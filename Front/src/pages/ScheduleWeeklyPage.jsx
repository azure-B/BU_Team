import SectionCard from '../components/common/SectionCard'
import ScheduleDetails from '../components/schedule/ScheduleDetails'
import { coursesForDate, eventsForDate, hourLabel, parseDate, weekDates } from '../components/schedule/scheduleModel'

const HOURS = Array.from({ length: 9 }, (_, index) => index + 9)
const DAYS = ['월', '화', '수', '목', '금']

export default function ScheduleWeeklyPage({ selectedDate, events, onSelect }) {
  const dates = weekDates(selectedDate)
  return (
    <>
      <SectionCard className="weekly-timetable" aria-label="주간 시간표">
        <div className="weekly-timetable__header">
          <span>TIME</span>
          {dates.map((value, index) => <button type="button" key={value} onClick={() => onSelect(value)} className={value === selectedDate ? 'is-selected' : ''} aria-pressed={value === selectedDate} aria-label={`${parseDate(value).getMonth() + 1}월 ${parseDate(value).getDate()}일 ${DAYS[index]}요일 선택`}><strong>{DAYS[index]}</strong><small>{parseDate(value).getDate()}</small></button>)}
        </div>
        <div className="weekly-timetable__body">
          <div className="weekly-timetable__hours">{HOURS.map((hour) => <span key={hour}>{String(hour).padStart(2, '0')}</span>)}</div>
          {dates.map((value) => (
            <div key={value} className={`timetable-column ${value === selectedDate ? 'timetable-column--selected' : ''}`}>
              {coursesForDate(value).map((course) => <button type="button" key={course.id} onClick={() => onSelect(value)} className={`timetable-course timetable-course--${course.color}`} style={{ top: (course.start - 9) * 48 + 2, height: (course.end - course.start) * 48 - 4 }} aria-label={`${course.title}, ${hourLabel(course.start)}부터 ${hourLabel(course.end)}까지, ${course.location}`} title={`${course.title} · ${hourLabel(course.start)}–${hourLabel(course.end)} · ${course.location}`}><strong>{course.title}</strong><small>{course.location}</small><span>{course.credits}</span></button>)}
              {eventsForDate(value, events).filter((event) => event.kind === 'recommend' && event.time >= '09:00' && event.time < '18:00').map((event) => {
                const [hour, minute] = event.time.split(':').map(Number)
                const start = hour + minute / 60
                return <button type="button" key={event.id} onClick={() => onSelect(value)} className="timetable-recommendation" style={{ top: (start - 9) * 48 + 2, height: Math.min(1, 18 - start) * 48 - 4 }} title={`${event.title} · ${event.time}`}><strong>{event.id === 'review' ? 'AI 복습' : event.title}</strong><small>{event.time}</small></button>
              })}
            </div>
          ))}
        </div>
        <div className="weekly-timetable__summary"><span>총 18학점 이수 중</span><strong>종강: 2026.12.21까지 자동 반복</strong></div>
      </SectionCard>
      <ScheduleDetails selectedDate={selectedDate} events={events} weekly />
    </>
  )
}
