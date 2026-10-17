import { CalendarBlank, Bell, Trash } from '@phosphor-icons/react'
import SectionCard from '../common/SectionCard'
import { coursesForDate, eventsForDate, hourLabel, parseDate } from './scheduleModel'
import { COURSE_KINDS } from './courseCatalog'

export default function ScheduleDetails({ selectedDate, events, customCourses, removedCourseIds, onRemoveCourse, onRemoveEvent, weekly = false }) {
  const date = parseDate(selectedDate)
  const courses = coursesForDate(selectedDate, customCourses, removedCourseIds)
  const personal = eventsForDate(selectedDate, events)
  const heading = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(date)
  const Icon = weekly ? Bell : CalendarBlank
  return (
    <SectionCard className="schedule-details">
      <div className="schedule-details__heading">
        <span><Icon size={16} weight="fill" aria-hidden="true" /></span>
        <h2>{heading} {weekly ? '일정' : '상세 일정'}</h2>
        <small>수업 {courses.length}건 · 일정 {personal.length}건</small>
      </div>
      {courses.map((course) => (
        <div className="schedule-detail" key={course.id}>
          <time>{hourLabel(course.start)}<br />– {hourLabel(course.end)}</time>
          <div><strong>{course.title}</strong><small>{[course.professor, course.location, '매주 반복'].filter(Boolean).join(' · ')}</small></div>
          <span className={`schedule-kind schedule-kind--${course.kind || 'class'}`}>{COURSE_KINDS[course.kind] || '수업'}</span>
          <button type="button" className="schedule-icon-button" aria-label={`${course.title} 수업 삭제`} onClick={() => onRemoveCourse(course.id)}><Trash size={16} aria-hidden="true" /></button>
        </div>
      ))}
      {personal.map((event) => (
        <div className="schedule-detail" key={event.id}>
          <time>{event.time}</time>
          <div><strong>{event.title}</strong><small>{event.repeatWeekly ? '매주 반복 · ' : ''}{event.location || '개인 일정'}</small></div>
          <span className={`schedule-kind schedule-kind--${event.kind}`}>{event.kind === 'task' ? '과제/마감' : event.kind === 'notice' ? '학사 공지' : 'AI 추천'}</span>
          {onRemoveEvent && events.some((savedEvent) => savedEvent.id === event.id) && <button type="button" className="schedule-icon-button" aria-label={`${event.title} ${event.repeatWeekly ? '정기 일정' : '일정'} 삭제`} onClick={() => onRemoveEvent(event.id)}><Trash size={16} aria-hidden="true" /></button>}
        </div>
      ))}
      {courses.length + personal.length === 0 && <p className="schedule-empty">선택한 날짜에 등록된 일정이 없어요.</p>}
    </SectionCard>
  )
}
