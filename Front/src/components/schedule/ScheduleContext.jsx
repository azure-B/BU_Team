import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { readSchedule, saveSchedule, dateKey, pickCourseColor } from './scheduleModel'
import { getSchedules, createSchedule, deleteSchedule } from '../../api/dashboardApi'

const ScheduleContext = createContext(null)

function browserStorage() {
  try { return typeof window === 'undefined' ? undefined : window.localStorage } catch { return undefined }
}

function toHour(date) {
  return date.getHours() + date.getMinutes() / 60
}

function classKind(title) {
  if (/채플|섬김|프런티어|사람다운|교양/.test(title)) return 'general'
  return 'major'
}

function schedulesToCourses(serverData) {
  const courses = []
  const seen = new Set()
  for (const item of serverData) {
    if (item.type !== 'CLASS') continue
    const start = new Date(item.startAt)
    const end = new Date(item.endAt)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue
    const day = start.getDay() || 7
    const startHour = toHour(start)
    const endHour = toHour(end)
    const key = `${item.title}|${day}|${startHour}|${endHour}`
    if (seen.has(key)) continue
    seen.add(key)
    const room = item.title.match(/\(([^)]+)\)\s*$/)?.[1] || '백석대 강의실'
    const title = item.title.replace(/\s*\([^)]*\)\s*$/, '')
    courses.push({
      id: item.id,
      catalogId: item.id,
      title,
      day,
      start: startHour,
      end: endHour,
      kind: classKind(item.title),
      color: pickCourseColor(`${title}-${day}-${startHour}`, courses.length),
      location: room,
      buildingId: item.buildingId || null,
      fromServer: true,
    })
  }
  return courses
}

function schedulesToEvents(serverData) {
  const pad = (n) => String(n).padStart(2, '0')
  const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
  return serverData
    .filter((item) => item.type !== 'CLASS')
    .map((item) => {
      const start = new Date(item.startAt)
      const end = new Date(item.endAt || item.startAt)
      const kind = item.type === 'TASK' ? 'task' : item.type === 'WEEKLY' || item.type === 'PERSONAL' ? 'personal' : 'recommend'
      let endTime = Number.isNaN(end.getTime()) ? null : hm(end)
      // 종료가 시작과 같거나 이전이면 +1시간
      if (!endTime || end <= start) {
        const fallback = new Date(start.getTime() + 60 * 60 * 1000)
        endTime = hm(fallback)
      }
      return {
        id: item.id,
        title: item.title,
        date: dateKey(start),
        time: hm(start),
        endTime,
        kind,
        repeatWeekly: item.type === 'WEEKLY',
        location: item.buildingId ? '백석대 강의실' : '캠퍼스',
        fromServer: true,
      }
    })
}

export function ScheduleProvider({ children }) {
  const [state, setState] = useState(() => readSchedule(browserStorage()))
  const [serverLoaded, setServerLoaded] = useState(false)

  const syncServerSchedules = useCallback(async () => {
    try {
      const serverData = await getSchedules(undefined, undefined, { force: true })
      if (!Array.isArray(serverData)) return

      const serverCourses = schedulesToCourses(serverData)
      const serverEvents = schedulesToEvents(serverData)

      setState((prev) => {
        const localCourses = prev.courses.filter((course) => !course.fromServer)
        const localEvents = prev.events.filter((event) => !event.fromServer)
        const eventIds = new Set(localEvents.map((event) => event.id))
        return {
          ...prev,
          courses: [...serverCourses, ...localCourses],
          events: [...localEvents, ...serverEvents.filter((event) => !eventIds.has(event.id))],
        }
      })
    } catch (err) {
      console.warn('서버 일정 동기화 건너뜀 (오프라인 모드):', err.message)
    } finally {
      setServerLoaded(true)
    }
  }, [])

  useEffect(() => {
    syncServerSchedules()
  }, [syncServerSchedules])

  useEffect(() => {
    saveSchedule(browserStorage(), state)
  }, [state])

  const addServerSchedule = async (scheduleData) => {
    try {
      const created = await createSchedule(scheduleData)
      await syncServerSchedules()
      return created
    } catch (err) {
      console.warn('서버 저장 실패:', err.message)
      throw err
    }
  }

  const removeServerSchedule = async (scheduleId) => {
    try {
      await deleteSchedule(scheduleId)
      setState((prev) => ({
        ...prev,
        events: prev.events.filter((e) => e.id !== scheduleId),
        courses: prev.courses.filter((c) => c.id !== scheduleId),
      }))
    } catch (err) {
      console.warn('서버 일정 삭제 실패:', err.message)
    }
  }

  return (
    <ScheduleContext.Provider
      value={{
        state,
        setState,
        serverLoaded,
        syncServerSchedules,
        addServerSchedule,
        removeServerSchedule,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  )
}

export function useSchedule() {
  return useContext(ScheduleContext)
}
