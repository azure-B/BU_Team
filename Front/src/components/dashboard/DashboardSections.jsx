import {
  BookOpenText,
  CaretRight,
  CheckCircle,
  Clock,
  FileText,
  ForkKnife,
  Lightbulb,
  MapPin,
  Megaphone,
  NavigationArrow,
  Sparkle,
  Warning,
} from '@phosphor-icons/react'
import SectionCard from '../common/SectionCard'
import './DashboardSections.css'

const SCHEDULES = [
  { time: '10:00 - 11:30', status: '종료', title: '자료구조', location: '본부동 201호', icon: CheckCircle, tone: 'muted' },
  { time: '12:00 - 13:00', status: '점심', title: '점심 식사', location: '학생식당 (학식)', icon: ForkKnife, tone: 'lunch' },
  { time: '15:00 - 16:30', status: '다음 일정', title: '인공지능', location: '본부동 302호', icon: Clock, tone: 'primary' },
  { time: '17:00 - 18:00', status: 'AI 추천', title: '자료구조 복습', location: '학술정보관 2열람실', icon: Sparkle, tone: 'recommend' },
]

const DEADLINES = [
  { due: 'D-2', tone: 'danger', title: '인공지능 과제 초안 작성', meta: '컴퓨터공학부 · 예상 소요 90분' },
  { due: 'D-5', tone: 'primary', title: '2025-2학기 백석드림 성적장학금 신청', meta: '장학복지팀 · 온라인 접수' },
  { due: 'D-7', tone: 'muted', title: '자료구조 중간고사 대비', meta: '3~5주차 트리/그래프 알고리즘' },
]

const NOTICES = [
  { category: '학사/장학', badge: 'D-5', source: '백석대 · 컴퓨터공학부', title: '2025학년도 2학기 백석드림 장학금 신청 요강 안내', meta: '오늘 09:20 · 온라인 접수' },
  { category: '학사', badge: 'NEW', source: '학사지원팀', title: '2025-2학기 수강철회 및 성적포기 신청 기간 안내', meta: '어제 · 포털 종합정보시스템' },
  { category: '취업/비교과', source: '인재개발원', title: '백석 글로벌 IT 인재 해외 인턴십 프로그램 2기 모집', meta: '9.15 · 글로벌 역량강화 지원' },
  { category: '도서관', source: '학술정보관', title: '학술정보관 2학기 중간고사 24시간 특별 개방 및 좌석 배정 안내', meta: '9.14 · 모바일 열람증 필수' },
]

function SectionHeading({ icon: Icon, title, badge, action }) {
  return (
    <div className="section-heading">
      <div className="section-heading__title">
        <span className="section-heading__icon"><Icon size={16} weight="fill" aria-hidden="true" /></span>
        <h2>{title}</h2>
        {badge && <span className="section-heading__badge">{badge}</span>}
      </div>
      {action && <button className="text-action" type="button">{action}<CaretRight size={14} aria-hidden="true" /></button>}
    </div>
  )
}

export function NextClassCard() {
  return (
    <SectionCard className="next-class">
      <div className="next-class__top">
        <div className="next-class__date">
          <span className="next-class__spark"><Sparkle size={18} weight="fill" aria-hidden="true" /></span>
          <div>
            <p>9월 17일 목요일 <span>· 2학기 3주차</span></p>
            <small>실시간 캠퍼스 이동 &amp; 강의 안내</small>
          </div>
        </div>
        <span className="status-chip status-chip--danger">시작 42분 전</span>
      </div>

      <div className="next-class__body">
        <div className="next-class__title-row">
          <div>
            <span className="next-class__label">NEXT CLASS</span>
            <h2>인공지능</h2>
          </div>
          <strong>15:00 - 16:30</strong>
        </div>

        <p className="location-line">
          <MapPin size={16} weight="fill" aria-hidden="true" />
          <strong>본부동 302호</strong>
          <span>현재 위치(자유관 203호)에서 도보 11분</span>
        </p>

        <div className="class-tip">
          <span className="class-tip__icon"><Lightbulb size={16} weight="fill" aria-hidden="true" /></span>
          <div className="class-tip__content">
            <p className="class-tip__highlight"><strong>14:35까지 출발</strong>을 권장해요.</p>
            <p className="class-tip__sub">예상 이동 시간은 도보 11분입니다.</p>
          </div>
        </div>

        <div className="class-actions">
          <button className="dashboard-button dashboard-button--primary" type="button">
            <NavigationArrow size={17} weight="fill" aria-hidden="true" /> 이동 경로 보기
          </button>
          <button className="dashboard-button dashboard-button--secondary" type="button">
            <FileText size={17} weight="fill" aria-hidden="true" /> 수업자료 미리보기
          </button>
        </div>
      </div>
    </SectionCard>
  )
}

export function TodaySchedule() {
  return (
    <SectionCard className="dashboard-section">
      <SectionHeading icon={Clock} title="오늘 일정" action="전체보기" />
      <div className="schedule-list">
        {SCHEDULES.map(({ time, status, title, location, icon: Icon, tone }) => (
          <div className={`schedule-row schedule-row--${tone}`} key={`${time}-${title}`}>
            <time>{time}</time>
            <span className="schedule-row__icon"><Icon size={16} weight="fill" aria-hidden="true" /></span>
            <div className="schedule-row__content">
              <div className="schedule-row__header">
                <span className="schedule-row__status">{status}</span>
                <strong className="schedule-row__title">{title}</strong>
              </div>
              <small className="schedule-row__location">{location}</small>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

export function DeadlineList() {
  return (
    <SectionCard className="dashboard-section">
      <SectionHeading icon={Warning} title="놓치면 안 돼요" badge="3건 마감 임박" />
      <div className="deadline-list">
        {DEADLINES.map((item) => (
          <button className="deadline-row" type="button" key={item.title}>
            <span className={`due-chip due-chip--${item.tone}`}>{item.due}</span>
            <span className="deadline-row__content">
              <strong>{item.title}</strong>
              <small>{item.meta}</small>
            </span>
            <CaretRight size={17} aria-hidden="true" />
          </button>
        ))}
      </div>
    </SectionCard>
  )
}

export function NoticeList() {
  return (
    <SectionCard className="dashboard-section">
      <SectionHeading icon={Megaphone} title="주요 공지사항" badge="4건 새글" action="전체보기" />
      <div className="notice-list">
        {NOTICES.map((notice) => (
          <button className="notice-row" type="button" key={notice.title}>
            <span className="notice-row__content">
              <span className="notice-row__meta">
                <span className="category-chip">{notice.category}</span>
                {notice.badge && <span className={`notice-badge ${notice.badge === 'NEW' ? 'notice-badge--new' : ''}`}>{notice.badge}</span>}
                <span>{notice.source}</span>
              </span>
              <strong>{notice.title}</strong>
              <small>{notice.meta}</small>
            </span>
            <CaretRight size={17} aria-hidden="true" />
          </button>
        ))}
      </div>
    </SectionCard>
  )
}

export function EmptyDashboardState() {
  return (
    <SectionCard className="dashboard-empty">
      <BookOpenText size={28} weight="duotone" aria-hidden="true" />
      <strong>표시할 일정이 없어요</strong>
      <p>새 일정이 등록되면 이곳에 바로 안내해 드릴게요.</p>
    </SectionCard>
  )
}
