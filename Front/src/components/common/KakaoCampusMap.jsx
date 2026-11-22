import { useEffect, useRef, useState } from 'react'
import { Crosshair, Minus, Plus } from '@phosphor-icons/react'
import { loadKakaoMap } from '../../utils/loadKakaoMap'

const valid = (point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lng)

export default function KakaoCampusMap({ config, from, to, route, picking, draft, onPick, onConfirm, onCancel, onCurrent, mapFocus, onReady, resetKey }) {
  const container = useRef(null)
  const mapRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    onReady(false)
    if (!config?.javascriptKey) return
    let disposed = false
    let observer
    setError(''); setReady(false)
    loadKakaoMap(config.javascriptKey).then((maps) => {
      if (disposed) return
      const map = new maps.Map(container.current, { center: new maps.LatLng(config.center.lat, config.center.lng), level: 3 })
      mapRef.current = map
      observer = new ResizeObserver(() => { const center = map.getCenter(); map.relayout(); map.setCenter(center) })
      observer.observe(container.current)
      setReady(true)
      onReady(true)
    }).catch((err) => { if (!disposed) setError(err.message) })
    const element = container.current
    return () => { disposed = true; observer?.disconnect(); mapRef.current = null; element?.replaceChildren() }
  }, [config, attempt, onReady])

  useEffect(() => {
    if (!ready || !mapRef.current) return
    const maps = window.kakao.maps
    const map = mapRef.current
    const handler = (event) => {
      if (picking) onPick({ id: 'custom', lat: event.latLng.getLat(), lng: event.latLng.getLng() })
    }
    maps.event.addListener(map, 'click', handler)
    return () => maps.event.removeListener(map, 'click', handler)
  }, [ready, picking, onPick])

  useEffect(() => {
    if (!ready || !mapRef.current) return
    const maps = window.kakao.maps
    const markers = []
    for (const [point, label, className] of [[picking === 'from' ? draft : from, '출발', 'start'], [picking === 'to' ? draft : to, '도착', 'end']]) {
      if (!valid(point)) continue
      const position = new maps.LatLng(point.lat, point.lng)
      const marker = new maps.CustomOverlay({ position, content: `<div class="campus-live-pin campus-live-pin--${className}">${label}</div>`, yAnchor: 1.3 })
      marker.setMap(mapRef.current); markers.push(marker)
    }
    return () => markers.forEach((marker) => marker.setMap(null))
  }, [ready, from, to, picking, draft])

  useEffect(() => {
    if (!ready || !route || picking || !mapRef.current) return
    const maps = window.kakao.maps
    const path = route.path.map((p) => new maps.LatLng(p.lat, p.lng))
    const line = new maps.Polyline({ path, strokeWeight: 6, strokeColor: '#1d4ed8', strokeOpacity: 0.9 })
    line.setMap(mapRef.current)
    const bounds = new maps.LatLngBounds()
    path.forEach((p) => bounds.extend(p))
    mapRef.current.setBounds(bounds, 40, 40, 70, 40)
    return () => line.setMap(null)
  }, [ready, route, picking])

  useEffect(() => {
    if (ready && valid(to)) mapRef.current?.panTo(new window.kakao.maps.LatLng(to.lat, to.lng))
  }, [ready, to])
  useEffect(() => {
    if (ready && valid(from)) mapRef.current?.panTo(new window.kakao.maps.LatLng(from.lat, from.lng))
  }, [ready, from])
  useEffect(() => {
    if (ready && valid(mapFocus)) mapRef.current?.panTo(new window.kakao.maps.LatLng(mapFocus.lat, mapFocus.lng))
  }, [ready, mapFocus])
  useEffect(() => {
    if (!ready || !resetKey || !mapRef.current) return
    mapRef.current.setLevel(3)
    mapRef.current.setCenter(new window.kakao.maps.LatLng(config.center.lat, config.center.lng))
  }, [ready, resetKey, config])

  return <div className={`campus-map${picking ? ' is-picking' : ''}`} role="region" aria-label="캠퍼스 지도">
    <div ref={container} className="campus-map__canvas" />
    {!config?.javascriptKey && <div className="campus-map__empty"><strong>지도를 연결하려면 설정이 필요합니다.</strong><p>서버의 카카오 JavaScript 키를 확인해 주세요.</p></div>}
    {config?.javascriptKey && !ready && !error && <div className="campus-map__empty" role="status">카카오 지도를 불러오는 중…</div>}
    {error && <div className="campus-map__empty" role="alert"><p>{error}</p><button type="button" onClick={() => setAttempt((n) => n + 1)}>다시 시도</button></div>}
    {ready && <div className="campus-map__controls">
      <button type="button" aria-label="현재 위치로 이동" onClick={onCurrent}><Crosshair size={21} /></button>
      <div className="campus-map__zoom">
        <button type="button" aria-label="지도 확대" onClick={() => mapRef.current.setLevel(Math.max(1, mapRef.current.getLevel() - 1))}><Plus size={20} /></button>
        <button type="button" aria-label="지도 축소" onClick={() => mapRef.current.setLevel(Math.min(14, mapRef.current.getLevel() + 1))}><Minus size={20} /></button>
      </div>
    </div>}
    {picking && ready && <div className="campus-map__picker"><p>{draft ? '선택한 지점을 확정해 주세요.' : `지도를 눌러 ${picking === 'to' ? '도착' : '출발'} 위치를 지정하세요.`}</p><div><button type="button" onClick={onCancel}>취소</button><button type="button" disabled={!draft} onClick={onConfirm}>{picking === 'to' ? '이 위치로 도착' : '이 위치에서 출발'}</button></div></div>}
  </div>
}
