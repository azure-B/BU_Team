import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { readSchedule, saveSchedule, dateKey } from './scheduleModel'
import { getSchedules, createSchedule, deleteSchedule } from '../../api/dashboardApi'

const ScheduleContext = createContext(null)

function browserStorage() {
  try { return typeof window === 'undefined' ? undefined : window.localStorage } catch { return undefined }
}

export function ScheduleProvider({ children }) {
  const [state, setState] = useState(() => readSchedule(browserStorage()))
  const [serverLoaded, setServerLoaded] = useState(false)

  // 1. 서버 DB의 일정 데이터 동기화
  const syncServerSchedules = useCallback(async () => {
    try {
      const serverData = await getSchedules()
      if (Array.isArray(serverData)) {
        setState((prev) => {
          // 서버 일정 중 기존에 없는 수업/일정 매핑
          const serverEvents = serverData.map((item) => {
            const start = new Date(item.startAt)
            const dKey = dateKey(start)
            const pad = (n) => String(n).padStart(2, '0')
            const timeStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`
            return {
              id: item.id,
              title: item.title,
              date: dKey,
              time: timeStr,
              kind: item.type === 'CLASS' ? 'recommend' : 'task',
              location: item.buildingId ? '백석대 강의실' : '캠퍼스',
              fromServer: true,
            }
          })

          // 중복 방지 (id 기준 병합)
          const existingIds = new Set(prev.events.map((e) => e.id))
          const newEvents = serverEvents.filter((se) => !existingIds.has(se.id))

          return {
            ...prev,
            events: [...prev.events, ...newEvents],
          }
        })
      }
    } catch (err) {
      console.warn('서버 일정 동기화 건너뜀 (오프라인 모드):', err.message)
    } finally {
      setServerLoaded(true)
    }
  }, [])

  useEffect(() => {
    syncServerSchedules()
  }, [syncServerSchedules])

  // 2. 로컬 상태 변경 시 localStorage 동기화
  useEffect(() => {
    saveSchedule(browserStorage(), state)
  }, [state])

  // 3. 서버에 신규 일정 추가하는 헬퍼
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

  // 4. 서버 일정 삭제하는 헬퍼
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
