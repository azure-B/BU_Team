import { useEffect, useRef, useState } from 'react'
import { ArrowsDownUp, ArrowUpRight, CaretDown, Clock, Footprints, MapPin, NavigationArrow, ArrowCounterClockwise } from '@phosphor-icons/react'
import SectionCard from '../components/common/SectionCard'
import KakaoCampusMap from '../components/common/KakaoCampusMap'
import CampusNextMoves from '../components/common/CampusNextMoves'
import { getMapConfig, getMapBuildings, getWalkingRoute } from '../api/campusMapApi'
import './CampusMapPreviewPage.css'

const CURRENT = { id: 'current', name: '현재 위치' }
const pointName = (point, role) => !point || point.id === 'custom' ? `${role} 위치` : point.name
const validPoint = (p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng)
/** 경로 API용 — 건물이면 id/name 포함해 대시보드 도보 분과 맞춤 */
function routePoint(point) {
  const payload = { lat: point.lat, lng: point.lng }
  if (point.id && point.id !== 'current' && point.id !== 'custom') {
    payload.buildingId = point.id
    if (point.name) payload.name = point.name
  }
  return payload
}
const ROUTE_SOURCE_LABEL = {
  campus: '교내 이동 기준',
  kakao: '카카오 도보 경로',
  osrm: '보행 경로',
  haversine: '직선 추정 경로',
}
function readPosition() {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext || !navigator.geolocation) {
      reject(new Error('현재 위치를 지원하지 않는 환경입니다. 지도에서 출발 위치를 선택해 주세요.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ ...CURRENT, lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }),
      (error) => reject(new Error(error.code === 1 ? '위치 권한이 거부되었습니다. 지도에서 출발 위치를 선택해 주세요.' : '현재 위치를 확인하지 못했습니다. 다시 시도하거나 지도에서 선택해 주세요.')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    )
  })
}

