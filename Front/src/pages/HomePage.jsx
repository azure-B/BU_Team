import { useState, useEffect } from 'react'
import {
  ClassEngagementCard,
  DeadlineList,
  DueTodayCard,
  GapActivityCard,
  NextClassCard,
  NoticeList,
  TodaySchedule,
} from '../components/dashboard/DashboardSections'
import DemoControls from '../components/dashboard/DemoControls'
import { getCurrentUser } from '../api/authApi'
import { getTodayDashboard } from '../api/dashboardApi'
import './HomePage.css'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const [greeting, setGreeting] = useState(null)

  useEffect(() => {
    setUser(getCurrentUser())
    // 인사·오늘 수업 건수는 /dashboard/today 한 번으로 (별도 getSchedules 중복 제거)
    getTodayDashboard()
      .then((data) => {
        if (data?.greeting) setGreeting(data.greeting)
      })
      .catch(() => {})
  }, [])

  const userName = greeting?.userName || user?.name || '이승빈'
  const department = greeting?.department || user?.department || '컴퓨터공학부'
  const grade = greeting?.grade || user?.grade || 3
  const studentId = greeting?.studentId || user?.studentId || '20221001'
  const classCount = greeting?.classCount

  return (
      <div className="dashboard-page">
        <section className="student-greeting" aria-labelledby="dashboard-title">
          <h1 id="dashboard-title">안녕하세요, <strong>{userName}</strong> 학우님</h1>
          <p>
            {department} {grade}학년 · 학번 {studentId}
            {typeof classCount === 'number' ? ` · 오늘 일정 ${classCount}건` : ''}
          </p>
          <DemoControls />
        </section>

        <ClassEngagementCard />
        <DueTodayCard />
        <GapActivityCard />
        <NextClassCard />
        <TodaySchedule />
        <DeadlineList />
        <NoticeList limit={2} />
      </div>
  )
}
