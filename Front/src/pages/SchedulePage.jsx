import { useEffect, useRef, useState } from 'react'
import { CalendarBlank, CaretLeft, CaretRight, Clock, Plus, X } from '@phosphor-icons/react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import SectionCard from '../components/common/SectionCard'
import { useSchedule } from '../components/schedule/ScheduleContext'
import { activeCourses, createCourse, monthWeek, parseDate, removeCourse, shiftDate, weekDates } from '../components/schedule/scheduleModel'
import ScheduleMonthlyPage from './ScheduleMonthlyPage'
import ScheduleWeeklyPage from './ScheduleWeeklyPage'
import './SchedulePage.css'

function AddScheduleDialog({ selectedDate, onClose, onAdd, onAddCourse }) {
  const dialogRef = useRef(null)
  const titleRef = useRef(null)
  const [mode, setMode] = useState('event')
  const [eventDraft, setEventDraft] = useState({ date: selectedDate, title: '', time: '09:00', kind: 'task' })
  const selectedDay = parseDate(selectedDate).getDay()
  const [courseDraft, setCourseDraft] = useState({ title: '', day: selectedDay >= 1 && selectedDay <= 5 ? selectedDay : 1, time: '09:00', kind: 'major' })
  const [error, setError] = useState('')
  const isCourse = mode === 'course'
  const draft = isCourse ? courseDraft : eventDraft
  const setDraft = isCourse ? setCourseDraft : setEventDraft
  const updateField = (field, value) => {
    setError('')
    setDraft((previous) => ({ ...previous, [field]: value }))
  }
  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])
  useEffect(() => { titleRef.current?.focus() }, [mode])
  const submit = (event) => {
    event.preventDefault()
    if (!draft.title.trim()) return
    if (isCourse) {
      const course = createCourse({ ...draft, id: crypto.randomUUID() })
      if (!course) { setError('요일과 시작 시간을 확인해 주세요.'); return }
      const problem = onAddCourse(course)
      if (problem) { setError(problem); return }
    } else {
      if (!parseDate(draft.date)) return
      onAdd({ ...draft, id: crypto.randomUUID(), title: draft.title.trim(), location: '개인 일정' })
    }
    onClose()
  }
  return (
    <dialog ref={dialogRef} className="schedule-dialog" aria-labelledby="add-schedule-title" onCancel={onClose} onClick={(event) => { if (event.target === dialogRef.current) onClose() }}>
      <form onSubmit={submit}>
        <div className="schedule-dialog__heading"><h2 id="add-schedule-title">{isCourse ? '새 수업 추가' : '새 일정 추가'}</h2><button type="button" className="schedule-icon-button" onClick={onClose} aria-label="추가 창 닫기"><X size={18} /></button></div>
        <div className="schedule-dialog__modes" role="group" aria-label="추가 모드">
          <button type="button" aria-pressed={!isCourse} onClick={() => { setMode('event'); setError('') }}>일정 추가</button>
          <button type="button" aria-pressed={isCourse} onClick={() => { setMode('course'); setError('') }}>수업 추가</button>
        </div>
        <label>{isCourse ? '수업 제목' : '일정 제목'}<input ref={titleRef} required maxLength={100} value={draft.title} onChange={(event) => updateField('title', event.target.value)} placeholder={isCourse ? '예: 자료구조, 인공지능 등' : '일정 또는 과제명을 입력하세요'} /></label>
        <div className="schedule-dialog__dates">
          {isCourse ? <label>요일<select value={draft.day} onChange={(event) => updateField('day', Number(event.target.value))}>{['월', '화', '수', '목', '금'].map((day, index) => <option key={day} value={index + 1}>{day}</option>)}</select></label> : <label>날짜<input required type="date" min="1900-01-01" max="9999-12-31" value={draft.date} onChange={(event) => updateField('date', event.target.value)} /></label>}
          <label>{isCourse ? '수업 시작 시간' : '시간'}<input required type="time" min={isCourse ? '00:00' : undefined} max={isCourse ? '23:00' : undefined} value={draft.time} onChange={(event) => updateField('time', event.target.value)} /></label>
        </div>
        <label>종류<select value={draft.kind} onChange={(event) => updateField('kind', event.target.value)}>{isCourse ? <><option value="major">전공</option><option value="general">교양</option></> : <><option value="task">과제/마감</option><option value="notice">학사 공지</option><option value="recommend">개인 일정/공부</option></>}</select></label>
        {isCourse && <p className="schedule-dialog__hint">수업은 1시간 단위로 표시되며, 삭제할 때까지 매주 반복됩니다.</p>}
        {error && <p className="schedule-dialog__error" role="alert">{error}</p>}
        <button className="schedule-save-button" type="submit" disabled={!draft.title.trim()}>{isCourse ? '수업 저장' : '일정 저장'}</button>
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
  const onAddCourse = (course) => {
    if (activeCourses(state.courses, state.removedCourseIds).some((existing) => existing.day === course.day && course.start < existing.end && course.end > existing.start)) return '같은 요일과 시간에 이미 수업이 있어요. 다른 시간을 선택해 주세요.'
    setState((previous) => ({ ...previous, selectedDate: weekDates(previous.selectedDate)[course.day - 1], courses: [...previous.courses, course] }))
    return null
  }
  const onRemoveCourse = (id) => setState((previous) => removeCourse(previous, id))
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
        <View selectedDate={state.selectedDate} events={state.events} courses={state.courses} removedCourseIds={state.removedCourseIds} onSelect={onSelect} onRemoveCourse={onRemoveCourse} />
        {adding && <AddScheduleDialog selectedDate={state.selectedDate} onClose={() => setAdding(false)} onAddCourse={onAddCourse} onAdd={(event) => setState((previous) => ({ ...previous, selectedDate: event.date, events: [...previous.events, event] }))} />}
      </div>
    </Layout>
  )
}
