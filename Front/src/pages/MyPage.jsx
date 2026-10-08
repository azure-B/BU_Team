import Layout from '../components/layout/Layout'
import {
  ActivityArchiveCard,
  IntegrationUtilityCard,
  ProfileSummaryCard,
} from '../components/mypage/MyPageSections'
import './MyPage.css'

export default function MyPage() {
  return (
    <Layout>
      <div className="mypage-container">
        <header className="mypage-header">
          <h1 className="mypage-title">마이페이지</h1>
        </header>

        <ProfileSummaryCard />
        <ActivityArchiveCard />
        <IntegrationUtilityCard />
      </div>
    </Layout>
  )
}
