import { Bell } from '@phosphor-icons/react'
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import NotificationPanel from './NotificationPanel'
import './Header.css'

const LOGO_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOdfMd_GnsPkLtxMfMpIrNwUv9A1s10jY6w4JHYwNPtQ8W_5hAYDf74Be_E6-_mSL3jQmdNV4LFzh637CVhocuYcjVhiZAX_Xk1xOIk5mbd-d913oM6xZrv-H_3FPaXp-kHiXErjK1rWYE_DZFB9TMXKSH_au3l0XPSsg3FaMjKc8I20DtAslrVRiTpCu1UHQM8osH9X-EFF6s3YAYOgVDt2qL5S_E_eU_c8op9B1L5ZnZvsUKGPfExVY3WohudaoBnlU'

export default function Header() {
  const [logoError, setLogoError] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const handleClose = useCallback(() => setPanelOpen(false), [])
  const handleToggle = () => setPanelOpen((prev) => !prev)

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
            {/* 읽지 않은 알림 수 배지 */}
            {unreadCount > 0 && (
              <span className="notif-badge" aria-hidden="true">
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
        onUnreadCountChange={setUnreadCount}
      />
    </header>
  )
}
