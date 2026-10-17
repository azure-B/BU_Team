import { useState, useEffect } from 'react'
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
import { getSchedules, getPrioritizedTasks, getNotices } from '../../api/dashboardApi'
import './DashboardSections.css'

function noticeMeta(createdAt) {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return '전체공지'
  return `${date.getMonth() + 1}.${date.getDate()} · 전체공지`
}

function isRecentNotice(createdAt) {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return false
  return Date.now() - date.getTime() < 14 * 24 * 60 * 60 * 1000
}

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

/**
 * 다음 수업 안내 카드 (실제 DB 일정 기반)
 */
export function NextClassCard() {
  const [nextClass, setNextClass] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNextClass = async () => {
      try {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        const schedules = await getSchedules(todayStart.toISOString(), todayEnd.toISOString())
        if (Array.isArray(schedules) && schedules.length > 0) {
          // 시작 시간 기준 오름차순 정렬
          const sorted = [...schedules].sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
          // 아직 종료되지 않은 가장 가까운 수업 찾기
          const now = new Date()
          const upcoming = sorted.find((s) => new Date(s.endAt) > now) || sorted[0]
          setNextClass(upcoming)
        }
      } catch (err) {
        console.warn('다음 수업 정보 로드 실패 (기본값 사용):', err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchNextClass()
  }, [])

  const formatTimeRange = (start, end) => {
    if (!start || !end) return '10:00 - 12:00'
    const s = new Date(start)
    const e = new Date(end)
    const pad = (n) => String(n).padStart(2, '0')
    return `${pad(s.getHours())}:${pad(s.getMinutes())} - ${pad(e.getHours())}:${pad(e.getMinutes())}`
  }

  const title = nextClass?.title || '인공지능 개론'
  const timeStr = formatTimeRange(nextClass?.startAt, nextClass?.endAt)

  return (
    <SectionCard className="next-class">
      <div className="next-class__top">
        <div className="next-class__date">
          <span className="next-class__spark"><Sparkle size={18} weight="fill" aria-hidden="true" /></span>
          <div>
            <p>오늘의 캠퍼스 이동 &amp; 강의 안내</p>
            <small>실시간 백석대 동선 계산 모듈 연동</small>
          </div>
        </div>
        <span className="status-chip status-chip--danger">오늘 수업</span>
      </div>

      <div className="next-class__body">
        <div className="next-class__title-row">
          <div>
            <span className="next-class__label">NEXT CLASS</span>
            <h2>{title}</h2>
          </div>
          <strong>{timeStr}</strong>
        </div>

        <p className="location-line">
          <MapPin size={16} weight="fill" aria-hidden="true" />
          <strong>백석대학교 진리관</strong>
          <span>현재 위치에서 도보 약 5분 소요</span>
        </p>

        <div className="class-tip">
          <span className="class-tip__icon"><Lightbulb size={16} weight="fill" aria-hidden="true" /></span>
          <div className="class-tip__content">
            <p className="class-tip__highlight"><strong>수업 시작 10분 전 출발</strong>을 권장해요.</p>
            <p className="class-tip__sub">지각 위험도가 안전(SAFE) 상태입니다.</p>
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

/**
 * 오늘 일정 목록 컴포넌트 (실제 DB Schedule 연동)
 */
export function TodaySchedule() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        const data = await getSchedules(todayStart.toISOString(), todayEnd.toISOString())
        if (Array.isArray(data) && data.length > 0) {
          setSchedules(data)
        }
      } catch (err) {
        console.warn('오늘 일정 조회 실패:', err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchSchedules()
  }, [])

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const pad = (n) => String(n).padStart(2, '0')
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const getStatusInfo = (startAt, endAt) => {
    const now = new Date()
    const start = new Date(startAt)
    const end = new Date(endAt)
    if (now > end) return { status: '종료', icon: CheckCircle, tone: 'muted' }
    if (now >= start && now <= end) return { status: '진행중', icon: Clock, tone: 'primary' }
    return { status: '예정', icon: Clock, tone: 'primary' }
  }

  return (
    <SectionCard className="dashboard-section">
      <SectionHeading icon={Clock} title="오늘 일정" action="전체보기" />
      <div className="schedule-list">
        {schedules.length > 0 ? (
          schedules.map((item) => {
            const { status, icon: Icon, tone } = getStatusInfo(item.startAt, item.endAt)
            const timeRange = `${formatTime(item.startAt)} - ${formatTime(item.endAt)}`
            return (
              <div className={`schedule-row schedule-row--${tone}`} key={item.id || item.title}>
                <time>{timeRange}</time>
                <span className="schedule-row__icon"><Icon size={16} weight="fill" aria-hidden="true" /></span>
                <div className="schedule-row__content">
                  <div className="schedule-row__header">
                    <span className="schedule-row__status">{status}</span>
                    <strong className="schedule-row__title">{item.title}</strong>
                  </div>
                  <small className="schedule-row__location">
                    {item.buildingId ? '백석대 강의실' : '캠퍼스 내 강의'}
                  </small>
                </div>
              </div>
            )
          })
        ) : (
          <div className="schedule-row schedule-row--muted">
            <time>오늘</time>
            <span className="schedule-row__icon"><CheckCircle size={16} weight="fill" aria-hidden="true" /></span>
            <div className="schedule-row__content">
              <strong className="schedule-row__title">오늘 등록된 일정이 없습니다.</strong>
              <small className="schedule-row__location">새로운 시간표나 일정을 추가해보세요.</small>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

/**
 * 우선순위 Top 3 과제 목록 컴포넌트 (조장님 계산 모듈 연동)
 */
export function DeadlineList() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopTasks = async () => {
      try {
        const data = await getPrioritizedTasks()
        if (Array.isArray(data) && data.length > 0) {
          setTasks(data)
        }
      } catch (err) {
        console.warn('우선순위 과제 조회 실패:', err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchTopTasks()
  }, [])

  const calculateDDay = (dueAt) => {
    if (!dueAt) return { dDay: 'D-day', tone: 'primary' }
    const now = new Date().getTime()
    const due = new Date(dueAt).getTime()
    const diffHours = (due - now) / (1000 * 60 * 60)

    if (diffHours < 0) return { dDay: '마감', tone: 'danger' }
    if (diffHours <= 24) return { dDay: 'D-Day', tone: 'danger' }
    const diffDays = Math.ceil(diffHours / 24)
    if (diffDays <= 3) return { dDay: `D-${diffDays}`, tone: 'primary' }
    return { dDay: `D-${diffDays}`, tone: 'muted' }
  }

  return (
    <SectionCard className="dashboard-section">
      <SectionHeading 
        icon={Warning} 
        title="놓치면 안 돼요" 
        badge={`${tasks.length}건 마감 임박 (우선순위 Top 3)`} 
      />
      <div className="deadline-list">
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const { dDay, tone } = calculateDDay(task.dueAt)
            return (
              <button className="deadline-row" type="button" key={task.id || task.title}>
                <span className={`due-chip due-chip--${tone}`}>{dDay}</span>
                <span className="deadline-row__content">
                  <strong>{task.title}</strong>
                  <small>
                    중요도 {task.importance}점 · 우선순위 점수: {task.priorityScore ?? 0}점
                  </small>
                </span>
                <CaretRight size={17} aria-hidden="true" />
              </button>
            )
          })
        ) : (
          <div className="deadline-row" style={{ cursor: 'default' }}>
            <span className="due-chip due-chip--primary">완료</span>
            <span className="deadline-row__content">
              <strong>마감 임박 과제가 없습니다!</strong>
              <small>모든 과제를 제시간에 완료했습니다.</small>
            </span>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

/**
 * 주요 공지사항 컴포넌트
 */
export function NoticeList({ limit = 5 } = {}) {
  const [notices, setNotices] = useState([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let ignore = false
    getNotices(limit)
      .then((data) => {
        if (ignore) return
        const list = Array.isArray(data?.notices) ? data.notices.slice(0, limit) : []
        setNotices(list)
        setTotal(data?.total || 0)
      })
      .catch(() => {
        if (!ignore) setNotices([])
      })
    return () => { ignore = true }
  }, [limit])

  const recentCount = notices.filter((notice) => isRecentNotice(notice.createdAt)).length

  return (
    <SectionCard className="dashboard-section">
      <SectionHeading
        icon={Megaphone}
        title="주요 공지사항"
        badge={total ? `${total}건` : recentCount ? `${recentCount}건 새글` : undefined}
        action="전체보기"
      />
      <div className="notice-list">
        {notices.length ? notices.map((notice) => (
          <a
            className="notice-row"
            key={notice.id}
            href={notice.link || 'https://www.bu.ac.kr/web/3483/subview.do'}
            target="_blank"
            rel="noreferrer"
          >
            <span className="notice-row__content">
              <span className="notice-row__meta">
                <span className="category-chip">{notice.category}</span>
                {isRecentNotice(notice.createdAt) && <span className="notice-badge notice-badge--new">NEW</span>}
                <span>{notice.source || notice.tags}</span>
              </span>
              <strong>{notice.title}</strong>
              <small>{noticeMeta(notice.createdAt)}</small>
            </span>
            <CaretRight size={17} aria-hidden="true" />
          </a>
        )) : (
          <div className="deadline-row" style={{ cursor: 'default' }}>
            <span className="deadline-row__content">
              <strong>표시할 공지가 없습니다.</strong>
              <small>Supabase에 2026년 전체공지를 넣은 뒤 다시 열어 주세요.</small>
            </span>
          </div>
        )}
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
