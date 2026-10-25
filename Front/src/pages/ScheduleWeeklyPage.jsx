import { useEffect, useState } from 'react'
import SectionCard from '../components/common/SectionCard'
import ScheduleDetails from '../components/schedule/ScheduleDetails'
import { activeCourses, coursesForDate, eventsForDate, hourLabel, parseDate, snapCourseHours, weekDates } from '../components/schedule/scheduleModel'
import { COURSE_KINDS } from '../components/schedule/courseCatalog'

const DAYS = ['월', '화', '수', '목', '금', '토', '일']
const HOUR_PX = 64

function isWeekendToday() {
  const day = new Date().getDay()
  return day === 0 || day === 6
}

export default function ScheduleWeeklyPage({ selectedDate, events, courses, removedCourseIds, onSelect, onRemoveEvent }) {
  // 초기 접근: 오늘이 토·일이면 주말 표시, 평일이면 미표시
  const [showWeekend, setShowWeekend] = useState(() => isWeekendToday())
  const allCourses = activeCourses(courses, removedCourseIds)
  const week = weekDates(selectedDate, 7)
  const friday = week[4]
  const selectedDay = parseDate(selectedDate)?.getDay()
  const selectedIsWeekend = selectedDay === 0 || selectedDay === 6

  useEffect(() => {
    setShowWeekend(isWeekendToday())
  }, [])

  useEffect(() => {
    if (!showWeekend && selectedIsWeekend) onSelect(friday)
  }, [showWeekend, selectedIsWeekend, onSelect, friday])

  const visibleDates = showWeekend ? week : week.slice(0, 5)
  const timetableEvents = week.flatMap((date) => eventsForDate(date, events)
    .map((event) => ({ ...event, date })))
  const eventHours = timetableEvents
    .filter((event) => visibleDates.includes(event.date))
    .flatMap((event) => {
      const [sh, sm] = String(event.time || '0:0').split(':').map(Number)
      const start = sh + (sm || 0) / 60
      let end = start + 1
      if (event.endTime) {
        const [eh, em] = String(event.endTime).split(':').map(Number)
        const endRaw = eh + (em || 0) / 60
        if (endRaw > start) end = endRaw
      }
      return [start, end]
    })
  const snapped = allCourses.map(snapCourseHours)
  const firstHour = Math.min(9, ...snapped.map((course) => course.start), ...eventHours.map(Math.floor))
  const lastHour = Math.max(18, ...snapped.map((course) => course.end), ...eventHours.map((h) => Math.min(24, Math.ceil(h))))
  const hours = Array.from({ length: Math.max(1, lastHour - firstHour) }, (_, index) => index + firstHour)

  const eventBlock = (event) => {
    const [sh, sm] = String(event.time || '0:0').split(':').map(Number)
    const start = sh + (sm || 0) / 60
    let end = start + 1
    if (event.endTime) {
      const [eh, em] = String(event.endTime).split(':').map(Number)
      const endRaw = eh + (em || 0) / 60
      if (endRaw > start) end = endRaw
    }
    return { start, end }
  }

  return (
    <>
      <SectionCard
        className={`weekly-timetable${showWeekend ? ' weekly-timetable--weekend' : ''}`}
        aria-label="주간 시간표"
        style={{ '--timetable-hour': `${HOUR_PX}px` }}
      >
        <div className="weekly-timetable__header">
          <span>TIME</span>
          {week.map((value, index) => {
            const weekend = index >= 5
            return (
              <button
                type="button"
                key={value}
                onClick={() => onSelect(value)}
                className={`${value === selectedDate ? 'is-selected' : ''}${weekend ? ' is-weekend' : ''}`}
                aria-pressed={value === selectedDate}
                aria-hidden={weekend && !showWeekend ? true : undefined}
                tabIndex={weekend && !showWeekend ? -1 : undefined}
                aria-label={`${parseDate(value).getMonth() + 1}월 ${parseDate(value).getDate()}일 ${DAYS[index]}요일 선택`}
              >
                <strong>{DAYS[index]}</strong>
                <small>{parseDate(value).getDate()}</small>
              </button>
            )
          })}
        </div>
        <div className="weekly-timetable__body" style={{ '--timetable-height': `${hours.length * HOUR_PX}px` }}>
          <div className="weekly-timetable__hours">{hours.map((hour) => <span key={hour}>{String(hour).padStart(2, '0')}</span>)}</div>
          {week.map((value, index) => {
            const weekend = index >= 5
            const dayLabel = `${parseDate(value).getMonth() + 1}월 ${parseDate(value).getDate()}일 ${DAYS[index]}요일`
            return (
              <div
                key={value}
                role="button"
                tabIndex={weekend && !showWeekend ? -1 : 0}
                className={`timetable-column${value === selectedDate ? ' timetable-column--selected' : ''}${weekend ? ' timetable-column--weekend' : ''}`}
                aria-hidden={weekend && !showWeekend ? true : undefined}
                aria-pressed={value === selectedDate}
                aria-label={`${dayLabel} 선택`}
                onClick={() => onSelect(value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(value)
                  }
                }}
              >
                {coursesForDate(value, courses, removedCourseIds).map((course) => {
                  const { start, end } = snapCourseHours(course)
                  return (
                    <button
                      type="button"
                      key={course.id}
                      onClick={() => onSelect(value)}
                      className={`timetable-course timetable-course--${course.color || course.kind}`}
                      style={{ top: (start - firstHour) * HOUR_PX + 2, height: (end - start) * HOUR_PX - 4 }}
                      aria-label={`${course.title}, ${hourLabel(course.start)}부터 ${hourLabel(course.end)}까지, ${course.location}, ${COURSE_KINDS[course.kind] || '수업'}`}
                      title={`${course.title} · ${hourLabel(course.start)}–${hourLabel(course.end)} · ${course.location}`}
                      tabIndex={weekend && !showWeekend ? -1 : undefined}
                    >
                      <strong>{course.title}</strong>
                      <small className="timetable-course__place">{course.location}</small>
                      <small className="timetable-course__kind">{COURSE_KINDS[course.kind] || '수업'}</small>
                    </button>
                  )
                })}
                {timetableEvents.filter((event) => event.date === value).map((event) => {
                  const { start, end } = eventBlock(event)
                  const timeLabel = event.endTime ? `${event.time}–${event.endTime}` : event.time
                  return (
                    <button
                      type="button"
                      key={`${event.id}-${value}`}
                      onClick={() => onSelect(value)}
                      className={`timetable-event timetable-event--${event.kind || 'personal'} ${event.repeatWeekly ? 'timetable-event--recurring' : ''}`}
                      style={{ top: (start - firstHour) * HOUR_PX + 2, height: Math.max(28, (end - start) * HOUR_PX - 4) }}
                      title={`${event.title} · ${timeLabel}${event.repeatWeekly ? ' · 매주 반복' : ''}`}
                      aria-label={`${event.title}, ${timeLabel}${event.repeatWeekly ? ', 매주 반복' : ''}`}
                      tabIndex={weekend && !showWeekend ? -1 : undefined}
                    >
                      <strong>{event.title}</strong>
                      <small>{timeLabel}{event.repeatWeekly ? ' · 매주' : ''}{event.location ? ` · ${event.location}` : ''}</small>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </SectionCard>

      <div
        className={`weekend-toggle${showWeekend ? ' weekend-toggle--show' : ' weekend-toggle--hide'}`}
        role="group"
        aria-label="주말 일정 표시"
      >
        <span className="weekend-toggle__thumb" aria-hidden="true" />
        <button
          type="button"
          className={`weekend-toggle__button${showWeekend ? ' is-active' : ''}`}
          aria-pressed={showWeekend}
          onClick={() => setShowWeekend(true)}
        >
          주말 표시
        </button>
        <button
          type="button"
          className={`weekend-toggle__button${!showWeekend ? ' is-active' : ''}`}
          aria-pressed={!showWeekend}
          onClick={() => setShowWeekend(false)}
        >
          주말 미표시
        </button>
      </div>

      <ScheduleDetails selectedDate={selectedDate} events={events} customCourses={courses} removedCourseIds={removedCourseIds} onRemoveEvent={onRemoveEvent} weekly />
    </>
  )
}
