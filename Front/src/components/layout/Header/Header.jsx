import { Bell } from '@phosphor-icons/react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import NotificationPanel from './NotificationPanel'
import { useNotificationState } from './NotificationContext'
import './Header.css'

const LOGO_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOdfMd_GnsPkLtxMfMpIrNwUv9A1s10jY6w4JHYwNPtQ8W_5hAYDf74Be_E6-_mSL3jQmdNV4LFzh637CVhocuYcjVhiZAX_Xk1xOIk5mbd-d913oM6xZrv-H_3FPaXp-kHiXErjK1rWYE_DZFB9TMXKSH_au3l0XPSsg3FaMjKc8I20DtAslrVRiTpCu1UHQM8osH9X-EFF6s3YAYOgVDt2qL5S_E_eU_c8op9B1L5ZnZvsUKGPfExVY3WohudaoBnlU'

const SESSION_LOADED_KEY = 'bu_app_loaded_session'

export default function Header() {
  const [logoError, setLogoError] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const { unreadCount } = useNotificationState()
  const location = useLocation()

  // 1) 앱 켤 때 (세션 최초 1회 진입 시)에만 애니메이션 실행
  const [shouldAnimateBadge, setShouldAnimateBadge] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const alreadyLoaded = window.sessionStorage.getItem(SESSION_LOADED_KEY)
      if (!alreadyLoaded && unreadCount > 0) {
        window.sessionStorage.setItem(SESSION_LOADED_KEY, 'true')
        return true
      }
    } catch {
      // sessionStorage 사용 불가능한 환경 fallback
    }
    return false
  })

  const prevCountRef = useRef(unreadCount)

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const alreadyLoaded = window.sessionStorage.getItem(SESSION_LOADED_KEY)
      if (!alreadyLoaded && unreadCount > 0) {
        // 앱 켤 때 (최초 진입 시)
        window.sessionStorage.setItem(SESSION_LOADED_KEY, 'true')
        setShouldAnimateBadge(true)
      } else if (prevCountRef.current !== undefined && unreadCount > prevCountRef.current) {
        // 새로운 알림이 들어와 카운트가 증가/갱신된 경우에만 팝 애니메이션 실행
        setShouldAnimateBadge(true)
      }
    } catch {
      if (prevCountRef.current !== undefined && unreadCount > prevCountRef.current) {
        setShouldAnimateBadge(true)
      }
    }

    // 상태변화가 없는 상태(단순 페이지 이동 등)에서는 애니메이션을 전혀 실행하지 않음
    prevCountRef.current = unreadCount
  }, [unreadCount])

  // 페이지 이동 시 열려있던 알림 패널만 닫기 (배지 상태는 그대로 유지)
  useEffect(() => {
    setPanelOpen(false)
  }, [location.pathname])

  const handleClose = useCallback(() => setPanelOpen(false), [])
  const handleToggle = () => setPanelOpen((prev) => !prev)
  const handleBadgeAnimationEnd = useCallback(() => {
    setShouldAnimateBadge(false)
  }, [])

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/" className="app-header__brand" aria-label="백석 AI 홈">
          {!logoError ? (
            <img
              src={LOGO_URL}
              alt="백석대학교 로고"
              className="app-header__logo"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="app-header__logo app-header__logo--fallback" aria-hidden="true">
              BU
            </span>
          )}
          <span>백석 AI</span>
        </Link>

        <div className="app-header__actions">
          {/* 알림 벨 버튼 */}
          <button
            className={`icon-button notif-bell-btn${panelOpen ? ' icon-button--active' : ''}`}
            type="button"
            aria-label={panelOpen ? '알림 닫기' : '알림 열기'}
            aria-expanded={panelOpen}
            onClick={handleToggle}
          >
            <Bell size={21} weight="regular" aria-hidden="true" />
            {/* 읽지 않은 알림 수 배지: 앱 켤 때나 신규 알림 수신 시에만 pop 애니메이션, 그 외엔 고정 유지 */}
            {unreadCount > 0 && (
              <span
                className={`notif-badge${shouldAnimateBadge ? ' notif-badge--pop' : ''}`}
                onAnimationEnd={handleBadgeAnimationEnd}
                aria-hidden="true"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 알림 패널 (Header 내부에서 portal 없이 렌더링, fixed position) */}
      <NotificationPanel
        isOpen={panelOpen}
        onClose={handleClose}
      />
    </header>
  )
}
