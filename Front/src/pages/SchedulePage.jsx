import { useEffect, useRef, useState } from 'react'
import { CalendarBlank, CaretLeft, CaretRight, Clock, Plus, X } from '@phosphor-icons/react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import SectionCard from '../components/common/SectionCard'
import { useSchedule } from '../components/schedule/ScheduleContext'
import { monthWeek, parseDate, shiftDate, weekDates } from '../components/schedule/scheduleModel'
import ScheduleMonthlyPage from './ScheduleMonthlyPage'
import ScheduleWeeklyPage from './ScheduleWeeklyPage'
import './SchedulePage.css'

function AddScheduleDialog({ selectedDate, onClose, onAdd }) {
  const dialogRef = useRef(null)
  const [date, setDate] = useState(selectedDate)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('09:00')
  const [kind, setKind] = useState('task')
  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])
  const submit = (event) => {
    event.preventDefault()
    if (!title.trim() || !parseDate(date)) return
    onAdd({ id: crypto.randomUUID(), date, time, title: title.trim(), kind, location: '개인 일정' })
    onClose()
  }
  return (
    <dialog ref={dialogRef} className="schedule-dialog" aria-labelledby="add-schedule-title" onCancel={onClose} onClick={(event) => { if (event.target === dialogRef.current) onClose() }}>
      <form onSubmit={submit}>
        <div className="schedule-dialog__heading"><h2 id="add-schedule-title">새 일정 추가</h2><button type="button" className="schedule-icon-button" onClick={onClose} aria-label="일정 추가 닫기"><X size={18} /></button></div>
        <label>일정 제목<input autoFocus required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="일정 또는 과제명을 입력하세요" /></label>
        <div className="schedule-dialog__dates"><label>날짜<input required type="date" min="1900-01-01" max="9999-12-31" value={date} onChange={(event) => setDate(event.target.value)} /></label><label>시간<input required type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label></div>
        <label>종류<select value={kind} onChange={(event) => setKind(event.target.value)}><option value="task">과제/마감</option><option value="notice">학사 공지</option><option value="recommend">개인 일정/공부</option></select></label>
        <button className="schedule-save-button" type="submit" disabled={!title.trim()}>일정 저장</button>
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
  const week = weekDates(state.selectedDate)
  const onSelect = (selectedDate) => setState((previous) => ({ ...previous, selectedDate }))
  const shift = (amount) => onSelect(shiftDate(state.selectedDate, monthly ? amount : amount * 7, monthly ? 'month' : 'day'))
  const ViewIcon = monthly ? Clock : CalendarBlank
  const View = monthly ? ScheduleMonthlyPage : ScheduleWeeklyPage
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
        {!monthly && <p className="schedule-week-range">{week[0].replaceAll('-', '.')} – {week[4].replaceAll('-', '.')}</p>}
        <View selectedDate={state.selectedDate} events={state.events} onSelect={onSelect} />
        {adding && <AddScheduleDialog selectedDate={state.selectedDate} onClose={() => setAdding(false)} onAdd={(event) => setState((previous) => ({ ...previous, selectedDate: event.date, events: [...previous.events, event] }))} />}
      </div>
    </Layout>
  )
}
