import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpenText,
  CaretRight,
  CheckCircle,
  ChatCircleDots,
  Clock,
  FileText,
  Lightbulb,
  MapPin,
  Megaphone,
  NavigationArrow,
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
import { isClassMarkedEarly, markClassEarlyEnd, resetEarlyEndForDemo } from '../../utils/classSession'
import { analyzeGapActivity } from '../../utils/gapActivities'
import { buildDueTodayPrompt } from '../../utils/dueToday'
import { fetchGapRouteTimes, resolveRouteOrigin } from '../../utils/campusRouteTimes'
import './DashboardSections.css'

/** 브라우저 GPS — 거부/실패 시 null */
function readCurrentPosition() {
  return new Promise((resolve) => {
    if (!navigator?.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
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
    // 데모 시계: 이전에 눌러둔 early-end 잔상 때문에 버튼이 사라지지 않게
    if (isDashboardDemoClock()) resetEarlyEndForDemo()

    const evaluate = async () => {
      try {
        const [schedules, buildingList] = await Promise.all([
          getSchedules(),
          getBuildings().catch(() => []),
        ])
        if (ignore) return
        const now = getDashboardNow()
        const today = projectSchedulesOntoDay(Array.isArray(schedules) ? schedules : [], now)
        let ongoing = pickOngoingClass(today, now)
        let engage = ongoing && isInEngagementWindow(ongoing, now)
        let wind = ongoing && isInWindDownWindow(ongoing, now)
        let previewMode = false

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
        if (ignore) return
        const demoClock = isDashboardDemoClock()
        const near = isNearBuilding(gps, building)
        if (!near && !previewMode && !demoClock) {
          setActive(null)
          setMode(null)
          setPrompt(null)
          setPreview(false)
          return
        }

        const marked = isClassMarkedEarly(ongoing.id)
        setActive(ongoing)
        setPlace([building?.name, ongoing.room].filter(Boolean).join(' · ') || '강의실')
        setPreview(previewMode || (demoClock && !near))
        setEarlyDone(marked)

        if (wind || marked) {
          setMode('winddown')
          setPrompt(null)
        } else {
          setMode('engage')
          setPrompt(pickEngagementPrompt(ongoing, now))
        }
      } catch {
        if (!ignore) {
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
    return () => {
      ignore = true
      clearInterval(timer)
      window.removeEventListener('bu-class-early-end', onEarly)
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
            끝났다면 알려 주세요. 확인 후에야 다음 수업 전 추천(이동·식사·과제)을 열어 둘게요.
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

  useEffect(() => {
    let ignore = false
    let timer

    const evaluate = async () => {
      try {
        const now = getDashboardNow()
        const [schedules, buildingList, facilities, tasks] = await Promise.all([
          getSchedules(),
          getBuildings().catch(() => []),
          getFacilities().catch(() => []),
          getTasks().catch(() => getPrioritizedTasks().catch(() => [])),
        ])
        if (ignore) return
        const today = projectSchedulesOntoDay(Array.isArray(schedules) ? schedules : [], now)
        const ongoing = pickOngoingClass(today, now)
        const wind = ongoing && isInWindDownWindow(ongoing, now)
        const early = ongoing && isClassMarkedEarly(ongoing.id)
        const forceGap = new URLSearchParams(window.location.search).has('gap')
        // 다음 수업 기준 틈: 조기종료 확인 후 · 수업 사이 · 미리보기
        // (wind-down만으로는 버튼 확인 전이라 틈새 추천은 숨김)
        const between = !ongoing || (ongoing && new Date(ongoing.endAt) <= now)
        if (!early && !between && !forceGap) {
          setSuggestion(null)
          return
        }
        const skipOngoing = Boolean(early || between || forceGap || wind)
        const next = pickUpcomingClass(today, now, { skipOngoing })
        if (!next) {
          setSuggestion(null)
          return
        }

        const buildingsSafe = Array.isArray(buildingList) ? buildingList : []
        const tasksSafe = Array.isArray(tasks) ? tasks : []
        const origin = await resolveRouteOrigin({
          today,
          now,
          buildings: buildingsSafe,
          demoClock: isDashboardDemoClock(),
          readGps: readCurrentPosition,
        })
        if (ignore) return
        const rawGapMin = (new Date(next.startAt).getTime() - now.getTime()) / 60000
        const routeTimes = await fetchGapRouteTimes({
          origin,
          nextClass: next,
          buildings: buildingsSafe,
          nowAt: now.toISOString(),
          includeBuildings: rawGapMin >= 30,
        }).catch(() => null)
        if (ignore) return

        const analyzed = analyzeGapActivity({
          now,
          nextClass: next,
          previousClassEndAt: ongoing?.endAt || null,
          origin,
          tasks: tasksSafe,
          facilities: Array.isArray(facilities) ? facilities : [],
          buildings: buildingsSafe,
          routeTimes,
        })
        if (!ignore) setSuggestion(analyzed)
      } catch {
        if (!ignore) setSuggestion(null)
      }
    }

    evaluate()
    timer = setInterval(evaluate, 60_000)
    window.addEventListener('bu-class-early-end', evaluate)
    return () => {
      ignore = true
      clearInterval(timer)
      window.removeEventListener('bu-class-early-end', evaluate)
    }
  }, [])

  if (!suggestion) return null

  return (
    <SectionCard className="gap-activity">
      <div className="gap-activity__top">
        <span className="gap-activity__icon" aria-hidden="true">
          <Lightbulb size={18} weight="fill" />
        </span>
        <div className="gap-activity__heading">
          <p>다음 수업 전 추천</p>
          <small>
            {typeof suggestion.freeGapMinutes === 'number'
              ? `${suggestion.freeGapMinutes}분 여유`
              : typeof suggestion.gapMinutes === 'number'
                ? `${suggestion.gapMinutes}분 틈`
                : ''}
            {' · '}
            {{
              meal: '식사',
              task: '과제',
              activity: '캠퍼스',
              plan: '추천 코스',
              'move-now': '바로 이동',
              tight: '바로 이동',
            }[suggestion.kind] || '준비'}
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
      </div>
    </SectionCard>
  )
}

/**
 * 다음 수업 안내 카드 (CLASS 요일 투영 + 캠퍼스 동선)
 */
export function NextClassCard() {
  const [nextClass, setNextClass] = useState(null)
  const [buildings, setBuildings] = useState([])
  const [routeInfo, setRouteInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [routeOrigin, setRouteOrigin] = useState(null)
  const [lookingAhead, setLookingAhead] = useState(false)

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
        const wind = ongoing && isInWindDownWindow(ongoing, demoNow)
        const early = ongoing && isClassMarkedEarly(ongoing.id)
        const forceWind = new URLSearchParams(window.location.search).has('winddown')
        const skipOngoing = Boolean(wind || early || forceWind)
        const origin = await resolveRouteOrigin({
          today,
          now: demoNow,
          buildings: buildingList,
          demoClock: isDashboardDemoClock(),
          readGps: readCurrentPosition,
        })
        if (ignore) return
        setLookingAhead(skipOngoing)
        setRouteOrigin(origin)
        setNextClass(pickUpcomingClass(today, demoNow, { skipOngoing }))
        setBuildings(buildingList)
      } catch (err) {
        console.warn('다음 수업 정보 로드 실패:', err.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    const onEarly = () => load()
    window.addEventListener('bu-class-early-end', onEarly)
    const timer = setInterval(load, 60_000)
    return () => {
      ignore = true
      clearInterval(timer)
      window.removeEventListener('bu-class-early-end', onEarly)
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
        const data = await getRouteAndLateness({
          currentBuildingId: routeOrigin.currentBuildingId,
          lat: routeOrigin.lat,
          lng: routeOrigin.lng,
          nextClassBuildingId: nextClass.buildingId,
          nextClassStartAt: nextClass.startAt,
          nowAt: getDashboardNow().toISOString(),
        })
        if (!ignore) setRouteInfo(data || null)
      } catch {
        if (!ignore) setRouteInfo(null)
      }
    })()
    return () => { ignore = true }
  }, [nextClass?.id, nextClass?.buildingId, nextClass?.startAt, routeOrigin?.currentBuildingId, routeOrigin?.lat, routeOrigin?.lng])

  const handleShowRoute = () => {
    if (!nextClass) {
      alert('오늘 예정된 수업이 없어 이동 경로를 안내할 수 없습니다.')
      return
    }
    const toName = buildings.find((b) => b.id === nextClass.buildingId)?.name || nextClass.room || '강의실'
    if (routeInfo) {
      const moveLine = `${routeInfo.travelMode === 'transit' ? '대중교통 포함 ' : ''}강의실까지 총 ${routeInfo.totalMinutes ?? '-'}분 예상되어져요`
      alert(
        `[현재 위치 → ${toName}${nextClass.room ? ` (${nextClass.room})` : ''}]\n` +
          moveLine +
          `\n권장 도착 ${routeInfo.recommendArriveLabel || '-'}\n` +
          `${tipHighlight}\n${tipSub}`,
      )
      return
    }
    alert(`[현재 위치 → ${toName}]\n경로 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.`)
  }

  const buildingName = buildings.find((b) => b.id === nextClass?.buildingId)?.name
  const place = [buildingName, nextClass?.room].filter(Boolean).join(' · ') || '캠퍼스'
  // 이미 그 건물에서 수업 중이면 "이동하세요" 대신 수업 응원
  const demoNowForCard = getDashboardNow()
  const attendingNow = Boolean(
    nextClass
    && new Date(nextClass.startAt) <= demoNowForCard
    && demoNowForCard < new Date(nextClass.endAt)
    && routeInfo?.fromBuildingId === nextClass.buildingId,
  )
  const classEndLabel = nextClass ? new Date(nextClass.endAt).toTimeString().slice(0, 5) : ''

  const walkLabel = attendingNow
    ? `지금 ${buildingName || '이 건물'}에서 수업 중이에요`
    : routeInfo?.travelLabel || routeInfo?.walkLabel
      || (typeof routeInfo?.totalMinutes === 'number'
        ? `현재 위치에서 강의실까지 총 ${routeInfo.totalMinutes}분`
        : null)
  const tipLevel = attendingNow ? 'SAFE' : (routeInfo?.latenessLevel || 'SAFE')
  const tipTone = latenessTone(tipLevel)
  const tipHighlight = attendingNow
    ? '수업 잘 듣고 있나요?'
    : routeInfo?.tipHighlight
      || (tipLevel === 'DANGER' ? '지금 바로 출발하세요' : tipLevel === 'WARNING' ? '조금 서두르는 게 좋아요' : '여유 있게 걸어가도 돼요')
  const tipSub = attendingNow
    ? `${classEndLabel}에 끝나요. 끝나면 다음 일정 동선을 바로 알려드릴게요.`
    : routeInfo?.tipSub || routeInfo?.message || '이동 시간을 계산하고 있습니다.'

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
            <span>주간 시간표에서 이번 주 수업을 확인해 보세요.</span>
          </p>
          <div className="class-actions">
            <Link className="dashboard-button dashboard-button--primary" to="/schedule/weekly">
              <NavigationArrow size={17} weight="fill" aria-hidden="true" /> 주간 시간표 보기
            </Link>
          </div>
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
            <small>{lookingAhead ? '곧 이어질 다음 수업 기준 동선' : '실시간 백석대 동선 계산 모듈 연동'}</small>
          </div>
        </div>
        <span className={`status-chip status-chip--${tipTone === 'muted' ? 'primary' : tipTone}`}>
          {lookingAhead ? '다음 수업' : '오늘 수업'}
        </span>
      </div>

      <div className="next-class__body">
        <div className="next-class__title-row">
          <div>
            <span className="next-class__label">NEXT CLASS</span>
            <h2>{nextClass.displayTitle || parseScheduleTitle(nextClass.title).name}</h2>
          </div>
          <strong>{formatTimeRange(nextClass.startAt, nextClass.endAt)}</strong>
        </div>

        <p className="location-line">
          <MapPin size={16} weight="fill" aria-hidden="true" />
          <strong>{place}</strong>
          <span title={walkLabel || undefined}>{walkLabel || '위치·이동 시간 확인 중…'}</span>
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

        <div className="class-actions">
          <button className="dashboard-button dashboard-button--primary" type="button" onClick={handleShowRoute}>
            <NavigationArrow size={17} weight="fill" aria-hidden="true" /> 이동 경로 보기
          </button>
          <Link className="dashboard-button dashboard-button--secondary" to="/schedule/weekly">
            <FileText size={17} weight="fill" aria-hidden="true" /> 주간 시간표
          </Link>
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

/**
 * 주요 공지사항
 */
export function NoticeList({ limit = 5 } = {}) {
  const [notices, setNotices] = useState([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let ignore = false
    getNotices(limit)
      .then((data) => {
        if (ignore) return
        const list = Array.isArray(data?.notices) ? data.notices.slice(0, limit) : []
        setNotices(list)
        setTotal(data?.total || 0)
      })
      .catch(() => {
        if (!ignore) setNotices([])
      })
    return () => { ignore = true }
  }, [limit])

  const recentCount = notices.filter((notice) => isRecentNotice(notice.createdAt)).length

  return (
    <SectionCard className="dashboard-section">
      <SectionHeading
        icon={Megaphone}
        title="주요 공지사항"
        badge={total ? `${total}건` : recentCount ? `${recentCount}건 새글` : undefined}
        action="전체보기"
        actionTo="https://www.bu.ac.kr/web/3483/subview.do"
      />
      <div className="notice-list">
        {notices.length ? notices.map((notice) => (
          <a
            className="notice-row"
            key={notice.id}
            href={notice.link || 'https://www.bu.ac.kr/web/3483/subview.do'}
            target="_blank"
            rel="noreferrer"
          >
            <span className="notice-row__content">
              <span className="notice-row__meta">
                <span className="category-chip">{notice.category}</span>
                {isRecentNotice(notice.createdAt) && <span className="notice-badge notice-badge--new">NEW</span>}
                <span>{notice.source || notice.tags}</span>
              </span>
              <strong>{notice.title}</strong>
              <small>{noticeMeta(notice.createdAt)}</small>
            </span>
            <CaretRight size={17} aria-hidden="true" />
          </a>
        )) : (
          <div className="deadline-row" style={{ cursor: 'default' }}>
            <span className="deadline-row__content">
              <strong>표시할 공지가 없습니다.</strong>
              <small>공지 API에서 불러온 목록이 비어 있습니다.</small>
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
