import { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import {
  DeadlineList,
  NextClassCard,
  NoticeList,
  TodaySchedule,
} from '../components/dashboard/DashboardSections'
import { getCurrentUser } from '../api/authApi'
import './HomePage.css'

export default function HomePage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  const userName = user?.name || '이승빈'
  const department = user?.department || '컴퓨터공학부'
  const grade = user?.grade || 3
  const studentId = user?.studentId || '20221001'

  return (
    <Layout>
      <div className="dashboard-page">
        <section className="student-greeting" aria-labelledby="dashboard-title">
          <h1 id="dashboard-title">안녕하세요, <strong>{userName}</strong> 학우님</h1>
          <p>{department} {grade}학년 · 학번 {studentId}</p>
        </section>

        <NextClassCard />
        <TodaySchedule />
        <DeadlineList />
        <NoticeList />
      </div>
    </Layout>
  )
}
