import { motion } from 'framer-motion'
import Header from '../Header'
import Footer from '../Footer'
import './Layout.css'

/**
 * 페이지 전환 variant
 * 새 페이지가 아래에서 올라오며 fade-in
 */
const pageVariants = {
  initial:  { opacity: 0, y: 20 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:     { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

/**
 * Layout — Header / main(페이지 content) / Footer 조합
 * @param {React.ReactNode} children
 * @param {boolean} noFooter  — Footer 숨김 옵션
 */
export default function Layout({ children, noFooter = false }) {
  return (
    <div className="layout">
      <Header />

      <motion.main
        className="layout__main"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.main>

      {!noFooter && <Footer />}
    </div>
  )
}
