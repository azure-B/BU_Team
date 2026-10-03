import {
  Bell,
  Bus,
  Camera,
  CaretRight,
  ChatCircleDots,
  Clock,
  FileCode,
  IdentificationCard,
  Info,
  NavigationArrow,
  Note,
  PencilSimpleLine,
  ShieldCheck,
  SpeakerHigh,
  Sun,
  Trash,
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

export function AssistantSettingCard() {
  const [pushBriefing, setPushBriefing] = useState(true)
  const [classSummary, setClassSummary] = useState(true)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [verbosity, setVerbosity] = useState('normal')

  return (
    <section className="setting-group">
      <span className="setting-group__label">AI 비서 맞춤 설정</span>
      <SectionCard className="setting-card">
        <div className="setting-list-row">
          <div className="setting-list-row__left">
            <span className="setting-row-icon">
              <Bell size={18} weight="fill" aria-hidden="true" />
            </span>
            <div className="setting-list-row__text">
              <span className="setting-row-title">AI 실시간 푸시 브리핑</span>
              <span className="setting-row-desc">다음 수업 30분 전 강의실 및 과제 요약</span>
            </div>
          </div>
          <ToggleSwitch
            checked={pushBriefing}
            onChange={setPushBriefing}
            ariaLabel="AI 실시간 푸시 브리핑 토글"
          />
        </div>

        <div className="setting-list-row">
          <div className="setting-list-row__left">
            <span className="setting-row-icon">
              <Clock size={18} weight="fill" aria-hidden="true" />
            </span>
            <div className="setting-list-row__text">
              <span className="setting-row-title">최근 수업 요약 서비스</span>
              <span className="setting-row-desc">수업 시작시 자동으로 STT 서비스 활성화</span>
            </div>
          </div>
          <ToggleSwitch
            checked={classSummary}
            onChange={setClassSummary}
            ariaLabel="최근 수업 요약 서비스 토글"
          />
        </div>

        <div className="setting-list-row">
          <div className="setting-list-row__left">
            <span className="setting-row-icon">
              <Note size={18} weight="fill" aria-hidden="true" />
            </span>
            <div className="setting-list-row__text">
              <span className="setting-row-title">AI 답변 상세도 설정</span>
              <span className="setting-row-desc">답변 분량 및 요약 밀도 조절</span>
            </div>
          </div>
          <div className="setting-segmented-control" role="group" aria-label="답변 상세도">
            <button
              type="button"
              className={`setting-segment-btn ${verbosity === 'concise' ? 'setting-segment-btn--active' : ''}`}
              onClick={() => setVerbosity('concise')}
            >
              간결하게
            </button>
            <button
              type="button"
              className={`setting-segment-btn ${verbosity === 'normal' ? 'setting-segment-btn--active' : ''}`}
              onClick={() => setVerbosity('normal')}
            >
              보통
            </button>
            <button
              type="button"
              className={`setting-segment-btn ${verbosity === 'detailed' ? 'setting-segment-btn--active' : ''}`}
              onClick={() => setVerbosity('detailed')}
            >
              자세히
            </button>
          </div>
        </div>

        <div className="setting-list-row">
          <div className="setting-list-row__left">
            <span className="setting-row-icon">
              <SpeakerHigh size={18} weight="fill" aria-hidden="true" />
            </span>
            <div className="setting-list-row__text">
              <span className="setting-row-title">음성 안내 (TTS) 사용</span>
              <span className="setting-row-desc">답변 결과 음성 동시 낭독</span>
            </div>
          </div>
          <ToggleSwitch
            checked={ttsEnabled}
            onChange={setTtsEnabled}
            ariaLabel="음성 안내 (TTS) 사용 토글"
          />
        </div>
      </SectionCard>
    </section>
  )
}

export function NotificationSettingCard() {
  const [academicNotice, setAcademicNotice] = useState(true)

  return (
    <section className="setting-group">
      <span className="setting-group__label">알림 및 캠퍼스 데이터</span>
      <SectionCard className="setting-card">
        <div className="setting-list-row">
          <div className="setting-list-row__left">
            <span className="setting-row-icon">
              <ChatCircleDots size={18} weight="fill" aria-hidden="true" />
            </span>
            <div className="setting-list-row__text">
              <span className="setting-row-title">학사 / 장학 공지 실시간 알림</span>
              <span className="setting-row-desc">컴공 학부 및 전교 장학 속보</span>
            </div>
          </div>
          <ToggleSwitch
            checked={academicNotice}
            onChange={setAcademicNotice}
            ariaLabel="학사 / 장학 공지 실시간 알림 토글"
          />
        </div>

        <button type="button" className="setting-list-row setting-list-row--interactive">
          <div className="setting-list-row__left">
            <span className="setting-row-icon">
              <Bus size={18} weight="fill" aria-hidden="true" />
            </span>
            <div className="setting-list-row__text">
              <span className="setting-row-title">셔틀버스 도착 알림</span>
              <span className="setting-row-desc">즐겨찾기: 천안역 ↔ 백석대 순환 노선</span>
            </div>
          </div>
          <div className="setting-list-row__right">
            <span className="setting-row-action-label">천안역 노선</span>
            <CaretRight size={16} weight="bold" className="setting-row-arrow" aria-hidden="true" />
          </div>
        </button>

        <button type="button" className="setting-list-row setting-list-row--interactive">
          <div className="setting-list-row__left">
            <span className="setting-row-icon">
              <NavigationArrow size={18} weight="fill" aria-hidden="true" />
            </span>
            <div className="setting-list-row__text">
              <span className="setting-row-title">강의실 이동 경로 안내</span>
              <span className="setting-row-desc">진리관 엘리베이터 혼잡 알림 포함</span>
            </div>
          </div>
          <div className="setting-list-row__right">
            <span className="setting-row-badge-soft">자동 길안내</span>
            <CaretRight size={16} weight="bold" className="setting-row-arrow" aria-hidden="true" />
          </div>
        </button>
      </SectionCard>
    </section>
  )
}

export function GeneralAppSettingCard() {
  const [themeMode, setThemeMode] = useState('light')
  const [cleaned, setCleaned] = useState(false)

  const handleCleanCache = () => {
    setCleaned(true)
    setTimeout(() => setCleaned(false), 2000)
  }

  return (
    <section className="setting-group">
      <span className="setting-group__label">일반 및 앱 정보</span>
      <SectionCard className="setting-card">
        <div className="setting-list-row">
          <div className="setting-list-row__left">
            <span className="setting-row-icon">
              <Sun size={18} weight="fill" aria-hidden="true" />
            </span>
            <div className="setting-list-row__text">
              <span className="setting-row-title">화면 모드</span>
              <span className="setting-row-desc">다크 모드 및 테마</span>
            </div>
          </div>
          <div className="setting-segmented-control" role="group" aria-label="화면 모드 선택">
            <button
              type="button"
              className={`setting-segment-btn ${themeMode === 'light' ? 'setting-segment-btn--active' : ''}`}
              onClick={() => setThemeMode('light')}
            >
              라이트
            </button>
            <button
              type="button"
              className={`setting-segment-btn ${themeMode === 'dark' ? 'setting-segment-btn--active' : ''}`}
              onClick={() => setThemeMode('dark')}
            >
              다크
            </button>
            <button
              type="button"
              className={`setting-segment-btn ${themeMode === 'system' ? 'setting-segment-btn--active' : ''}`}
              onClick={() => setThemeMode('system')}
            >
              시스템
            </button>
          </div>
        </div>

        <button
          type="button"
          className="setting-list-row setting-list-row--interactive"
          onClick={handleCleanCache}
        >
          <div className="setting-list-row__left">
            <span className="setting-row-icon">
              <Trash size={18} weight="fill" aria-hidden="true" />
            </span>
            <div className="setting-list-row__text">
              <span className="setting-row-title">캐시 데이터 삭제</span>
              <span className="setting-row-desc">
                {cleaned ? '캐시가 모두 정리되었습니다 (0 KB)' : '현재 임시 파일 용량 42.8 MB'}
              </span>
            </div>
          </div>
          <span className="setting-row-action-link">
            {cleaned ? '완료' : '정리하기'}
          </span>
        </button>

        <button type="button" className="setting-list-row setting-list-row--interactive">
          <div className="setting-list-row__left">
            <span className="setting-row-icon">
              <ShieldCheck size={18} weight="fill" aria-hidden="true" />
            </span>
            <span className="setting-row-title">이용약관 및 개인정보 처리방침</span>
          </div>
          <CaretRight size={16} weight="bold" className="setting-row-arrow" aria-hidden="true" />
        </button>

        <button type="button" className="setting-list-row setting-list-row--interactive">
          <div className="setting-list-row__left">
            <span className="setting-row-icon">
              <FileCode size={18} weight="fill" aria-hidden="true" />
            </span>
            <span className="setting-row-title">오픈소스 라이선스</span>
          </div>
          <CaretRight size={16} weight="bold" className="setting-row-arrow" aria-hidden="true" />
        </button>

        <div className="setting-list-row">
          <div className="setting-list-row__left">
            <span className="setting-row-icon">
              <Info size={18} weight="fill" aria-hidden="true" />
            </span>
            <span className="setting-row-title">앱 버전 정보</span>
          </div>
          <span className="setting-version-label">v2.4.1 (최신 버전)</span>
        </div>
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
        <button type="button" className="setting-sub-link">계정 전환</button>
        <span className="setting-sub-divider">·</span>
        <button type="button" className="setting-sub-link setting-sub-link--danger">회원 탈퇴</button>
      </div>
    </div>
  )
}
