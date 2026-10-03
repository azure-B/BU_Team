import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import HomePage from './pages/HomePage'
import MyPage from './pages/MyPage'
import SettingPage from './pages/SettingPage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import './styles/global.css'

/**
 * AnimatePresence는 현재 location을 key로 사용해야
 * 라우트 전환 시 exit 애니메이션이 올바르게 동작합니다.
 */
function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"          element={<SettingPage />} />
        <Route path="/setting"   element={<SettingPage />} />
        <Route path="/settings"  element={<SettingPage />} />
        <Route path="/Setting"   element={<SettingPage />} />
        <Route path="/Settings"  element={<SettingPage />} />
        <Route path="/mypage"    element={<MyPage />} />
        <Route path="/myPage"    element={<MyPage />} />
        <Route path="/home"      element={<HomePage />} />
        <Route path="/Home"      element={<HomePage />} />
        <Route path="/dashboard" element={<HomePage />} />
        <Route path="/login"     element={<LoginPage />} />
        <Route path="*"          element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
