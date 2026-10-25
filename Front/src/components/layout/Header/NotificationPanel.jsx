import { useEffect, useRef, useState } from 'react'
import { getNotices, getSchedules, getTasks } from '../../../api/dashboardApi'
import { getCurrentUser } from '../../../api/authApi'
import { getDashboardNow, projectSchedulesOntoDay } from '../../../utils/todaySchedules'
import './NotificationPanel.css'

const STORAGE_KEY = 'baekseok_ai_notifications_v2'
const READ_KEY = 'baekseok_ai_notifications_read_v2'

function NotifIcon({ type }) {
  if (type === 'recommendation') {
    return (
      <div className="notif-icon notif-icon--star">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>
    )
  }
  if (type === 'deadline') {
    return (
      <div className="notif-icon notif-icon--deadline">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  }
  if (type === 'class') {
    return (
      <div className="notif-icon notif-icon--class">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
    )
  }
  return (
    <div className="notif-icon notif-icon--notice">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
  )
}

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

export default function NotificationPanel({ isOpen, onClose, onUnreadCountChange }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const panelRef = useRef(null)

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

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        if (!e.target.closest('.notif-bell-btn')) onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  useEffect(() => {
    const count = items.filter((n) => n.unread).length
    onUnreadCountChange?.(count)
  }, [items, onUnreadCountChange])

  function handleRead(id) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)))
    const read = readIds()
    read.add(id)
    saveReadIds(read)
  }

  function handleReadAll() {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })))
    saveReadIds(new Set(items.map((n) => n.id)))
  }

  const unreadCount = items.filter((n) => n.unread).length

  return (
    <>
      <div
        className={'notif-backdrop' + (isOpen ? ' notif-backdrop--visible' : '')}
        aria-hidden="true"
        onClick={onClose}
      />
      <section
        ref={panelRef}
        className={'notif-panel' + (isOpen ? ' notif-panel--open' : '')}
        aria-label="알림 센터"
        aria-modal="true"
        role="dialog"
      >
        <div className="notif-panel__arrow" aria-hidden="true" />
        <div className="notif-panel__header">
          <div className="notif-panel__title-row">
            <h2 className="notif-panel__title">알림</h2>
            {unreadCount > 0 && (
              <span className="notif-panel__count-badge">{unreadCount}</span>
            )}
          </div>
          <div className="notif-panel__header-actions">
            {unreadCount > 0 && (
              <button className="notif-panel__read-all-btn" type="button" onClick={handleReadAll}>
                모두 읽음
              </button>
            )}
            <button className="notif-panel__close-btn" type="button" aria-label="알림 닫기" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="notif-panel__list">
          {loading ? (
            <div className="notif-panel__empty"><p>알림을 불러오는 중…</p></div>
          ) : items.length === 0 ? (
            <div className="notif-panel__empty">
              <span aria-hidden="true">🔔</span>
              <p>새로운 알림이 없습니다</p>
            </div>
          ) : (
            items.map((notif) => (
              <article
                key={notif.id}
                className={'notif-item' + (notif.unread ? ' notif-item--unread' : '')}
                onClick={() => handleRead(notif.id)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleRead(notif.id)}
                role="button"
                aria-label={'알림: ' + notif.message + (notif.unread ? ' (읽지 않음)' : '')}
              >
                <NotifIcon type={notif.type} />
                <div className="notif-item__body">
                  <p className="notif-item__message">{notif.message}</p>
                  <span className="notif-item__time">{notif.time}</span>
                </div>
                {notif.unread && <span className="notif-item__dot" aria-hidden="true" />}
              </article>
            ))
          )}
        </div>
      </section>
    </>
  )
}
