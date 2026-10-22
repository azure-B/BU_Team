import { useState } from 'react'
import { CalendarBlank, Bell, Trash, CheckSquareOffset, CaretDown, CaretUp } from '@phosphor-icons/react'
import SectionCard from '../common/SectionCard'
import { coursesForDate, eventsForDate, hourLabel, parseDate } from './scheduleModel'
import { COURSE_KINDS } from './courseCatalog'
import { getScheduleTasks } from '../../api/dashboardApi'

export default function ScheduleDetails({ selectedDate, events, customCourses, removedCourseIds, onRemoveCourse, onRemoveEvent, weekly = false }) {
  const date = parseDate(selectedDate)
  const courses = coursesForDate(selectedDate, customCourses, removedCourseIds)
  const personal = eventsForDate(selectedDate, events)
  const heading = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(date)
  const Icon = weekly ? Bell : CalendarBlank

  // 특정 수업의 연계 과제 상태 관리
  const [courseTasks, setCourseTasks] = useState({})
  const [loadingTasks, setLoadingTasks] = useState({})
  const [expandedCourses, setExpandedCourses] = useState({})

  const toggleCourseTasks = async (courseId, courseTitle) => {
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
        const tasks = courseTasks[course.id] || []
        const isLoading = loadingTasks[course.id]

        return (
          <div key={course.id} className="schedule-detail-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className="schedule-detail">
              <time>{hourLabel(course.start)}<br />– {hourLabel(course.end)}</time>
              <div>
                <strong>{course.title}</strong>
                <small>{[course.professor, course.location, '매주 반복'].filter(Boolean).join(' · ')}</small>
              </div>
              <span className={`schedule-kind schedule-kind--${course.kind || 'class'}`}>{COURSE_KINDS[course.kind] || '수업'}</span>
              
              <button
                type="button"
                className="schedule-icon-button"
                title="연계 과제 확인"
                aria-label={`${course.title} 연계 과제`}
                style={{ color: '#2563eb' }}
                onClick={() => toggleCourseTasks(course.id, course.title)}
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

            {/* 일정 ↔ 과제 연계 뷰 */}
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
                ) : tasks.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#334155' }}>
                    {tasks.map((t) => (
                      <li key={t.id} style={{ marginBottom: '2px' }}>
                        <strong>{t.title}</strong> (중요도 {t.importance}점 · {t.status})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, color: '#94a3b8' }}>등록된 연계 과제가 없습니다.</p>
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

      {courses.length + personal.length === 0 && <p className="schedule-empty">선택한 날짜에 등록된 일정이 없어요.</p>}
    </SectionCard>
  )
}
