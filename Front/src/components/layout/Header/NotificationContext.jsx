import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getNotices, getSchedules, getTasks } from '../../../api/dashboardApi'
import { getCurrentUser } from '../../../api/authApi'
import { getDashboardNow, projectSchedulesOntoDay } from '../../../utils/todaySchedules'

const STORAGE_KEY = 'baekseok_ai_notifications_v2'
const READ_KEY = 'baekseok_ai_notifications_read_v2'

function pad2(n) {
  return String(n).padStart(2, '0')
}

function timeLabel(date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function relativeTime(from, now) {
  const diff = Math.round((now.getTime() - from.getTime()) / 60000)
  if (diff < 1) return '방금'
  if (diff < 60) return `${diff}분 전`
  if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`
  return `${Math.floor(diff / 1440)}일 전`
}

function titleOf(item) {
  return String(item?.displayTitle || item?.title || '일정').replace(/^\[.*?\]\s*/, '')
}

function readIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function saveReadIds(ids) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]))
  } catch { /* ignore */ }
}

async function buildLiveNotifications() {
  const now = getDashboardNow()
  const user = getCurrentUser()
  const department = user?.department || ''
  const items = []

  const [schedules, tasks, noticeRes] = await Promise.all([
    getSchedules().catch(() => []),
    getTasks().catch(() => []),
    getNotices(12).catch(() => ({ notices: [] })),
  ])

  const list = Array.isArray(schedules) ? schedules : []
  const today = projectSchedulesOntoDay(list, now)
  const upcoming = today
    .filter((s) => new Date(s.startAt) > now && (s.type === 'CLASS' || !s.type))
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))

  const next = upcoming[0]
  if (next) {
    const start = new Date(next.startAt)
    const leaveMin = next.buildingId ? 20 : 15
    const leaveAt = new Date(start.getTime() - leaveMin * 60000)
    items.push({
      id: `leave-${next.id}`,
      type: 'class',
      message: `다음 수업 출발 시각 ${timeLabel(leaveAt)} · ${titleOf(next)} (${timeLabel(start)})`,
      time: relativeTime(leaveAt < now ? leaveAt : now, now),
      sortAt: leaveAt.getTime(),
    })
  }

  const taskList = Array.isArray(tasks) ? tasks : (tasks?.tasks || [])
  for (const task of taskList.slice(0, 20)) {
    const due = new Date(task.dueAt || task.deadline || task.endAt)
    if (Number.isNaN(due.getTime())) continue
    const days = Math.ceil((due.getTime() - now.getTime()) / 86400000)
    if (days < 0 || days > 3) continue
    const dLabel = days === 0 ? 'D-Day' : `D-${days}`
    items.push({
      id: `task-${task.id}`,
      type: 'deadline',
      message: `과제 ${dLabel} · ${task.title || '과제'}`,
      time: relativeTime(due, now),
      sortAt: due.getTime(),
    })
  }

  const notices = Array.isArray(noticeRes?.notices) ? noticeRes.notices : []
  const depKey = department.replace(/\s/g, '')
  const filtered = notices.filter((n) => {
    const hay = `${n.title || ''} ${n.tags || ''} ${n.category || ''}`.replace(/\s/g, '')
    if (!depKey) return true
    if (depKey.includes('컴퓨터') && /컴퓨터|정보보호|소프트웨어/.test(hay)) return true
    if (depKey.includes('첨단') && /첨단|IT|스마트/.test(hay)) return true
    return /마감|신청|모집/.test(hay)
  }).slice(0, 3)

  for (const n of filtered) {
    const created = new Date(n.createdAt || Date.now())
    items.push({
      id: `notice-${n.id}`,
      type: 'notice',
      message: `내 학부 대상 공지 · ${n.title}`,
      time: relativeTime(created, now),
      sortAt: created.getTime(),
    })
  }

  if (!items.length) {
    items.push({
      id: 'empty-1',
      type: 'recommendation',
      message: '오늘은 급한 알림이 없어요. 홈의 공강 추천을 확인해 보세요.',
      time: '방금',
      sortAt: now.getTime(),
    })
  }

  const read = readIds()
  return items
    .sort((a, b) => b.sortAt - a.sortAt)
    .slice(0, 12)
    .map((n) => ({ ...n, unread: !read.has(n.id) }))
}

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const live = await buildLiveNotifications()
        if (!ignore) setItems(live)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(live.map(({ unread, ...rest }) => rest)))
        } catch { /* ignore */ }
      } catch {
        if (!ignore) setItems([])
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
  }, [])

  const unreadCount = useMemo(() => items.filter((item) => item.unread).length, [items])
  const value = useMemo(() => ({ items, setItems, loading, unreadCount }), [items, loading, unreadCount])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotificationState() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotificationState must be used within NotificationProvider')
  return context
}

export { readIds, saveReadIds }
