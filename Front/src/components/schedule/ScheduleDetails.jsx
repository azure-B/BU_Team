import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CalendarBlank, Bell, Trash, CheckSquareOffset, CaretDown, CaretUp } from '@phosphor-icons/react'
import SectionCard from '../common/SectionCard'
import { coursesForDate, eventsForDate, hourLabel, parseDate } from './scheduleModel'
import { COURSE_KINDS } from './courseCatalog'
import { getScheduleTasks } from '../../api/dashboardApi'

const WEEKEND_EMPTY_MESSAGES = [
  '주말엔 알람 끄고, 여유 한 스푼 더 담아보세요.',
  '오늘은 계획표보다 낮잠이 우선순위예요.',
  '과제 생각은 월요일에게 맡기고, 지금은 충전 타임!',
  '빈 일정표, 그게 바로 주말의 특권이죠.',
  '밖으로 나가든 집에서 쉬든, 당신 페이스가 정답이에요.',
]

const STATUS_LABEL = { PENDING: '대기', IN_PROGRESS: '진행 중', COMPLETED: '완료' }

/** 마감일 기준 해당 학사주(월~일) 기간 */
function taskWeekPeriod(dueAt) {
  const due = new Date(dueAt)
  if (Number.isNaN(due.getTime())) return null
  const start = new Date(due.getFullYear(), due.getMonth(), due.getDate() - ((due.getDay() + 6) % 7), 0, 0, 0, 0)
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999)
  return { start, end }
}

function formatPeriodRange(period) {
  if (!period) return ''
  const fmt = (d) => `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`
  return `${fmt(period.start)}–${fmt(period.end)}`
}

function isDateInPeriod(date, period) {
  if (!date || !period) return false
  const t = date.getTime()
  return t >= period.start.getTime() && t <= period.end.getTime()
}

function displayTaskTitle(title) {
  return String(title || '').replace(/^(.+?)\s·\s/, '')
}

