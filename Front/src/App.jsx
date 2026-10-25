import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import MyPage from './pages/MyPage'
import SchedulePage from './pages/SchedulePage'
import Layout from './components/layout/Layout'
import { ScheduleProvider } from './components/schedule/ScheduleContext'
import { AssistantPreferencesProvider } from './components/layout/Footer/AssistantPreferences'
import { NotificationProvider } from './components/layout/Header/NotificationContext'
import './styles/global.css'

function AppRoutes() {
  return (
    <Routes>
      {/* 로그인 페이지 (상단바/하단바 없는 전체 화면) */}
      <Route path="/login" element={<LoginPage />} />

      {/* 기본 레이아웃 (Header 및 Footer 영속 유지) */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/Home" element={<HomePage />} />
        <Route path="/dashboard" element={<HomePage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/schedule/:view" element={<SchedulePage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/myPage" element={<MyPage />} />
        <Route path="/setting" element={<Navigate to="/mypage" replace />} />
        <Route path="/Setting" element={<Navigate to="/mypage" replace />} />
        <Route path="/settings" element={<Navigate to="/mypage" replace />} />
        <Route path="/Settings" element={<Navigate to="/mypage" replace />} />
      </Route>

      {/* 404 페이지 (헤더 유지 + 푸터 제외) */}
      <Route element={<Layout noFooter />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <ScheduleProvider>
          <AssistantPreferencesProvider>
            <AppRoutes />
          </AssistantPreferencesProvider>
        </ScheduleProvider>
      </NotificationProvider>
    </BrowserRouter>
  )
}
