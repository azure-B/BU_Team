import Layout from '../components/layout/Layout'
import {
  NotificationSettingCard,
  ProfileSettingCard,
  SettingAccountActions,
} from '../components/setting/SettingSections'
import './SettingPage.css'

export default function SettingPage() {
  return (
    <Layout>
      <div className="setting-container">
        <header className="setting-header">
          <h1 className="setting-title">설정</h1>
        </header>

        <ProfileSettingCard />
        <NotificationSettingCard />
        <SettingAccountActions />
      </div>
    </Layout>
  )
}
