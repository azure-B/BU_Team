import { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import {
  ClassEngagementCard,
  DeadlineList,
  DueTodayCard,
  GapActivityCard,
  NextClassCard,
  NoticeList,
  TodaySchedule,
} from '../components/dashboard/DashboardSections'
import { getCurrentUser } from '../api/authApi'
import { getSchedules, getTodayDashboard } from '../api/dashboardApi'
import { getDashboardNow, getDemoDowLabel, isDashboardDemoClock, projectSchedulesOntoDay } from '../utils/todaySchedules'
import { demoAccountIndexLabel } from '../utils/demoParams'
import { resetEarlyEndForDemo } from '../utils/classSession'
import './HomePage.css'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const [greeting, setGreeting] = useState(null)
  const [classCount, setClassCount] = useState(null)

  useEffect(() => {
    if (isDashboardDemoClock()) resetEarlyEndForDemo()
    setUser(getCurrentUser())
    getTodayDashboard()
      .then((data) => {
        if (data?.greeting) setGreeting(data.greeting)
      })
      .catch(() => {})
    // 데모: 화요일 기준으로 오늘 수업 건수 표시
    getSchedules()
      .then((list) => {
        const today = projectSchedulesOntoDay(Array.isArray(list) ? list : [], getDashboardNow())
        setClassCount(today.length)
      })
      .catch(() => setClassCount(0))
  }, [])

  const userName = greeting?.userName || user?.name || '이승빈'
  const department = greeting?.department || user?.department || '컴퓨터공학부'
  const grade = greeting?.grade || user?.grade || 3
  const studentId = greeting?.studentId || user?.studentId || '20221001'
  const demoNow = getDashboardNow()
  const accountIdx = demoAccountIndexLabel(studentId)
  const demoClockLabel = isDashboardDemoClock()
    ? `데모 account=${accountIdx ?? '?'} · ${demoNow.getMonth() + 1}/${demoNow.getDate()}(${getDemoDowLabel(demoNow)}) ${String(demoNow.getHours()).padStart(2, '0')}:${String(demoNow.getMinutes()).padStart(2, '0')}`
    : null

  return (
    <Layout>
      <div className="dashboard-page">
        <section className="student-greeting" aria-labelledby="dashboard-title">
          <h1 id="dashboard-title">안녕하세요, <strong>{userName}</strong> 학우님</h1>
          <p>
            {department} {grade}학년 · 학번 {studentId}
            {typeof classCount === 'number' ? ` · 오늘 수업 ${classCount}건` : ''}
            {demoClockLabel ? ` · ${demoClockLabel}` : ''}
          </p>
        </section>

        <ClassEngagementCard />
        <DueTodayCard />
        <GapActivityCard />
        <NextClassCard />
        <TodaySchedule />
        <DeadlineList />
        <NoticeList />
      </div>
    </Layout>
  )
}
