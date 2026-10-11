import {
  BookBookmark,
  CalendarBlank,
  Clock,
  Compass,
  House,
  Microphone,
  PaperPlaneTilt,
  Sparkle,
  UserCircle,
  Warning,
  X,
} from '@phosphor-icons/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { useSchedule } from '../../schedule/ScheduleContext'
import { useAssistantPreferences } from './AssistantPreferences'
import './Footer.css'

const QUICK_QUESTIONS = [
  { label: '오늘 남은 일정 알려줘', icon: Clock },
  { label: '이번 주 마감 과제', icon: Warning },
  { label: '중간고사 공부 계획', icon: BookBookmark },
]

function AssistantSheet({ open, mode, onClose, onToggle, onExpand, triggerRef }) {
  const isExpanded = mode === 'expanded'
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([])
  const [historyVisible, setHistoryVisible] = useState(() => mode === 'expanded')
  const inputRef = useRef(null)
  const handleRef = useRef(null)
  const historyRef = useRef(null)
  const historyContentRef = useRef(null)
  const contentRef = useRef(null)
  const sheetRef = useRef(null)
  const hasOpenedRef = useRef(false)
  const reducedMotion = useReducedMotion()
  const [geometry, setGeometry] = useState(null)

  useLayoutEffect(() => {
    const measure = () => {
      const button = triggerRef.current?.querySelector('span')
      if (!button || !contentRef.current) return
      const rect = button.getBoundingClientRect()
      const viewport = window.visualViewport
      const width = Math.min((viewport?.width ?? window.innerWidth) - 20, 420)
      // Measure at the final width; never scale the text with the surface.
      contentRef.current.style.width = `${width - 12}px`
      const safeBottom = parseFloat(getComputedStyle(sheetRef.current).scrollMarginBottom) || 10
      const viewportHeight = viewport?.height ?? window.innerHeight
      const availableHeight = Math.max(0, viewportHeight - safeBottom - 10)
      const contentStyle = getComputedStyle(contentRef.current)
      const compactHeight = [...contentRef.current.children]
        .filter((child) => child !== historyRef.current)
        .reduce((total, child) => {
          const style = getComputedStyle(child)
          return total + child.offsetHeight + parseFloat(style.marginTop) + parseFloat(style.marginBottom)
        }, parseFloat(contentStyle.paddingTop) + parseFloat(contentStyle.paddingBottom) + 12 + 14)
      // Expanded height depends only on the viewport, never the message count.
      const height = Math.min(isExpanded ? 600 : compactHeight, availableHeight)
      setGeometry({
        button: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        panel: {
          left: (viewport?.offsetLeft ?? 0) + ((viewport?.width ?? window.innerWidth) - width) / 2,
          top: (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - height - safeBottom,
          width,
          height,
        },
      })
    }
    measure()
    const observer = new ResizeObserver(measure)
    for (const child of contentRef.current.children) {
      if (child !== historyRef.current) observer.observe(child)
    }
    observer.observe(triggerRef.current)
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('scroll', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('scroll', measure)
    }
  }, [triggerRef, isExpanded])

  useEffect(() => {
    if (!open) return undefined
    hasOpenedRef.current = true
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab') {
        const focusable = [...sheetRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), [tabindex="0"]')]
        const first = focusable[0]
        const last = focusable.at(-1)
        if (event.shiftKey && (document.activeElement === first || !sheetRef.current.contains(document.activeElement))) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && (document.activeElement === last || !sheetRef.current.contains(document.activeElement))) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  useLayoutEffect(() => {
    if (isExpanded && historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight
  }, [messages, isExpanded, geometry?.panel.height])

  useLayoutEffect(() => {
    if (open && isExpanded) setHistoryVisible(true)
  }, [open, isExpanded])

  const toggleExpanded = () => {
    if (!isExpanded) setHistoryVisible(true)
    onToggle()
  }

  const submitQuery = (event) => {
    event.preventDefault()
    const text = query.trim()
    if (!text) return
    setHistoryVisible(true)
    onExpand()
    setMessages((previous) => [...previous, { id: previous.length + 1, text }])
    setQuery('')
    if (window.matchMedia('(pointer: coarse)').matches) {
      inputRef.current?.blur()
    } else {
      inputRef.current?.focus({ preventScroll: true })
    }
  }

  return (
    <div className={`assistant-layer ${open ? 'assistant-layer--open' : ''}`}>
      <motion.button className="assistant-backdrop" type="button" aria-label="AI 비서 닫기" onClick={onClose}
        tabIndex={-1} aria-hidden={!open} initial={false}
        animate={{ opacity: open ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : 0.25 }} />
      <motion.section ref={sheetRef} id="assistant-dialog" className="assistant-sheet"
        data-state={open ? mode : 'off'}
        role={open ? 'dialog' : undefined} aria-modal={open ? true : undefined}
        aria-labelledby={open ? 'assistant-title' : undefined} aria-hidden={!open}
        initial={false}
        style={{ visibility: geometry ? 'visible' : 'hidden', pointerEvents: open ? 'auto' : 'none' }}
        animate={geometry ? {
          ...(open ? geometry.panel : geometry.button),
          borderRadius: open ? 28 : 24,
          borderWidth: open ? 6 : 4,
          borderColor: open ? 'var(--color-border)' : 'var(--color-surface)',
          backgroundColor: open ? 'var(--color-surface)' : 'var(--color-primary)',
          boxShadow: open ? '0 16px 44px rgba(15, 23, 42, 0.24)' : '0 7px 18px rgba(37, 99, 235, 0.3)',
        } : {}}
        transition={reducedMotion || (!open && !hasOpenedRef.current) ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 36, mass: 1 }}
        onAnimationComplete={() => {
          setHistoryVisible(open && isExpanded)
          if (open && !sheetRef.current.contains(document.activeElement)) handleRef.current?.focus({ preventScroll: true })
        }}>
        <motion.span className="assistant-sheet__button-icon" aria-hidden="true" initial={false}
          animate={{ opacity: open ? 0 : 1, filter: open ? 'blur(4px)' : 'blur(0px)' }}
          transition={{ duration: reducedMotion ? 0 : 0.1, delay: open || reducedMotion ? 0 : 0.22 }}>
          <Sparkle size={24} weight="fill" />
        </motion.span>
        <motion.div ref={contentRef} className="assistant-sheet__content" inert={!open} initial={false}
          animate={{ opacity: open ? 1 : 0, filter: open ? 'blur(0px)' : 'blur(4px)', y: open ? 0 : 6 }}
          transition={{ duration: reducedMotion ? 0 : open ? 0.2 : 0.09, delay: open && !reducedMotion ? 0.18 : 0 }}>
        <button ref={handleRef} className="assistant-sheet__handle" type="button"
          aria-label={isExpanded ? 'AI 비서 접기' : 'AI 비서 펼치기'}
          aria-expanded={isExpanded} aria-controls="assistant-history" onClick={toggleExpanded}>
          <span aria-hidden="true" />
        </button>
        <div className="assistant-sheet__header">
          <div className="assistant-sheet__title">
            <span><Sparkle size={19} weight="fill" aria-hidden="true" /></span>
            <div>
              <div className="assistant-sheet__title-line">
                <h2 id="assistant-title">백석AI 비서</h2>
              </div>
              <p>캠퍼스 일정, 학사 공지, 과제 질의가 가능해요</p>
            </div>
          </div>
          <button className="sheet-close" type="button" aria-label="AI 비서 닫기" onClick={onClose}>
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <div ref={historyRef} id="assistant-history" className={`assistant-history ${isExpanded ? 'assistant-history--active' : ''} ${historyVisible ? 'assistant-history--visible' : ''}`}
          role="log" aria-label="AI 비서 대화 내역" aria-live="polite" aria-hidden={!isExpanded}
          inert={!isExpanded} tabIndex={isExpanded ? 0 : -1}>
          <div ref={historyContentRef} className="assistant-history__messages">
            {messages.map((message) => (
              <p key={message.id} className="assistant-history__message"><span className="assistant-history__speaker">나</span>{message.text}</p>
            ))}
            {messages.length === 0 && <p className="assistant-history__hint">질문을 입력하고 전송해 주세요.</p>}
          </div>
        </div>

        <form className="assistant-input" onSubmit={submitQuery}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="무엇이든 물어보세요"
            aria-label="AI 비서 질문"
          />
          <button className="assistant-input__voice" type="button" aria-label="음성 명령">
            <Microphone size={19} weight="fill" aria-hidden="true" />
          </button>
          <button className="assistant-input__send" type="submit" aria-label="질문 전송" disabled={!query.trim()}>
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
        </motion.div>
      </motion.section>
    </div>
  )
}

export default function Footer() {
  const { mode: assistantMode, setMode: setAssistantMode } = useAssistantPreferences()
  const [assistantOpen, setAssistantOpen] = useState(false)
  const triggerRef = useRef(null)
  const closeAssistant = useCallback(() => {
    setAssistantOpen(false)
    triggerRef.current?.focus({ preventScroll: true })
  }, [])
  const location = useLocation()
  const path = (location.pathname || '').toLowerCase()
  const { state } = useSchedule()
  const isHome = path === '/' || path === '/home' || path === '/dashboard'
  const isSchedule = path === '/schedule' || path.startsWith('/schedule')
  const isMyPage = path === '/mypage'

  return (
    <>
      <footer className="app-footer">
        <nav className="bottom-nav" aria-label="주요 메뉴">
          <Link
            className={`bottom-nav__item ${isHome ? 'bottom-nav__item--active' : ''}`}
            to="/"
            aria-current={isHome ? 'page' : undefined}
          >
            <House size={24} weight={isHome ? 'fill' : 'regular'} aria-hidden="true" />
            <span>홈</span>
          </Link>
          <Link
            className={`bottom-nav__item ${isSchedule ? 'bottom-nav__item--active' : ''}`}
            to={`/schedule/${state?.view || 'weekly'}`}
            aria-current={isSchedule ? 'page' : undefined}
          >
            <CalendarBlank size={24} weight={isSchedule ? 'fill' : 'regular'} aria-hidden="true" />
            <span>일정</span>
          </Link>
          <button
            ref={triggerRef}
            className={`bottom-nav__assistant ${assistantOpen ? 'bottom-nav__assistant--open' : ''}`}
            type="button"
            aria-label="AI 비서 실행"
            aria-expanded={assistantOpen}
            aria-controls="assistant-dialog"
            onClick={() => setAssistantOpen(true)}
          >
            <span aria-hidden="true" />
            <strong>AI 비서</strong>
          </button>
          <button className="bottom-nav__item" type="button">
            <Compass size={24} aria-hidden="true" /><span>캠퍼스</span>
          </button>
          <Link
            className={`bottom-nav__item ${isMyPage ? 'bottom-nav__item--active' : ''}`}
            to="/mypage"
            aria-current={isMyPage ? 'page' : undefined}
          >
            <UserCircle size={24} weight={isMyPage ? 'fill' : 'regular'} aria-hidden="true" />
            <span>MY</span>
          </Link>
        </nav>
      </footer>
      <AssistantSheet open={assistantOpen} mode={assistantMode} onClose={closeAssistant}
        onToggle={() => setAssistantMode((current) => current === 'expanded' ? 'collapsed' : 'expanded')}
        onExpand={() => setAssistantMode('expanded')} triggerRef={triggerRef} />
    </>
  )
}
