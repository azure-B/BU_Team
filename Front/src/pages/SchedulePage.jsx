import { useEffect, useRef, useState } from 'react'
import { CalendarBlank, CaretLeft, CaretRight, Clock, Plus, X } from '@phosphor-icons/react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import SectionCard from '../components/common/SectionCard'
import { useSchedule } from '../components/schedule/ScheduleContext'
import { activeCourses, monthWeek, parseDate, removeCourse, removeEvent, shiftDate, weekDates } from '../components/schedule/scheduleModel'
import CourseSearch from '../components/schedule/CourseSearch'
import ScheduleMonthlyPage from './ScheduleMonthlyPage'
import ScheduleWeeklyPage from './ScheduleWeeklyPage'
import './SchedulePage.css'

function openNativePicker(event) {
  const picker = event.currentTarget
  if (typeof picker.showPicker !== 'function') return
  try {
    picker.showPicker()
    event.preventDefault()
  } catch { /* Leave the browser's native click behavior as fallback. */ }
}

function PickerField({ id, label, value, displayValue, Icon, type, min, max, onChange }) {
  return (
    <div className="schedule-dialog__field">
      <span id={`${id}-label`}>{label}</span>
      <div className="schedule-dialog__picker">
        <div className="schedule-dialog__picker-face" aria-hidden="true">
          <span id={`${id}-value`}>{displayValue || value || `${label} 선택`}</span>
          <Icon size={18} aria-hidden="true" />
        </div>
        <input className="schedule-dialog__picker-input" type={type} min={min} max={max} value={value} onChange={onChange} onClick={openNativePicker} aria-labelledby={`${id}-label`} required />
      </div>
    </div>
  )
}

function AddScheduleDialog({ selectedDate, onClose, onAdd, onAddCourse, existingCourses }) {
  const dialogRef = useRef(null)
  const titleRef = useRef(null)
  const [mode, setMode] = useState('event')
  const [eventDraft, setEventDraft] = useState({ date: selectedDate, title: '', time: '09:00', kind: 'task', repeatWeekly: false })
  const [error, setError] = useState('')
  const eventDateLabel = parseDate(eventDraft.date)
    ? new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(parseDate(eventDraft.date))
    : '날짜 선택'
  const isCourse = mode === 'course'
  const draft = eventDraft
  const updateField = (field, value) => {
    setError('')
    setEventDraft((previous) => ({ ...previous, [field]: value }))
  }
  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])
  useEffect(() => { titleRef.current?.focus() }, [mode])
  const submit = (event) => {
    event.preventDefault()
    if (isCourse) return
    if (!draft.title.trim()) return
    if (!parseDate(draft.date)) { setError('날짜를 선택해 주세요.'); return }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)) { setError('시간을 선택해 주세요.'); return }
    onAdd({ ...draft, id: crypto.randomUUID(), title: draft.title.trim(), location: '개인 일정' })
    onClose()
  }
  return (
    <dialog ref={dialogRef} className={`schedule-dialog${isCourse ? ' schedule-dialog--course' : ''}`} aria-labelledby="add-schedule-title" onCancel={onClose} onClick={(event) => { if (event.target === dialogRef.current) onClose() }}>
      <form onSubmit={submit}>
        <div className="schedule-dialog__heading"><h2 id="add-schedule-title">{isCourse ? '새 수업 추가' : '새 일정 추가'}</h2><button type="button" className="schedule-icon-button" onClick={onClose} aria-label="추가 창 닫기"><X size={18} /></button></div>
        <div className="schedule-dialog__modes" role="group" aria-label="추가 모드">
          <button type="button" aria-pressed={!isCourse} onClick={() => { setMode('event'); setError('') }}>일정 추가</button>
          <button type="button" aria-pressed={isCourse} onClick={() => { setMode('course'); setError('') }}>수업 추가</button>
        </div>
        {isCourse ? <CourseSearch onAdd={onAddCourse} onClose={onClose} existingCourses={existingCourses} /> : <>
        <label>일정 제목<input ref={titleRef} required maxLength={100} value={draft.title} onChange={(event) => updateField('title', event.target.value)} placeholder="일정 또는 과제명을 입력하세요" /></label>
        <div className="schedule-dialog__dates">
          <PickerField id="schedule-date" label="날짜" value={eventDraft.date} displayValue={eventDateLabel} Icon={CalendarBlank} type="date" min="1900-01-01" max="9999-12-31" onChange={(event) => updateField('date', event.target.value)} />
          <PickerField id="schedule-time" label="시간" value={draft.time} Icon={Clock} type="time" onChange={(event) => updateField('time', event.target.value)} />
        </div>
        <label>종류<select value={draft.kind} onChange={(event) => updateField('kind', event.target.value)}><option value="task">과제/마감</option><option value="notice">학사 공지</option><option value="recommend">개인 일정/공부</option></select></label>
        <label className="schedule-dialog__repeat"><input type="checkbox" checked={eventDraft.repeatWeekly} onChange={(event) => updateField('repeatWeekly', event.target.checked)} /><span>주간 반복</span></label>
        {error && <p className="schedule-dialog__error" role="alert">{error}</p>}
        <button className="schedule-save-button" type="submit" disabled={!draft.title.trim()}>일정 저장</button>
        </>}
      </form>
    </dialog>
  )
}

