import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Header from '../Header'
import Footer from '../Footer'
import './Layout.css'

export default function Layout({ children, noFooter = false }) {
  const location = useLocation()

  return (
    <div className="app-layout">
      <Header />
      <main className="app-layout__main">
        {children ? (
          children
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        )}
      </main>
      {!noFooter && <Footer />}
    </div>
  )
}
