import { Link } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import {
  ActivityArchiveCard,
  IntegrationUtilityCard,
} from '../components/mypage/MyPageSections'
import {
  NotificationSettingCard,
  ProfileSettingCard,
  SettingAccountActions,
} from '../components/setting/SettingSections'
import { llmFreePercent, readChatStats } from '../utils/chatStats'
import './MyPage.css'

export default function MyPage() {
  const stats = readChatStats()
  const freePct = llmFreePercent(stats)

  return (
    <Layout>
      <div className="mypage-container">
        <header className="mypage-header">
          <h1 className="mypage-title">마이페이지</h1>
        </header>

        <ProfileSettingCard />
        <section className="mypage-stats-teaser">
          <Link to="/chat-stats" className="mypage-stats-teaser__link">
            <strong>비서 처리 통계</strong>
            <span>
              {stats.total
                ? `LLM 없이 ${freePct}% · 질문 ${stats.total}건`
                : '질문 경로·응답 시간·비용 보기'}
            </span>
          </Link>
        </section>
        <ActivityArchiveCard />
        <IntegrationUtilityCard />
        <NotificationSettingCard />
        <SettingAccountActions />
      </div>
    </Layout>
  )
}
