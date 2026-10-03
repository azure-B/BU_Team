import {
  CalendarPlus,
  CaretRight,
  Certificate,
  ChartLineUp,
  Folder,
  ListChecks,
  PencilSimpleLine,
} from '@phosphor-icons/react'
import SectionCard from '../common/SectionCard'
import './MyPageSections.css'

const PROFILE_IMG_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC7bq76F-IIQaZYUY_LwRfTT1W2ZGsFo7RTz-bWTsLD_dit8j15K9_GTK06hVhaBububojMzrdVnugQTlbeM7IWlmT2XrsFvyeA_H9N8LVaxMkjCcu0Jtcj2jazG3btt75lV4jg0a_QQK1_WPHexjTKohS6lwzk1jXKzTqUBjAUQr0OMincgu6kCv4K3mSxqVqAZzYDuUmaucu725bSz7Lva7DOZlmVA63jOqLnYIj7x7V9LYroa890mA'

const ACTIVITIES = [
  {
    icon: CalendarPlus,
    title: '시간표 직접 등록 및 수정',
    desc: '이번 학기 6개 과목 수동 입력 완료',
    badge: '직접 관리',
  },
  {
    icon: ListChecks,
    title: '수강 과목 및 과제 관리',
    desc: '진행 중인 과제 3개 · 수동 체크리스트',
    badge: '14건',
  },
  {
    icon: ChartLineUp,
    title: '취득 학점 및 성적 관리',
    desc: '학기별 성적 직접 입력 및 GPA 자동 계산',
    badge: '수정',
  },
]

export function ProfileSummaryCard() {
  return (
    <SectionCard className="mypage-card">
      <div className="mypage-card__top">
        <span className="mypage-card__student-id">컴퓨터공학부 3학년 · 학번 20221340</span>
        <span className="mypage-badge mypage-badge--semester">2025-2학기</span>
      </div>

      <div className="mypage-profile">
        <div className="mypage-profile__avatar-wrap">
          <img
            src={PROFILE_IMG_URL}
            alt="홍길동 학우 프로필"
            className="mypage-profile__avatar"
          />
        </div>

        <div className="mypage-profile__info">
          <div className="mypage-profile__name-row">
            <h2 className="mypage-profile__name">홍길동 학우님</h2>
            <span className="mypage-badge mypage-badge--role">학부생</span>
          </div>
          <p className="mypage-profile__dept">인공지능·소프트웨어 전공 트랙</p>
        </div>
      </div>

      <div className="mypage-stats-ribbon">
        <div className="mypage-stats-item">
          <span className="mypage-stats-item__label">AI 동행</span>
          <strong className="mypage-stats-item__value">342일째</strong>
        </div>
        <div className="mypage-stats-item">
          <span className="mypage-stats-item__label">학기 질문</span>
          <strong className="mypage-stats-item__value">128건</strong>
        </div>
        <div className="mypage-stats-item">
          <span className="mypage-stats-item__label">요약 노트</span>
          <strong className="mypage-stats-item__value">24개</strong>
        </div>
      </div>
    </SectionCard>
  )
}

