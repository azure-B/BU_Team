import { Bell, GearSix } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Header.css'

const LOGO_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOdfMd_GnsPkLtxMfMpIrNwUv9A1s10jY6w4JHYwNPtQ8W_5hAYDf74Be_E6-_mSL3jQmdNV4LFzh637CVhocuYcjVhiZAX_Xk1xOIk5mbd-d913oM6xZrv-H_3FPaXp-kHiXErjK1rWYE_DZFB9TMXKSH_au3l0XPSsg3FaMjKc8I20DtAslrVRiTpCu1UHQM8osH9X-EFF6s3YAYOgVDt2qL5S_E_eU_c8op9B1L5ZnZvsUKGPfExVY3WohudaoBnlU'

export default function Header() {
  const [logoError, setLogoError] = useState(false)

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
          <button className="icon-button" type="button" aria-label="알림">
            <Bell size={21} weight="regular" aria-hidden="true" />
          </button>
          <button className="icon-button" type="button" aria-label="설정">
            <GearSix size={22} weight="regular" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}
