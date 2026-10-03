import {
  BookBookmark,
  CalendarBlank,
  ChatCircleDots,
  Clock,
  Compass,
  House,
  Info,
  Microphone,
  PaperPlaneTilt,
  Sparkle,
  UserCircle,
  Warning,
  X,
} from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Footer.css'

const QUICK_QUESTIONS = [
  { label: '오늘 남은 일정 알려줘', icon: Clock },
  { label: '이번 주 마감 과제', icon: Warning },
  { label: '중간고사 공부 계획', icon: BookBookmark },
]

function AssistantSheet({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [sending, setSending] = useState(false)
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 220)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(focusTimer)
    }
  }, [open, onClose])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const submitQuery = (event) => {
    event.preventDefault()
    if (!query.trim() || sending) return
    setSending(true)
    timerRef.current = window.setTimeout(() => {
      setQuery('')
      setSending(false)
      onClose()
    }, 650)
  }

  return (
    <div className={`assistant-layer ${open ? 'assistant-layer--open' : ''}`} aria-hidden={!open}>
      <button className="assistant-backdrop" type="button" aria-label="AI 비서 닫기" onClick={onClose} />
      <section className="assistant-sheet" role="dialog" aria-modal="true" aria-labelledby="assistant-title">
        <div className="assistant-sheet__handle" aria-hidden="true" />
        <div className="assistant-sheet__header">
          <div className="assistant-sheet__title">
            <span><ChatCircleDots size={19} weight="fill" aria-hidden="true" /></span>
            <div>
              <div className="assistant-sheet__title-line">
                <h2 id="assistant-title">AI 비서 실시간 질의</h2>
                <span className="connected-badge">연동됨</span>
              </div>
              <p>캠퍼스 일정, 학사 공지, 과제 질의가 가능해요</p>
            </div>
          </div>
          <button className="sheet-close" type="button" aria-label="AI 비서 닫기" onClick={onClose}>
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <form className="assistant-input" onSubmit={submitQuery}>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={sending ? '질문을 분석하고 있어요' : '무엇이든 물어보세요'}
            aria-label="AI 비서 질문"
            disabled={sending}
          />
          <button className="assistant-input__voice" type="button" aria-label="음성 명령">
            <Microphone size={19} weight="fill" aria-hidden="true" />
          </button>
          <button className="assistant-input__send" type="submit" aria-label="질문 전송" disabled={!query.trim() || sending}>
            <PaperPlaneTilt size={17} weight="fill" aria-hidden="true" />
          </button>
        </form>

        <div className="quick-questions">
          <p><Sparkle size={14} weight="fill" aria-hidden="true" /> 추천 질문</p>
          <div className="quick-questions__track">
            {QUICK_QUESTIONS.map(({ label, icon: Icon }) => (
              <button type="button" key={label} onClick={() => setQuery(label)}>
                <Icon size={14} weight="fill" aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
        </div>

        <p className="assistant-sheet__source"><Info size={13} aria-hidden="true" /> 백석대학교 공식 LMS 및 포털 연동</p>
      </section>
    </div>
  )
}

export default function Footer() {
  const [assistantOpen, setAssistantOpen] = useState(false)
  const location = useLocation()
  const isHomeActive = location.pathname === '/home' || location.pathname === '/dashboard'
  const isMyPageActive = location.pathname === '/' || location.pathname === '/mypage'

  return (
    <>
      <footer className="app-footer">
        <nav className="bottom-nav" aria-label="주요 메뉴">
          <Link
            className={`bottom-nav__item ${isHomeActive ? 'bottom-nav__item--active' : ''}`}
            to="/home"
          >
            <House size={24} weight={isHomeActive ? 'fill' : 'regular'} aria-hidden="true" />
            <span>홈</span>
          </Link>
          <button className="bottom-nav__item" type="button">
            <CalendarBlank size={24} aria-hidden="true" /><span>일정</span>
          </button>
          <button
            className="bottom-nav__assistant"
            type="button"
            aria-label="AI 비서 실행"
            aria-expanded={assistantOpen}
            onClick={() => setAssistantOpen(true)}
          >
            <span><Sparkle size={24} weight="fill" aria-hidden="true" /></span>
            <strong>AI 비서</strong>
          </button>
          <button className="bottom-nav__item" type="button">
            <Compass size={24} aria-hidden="true" /><span>캠퍼스</span>
          </button>
          <Link
            className={`bottom-nav__item ${isMyPageActive ? 'bottom-nav__item--active' : ''}`}
            to="/mypage"
          >
            <UserCircle size={24} weight={isMyPageActive ? 'fill' : 'regular'} aria-hidden="true" />
            <span>MY</span>
          </Link>
        </nav>
      </footer>
      <AssistantSheet open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </>
  )
}
