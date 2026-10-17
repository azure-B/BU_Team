import SectionCard from '../components/common/SectionCard'
import ScheduleDetails from '../components/schedule/ScheduleDetails'
import { activeCourses, coursesForDate, eventsForDate, hourLabel, parseDate, weekDates } from '../components/schedule/scheduleModel'
import { COURSE_KINDS } from '../components/schedule/courseCatalog'

const DAYS = ['월', '화', '수', '목', '금', '토', '일']

export default function ScheduleWeeklyPage({ selectedDate, events, courses, removedCourseIds, onSelect, onRemoveCourse, onRemoveEvent }) {
  const allCourses = activeCourses(courses, removedCourseIds)
  const dates = weekDates(selectedDate, allCourses.some((course) => course.day > 5) ? 7 : 5)
  const timetableEvents = dates.flatMap((date) => eventsForDate(date, events)
    .filter((event) => event.repeatWeekly === true || (event.kind === 'recommend' && event.time >= '09:00' && event.time < '18:00'))
    .map((event) => ({ ...event, date })))
  const eventStarts = timetableEvents.map((event) => {
    const [hour, minute] = event.time.split(':').map(Number)
    return hour + minute / 60
  })
  const firstHour = Math.min(9, ...allCourses.map((course) => Math.floor(course.start)), ...eventStarts.map(Math.floor))
  const lastHour = Math.max(18, ...allCourses.map((course) => Math.ceil(course.end)), ...eventStarts.map((start) => Math.min(24, Math.ceil(start + 1))))
  const hours = Array.from({ length: lastHour - firstHour }, (_, index) => index + firstHour)
  return (
    <>
      <SectionCard className="weekly-timetable" aria-label="주간 시간표" style={{ '--timetable-days': dates.length }}>
        <div className="weekly-timetable__header">
          <span>TIME</span>
          {dates.map((value, index) => <button type="button" key={value} onClick={() => onSelect(value)} className={value === selectedDate ? 'is-selected' : ''} aria-pressed={value === selectedDate} aria-label={`${parseDate(value).getMonth() + 1}월 ${parseDate(value).getDate()}일 ${DAYS[index]}요일 선택`}><strong>{DAYS[index]}</strong><small>{parseDate(value).getDate()}</small></button>)}
        </div>
        <div className="weekly-timetable__body" style={{ '--timetable-height': `${hours.length * 48}px` }}>
          <div className="weekly-timetable__hours">{hours.map((hour) => <span key={hour}>{String(hour).padStart(2, '0')}</span>)}</div>
          {dates.map((value) => (
            <div key={value} className={`timetable-column ${value === selectedDate ? 'timetable-column--selected' : ''}`}>
              {coursesForDate(value, courses, removedCourseIds).map((course) => <button type="button" key={course.id} onClick={() => onSelect(value)} className={`timetable-course timetable-course--${course.color}`} style={{ top: (course.start - firstHour) * 48 + 2, height: (course.end - course.start) * 48 - 4 }} aria-label={`${course.title}, ${hourLabel(course.start)}부터 ${hourLabel(course.end)}까지, ${COURSE_KINDS[course.kind] || course.location}`} title={`${course.title} · ${hourLabel(course.start)}–${hourLabel(course.end)} · ${course.location}`}><strong>{course.title}</strong><small>{COURSE_KINDS[course.kind] || course.location}</small></button>)}
              {timetableEvents.filter((event) => event.date === value).map((event) => {
                const [hour, minute] = event.time.split(':').map(Number)
                const start = hour + minute / 60
                if (!event.repeatWeekly && coursesForDate(value, courses, removedCourseIds).some((course) => start < course.end && Math.min(start + 1, 24) > course.start)) return null
                const duration = Math.min(1, 24 - start)
                return <button type="button" key={event.id} onClick={() => onSelect(value)} className={`timetable-event timetable-event--${event.kind} ${event.repeatWeekly ? 'timetable-event--recurring' : ''}`} style={{ top: (start - firstHour) * 48 + 2, height: Math.max(8, duration * 48 - 4) }} title={`${event.title} · ${event.time}${event.repeatWeekly ? ' · 매주 반복' : ''}`}><strong>{event.id === 'review' ? 'AI 복습' : event.title}</strong><small>{event.time}{event.repeatWeekly ? ' · 매주' : ''}</small></button>
              })}
            </div>
          ))}
        </div>
        <div className="weekly-timetable__summary"><span>주간 시간표</span></div>
      </SectionCard>
      <ScheduleDetails selectedDate={selectedDate} events={events} customCourses={courses} removedCourseIds={removedCourseIds} onRemoveCourse={onRemoveCourse} onRemoveEvent={onRemoveEvent} weekly />
    </>
  )
}