export function AcademicPerformanceCard() {
  return (
    <SectionCard className="mypage-card">
      <div className="mypage-section-head">
        <div className="mypage-section-head__title">
          <span className="mypage-section-head__icon">
            <Certificate size={16} weight="fill" aria-hidden="true" />
          </span>
          <h3>2025-2학기 학적 및 학업</h3>
        </div>
        <div className="mypage-section-head__actions">
          <span className="mypage-badge mypage-badge--neutral">직접 등록됨</span>
          <button
            type="button"
            className="mypage-icon-btn"
            aria-label="학적 정보 직접 수정"
          >
            <PencilSimpleLine size={14} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="academic-grid">
        <div className="academic-tile">
          <span className="academic-tile__label">신청 학점</span>
          <div className="academic-tile__value-row">
            <span className="academic-tile__num">18</span>
            <span className="academic-tile__max">/ 19학점</span>
          </div>
        </div>

        <div className="academic-tile academic-tile--primary">
          <span className="academic-tile__label academic-tile__label--primary">누적 평점 (GPA)</span>
          <div className="academic-tile__value-row">
            <span className="academic-tile__num academic-tile__num--primary">4.12</span>
            <span className="academic-tile__max">/ 4.5</span>
          </div>
        </div>
      </div>

      <div className="graduation-progress">
        <div className="graduation-progress__head">
          <div className="graduation-progress__title">
            <span>백석인증 졸업요건 충족률</span>
            <span className="status-dot" aria-hidden="true" />
          </div>
          <strong className="graduation-progress__percent">82%</strong>
        </div>

        <div
          className="progress-bar-track"
          role="progressbar"
          aria-valuenow={82}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="백석인증 졸업요건 충족률 82%"
        >
          <div className="progress-bar-fill" style={{ width: '82%' }} />
        </div>

        <div className="graduation-progress__footer">
          <span className="graduation-progress__points">
            인증포인트 <strong>410</strong> / 500점
          </span>
          <button type="button" className="mypage-text-action">
            <span>상세보기</span>
            <CaretRight size={13} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
    </SectionCard>
  )
}

export function ActivityArchiveCard() {
  return (
    <SectionCard className="mypage-card">
      <div className="mypage-section-head">
        <div className="mypage-section-head__title">
          <span className="mypage-section-head__icon">
            <Folder size={16} weight="fill" aria-hidden="true" />
          </span>
          <h3>나의 활동 및 보관함</h3>
        </div>
        <button type="button" className="mypage-text-action">
          <span>전체보기</span>
          <CaretRight size={14} weight="bold" aria-hidden="true" />
        </button>
      </div>

      <div className="activity-list">
        {ACTIVITIES.map((act) => {
          const Icon = act.icon
          return (
            <button className="activity-item" type="button" key={act.title}>
              <div className="activity-item__left">
                <span className="activity-item__icon">
                  <Icon size={18} weight="fill" aria-hidden="true" />
                </span>
                <div className="activity-item__text">
                  <p className="activity-item__title">{act.title}</p>
                  <span className="activity-item__desc">{act.desc}</span>
                </div>
              </div>

              <div className="activity-item__right">
                <span className="mypage-badge mypage-badge--semester">{act.badge}</span>
                <CaretRight size={15} weight="bold" className="activity-item__arrow" aria-hidden="true" />
              </div>
            </button>
          )
        })}
      </div>
    </SectionCard>
  )
}

export function IntegrationUtilityCard() {
  return (
    <SectionCard className="mypage-card">
      <div className="direct-manage-banner">
        <div className="direct-manage-banner__body">
          <div className="direct-manage-banner__left">
            <span className="direct-manage-banner__icon">
              <PencilSimpleLine size={16} weight="bold" aria-hidden="true" />
            </span>
            <div className="direct-manage-banner__text">
              <p className="direct-manage-banner__title">내 학사 정보 직접 입력 및 관리</p>
              <p className="direct-manage-banner__desc">시간표 및 성적 직접 등록됨 (직접 입력 모드)</p>
            </div>
          </div>
          <button type="button" className="direct-manage-banner__btn">
            <span>정보 수정</span>
            <CaretRight size={13} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <div className="direct-manage-banner__footer">
          <span>* 학교 포털 연동 없이 기기에 안전하게 직접 저장됩니다</span>
          <strong>최근 수정 14:02</strong>
        </div>
      </div>

      <div className="mypage-app-meta">
        <span className="mypage-app-meta__ver">App v2.4.1 (최신 버전)</span>
        <div className="mypage-app-meta__links">
          <button type="button" className="mypage-app-meta__btn">이용약관</button>
          <span className="mypage-app-meta__divider">·</span>
          <button type="button" className="mypage-app-meta__btn">계정 전환</button>
          <span className="mypage-app-meta__divider">·</span>
          <button type="button" className="mypage-app-meta__btn mypage-app-meta__btn--danger">로그아웃</button>
        </div>
      </div>
    </SectionCard>
  )
}
