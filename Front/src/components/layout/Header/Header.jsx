import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import './Header.css'

const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/work', label: 'Work' },
  { path: '/contact', label: 'Contact' },
]

export default function Header() {
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 라우트 변경시 모바일 메뉴 닫기
  useEffect(() => { setMenuOpen(false) }, [pathname])

  return (
    <motion.header
      className={`header ${scrolled ? 'header--scrolled' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="container header__inner">
        {/* Logo */}
        <Link to="/" className="header__logo">
          <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            MyApp
          </motion.span>
        </Link>

        {/* Desktop Nav */}
        <nav className="header__nav" aria-label="Main navigation">
          <ul className="header__nav-list">
            {NAV_LINKS.map(({ path, label }) => (
              <li key={path}>
                <Link to={path} className={`header__nav-link ${pathname === path ? 'active' : ''}`}>
                  {label}
                  {pathname === path && (
                    <motion.span
                      className="header__nav-indicator"
                      layoutId="nav-indicator"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* CTA Button */}
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Link to="/contact" className="header__cta">시작하기</Link>
        </motion.div>

        {/* Hamburger (mobile) */}
        <button
          className={`header__hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="header__mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <ul>
              {NAV_LINKS.map(({ path, label }, i) => (
                <motion.li
                  key={path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link to={path} className={pathname === path ? 'active' : ''}>
                    {label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
