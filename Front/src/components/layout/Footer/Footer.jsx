import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import './Footer.css'

const FOOTER_LINKS = [
  {
    title: '서비스',
    links: [{ label: 'Home', path: '/' }, { label: 'About', path: '/about' }, { label: 'Work', path: '/work' }],
  },
  {
    title: '연락',
    links: [{ label: 'Contact', path: '/contact' }],
  },
]

const SOCIAL_LINKS = [
  { label: 'GitHub', href: 'https://github.com', icon: 'GH' },
  { label: 'Twitter', href: 'https://twitter.com', icon: 'TW' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <span className="footer__logo">MyApp</span>
          <p className="footer__tagline">아름다운 것을 함께 만들어요.</p>
          <div className="footer__social">
            {SOCIAL_LINKS.map(({ label, href, icon }) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social-link"
                aria-label={label}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {icon}
              </motion.a>
            ))}
          </div>
        </div>

        <div className="footer__nav">
          {FOOTER_LINKS.map(({ title, links }) => (
            <div key={title} className="footer__nav-group">
              <h3 className="footer__nav-title">{title}</h3>
              <ul>
                {links.map(({ label, path }) => (
                  <li key={path}>
                    <Link to={path} className="footer__nav-link">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container">
          <p>© {year} MyApp. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
