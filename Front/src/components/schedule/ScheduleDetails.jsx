import { CalendarBlank, Bell } from '@phosphor-icons/react'
import SectionCard from '../common/SectionCard'
import { coursesForDate, eventsForDate, hourLabel, parseDate } from './scheduleModel'

export default function ScheduleDetails({ selectedDate, events, weekly = false }) {
  const date = parseDate(selectedDate)
  const courses = coursesForDate(selectedDate)
  const personal = eventsForDate(selectedDate, events)
  const heading = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(date)
  const Icon = weekly ? Bell : CalendarBlank
  return (
    <SectionCard className="schedule-details">
      <div className="schedule-details__heading">
        <span><Icon size={16} weight="fill" aria-hidden="true" /></span>
        <h2>{heading} {weekly ? '연계 일정' : '상세 일정'}</h2>
        <small>수업 {courses.length}건 · 일정 {personal.length}건</small>
      </div>
      {!weekly && courses.map((course) => (
        <div className="schedule-detail" key={course.id}>
          <time>{hourLabel(course.start)}<br />– {hourLabel(course.end)}</time>
          <div><strong>{course.title}</strong><small>{course.location} · 주간 반복</small></div>
          <span className="schedule-kind schedule-kind--class">수업</span>
        </div>
      ))}
      {personal.map((event) => (
        <div className="schedule-detail" key={event.id}>
          <time>{event.time}</time>
          <div><strong>{event.title}</strong><small>{event.location || '개인 일정'}</small></div>
          <span className={`schedule-kind schedule-kind--${event.kind}`}>{event.kind === 'task' ? '과제/마감' : event.kind === 'notice' ? '학사 공지' : 'AI 추천'}</span>
        </div>
      ))}
      {(weekly ? personal.length === 0 : courses.length + personal.length === 0) && <p className="schedule-empty">선택한 날짜에 등록된 {weekly ? '연계 ' : ''}일정이 없어요.</p>}
    </SectionCard>
  )
}
