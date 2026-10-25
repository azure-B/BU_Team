import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpenText,
  CaretRight,
  CheckCircle,
  ChatCircleDots,
  Clock,
  Lightbulb,
  MapPin,
  Megaphone,
  Sparkle,
  Warning,
} from '@phosphor-icons/react'
import SectionCard from '../common/SectionCard'
import {
  getSchedules,
  getPrioritizedTasks,
  getNotices,
  getRouteAndLateness,
  getBuildings,
  getFacilities,
  getTasks,
} from '../../api/dashboardApi'
import { getDashboardNow, isDashboardDemoClock, parseScheduleTitle, pickUpcomingClass, projectSchedulesOntoDay } from '../../utils/todaySchedules'
import {
  isInEngagementWindow,
  isInWindDownWindow,
  isNearBuilding,
  pickEngagementPrompt,
  pickOngoingClass,
} from '../../utils/classEngagement'
import { getEarlyEndRecord, isClassMarkedEarly, markClassEarlyEnd } from '../../utils/classSession'
import {
  analyzeDayWrapActivity,
  analyzeGapActivity,
  pickPlanStyle,
  PLAN_STYLES,
  PLAN_STYLE_LABEL,
} from '../../utils/gapActivities'
import { buildDueTodayPrompt } from '../../utils/dueToday'
import { fetchGapRouteTimes, resolveRouteOrigin } from '../../utils/campusRouteTimes'
import { DEMO_GPS_EVENT, getDemoGpsOverride } from '../../utils/demoGps'
import { getCurrentUser } from '../../api/authApi'
import { useSchedule } from '../schedule/ScheduleContext'
import './DashboardSections.css'

/** 데모 GPS 오버라이드 우선, 없으면 브라우저 GPS — 거부/실패 시 null */
function readCurrentPosition() {
  const mock = getDemoGpsOverride()
  if (mock && Number.isFinite(mock.lat) && Number.isFinite(mock.lng)) {
    return Promise.resolve({ lat: mock.lat, lng: mock.lng, buildingId: mock.buildingId })
  }
  return new Promise((resolve) => {
    if (!navigator?.geolocation) {
      resolve(null)
      return
    }
    let done = false
    const finish = (value) => {
      if (done) return
      done = true
      resolve(value)
    }
    // 권한 팝업·거부·지연 시에도 로딩이 멈추도록 하드 타임아웃
    const hard = setTimeout(() => finish(null), 2500)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(hard)
        finish({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        clearTimeout(hard)
        finish(null)
      },
      { enableHighAccuracy: false, timeout: 2000, maximumAge: 60_000 },
    )
  })
}

function noticeMeta(createdAt) {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return '전체공지'
  return `${date.getMonth() + 1}.${date.getDate()} · 전체공지`
}

function isRecentNotice(createdAt) {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return false
  return Date.now() - date.getTime() < 14 * 24 * 60 * 60 * 1000
}