export default function CampusMapPreviewPage() {
  const [from, setFrom] = useState(CURRENT)
  const [to, setTo] = useState(null)
  const [route, setRoute] = useState(null)
  const [config, setConfig] = useState(null)
  const [mapReady, setMapReady] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [buildings, setBuildings] = useState([])
  const [configError, setConfigError] = useState('')
  const [buildingError, setBuildingError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [retry, setRetry] = useState(0)
  const [message, setMessage] = useState('')
  const [picking, setPicking] = useState(null)
  const [draft, setDraft] = useState(null)
  const originSelectRef = useRef(null)
  const destinationSelectRef = useRef(null)
  const epoch = useRef(0)
  const routeRequest = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoadingData(true); setConfigError(''); setBuildingError(''); setConfig(null)
    Promise.allSettled([
      getMapConfig(controller.signal).then(setConfig),
      getMapBuildings(controller.signal).then((rows) => {
        const points = rows.filter((b) => b.x != null && b.y != null).map((b) => ({ id: b.id, name: b.name, lat: Number(b.x), lng: Number(b.y) }))
          .filter((b) => validPoint(b) && Math.abs(b.lat) <= 90 && Math.abs(b.lng) <= 180)
        points.sort((a, b) => (a.name === '본부동' ? -2 : a.name === '지혜관' ? -1 : 0) - (b.name === '본부동' ? -2 : b.name === '지혜관' ? -1 : 0) || a.name.localeCompare(b.name, 'ko'))
        setBuildings(points)
      }),
    ]).then(([mapResult, buildingsResult]) => {
      if (controller.signal.aborted) return
      if (mapResult.status === 'rejected') setConfigError('지도 설정을 불러오지 못했습니다. 서버 연결을 확인해 주세요.')
      if (buildingsResult.status === 'rejected') setBuildingError('건물 목록을 불러오지 못했습니다. 다시 시도해 주세요.')
      setLoadingData(false)
    })
    return () => controller.abort()
  }, [retry])
  useEffect(() => () => { epoch.current += 1; routeRequest.current?.abort() }, [])

  function invalidate() {
    epoch.current += 1
    routeRequest.current?.abort()
    setLoading(false); setRoute(null); setMessage('')
  }
  async function useCurrentLocation() {
    invalidate(); setPicking(null); setDraft(null); setFrom(CURRENT); setLoading(true)
    const version = epoch.current
    try {
      const position = await readPosition()
      if (version !== epoch.current) return
      setFrom(position)
      setMessage(`현재 위치를 확인했습니다. 위치 정확도 약 ${Math.round(position.accuracy)}m입니다.`)
    } catch (error) { if (version === epoch.current) setMessage(error.message) }
    finally { if (version === epoch.current) setLoading(false) }
  }
  function selectLocation(target, value) {
    if (value === 'pick') {
      if (!mapReady) { setMessage('지도가 연결된 후 위치를 직접 선택할 수 있습니다.'); return }
      epoch.current += 1; routeRequest.current?.abort(); setLoading(false); setMessage('')
      setPicking(target); setDraft(null); return
    }
    if (value === 'current') { useCurrentLocation(); return }
    const point = buildings.find((b) => b.id === value)
    if (!point) return
    invalidate(); setPicking(null); setDraft(null)
    if (target === 'from') setFrom(point)
    else setTo(point)
  }
  function finishPick(confirm) {
    if (confirm && !draft) return
    if (confirm) {
      invalidate()
      if (picking === 'from') setFrom(draft)
      else setTo(draft)
    }
    const trigger = picking === 'to' ? destinationSelectRef : originSelectRef
    setPicking(null); setDraft(null); trigger.current?.focus()
  }
  async function showRoute(event) {
    event.preventDefault()
    if (!to) { setMessage('도착 위치를 선택해 주세요.'); return }
    invalidate(); setLoading(true)
    const version = epoch.current
    const controller = new AbortController()
    routeRequest.current = controller
    try {
      let origin = from
      if (origin.id === 'current' && !validPoint(origin)) {
        origin = await readPosition()
        if (version !== epoch.current) return
        setFrom(origin)
      }
      if (origin.lat === to.lat && origin.lng === to.lng) throw new Error('출발 위치와 다른 도착 위치를 선택해 주세요.')
      const data = await getWalkingRoute(routePoint(origin), routePoint(to), controller.signal)
      if (version !== epoch.current) return
      setRoute({ ...data, from: origin, to, arriveAt: new Date(Date.now() + data.durationSeconds * 1000) })
    } catch (error) {
      if (version === epoch.current && !controller.signal.aborted) setMessage(error.message)
    } finally { if (version === epoch.current) setLoading(false) }
  }
  function reset() { invalidate(); setFrom(CURRENT); setTo(null); setPicking(null); setDraft(null); setResetKey((n) => n + 1) }
  const minutes = route ? Math.ceil(route.durationSeconds / 60) : '—'
  const arrival = route ? route.arriveAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'
  return <div className="campus-preview">
    <header className="campus-preview__header"><h1>캠퍼스</h1></header>
    <form onSubmit={showRoute} className="campus-preview__form">
      <SectionCard className="campus-location">
        <div className="campus-location__rail" aria-hidden="true"><i /><span /><MapPin size={17} weight="fill" /></div>
        <div className="campus-location__fields">
          <label className="campus-location__field"><span>출발</span>
            <select ref={originSelectRef} aria-label="출발 위치" value={from.id} onChange={(e) => selectLocation('from', e.target.value)}>
              {from.id === 'custom' && <option value="custom" hidden>출발 위치</option>}
              <option value="pick">출발 위치 직접 선택</option><option value="current">현재 위치</option>
              {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select><CaretDown size={14} aria-hidden="true" />
          </label>
          <label className="campus-location__field"><span>도착</span>
            <select ref={destinationSelectRef} aria-label="도착 위치" value={to?.id || ''} onChange={(e) => selectLocation('to', e.target.value)}>
              <option value="" disabled hidden>도착 위치</option>
              {to?.id === 'custom' && <option value="custom" hidden>도착 위치</option>}
              <option value="pick">도착 위치 직접 선택</option>
              {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select><CaretDown size={14} aria-hidden="true" />
          </label>
        </div>
        <button className="campus-location__swap" type="button" aria-label="출발지와 도착지 바꾸기" disabled={Boolean(picking) || !to || !validPoint(from)} onClick={() => {
          invalidate(); setFrom(to); setTo(from.id === 'current' ? { ...from, id: 'custom' } : from)
        }}><ArrowsDownUp size={20} /></button>
      </SectionCard>
      <div className="campus-preview__actions">
        <button className="campus-preview__submit" type="submit" disabled={Boolean(picking) || loading}><NavigationArrow size={18} weight="fill" />{loading ? '위치·경로 확인 중…' : picking ? '지도에서 위치를 확정해 주세요' : '경로 찾기'}</button>
        <button className="campus-preview__reset" type="button" aria-label="위치와 지도 초기화" onClick={reset}><ArrowCounterClockwise size={18} /><span>초기화</span></button>
      </div>
      <p className="campus-preview__message" role="status">{message}</p>
      {(configError || buildingError) && <div className="campus-map__api-error" role="alert"><p>{configError || buildingError}</p><button type="button" onClick={() => { invalidate(); setPicking(null); setDraft(null); setRetry((n) => n + 1) }}>서버 연결 다시 시도</button></div>}
      {loadingData && <p className="campus-preview__message">지도·건물 정보를 불러오는 중…</p>}
      <KakaoCampusMap config={config} from={from} to={to} route={route} picking={picking} draft={draft} onPick={setDraft} onConfirm={() => finishPick(true)} onCancel={() => finishPick(false)} onCurrent={useCurrentLocation} onReady={setMapReady} resetKey={resetKey} />
      <SectionCard className="campus-journey" aria-label="이동 정보">
        <div className="campus-journey__heading"><span><Footprints size={17} weight="fill" />도보 이동</span><span className="campus-journey__example">{route ? (ROUTE_SOURCE_LABEL[route.source] || '도보 경로') : '경로 선택 중'}</span></div>
        <div className="campus-journey__stats">
          <div><span>예상 소요 시간</span><strong>{minutes}<small>분</small></strong></div>
          <div><span>이동 거리</span><strong>{route ? Math.round(route.distanceMeters).toLocaleString('ko-KR') : '—'}<small>m</small></strong></div>
          <div><span>도착 예정</span><strong className="campus-journey__arrival"><Clock size={15} />{arrival}</strong></div>
        </div>
        <div className="campus-journey__detail"><ArrowUpRight size={19} /><p>{route ? <><strong>{pointName(route.from, '출발')}</strong>에서 <strong>{pointName(route.to, '도착')}</strong>까지의 도보 경로입니다.</> : '위치를 선택하고 경로를 확인해 주세요.'}</p></div>
      </SectionCard>
      <CampusNextMoves buildings={buildings} buildingsLoading={loadingData} fromLabel={pointName(from, '출발')} onChoose={(building, title) => {
        selectLocation('to', building.id)
        setMessage(`${title} 수업의 ${building.name}을 도착지로 설정했습니다.`)
        destinationSelectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }} />
    </form>
  </div>
}
