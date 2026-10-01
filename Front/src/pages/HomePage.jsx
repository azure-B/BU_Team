import Layout from '../components/layout/Layout'
import {
  DeadlineList,
  NextClassCard,
  NoticeList,
  TodaySchedule,
} from '../components/dashboard/DashboardSections'
import './HomePage.css'

export default function HomePage() {
  return (
    <Layout>
      <div className="dashboard-page">
        <section className="student-greeting" aria-labelledby="dashboard-title">
          <h1 id="dashboard-title">안녕하세요, <strong>홍길동</strong> 학우님</h1>
          <p>컴퓨터공학부 3학년 · 학번 20221340</p>
        </section>

        <NextClassCard />
        <TodaySchedule />
        <DeadlineList />
        <NoticeList />
      </div>
    </Layout>
  )
}
