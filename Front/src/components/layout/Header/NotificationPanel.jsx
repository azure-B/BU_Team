import { useEffect, useRef, useState } from "react"
import "./NotificationPanel.css"

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "recommendation",
    message: "오늘 당신을 위한 추천 카드가 도착했습니다.",
    time: "8분 전",
    unread: true,
  },
  {
    id: 2,
    type: "deadline",
    message: "남은 과제 마감 기한이 임박했습니다. 등록 서류를 확인하세요.",
    time: "35분 전",
    unread: true,
  },
  {
    id: 3,
    type: "class",
    message: "15:00 [인공지능기초] 본부동 강의실로 이동할 시간입니다.",
    time: "2시간 전",
    unread: false,
  },
  {
    id: 4,
    type: "notice",
    message: "2024년 2학기 수강신청 확인 및 변경 기간 안내입니다.",
    time: "1년 전",
    unread: false,
  },
]

function NotifIcon({ type }) {
  if (type === "recommendation") {
    return (
      <div className="notif-icon notif-icon--star">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>
    )
  }
  if (type === "deadline") {
    return (
      <div className="notif-icon notif-icon--deadline">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  }
  if (type === "class") {
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

export default function NotificationPanel({ isOpen, onClose, onUnreadCountChange }) {
  const [items, setItems] = useState(MOCK_NOTIFICATIONS)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        if (!e.target.closest(".notif-bell-btn")) {
          onClose()
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, onClose])

  useEffect(() => {
    const count = items.filter((n) => n.unread).length
    onUnreadCountChange?.(count)
  }, [items, onUnreadCountChange])

  function handleRead(id) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    )
  }

  function handleReadAll() {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const unreadCount = items.filter((n) => n.unread).length

  return (
    <>
      <div
        className={"notif-backdrop" + (isOpen ? " notif-backdrop--visible" : "")}
        aria-hidden="true"
        onClick={onClose}
      />
      <section
        ref={panelRef}
        className={"notif-panel" + (isOpen ? " notif-panel--open" : "")}
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
              <button
                className="notif-panel__read-all-btn"
                type="button"
                onClick={handleReadAll}
              >
                모두 읽음
              </button>
            )}
            <button
              className="notif-panel__close-btn"
              type="button"
              aria-label="알림 닫기"
              onClick={onClose}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="notif-panel__list">
          {items.length === 0 ? (
            <div className="notif-panel__empty">
              <span aria-hidden="true">🔔</span>
              <p>새로운 알림이 없습니다</p>
            </div>
          ) : (
            items.map((notif) => (
              <article
                key={notif.id}
                className={"notif-item" + (notif.unread ? " notif-item--unread" : "")}
                onClick={() => handleRead(notif.id)}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleRead(notif.id)}
                role="button"
                aria-label={"알림: " + notif.message + (notif.unread ? " (읽지 않음)" : "")}
              >
                <NotifIcon type={notif.type} />
                <div className="notif-item__body">
                  <p className="notif-item__message">{notif.message}</p>
                  <span className="notif-item__time">{notif.time}</span>
                </div>
                {notif.unread && (
                  <span className="notif-item__dot" aria-hidden="true" />
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </>
  )
}
