import SectionCard from '../components/common/SectionCard'
import ScheduleDetails from '../components/schedule/ScheduleDetails'
import { coursesForDate, eventsForDate, monthDates, parseDate } from '../components/schedule/scheduleModel'

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export default function ScheduleMonthlyPage({ selectedDate, events, onSelect }) {
  const selectedMonth = selectedDate.slice(0, 7)
  return (
    <>
      <SectionCard className="monthly-calendar" aria-label="월간 달력">
        <div className="monthly-calendar__weekdays">{DAYS.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="monthly-calendar__grid">
          {monthDates(selectedDate).map((value) => {
            const date = parseDate(value)
            const courses = coursesForDate(value)
            const personal = eventsForDate(value, events)
            const selected = value === selectedDate
            return (
              <button key={value} type="button" className={`calendar-day ${value.slice(0, 7) !== selectedMonth ? 'calendar-day--outside' : ''} ${selected ? 'calendar-day--selected' : ''}`} onClick={() => onSelect(value)} aria-pressed={selected} aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일, 수업 ${courses.length}건, 일정 ${personal.length}건`}>
                <span className="calendar-day__number">{date.getDate()}</span>
                {courses.length > 0 && <span className="calendar-day__classes" aria-hidden="true" />}
                <span className="calendar-day__dots" aria-hidden="true">{[...new Set(personal.map((event) => event.kind))].map((kind) => <i className={`schedule-dot schedule-dot--${kind}`} key={kind} />)}</span>
              </button>
            )
          })}
        </div>
        <div className="calendar-legend">
          <span><i className="calendar-day__classes" />정규 수업(학기)</span>
          <span><i className="schedule-dot schedule-dot--task" />과제/마감</span>
          <span><i className="schedule-dot schedule-dot--notice" />학사 공지</span>
          <span><i className="schedule-dot schedule-dot--recommend" />AI 추천/시험</span>
        </div>
      </SectionCard>
      <ScheduleDetails selectedDate={selectedDate} events={events} />
    </>
  )
}