function formatTimeRange(start, end) {
  if (!start || !end) return '--:-- - --:--'
  const s = new Date(start)
  const e = new Date(end)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(s.getHours())}:${pad(s.getMinutes())} - ${pad(e.getHours())}:${pad(e.getMinutes())}`
}

function latenessTone(level) {
  if (level === 'DANGER') return 'danger'
  if (level === 'WARNING') return 'primary'
  return 'muted'
}

function SectionHeading({ icon: Icon, title, badge, action, actionTo }) {
  const external = typeof actionTo === 'string' && /^https?:\/\//.test(actionTo)
  return (
    <div className="section-heading">
      <div className="section-heading__title">
        <span className="section-heading__icon"><Icon size={16} weight="fill" aria-hidden="true" /></span>
        <h2>{title}</h2>
        {badge && <span className="section-heading__badge">{badge}</span>}
      </div>
      {action && actionTo && external && (
        <a className="text-action" href={actionTo} target="_blank" rel="noreferrer">{action}<CaretRight size={14} aria-hidden="true" /></a>
      )}
      {action && actionTo && !external && (
        <Link className="text-action" to={actionTo}>{action}<CaretRight size={14} aria-hidden="true" /></Link>
      )}
      {action && !actionTo && (
        <button className="text-action" type="button">{action}<CaretRight size={14} aria-hidden="true" /></button>
      )}
    </div>
  )
}

/**
 * 수업 중 체크인 / 종료 30분 전 「일찍 끝났나요?」
 */
export function ClassEngagementCard() {
  const [active, setActive] = useState(null)
  const [mode, setMode] = useState(null) // engage | winddown
  const [prompt, setPrompt] = useState(null)
  const [place, setPlace] = useState('')
  const [preview, setPreview] = useState(false)
  const [earlyDone, setEarlyDone] = useState(false)

  useEffect(() => {
    let ignore = false
    let timer
    const forcePreview = new URLSearchParams(window.location.search).has('checkin')
    const forceWind = new URLSearchParams(window.location.search).has('winddown')
    let seq = 0

    const evaluate = async () => {
      const my = ++seq
      try {
        const [schedules, buildingList] = await Promise.all([
          getSchedules(),
          getBuildings().catch(() => []),
        ])
        if (ignore || my !== seq) return
        const now = getDashboardNow()
        const today = projectSchedulesOntoDay(Array.isArray(schedules) ? schedules : [], now)
        let ongoing = pickOngoingClass(today, now)
        let engage = ongoing && isInEngagementWindow(ongoing, now)
        // 다음 수업이 없어도 조기종료 → 밥·과제·사이버강의(day-wrap) 추천으로 연결
        let wind = ongoing && isInWindDownWindow(ongoing, now)
        let previewMode = false

        // 이미 일찍 끝냄 → 마무리 카드 즉시 숨김 (틈새/하루 마무리 추천에 넘김)
        if (ongoing && isClassMarkedEarly(ongoing.id)) {
          setActive(ongoing)
          setMode('winddown')
          setEarlyDone(true)
          setPrompt(null)
          setPreview(false)
          return
        }

        if ((!ongoing || (!engage && !wind)) && (forcePreview || forceWind)) {
          ongoing = today.find((s) => s.type === 'CLASS' || !s.type) || today[0] || null
          if (ongoing) {
            previewMode = true
            if (forceWind) {
              wind = true
              engage = false
            } else {
              engage = true
              wind = false
            }
          }
        }

        if (!ongoing || (!engage && !wind)) {
          setActive(null)
          setMode(null)
          setPrompt(null)
          setPreview(false)
          setEarlyDone(false)
          return
        }

        const building = (buildingList || []).find((b) => b.id === ongoing.buildingId)
        const gps = await readCurrentPosition()
        if (ignore || my !== seq) return
        const demoClock = isDashboardDemoClock()
        const near = isNearBuilding(gps, building)
        if (!near && !previewMode && !demoClock) {
          setActive(null)
          setMode(null)
          setPrompt(null)
          setPreview(false)
          return
        }

        setActive(ongoing)
        setPlace([building?.name, ongoing.room].filter(Boolean).join(' · ') || '강의실')
        setPreview(previewMode || (demoClock && !near))
        setEarlyDone(false)

        if (wind) {
          setMode('winddown')
          setPrompt(null)
        } else {
          setMode('engage')
          setPrompt(pickEngagementPrompt(ongoing, now))
        }
      } catch {
        if (!ignore && my === seq) {
          setActive(null)
          setMode(null)
          setPrompt(null)
          setPreview(false)
        }
      }
    }

    evaluate()
    timer = setInterval(evaluate, 60_000)
    const onEarly = () => evaluate()
    window.addEventListener('bu-class-early-end', onEarly)
    window.addEventListener(DEMO_GPS_EVENT, onEarly)
    return () => {
      ignore = true
      clearInterval(timer)
      window.removeEventListener('bu-class-early-end', onEarly)
      window.removeEventListener(DEMO_GPS_EVENT, onEarly)
    }
  }, [])

  // 일찍 끝났어요 확인 시 마무리 구간 카드 제거
  if (!active || !mode || earlyDone) return null

  const title = active.displayTitle || parseScheduleTitle(active.title).name

  if (mode === 'winddown') {
    return (
      <SectionCard className="class-engage class-engage--wind">
        <div className="class-engage__top">
          <span className="class-engage__icon" aria-hidden="true">
            <ChatCircleDots size={18} weight="fill" />
          </span>
          <div className="class-engage__heading">
            <p>수업 마무리 구간</p>
            <small>{title} · {place}{preview ? ' · 미리보기' : ''}</small>
          </div>
          <span className="status-chip status-chip--primary">30분 전</span>
        </div>
        <div className="class-engage__body">
          <p className="class-engage__prompt">
            <strong>{title}, 아직 수업 시간인데 예상보다 일찍 끝났나요?</strong>
          </p>
          <p className="class-engage__hint">
            끝났다면 알려 주세요. 확인 후 다음 수업 동선이나, 남은 수업이 없으면 밥·과제·사이버강의 추천을 열어 둘게요.
          </p>
          <button
            type="button"
            className="dashboard-button dashboard-button--primary class-engage__cta"
            onClick={() => markClassEarlyEnd(active.id)}
          >
            네, 일찍 끝났어요
          </button>
        </div>
      </SectionCard>
    )
  }

  if (!prompt) return null

  return (
    <SectionCard className="class-engage">
      <div className="class-engage__top">
        <span className="class-engage__icon" aria-hidden="true">
          <ChatCircleDots size={18} weight="fill" />
        </span>
        <div className="class-engage__heading">
          <p>수업 중 체크인</p>
          <small>{title} · {place}{preview ? ' · 미리보기' : ''}</small>
        </div>
        <span className="status-chip status-chip--primary">{preview ? '미리보기' : '집중'}</span>
      </div>
      <div className="class-engage__body">
        <p className="class-engage__prompt" title={prompt.highlight}>
          <strong>{prompt.highlight}</strong>
        </p>
        <p className="class-engage__hint" title={prompt.sub}>{prompt.sub}</p>
      </div>
    </SectionCard>
  )
}

/**
 * 오늘 마감인 사이버강의·과제 — 수업 중이면 「교수님 몰래..」, 아니면 위트 있게 재촉
 */
export function DueTodayCard() {
  const [prompt, setPrompt] = useState(null)

  useEffect(() => {
    let ignore = false
    const evaluate = async () => {
      try {
        const now = getDashboardNow()
        const [schedules, tasks] = await Promise.all([
          getSchedules(),
          getTasks().catch(() => []),
        ])
        if (ignore) return
        const today = projectSchedulesOntoDay(Array.isArray(schedules) ? schedules : [], now)
        const ongoing = pickOngoingClass(today, now)
        const inClass = Boolean(ongoing && !isClassMarkedEarly(ongoing.id))
        setPrompt(buildDueTodayPrompt({ tasks: Array.isArray(tasks) ? tasks : [], now, inClass }))
      } catch {
        if (!ignore) setPrompt(null)
      }
    }
    evaluate()
    const timer = setInterval(evaluate, 60_000)
    window.addEventListener('bu-class-early-end', evaluate)
    return () => {
      ignore = true
      clearInterval(timer)
      window.removeEventListener('bu-class-early-end', evaluate)
    }
  }, [])

  if (!prompt) return null

  return (
    <SectionCard className="class-engage class-engage--wind">
      <div className="class-engage__top">
        <span className="class-engage__icon" aria-hidden="true">
          <Clock size={18} weight="fill" />
        </span>
        <div className="class-engage__heading">
          <p>오늘 마감</p>
          <small>{prompt.kind === 'cyber' ? '사이버강의' : '과제'}</small>
        </div>
        <span className="status-chip status-chip--danger">D-day</span>
      </div>
      <div className="class-engage__body">
        <p className="class-engage__prompt"><strong>{prompt.highlight}</strong></p>
        <p className="class-engage__hint">{prompt.sub}</p>
        <ul className="gap-activity__list">
          {prompt.items.map((item) => (
            <li key={item.name}>
              <strong>{item.name}</strong>
              <span>{item.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  )
}

/**
 * 다음 수업까지 틈새 활동 (점심·과제·캠퍼스 스팟)
 */
export function GapActivityCard() {
  const [suggestion, setSuggestion] = useState(null)
  // 이벤트 detail로 즉시 잠금 해제 (effect 재구독 없이 ref로 유지)
  const earlyUnlockedRef = useRef(Boolean(getEarlyEndRecord()?.classId))
  const seedSaltRef = useRef(0)
  const planStyleRef = useRef(pickPlanStyle(Date.now()))
  const evaluateRef = useRef(null)

  useEffect(() => {
    let ignore = false
    let timer
    let seq = 0

    const evaluate = async () => {
      const my = ++seq
      try {
        const now = getDashboardNow()
        const [schedules, buildingList, facilities, tasks] = await Promise.all([
          getSchedules(),
          getBuildings().catch(() => []),
          getFacilities().catch(() => []),
          getTasks().catch(() => getPrioritizedTasks().catch(() => [])),
        ])
        if (ignore || my !== seq) return
        const today = projectSchedulesOntoDay(Array.isArray(schedules) ? schedules : [], now)
        const ongoing = pickOngoingClass(today, now)
        const markedEarly = Boolean(
          (ongoing && isClassMarkedEarly(ongoing.id))
          || (earlyUnlockedRef.current && getEarlyEndRecord()?.classId),
        )
        const early = markedEarly || earlyUnlockedRef.current
        const forceGap = new URLSearchParams(window.location.search).has('gap')
        // 조기종료 확정이면 시계상 수업 중이어도 「수업 사이」로 취급
        const between = !ongoing || early || new Date(ongoing.endAt) <= now
        // wind-down만으로는 버튼 확인 전이라 틈새 추천은 숨김
        if (!between && !forceGap) {
          setSuggestion(null)
          return
        }
        const next = pickUpcomingClass(today, now, { skipOngoing: true })
        const buildingsSafe = Array.isArray(buildingList) ? buildingList : []
        const tasksSafe = Array.isArray(tasks) ? tasks : []
        const prevEnd = early ? now.toISOString() : (ongoing?.endAt || null)
        const origin = await resolveRouteOrigin({
          today,
          now,
          buildings: buildingsSafe,
          demoClock: isDashboardDemoClock(),
          readGps: readCurrentPosition,
        })
        if (ignore || my !== seq) return

        // 오늘 남은 수업 없음 → 밥·과제·사이버강의 유도
        if (!next) {
          const wrap = analyzeDayWrapActivity({
            now,
            previousClassEndAt: prevEnd,
            origin,
            tasks: tasksSafe,
            facilities: Array.isArray(facilities) ? facilities : [],
            buildings: buildingsSafe,
            planStyle: planStyleRef.current,
            seedSalt: seedSaltRef.current,
          })
          if (!ignore && my === seq) setSuggestion(wrap)
          return
        }

        const buildSuggestion = (routeTimes) => analyzeGapActivity({
          now,
          nextClass: next,
          previousClassEndAt: prevEnd,
          origin,
          tasks: tasksSafe,
          facilities: Array.isArray(facilities) ? facilities : [],
          buildings: buildingsSafe,
          routeTimes,
          planStyle: planStyleRef.current,
          seedSalt: seedSaltRef.current,
        })

        // 1) 경로 API 기다리지 말고 바로 추천 표시
        const quick = buildSuggestion(null)
        if (!ignore && my === seq && quick) setSuggestion(quick)

        // 2) 다음 강의실 경로만 보정 (건물 일괄 조회는 느림)
        const routeTimes = await fetchGapRouteTimes({
          origin,
          nextClass: next,
          buildings: buildingsSafe,
          nowAt: now.toISOString(),
          includeBuildings: false,
        }).catch(() => null)
        if (ignore || my !== seq) return
        if (routeTimes) {
          const refined = buildSuggestion(routeTimes)
          if (!ignore && my === seq && refined) setSuggestion(refined)
        }
      } catch (err) {
        console.warn('틈새 추천 실패:', err)
        if (!ignore && my === seq) setSuggestion(null)
      }
    }

    evaluateRef.current = evaluate
    evaluate()
    timer = setInterval(evaluate, 60_000)
    const onEarly = (event) => {
      if (event?.detail?.classId) earlyUnlockedRef.current = true
      else if (event?.detail === null) earlyUnlockedRef.current = false
      evaluate()
    }
    window.addEventListener('bu-class-early-end', onEarly)
    window.addEventListener(DEMO_GPS_EVENT, evaluate)
    return () => {
      ignore = true
      clearInterval(timer)
      window.removeEventListener('bu-class-early-end', onEarly)
      window.removeEventListener(DEMO_GPS_EVENT, evaluate)
    }
  }, [])

  const reshuffleCourse = () => {
    seedSaltRef.current += 1 + Math.floor(Math.random() * 9)
    // 직전과 다른 테마 (식사 여유 / 과제 집중 / 산책·휴식 / 골고루)
    const others = PLAN_STYLES.filter((s) => s !== planStyleRef.current)
    const pool = others.length ? others : PLAN_STYLES
    planStyleRef.current = pool[Math.floor(Math.random() * pool.length)]
      || pickPlanStyle(Date.now() + seedSaltRef.current * 17)
    evaluateRef.current?.()
  }

  if (!suggestion) return null

  const kindLabel = {
    meal: '식사',
    task: '과제',
    activity: '캠퍼스',
    plan: '추천 코스',
    'day-wrap': '하루 마무리',
    'move-now': '바로 이동',
    tight: '바로 이동',
  }[suggestion.kind] || '준비'
  const styleLabel = suggestion.planStyleLabel || PLAN_STYLE_LABEL[suggestion.planStyle] || kindLabel
  const canReshuffle = suggestion.kind === 'plan'
    || suggestion.kind === 'meal'
    || suggestion.kind === 'task'
    || suggestion.kind === 'activity'
    || suggestion.kind === 'day-wrap'
  const isDayWrap = suggestion.kind === 'day-wrap'

  return (
    <SectionCard className="gap-activity">
      <div className="gap-activity__top">
        <span className="gap-activity__icon" aria-hidden="true">
          <Lightbulb size={18} weight="fill" />
        </span>
        <div className="gap-activity__heading">
          <p>{isDayWrap ? '수업 끝난 뒤 추천' : '다음 수업 전 추천'}</p>
          <small>
            {isDayWrap
              ? '오늘 남은 수업 없음'
              : typeof suggestion.freeGapMinutes === 'number'
                ? `${suggestion.freeGapMinutes}분 여유`
                : typeof suggestion.gapMinutes === 'number'
                  ? `${suggestion.gapMinutes}분 틈`
                  : ''}
            {' · '}
            {styleLabel}
          </small>
        </div>
      </div>
      <div className="gap-activity__body">
        <p className="gap-activity__title" title={suggestion.title}><strong>{suggestion.title}</strong></p>
        <p className="gap-activity__body-text" title={suggestion.body}>{suggestion.body}</p>
        {Array.isArray(suggestion.items) && suggestion.items.length > 0 && (
          <ul className="gap-activity__list">
            {suggestion.items.map((item) => (
              <li key={`${item.name}-${item.detail}`}>
                <strong>{item.name}</strong>
                {item.detail ? <span>{item.detail}</span> : null}
              </li>
            ))}
          </ul>
        )}
        {canReshuffle && (
          <div className="gap-activity__actions">
            <button
              type="button"
              className="dashboard-button dashboard-button--secondary gap-activity__reshuffle"
              onClick={reshuffleCourse}
            >
              <Sparkle size={16} weight="fill" aria-hidden="true" />
              다른 코스 추천
            </button>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

/**
 * 캠퍼스 이동 & 강의 안내
 * - 진행 중 수업이 있으면(조기종료 전) 그 수업을 보여 주고 GPS로 출석/미도착 안내
 * - 조기종료·공강 시에만 다음 수업 동선으로 넘어감
 */
export function NextClassCard() {
  const [nextClass, setNextClass] = useState(null)
  const [buildings, setBuildings] = useState([])
  const [routeInfo, setRouteInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [routeOrigin, setRouteOrigin] = useState(null)
  const [lookingAhead, setLookingAhead] = useState(false)
  /** 현재(또는 조기종료) 수업 뒤에 이어질 수업이 있는지 */
  const [hasFollowingClass, setHasFollowingClass] = useState(true)
  /** 'in' | 'away' | 'unknown' — GPS 기준 현재 수업 건물 체류 */
  const [presence, setPresence] = useState('unknown')

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        const [schedules, buildingList] = await Promise.all([
          getSchedules(),
          getBuildings().catch(() => []),
        ])
        if (ignore) return
        const list = Array.isArray(schedules) ? schedules : []
        const demoNow = getDashboardNow()
        const today = projectSchedulesOntoDay(list, demoNow)
        const ongoing = pickOngoingClass(today, demoNow)
        const early = Boolean(ongoing && isClassMarkedEarly(ongoing.id))
        // wind-down만으로는 다음 수업으로 넘기지 않음. 조기종료 확인 후에만.
        const skipOngoing = early
        const focus = pickUpcomingClass(today, demoNow, { skipOngoing })
        const following = pickUpcomingClass(today, demoNow, { skipOngoing: true })
        const origin = await resolveRouteOrigin({
          today,
          now: demoNow,
          buildings: buildingList,
          demoClock: isDashboardDemoClock(),
          readGps: readCurrentPosition,
        })
        if (ignore) return
        setLookingAhead(skipOngoing)
        setHasFollowingClass(Boolean(following))
        setRouteOrigin(origin)
        setNextClass(focus)
        setBuildings(buildingList)

        // GPS로 진행 중 수업 건물 체류 여부 (데모 시계여도 실제 GPS 우선)
        const classOngoing = Boolean(
          focus
          && !skipOngoing
          && new Date(focus.startAt) <= demoNow
          && demoNow < new Date(focus.endAt),
        )
        if (!classOngoing || !focus?.buildingId) {
          setPresence('unknown')
        } else {
          const building = (buildingList || []).find((b) => b.id === focus.buildingId)
          const gps = await readCurrentPosition()
          if (ignore) return
          if (!gps || !building) setPresence('unknown')
          else setPresence(isNearBuilding(gps, building) ? 'in' : 'away')
        }
      } catch (err) {
        console.warn('다음 수업 정보 로드 실패:', err.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    const onEarly = () => load()
    window.addEventListener('bu-class-early-end', onEarly)
    window.addEventListener(DEMO_GPS_EVENT, onEarly)
    const timer = setInterval(load, 60_000)
    return () => {
      ignore = true
      clearInterval(timer)
      window.removeEventListener('bu-class-early-end', onEarly)
      window.removeEventListener(DEMO_GPS_EVENT, onEarly)
    }
  }, [])

  useEffect(() => {
    if (!nextClass?.buildingId || !nextClass?.startAt || !routeOrigin) {
      setRouteInfo(null)
      return
    }
    let ignore = false
    ;(async () => {
      try {
        // 진행 중 수업이면 실제 GPS로 강의실까지 거리 계산 (데모 스냅보다 우선)
        const demoNow = getDashboardNow()
        const ongoing = !lookingAhead
          && new Date(nextClass.startAt) <= demoNow
          && demoNow < new Date(nextClass.endAt)
        const gps = ongoing ? await readCurrentPosition() : null
        if (ignore) return
        const data = await getRouteAndLateness({
          currentBuildingId: gps ? undefined : routeOrigin.currentBuildingId,
          lat: gps?.lat ?? routeOrigin.lat,
          lng: gps?.lng ?? routeOrigin.lng,
          nextClassBuildingId: nextClass.buildingId,
          nextClassStartAt: nextClass.startAt,
          nowAt: demoNow.toISOString(),
        })
        if (!ignore) setRouteInfo(data || null)
      } catch {
        if (!ignore) setRouteInfo(null)
      }
    })()
    return () => { ignore = true }
  }, [nextClass?.id, nextClass?.buildingId, nextClass?.startAt, nextClass?.endAt, lookingAhead, routeOrigin?.currentBuildingId, routeOrigin?.lat, routeOrigin?.lng])

  const demoNowForCard = getDashboardNow()
  const classOngoing = Boolean(
    nextClass
    && !lookingAhead
    && new Date(nextClass.startAt) <= demoNowForCard
    && demoNowForCard < new Date(nextClass.endAt),
  )
  const minutesIntoClass = classOngoing
    ? Math.round((demoNowForCard.getTime() - new Date(nextClass.startAt).getTime()) / 60000)
    : 0
  const buildingName = buildings.find((b) => b.id === nextClass?.buildingId)?.name
  const place = [buildingName, nextClass?.room].filter(Boolean).join(' · ') || '캠퍼스'
  const classEndLabel = nextClass ? new Date(nextClass.endAt).toTimeString().slice(0, 5) : ''
  const classStartLabel = nextClass ? new Date(nextClass.startAt).toTimeString().slice(0, 5) : ''

  let walkLabel = routeInfo?.travelLabel || routeInfo?.walkLabel
    || (typeof routeInfo?.totalMinutes === 'number'
      ? `현재 위치에서 강의실까지 총 ${routeInfo.totalMinutes}분`
      : null)
  let tipLevel = routeInfo?.latenessLevel || 'SAFE'
  let tipHighlight = routeInfo?.tipHighlight
    || (tipLevel === 'DANGER' ? '지금 바로 출발하세요' : tipLevel === 'WARNING' ? '조금 서두르는 게 좋아요' : '여유 있게 걸어가도 돼요')
  let tipSub = routeInfo?.tipSub || routeInfo?.message
    || (routeOrigin?.lat == null
      ? '위치 권한이 없어 직전·현재 수업 건물 기준으로 안내해요.'
      : '이동 시간을 계산하고 있습니다.')

  if (!walkLabel && routeOrigin?.lat == null && !classOngoing) {
    walkLabel = '위치 없이 시간표 기준'
  }

  if (classOngoing && presence === 'in') {
    walkLabel = `지금 ${buildingName || '이 건물'}에서 수업 중이에요`
    tipLevel = 'SAFE'
    tipHighlight = '강의실에 잘 도착하셨네요'
    tipSub = hasFollowingClass
      ? `${classEndLabel}에 끝나요. 편하게 수업에 집중해 보세요. 끝나면 다음 동선도 바로 알려드릴게요.`
      : `${classEndLabel}에 끝나요. 편하게 수업에 집중해 보세요. 끝나면 밥·과제·사이버강의 중 뭐부터 할지 추천해 드릴게요.`
  } else if (classOngoing && presence === 'away') {
    const totalMin = routeInfo?.totalMinutes
    walkLabel = typeof totalMin === 'number'
      ? `강의실까지 총 ${totalMin}분 정도 보여요`
      : `아직 ${buildingName || '강의실'} 근처는 아닌 것 같아요`
    if (minutesIntoClass <= 20) {
      tipLevel = 'WARNING'
      tipHighlight = '수업이 이미 시작했어요'
      tipSub = typeof totalMin === 'number'
        ? `가까운 길로 가면 약 ${totalMin}분이면 도착해요. 무리하지 않는 선에서 조금 서둘러 볼까요?`
        : '강의실 쪽으로 천천히 발걸음을 옮겨 볼까요?'
    } else {
      tipLevel = 'WARNING'
      tipHighlight = '오늘은 강의실과 조금 떨어져 있어요'
      tipSub = '괜찮으신가요? 사정이 있다면 천천히, 오실 수 있다면 편한 길로 와 주세요.'
    }
  } else if (classOngoing && presence === 'unknown') {
    walkLabel = `지금은 ${classStartLabel}~${classEndLabel} 수업 시간이에요`
    tipLevel = 'SAFE'
    tipHighlight = '수업 시간이에요'
    tipSub = '위치 확인이 어려워 동선만 참고로 보여 드릴게요. 강의실에 계시다면 편하게 수업에 집중해 주세요.'
  }

  const tipTone = latenessTone(tipLevel)

  if (loading) {
    return (
      <SectionCard className="next-class">
        <div className="next-class__top">
          <div className="next-class__date">
            <span className="next-class__spark"><Sparkle size={18} weight="fill" aria-hidden="true" /></span>
            <div>
              <p>오늘의 캠퍼스 이동 &amp; 강의 안내</p>
              <small>수업 정보를 불러오는 중…</small>
            </div>
          </div>
        </div>
      </SectionCard>
    )
  }

  if (!nextClass) {
    return (
      <SectionCard className="next-class">
        <div className="next-class__top">
          <div className="next-class__date">
            <span className="next-class__spark"><Sparkle size={18} weight="fill" aria-hidden="true" /></span>
            <div>
              <p>오늘의 캠퍼스 이동 &amp; 강의 안내</p>
              <small>오늘은 등록된 수업이 없어요</small>
            </div>
          </div>
          <span className="status-chip status-chip--muted">휴일/공강</span>
        </div>
        <div className="next-class__body">
          <p className="location-line">
            <MapPin size={16} weight="fill" aria-hidden="true" />
            <strong>여유로운 하루</strong>
            <span>오늘은 등록된 수업이 없어요. 푹 쉬어도 좋아요.</span>
          </p>
        </div>
      </SectionCard>
    )
  }

  return (
    <SectionCard className="next-class">
      <div className="next-class__top">
        <div className="next-class__date">
          <span className="next-class__spark"><Sparkle size={18} weight="fill" aria-hidden="true" /></span>
          <div>
            <p>오늘의 캠퍼스 이동 &amp; 강의 안내</p>
            <small>
              {routeOrigin?.lat == null
                ? '위치 없이 시간표 기준'
                : lookingAhead
                  ? '곧 이어질 다음 수업 기준 동선'
                  : classOngoing
                    ? '지금 진행 중인 수업 기준'
                    : '실시간 백석대 동선 계산 모듈 연동'}
            </small>
          </div>
        </div>
        <span className={`status-chip status-chip--${tipTone === 'muted' ? 'primary' : tipTone}`}>
          {lookingAhead ? '다음 수업' : classOngoing ? '수업 중' : '오늘 수업'}
        </span>
      </div>

      <div className="next-class__body">
        <div className="next-class__title-row">
          <div>
            <span className="next-class__label">{classOngoing ? 'NOW' : 'NEXT CLASS'}</span>
            <h2>{nextClass.displayTitle || parseScheduleTitle(nextClass.title).name}</h2>
          </div>
          <strong>{formatTimeRange(nextClass.startAt, nextClass.endAt)}</strong>
        </div>

        <p className="location-line">
          <MapPin size={16} weight="fill" aria-hidden="true" />
          <strong>{place}</strong>
          <span title={walkLabel || undefined}>
            {walkLabel
              || (routeOrigin?.lat != null
                ? '이동 시간을 계산하고 있어요…'
                : '위치 없이 시간표 기준')}
          </span>
        </p>

        <div className={`class-tip class-tip--${tipTone}`}>
          <span className="class-tip__icon"><Lightbulb size={16} weight="fill" aria-hidden="true" /></span>
          <div className="class-tip__content">
            <p className="class-tip__highlight" title={tipHighlight}>
              <strong>{tipHighlight}</strong>
            </p>
            <p className="class-tip__sub" title={tipSub}>{tipSub}</p>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

/**
 * 오늘 일정 목록 (CLASS 요일 투영)
 */
export function TodaySchedule() {
  const [schedules, setSchedules] = useState([])
  const [buildings, setBuildings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const fetchSchedules = async () => {
      try {
        const [data, buildingList] = await Promise.all([
          getSchedules(),
          getBuildings().catch(() => []),
        ])
        if (ignore) return
        const list = Array.isArray(data) ? data : []
        setSchedules(projectSchedulesOntoDay(list, getDashboardNow()))
        setBuildings(buildingList)
      } catch (err) {
        console.warn('오늘 일정 조회 실패:', err.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    fetchSchedules()
    return () => { ignore = true }
  }, [])

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const pad = (n) => String(n).padStart(2, '0')
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const getStatusInfo = (startAt, endAt) => {
    const now = getDashboardNow()
    const start = new Date(startAt)
    const end = new Date(endAt)
    if (now > end) return { status: '종료', icon: CheckCircle, tone: 'muted' }
    if (now >= start && now <= end) return { status: '진행중', icon: Clock, tone: 'primary' }
    return { status: '예정', icon: Clock, tone: 'primary' }
  }

  const buildingName = (id) => buildings.find((b) => b.id === id)?.name

  return (
    <SectionCard className="dashboard-section">
      <SectionHeading icon={Clock} title="오늘 일정" action="전체보기" actionTo="/schedule/weekly" />
      <div className="schedule-list">
        {loading ? (
          <div className="schedule-row schedule-row--muted">
            <time>--</time>
            <span className="schedule-row__icon"><Clock size={16} weight="fill" aria-hidden="true" /></span>
            <div className="schedule-row__content">
              <strong className="schedule-row__title">일정을 불러오는 중…</strong>
            </div>
          </div>
        ) : schedules.length > 0 ? (
          schedules.map((item) => {
            const { status, icon: Icon, tone } = getStatusInfo(item.startAt, item.endAt)
            const timeRange = `${formatTime(item.startAt)} - ${formatTime(item.endAt)}`
            const place = [buildingName(item.buildingId), item.room].filter(Boolean).join(' · ') || '캠퍼스'
            return (
              <div className={`schedule-row schedule-row--${tone}`} key={item.id || item.title}>
                <time>{timeRange}</time>
                <span className="schedule-row__icon"><Icon size={16} weight="fill" aria-hidden="true" /></span>
                <div className="schedule-row__content">
                  <div className="schedule-row__header">
                    <span className="schedule-row__status">{status}</span>
                    <strong className="schedule-row__title">{item.displayTitle || item.title}</strong>
                  </div>
                  <small className="schedule-row__location">{place}</small>
                </div>
              </div>
            )
          })
        ) : (
          <div className="schedule-row schedule-row--muted">
            <time>오늘</time>
            <span className="schedule-row__icon"><CheckCircle size={16} weight="fill" aria-hidden="true" /></span>
            <div className="schedule-row__content">
              <strong className="schedule-row__title">오늘 등록된 수업·일정이 없습니다.</strong>
              <small className="schedule-row__location">주간 시간표에서 이번 주 일정을 확인해 보세요.</small>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

/**
 * 우선순위 Top 3 과제 (조장님 계산 모듈)
 */
export function DeadlineList() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const fetchTopTasks = async () => {
      try {
        const data = await getPrioritizedTasks()
        if (!ignore && Array.isArray(data)) setTasks(data)
      } catch (err) {
        console.warn('우선순위 과제 조회 실패:', err.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    fetchTopTasks()
    return () => { ignore = true }
  }, [])

  const calculateDDay = (dueAt) => {
    if (!dueAt) return { dDay: 'D-day', tone: 'primary' }
    const now = new Date().getTime()
    const due = new Date(dueAt).getTime()
    const diffHours = (due - now) / (1000 * 60 * 60)

    if (diffHours < 0) return { dDay: '마감', tone: 'danger' }
    if (diffHours <= 24) return { dDay: 'D-Day', tone: 'danger' }
    const diffDays = Math.ceil(diffHours / 24)
    if (diffDays <= 3) return { dDay: `D-${diffDays}`, tone: 'primary' }
    return { dDay: `D-${diffDays}`, tone: 'muted' }
  }

  return (
    <SectionCard className="dashboard-section">
      <SectionHeading 
        icon={Warning} 
        title="놓치면 안 돼요" 
        badge={loading ? '불러오는 중' : `${tasks.length}건 마감 임박 (우선순위 Top 3)`}
        action="전체보기"
        actionTo="/schedule/weekly"
      />
      <div className="deadline-list">
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const { dDay, tone } = calculateDDay(task.dueAt)
            return (
              <button className="deadline-row" type="button" key={task.id || task.title}>
                <span className={`due-chip due-chip--${tone}`}>{dDay}</span>
                <span className="deadline-row__content">
                  <strong>{task.title}</strong>
                  <small>
                    중요도 {task.importance}점 · 우선순위 점수: {task.priorityScore ?? 0}점
                  </small>
                </span>
                <CaretRight size={17} aria-hidden="true" />
              </button>
            )
          })
        ) : (
          <div className="deadline-row" style={{ cursor: 'default' }}>
            <span className="due-chip due-chip--primary">{loading ? '…' : '완료'}</span>
            <span className="deadline-row__content">
              <strong>{loading ? '우선순위 과제를 불러오는 중…' : '마감 임박 과제가 없습니다!'}</strong>
              <small>{loading ? '잠시만 기다려 주세요.' : '급한 과제가 없으면 여유롭게 복습해 보세요.'}</small>
            </span>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

function noticeMatchesUser(notice, department, grade) {
  const hay = `${notice.title || ''} ${notice.tags || ''} ${notice.category || ''} ${notice.content || ''}`.replace(/\s/g, '')
  const dep = String(department || '').replace(/\s/g, '')
  let score = 0
  if (dep) {
    if (dep.includes('컴퓨터') && /컴퓨터|정보보호|소프트웨어|컴공/.test(hay)) score += 3
    if (dep.includes('첨단') && /첨단|IT|스마트/.test(hay)) score += 3
    if (hay.includes(dep.slice(0, 4))) score += 2
  }
  if (grade && new RegExp(`${grade}\\s*학년|0?${grade}학년`).test(`${notice.title}${notice.content || ''}`)) {
    score += 2
  }
  if (/마감|신청|모집|장학|비교과|인턴|채용|대회/.test(hay)) score += 1
  return score
}

/**
 * 학부·학년 맞춤 공지 + 마감 일정 추가
 */
export function NoticeList({ limit = 5 } = {}) {
  const [notices, setNotices] = useState([])
  const [addingId, setAddingId] = useState(null)
  const { addServerSchedule } = useSchedule()
  const user = getCurrentUser() || null

  useEffect(() => {
    let ignore = false
    getNotices(Math.max(limit * 4, 20))
      .then((data) => {
        if (ignore) return
        const raw = Array.isArray(data?.notices) ? data.notices : []
        const scored = raw
          .map((n) => ({ ...n, _score: noticeMatchesUser(n, user?.department, user?.grade) }))
          .filter((n) => n._score > 0)
          .sort((a, b) => b._score - a._score || String(b.createdAt).localeCompare(String(a.createdAt)))
        const picked = (scored.length ? scored : raw).slice(0, limit)
        setNotices(picked)
      })
      .catch(() => {
        if (!ignore) setNotices([])
      })
    return () => { ignore = true }
  }, [limit, user?.department, user?.grade])

  const addDeadline = async (notice) => {
    if (!addServerSchedule || addingId) return
    setAddingId(notice.id)
    try {
      const startAt = new Date()
      startAt.setDate(startAt.getDate() + 7)
      startAt.setHours(23, 0, 0, 0)
      const endAt = new Date(startAt.getTime() + 59 * 60 * 1000)
      await addServerSchedule({
        title: `[공지] ${String(notice.title || '공지 마감').slice(0, 40)}`,
        type: 'PERSONAL',
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      })
    } catch (err) {
      console.warn('공지 일정 추가 실패:', err?.message)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <SectionCard className="dashboard-section">
      <SectionHeading
        icon={Megaphone}
        title="추천 공지"
        badge={notices.length ? `${notices.length}건` : undefined}
        action="전체보기"
        actionTo="https://www.bu.ac.kr/web/3483/subview.do"
      />
      <div className="notice-list">
        {notices.length ? notices.map((notice) => (
          <div className="notice-row notice-row--card" key={notice.id}>
            <a
              className="notice-row__content"
              href={notice.link || 'https://www.bu.ac.kr/web/3483/subview.do'}
              target="_blank"
              rel="noreferrer"
            >
              <span className="notice-row__meta">
                <span className="category-chip">{notice.category || '학부'}</span>
                {isRecentNotice(notice.createdAt) && <span className="notice-badge notice-badge--new">NEW</span>}
                <span>{notice.source || notice.tags || '맞춤'}</span>
              </span>
              <strong>{notice.title}</strong>
              <small>{noticeMeta(notice.createdAt)}</small>
            </a>
            <button
              type="button"
              className="notice-row__add"
              disabled={addingId === notice.id}
              onClick={() => addDeadline(notice)}
            >
              {addingId === notice.id ? '추가 중…' : '일정 추가'}
            </button>
          </div>
        )) : (
          <div className="deadline-row" style={{ cursor: 'default' }}>
            <span className="deadline-row__content">
              <strong>맞춤 공지가 없어요</strong>
              <small>학부·관심 키워드에 맞는 글을 찾지 못했어요.</small>
            </span>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

export function EmptyDashboardState() {
  return (
    <SectionCard className="dashboard-empty">
      <BookOpenText size={28} weight="duotone" aria-hidden="true" />
      <strong>표시할 일정이 없어요</strong>
      <p>새 일정이 등록되면 이곳에 바로 안내해 드릴게요.</p>
    </SectionCard>
  )
}
