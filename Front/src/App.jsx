import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import { ScheduleProvider } from './components/schedule/ScheduleContext'
import { AssistantPreferencesProvider } from './components/layout/Footer/AssistantPreferences'
import { ensureDemoSession } from './utils/demoSession'
import './styles/global.css'

const SchedulePage = lazy(() => import('./pages/SchedulePage'))
const MyPage = lazy(() => import('./pages/MyPage'))

/**
 * AnimatePresence는 현재 location을 key로 사용해야
 * 라우트 전환 시 exit 애니메이션이 올바르게 동작합니다.
 */
function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<div className="app-boot" aria-busy="true" style={{ minHeight: '40vh' }} />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/"        element={<HomePage />} />
          <Route path="/home"    element={<HomePage />} />
          <Route path="/Home"    element={<HomePage />} />
          <Route path="/dashboard" element={<HomePage />} />
          <Route path="/login"   element={<LoginPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/schedule/:view" element={<SchedulePage />} />
          <Route path="/mypage"  element={<MyPage />} />
          <Route path="/myPage"  element={<MyPage />} />
          <Route path="/setting" element={<Navigate to="/mypage" replace />} />
          <Route path="/Setting" element={<Navigate to="/mypage" replace />} />
          <Route path="/settings" element={<Navigate to="/mypage" replace />} />
          <Route path="/Settings" element={<Navigate to="/mypage" replace />} />
          <Route path="*"        element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}

export default function App() {
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    let ignore = false
    ensureDemoSession()
      .catch(() => {})
      .finally(() => {
        if (!ignore) setSessionReady(true)
      })
    return () => { ignore = true }
  }, [])

  if (!sessionReady) {
    return <div className="app-boot" aria-busy="true" style={{ minHeight: '40vh' }} />
  }

  return (
    <BrowserRouter>
      <ScheduleProvider>
        <AssistantPreferencesProvider>
          <AnimatedRoutes />
        </AssistantPreferencesProvider>
      </ScheduleProvider>
    </BrowserRouter>
  )
}