export default function SchedulePage() {
  const { view } = useParams()
  const { state, setState } = useSchedule()
  const [adding, setAdding] = useState(false)
  const validView = view === 'weekly' || view === 'monthly'
  useEffect(() => {
    if (validView) setState((previous) => previous.view === view ? previous : { ...previous, view })
  }, [view, validView, setState])
  if (!validView) return <Navigate to={`/schedule/${state.view}`} replace />

  const monthly = view === 'monthly'
  const date = parseDate(state.selectedDate)
  const onSelect = (selectedDate) => setState((previous) => ({ ...previous, selectedDate }))
  const shift = (amount) => onSelect(shiftDate(state.selectedDate, monthly ? amount : amount * 7, monthly ? 'month' : 'day'))
  const ViewIcon = monthly ? Clock : CalendarBlank
  const View = monthly ? ScheduleMonthlyPage : ScheduleWeeklyPage
  const onAddCourse = (newCourses) => {
    if (!newCourses.length) return '등록할 수 있는 수업 시간이 없습니다.'
    const existingCourses = activeCourses(state.courses, state.removedCourseIds)
    if (existingCourses.some((existing) => existing.catalogId === newCourses[0].catalogId)) return '이미 추가한 수업입니다.'
    if (newCourses.some((course) => existingCourses.some((existing) => existing.day === course.day && course.start < existing.end && course.end > existing.start))) return '기존 수업과 시간이 겹쳐 추가할 수 없습니다.'
    setState((previous) => ({ ...previous, selectedDate: weekDates(previous.selectedDate, 7)[newCourses[0].day - 1], courses: [...previous.courses, ...newCourses] }))
    return null
  }
  const onRemoveCourse = (id) => setState((previous) => removeCourse(previous, id))
  const onRemoveEvent = (id) => setState((previous) => removeEvent(previous, id))
  return (
    <Layout>
      <div className="schedule-page">
        <section className="schedule-page__intro" aria-labelledby="schedule-title"><h1 id="schedule-title">{monthly ? '월간 일정' : '주간 시간표'}</h1><p>2026학년도 2학기 · 나의 수업과 일정</p></section>
        <SectionCard className="schedule-toolbar">
          <div className="schedule-toolbar__period">
            <button className="schedule-icon-button" type="button" aria-label={monthly ? '이전 달' : '이전 주'} onClick={() => shift(-1)}><CaretLeft size={16} /></button>
            <h2>{monthly ? `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}` : `${date.getMonth() + 1}월 ${monthWeek(state.selectedDate)}주차`}</h2>
            <button className="schedule-icon-button" type="button" aria-label={monthly ? '다음 달' : '다음 주'} onClick={() => shift(1)}><CaretRight size={16} /></button>
          </div>
          <div className="schedule-toolbar__actions">
            <button className="schedule-icon-button schedule-icon-button--primary" type="button" aria-label="새 일정 추가" onClick={() => setAdding(true)}><Plus size={18} weight="bold" /></button>
            <Link className="schedule-icon-button" to={`/schedule/${monthly ? 'weekly' : 'monthly'}`} aria-label={monthly ? '주간 시간표로 보기' : '월간 달력으로 보기'}><ViewIcon size={18} weight="fill" /></Link>
          </div>
        </SectionCard>
        <View selectedDate={state.selectedDate} events={state.events} courses={state.courses} removedCourseIds={state.removedCourseIds} onSelect={onSelect} onRemoveCourse={onRemoveCourse} onRemoveEvent={onRemoveEvent} />
        {adding && <AddScheduleDialog selectedDate={state.selectedDate} onClose={() => setAdding(false)} onAddCourse={onAddCourse} existingCourses={activeCourses(state.courses, state.removedCourseIds)} onAdd={(event) => setState((previous) => ({ ...previous, selectedDate: event.date, events: [...previous.events, event] }))} />}
      </div>
    </Layout>
  )
}
