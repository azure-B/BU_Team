import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'bu-notification-state'

const DEFAULT_NOTIFICATIONS = [
  {
    id: 1,
    type: 'recommendation',
    message: '오늘 당신을 위한 추천 카드가 도착했습니다.',
    time: '8분 전',
    unread: true,
  },
  {
    id: 2,
    type: 'deadline',
    message: '남은 과제 마감 기한이 임박했습니다. 등록 서류를 확인하세요.',
    time: '35분 전',
    unread: true,
  },
  {
    id: 3,
    type: 'class',
    message: '15:00 [인공지능기초] 본부동 강의실로 이동할 시간입니다.',
    time: '2시간 전',
    unread: false,
  },
  {
    id: 4,
    type: 'notice',
    message: '2024년 2학기 수강신청 확인 및 변경 기간 안내입니다.',
    time: '1년 전',
    unread: false,
  },
]

const NotificationContext = createContext(null)

function readStoredNotifications() {
  if (typeof window === 'undefined') {
    return DEFAULT_NOTIFICATIONS
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_NOTIFICATIONS

    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
  } catch {
    // 로컬 저장소가 비어 있거나 손상된 경우 기본 알림을 유지한다.
  }

  return DEFAULT_NOTIFICATIONS
}

export function NotificationProvider({ children }) {
  const [items, setItems] = useState(readStoredNotifications)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const unreadCount = useMemo(
    () => items.filter((notification) => notification.unread).length,
    [items],
  )

  const value = useMemo(
    () => ({ items, setItems, unreadCount }),
    [items, unreadCount],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationState() {
  const context = useContext(NotificationContext)

  if (!context) {
    throw new Error('useNotificationState must be used within NotificationProvider')
  }

  return context
}