export default function ScheduleDetails({ selectedDate, events, customCourses, removedCourseIds, onRemoveCourse, onRemoveEvent, weekly = false }) {
  const date = parseDate(selectedDate)
  const courses = coursesForDate(selectedDate, customCourses, removedCourseIds)
  const personal = eventsForDate(selectedDate, events)
  const heading = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(date)
  const Icon = weekly ? Bell : CalendarBlank
  const reducedMotion = useReducedMotion()
  const isWeekend = date?.getDay() === 0 || date?.getDay() === 6
  const emptyMessage = useMemo(() => {
    if (!isWeekend) return '선택한 날짜에 등록된 일정이 없어요.'
    return WEEKEND_EMPTY_MESSAGES[Math.floor(Math.random() * WEEKEND_EMPTY_MESSAGES.length)]
  }, [selectedDate, isWeekend])
  const emptyMotion = reducedMotion
    ? { initial: false, animate: { opacity: 1 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 10, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -6, scale: 0.98 },
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
      }

  // 특정 수업의 연계 과제 상태 관리
  const [courseTasks, setCourseTasks] = useState({})
  const [loadingTasks, setLoadingTasks] = useState({})
  const [expandedCourses, setExpandedCourses] = useState({})

  const toggleCourseTasks = async (courseId) => {
    const isExpanded = expandedCourses[courseId]
    if (isExpanded) {
      setExpandedCourses((prev) => ({ ...prev, [courseId]: false }))
      return
    }

    setExpandedCourses((prev) => ({ ...prev, [courseId]: true }))
    if (!courseTasks[courseId]) {
      setLoadingTasks((prev) => ({ ...prev, [courseId]: true }))
      try {
        const res = await getScheduleTasks(courseId)
        setCourseTasks((prev) => ({ ...prev, [courseId]: res.tasks || [] }))
      } catch (err) {
        console.warn('연계 과제 조회 실패:', err.message)
        setCourseTasks((prev) => ({ ...prev, [courseId]: [] }))
      } finally {
        setLoadingTasks((prev) => ({ ...prev, [courseId]: false }))
      }
    }
  }

  return (
    <SectionCard className="schedule-details">
      <div className="schedule-details__heading">
        <span><Icon size={16} weight="fill" aria-hidden="true" /></span>
        <h2>{heading} {weekly ? '일정' : '상세 일정'}</h2>
        <small>수업 {courses.length}건 · 일정 {personal.length}건</small>
      </div>

      {courses.map((course) => {
        const isExpanded = expandedCourses[course.id]
        const tasksForDay = (courseTasks[course.id] || [])
          .map((task) => ({ ...task, period: taskWeekPeriod(task.dueAt) }))
          .filter((task) => isDateInPeriod(date, task.period))
        const isLoading = loadingTasks[course.id]
        const placeLine = [course.professor, course.location].filter(Boolean).join(' · ')

        return (
          <div key={course.id} className="schedule-detail-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className="schedule-detail">
              <time>{hourLabel(course.start)}<br />– {hourLabel(course.end)}</time>
              <div>
                <strong>{course.title}</strong>
                {placeLine ? <small>{placeLine}</small> : null}
              </div>
              <span className={`schedule-kind schedule-kind--${course.kind || 'class'}`}>{COURSE_KINDS[course.kind] || '수업'}</span>
              
              <button
                type="button"
                className="schedule-icon-button"
                title="연계 과제 확인"
                aria-label={`${course.title} 연계 과제`}
                style={{ color: '#2563eb' }}
                onClick={() => toggleCourseTasks(course.id)}
              >
                {isExpanded ? <CaretUp size={16} /> : <CheckSquareOffset size={16} />}
              </button>

              <button
                type="button"
                className="schedule-icon-button"
                aria-label={`${course.title} 수업 삭제`}
                onClick={() => onRemoveCourse(course.id)}
              >
                <Trash size={16} aria-hidden="true" />
              </button>
            </div>

            {/* 일정 ↔ 과제 연계 뷰 — 선택 날짜가 속한 주차 과제만 */}
            {isExpanded && (
              <div
                style={{
                  margin: '0 0 8px 60px',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                }}
              >
                <strong style={{ display: 'block', marginBottom: '4px', color: '#1e293b' }}>
                  📝 {course.title} 연계 과제
                </strong>
                {isLoading ? (
                  <p style={{ margin: 0, color: '#64748b' }}>과제를 불러오는 중...</p>
                ) : tasksForDay.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#334155' }}>
                    {tasksForDay.map((t) => (
                      <li key={t.id} style={{ marginBottom: '6px' }}>
                        <strong>{displayTaskTitle(t.title)}</strong>
                        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
                          기간 {formatPeriodRange(t.period)} · 중요도 {t.importance}점 · {STATUS_LABEL[t.status] || t.status}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, color: '#94a3b8' }}>이 날짜에 해당하는 연계 과제가 없습니다.</p>
                )}
              </div>
            )}
          </div>
        )
      })}

      {personal.map((event) => (
        <div className="schedule-detail" key={event.id}>
          <time>{event.time}</time>
          <div><strong>{event.title}</strong><small>{event.repeatWeekly ? '매주 반복 · ' : ''}{event.location || '개인 일정'}</small></div>
          <span className={`schedule-kind schedule-kind--${event.kind}`}>{event.kind === 'task' ? '과제/마감' : event.kind === 'notice' ? '학사 공지' : 'AI 추천'}</span>
          {onRemoveEvent && events.some((savedEvent) => savedEvent.id === event.id) && (
            <button
              type="button"
              className="schedule-icon-button"
              aria-label={`${event.title} ${event.repeatWeekly ? '정기 일정' : '일정'} 삭제`}
              onClick={() => onRemoveEvent(event.id)}
            >
              <Trash size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      ))}

      <AnimatePresence mode="wait">
        {courses.length + personal.length === 0 && (
          <motion.p
            key={`${selectedDate}-${emptyMessage}`}
            className={`schedule-empty${isWeekend ? ' schedule-empty--weekend' : ''}`}
            {...emptyMotion}
          >
            {emptyMessage}
          </motion.p>
        )}
      </AnimatePresence>
    </SectionCard>
  )
}
