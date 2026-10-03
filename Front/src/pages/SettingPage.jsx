import Layout from '../components/layout/Layout'
import {
  AssistantSettingCard,
  GeneralAppSettingCard,
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
        <AssistantSettingCard />
        <NotificationSettingCard />
        <GeneralAppSettingCard />
        <SettingAccountActions />
      </div>
    </Layout>
  )
}
