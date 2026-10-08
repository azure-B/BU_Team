import {
  Bell,
  Camera,
  CaretRight,
  ChatCircleDots,
  IdentificationCard,
  NavigationArrow,
  PencilSimpleLine,
  ShieldCheck,
} from '@phosphor-icons/react'
import { useState } from 'react'
import SectionCard from '../common/SectionCard'
import './SettingSections.css'

const PROFILE_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC7bq76F-IIQaZYUY_LwRfTT1W2ZGsFo7RTz-bWTsLD_dit8j15K9_GTK06hVhaBububojMzrdVnugQTlbeM7IWlmT2XrsFvyeA_H9N8LVaxMkjCcu0Jtcj2jazG3btt75lV4jg0a_QQK1_WPHexjTKohS6lwzk1jXKzTqUBjAUQr0OMincgu6kCv4K3mSxqVqAZzYDuUmaucu725bSz7Lva7DOZlmVA63jOqLnYIj7x7V9LYroa890mA'

function ToggleSwitch({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`setting-toggle ${checked ? 'setting-toggle--checked' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="setting-toggle__thumb" />
    </button>
  )
}

export function ProfileSettingCard() {
  return (
    <section className="setting-group">
      <div className="setting-group__label-row">
        <span className="setting-group__label">내 프로필 및 학적 정보 (직접 입력)</span>
        <span className="setting-badge-pill">
          <ShieldCheck size={12} weight="fill" aria-hidden="true" />
          로컬 저장
        </span>
      </div>

      <SectionCard className="setting-card">
        <div className="profile-setting">
          <div className="profile-setting__avatar-wrap">
            <img src={PROFILE_AVATAR} alt="홍길동 학우" className="profile-setting__avatar" />
            <button
              type="button"
              className="profile-setting__cam-btn"
              aria-label="프로필 사진 변경"
            >
              <Camera size={13} weight="bold" aria-hidden="true" />
            </button>
          </div>

          <div className="profile-setting__info">
            <div className="profile-setting__name-row">
              <span className="profile-setting__name">홍길동 학우</span>
              <span className="setting-role-badge">학부생</span>
            </div>
            <div className="profile-setting__details">
              <div className="profile-setting__detail-item">
                <span className="profile-setting__detail-label">전공</span>
                <span className="profile-setting__detail-value">컴퓨터공학부 (소프트웨어학)</span>
              </div>
              <div className="profile-setting__meta-line">
                <span>학년: <strong>3학년</strong></span>
                <span>·</span>
                <span>학번: <strong>20221340</strong></span>
              </div>
            </div>
          </div>

          <button type="button" className="setting-edit-btn">
            <PencilSimpleLine size={14} weight="bold" aria-hidden="true" />
            <span>정보 변경</span>
          </button>
        </div>

        <button type="button" className="setting-list-row setting-list-row--interactive">
          <div className="setting-list-row__left">
            <span className="setting-row-icon">
              <IdentificationCard size={18} weight="fill" aria-hidden="true" />
            </span>
            <div className="setting-list-row__text">
              <div className="setting-list-row__title-line">
                <span className="setting-row-title">학적 정보 직접 수정</span>
                <span className="setting-row-subtext">(전공, 학년, 학번, 관심분야)</span>
              </div>
              <span className="setting-row-desc">
                학교 포털 연동 없이 기기에 안전하게 직접 저장됩니다
              </span>
            </div>
          </div>
          <CaretRight size={17} weight="bold" className="setting-row-arrow" aria-hidden="true" />
        </button>
      </SectionCard>
    </section>
  )
}

export function NotificationSettingCard() {
  const [academicNotice, setAcademicNotice] = useState(true)
  const [scheduleNotice, setScheduleNotice] = useState(true)

  return (
    <section className="setting-group">
      <span className="setting-group__label">알림 및 캠퍼스 안내</span>
      <SectionCard className="setting-card">
        <div className="setting-list-row">
          <div className="setting-list-row__left">
            <span className="setting-row-icon"><Bell size={18} weight="fill" aria-hidden="true" /></span>
            <div className="setting-list-row__text">
              <span className="setting-row-title">수업 및 과제 알림</span>
              <span className="setting-row-desc">예정된 수업과 과제 마감 알림</span>
            </div>
          </div>
          <ToggleSwitch checked={scheduleNotice} onChange={setScheduleNotice} ariaLabel="수업 및 과제 알림 토글" />
        </div>
        <div className="setting-list-row">
          <div className="setting-list-row__left">
            <span className="setting-row-icon"><ChatCircleDots size={18} weight="fill" aria-hidden="true" /></span>
            <div className="setting-list-row__text">
              <span className="setting-row-title">학사 / 장학 공지 알림</span>
              <span className="setting-row-desc">학부 및 학교 공지 알림</span>
            </div>
          </div>
          <ToggleSwitch checked={academicNotice} onChange={setAcademicNotice} ariaLabel="학사 / 장학 공지 알림 토글" />
        </div>
        <button type="button" className="setting-list-row setting-list-row--interactive">
          <div className="setting-list-row__left">
            <span className="setting-row-icon"><NavigationArrow size={18} weight="fill" aria-hidden="true" /></span>
            <div className="setting-list-row__text">
              <span className="setting-row-title">강의실 이동 경로 안내</span>
              <span className="setting-row-desc">현재 위치와 다음 수업을 기준으로 경로 안내</span>
            </div>
          </div>
          <CaretRight size={16} weight="bold" className="setting-row-arrow" aria-hidden="true" />
        </button>
      </SectionCard>
    </section>
  )
}

export function SettingAccountActions() {
  return (
    <div className="setting-account-box">
      <button type="button" className="setting-logout-btn">
        로그아웃
      </button>
      <div className="setting-sub-links">
        <button type="button" className="setting-sub-link setting-sub-link--danger">회원 탈퇴</button>
      </div>
    </div>
  )
}
