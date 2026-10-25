import { useMemo, useState } from 'react'
import { DEMO_ACCOUNTS } from '../../data/demoAccounts'
import { getDashboardNow } from '../../utils/todaySchedules'
import { demoAccountIndexLabel, parseDemoTimeParam } from '../../utils/demoParams'
import { resetEarlyEndForDemo } from '../../utils/classSession'
import { DEMO_GPS_PRESETS, getDemoGpsMode, setDemoGpsMode } from '../../utils/demoGps'
import { getCurrentUser } from '../../api/authApi'
import './DemoControls.css'

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatTimeValue(date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function applyDemoParams({ accountIndex, timeHHmm, live = false }) {
  const url = new URL(window.location.href)
  if (accountIndex != null && accountIndex >= 0) {
    url.searchParams.set('account', String(accountIndex))
    url.searchParams.delete('demoUser')
  }
  if (live) {
    url.searchParams.set('time', 'live')
  } else if (timeHHmm) {
    const compact = timeHHmm.replace(':', '')
    url.searchParams.set('time', compact)
  }
  url.searchParams.delete('demoTime')
  // 시각·계정 바꿀 때만 조기종료 잔상 제거 (대시보드 마운트마다 지우지 않음)
  resetEarlyEndForDemo()
  window.location.assign(`${url.pathname}${url.search}${url.hash}`)
}

/**
 * 대시보드 헤더: 현재(데모) 시각·계정·GPS 위치 전환
 */
export default function DemoControls() {
  const user = getCurrentUser()
  const now = getDashboardNow()
  const accountIndex = demoAccountIndexLabel(user?.studentId) ?? 0
  const parsed = useMemo(
    () => (typeof window !== 'undefined' ? parseDemoTimeParam(window.location.search) : null),
    [],
  )
  const [timeValue, setTimeValue] = useState(() => formatTimeValue(now))
  const [gpsMode, setGpsMode] = useState(() => getDemoGpsMode())

  const dow = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()] || ''
  const dateLabel = `${now.getMonth() + 1}/${now.getDate()}(${dow})`
  const isLive = Boolean(parsed?.live)

  const setGps = (mode) => {
    setDemoGpsMode(mode, { reload: false })
    setGpsMode(mode)
  }

  return (
    <div className="demo-controls" role="group" aria-label="데모 시각·계정·위치">
      <label className="demo-controls__field">
        <span className="demo-controls__label">시각</span>
        <span className="demo-controls__date">{dateLabel}</span>
        <input
          type="time"
          className="demo-controls__time"
          value={timeValue}
          step={60}
          onChange={(e) => {
            const v = e.target.value
            setTimeValue(v)
            if (v) applyDemoParams({ accountIndex, timeHHmm: v })
          }}
        />
        <button
          type="button"
          className={`demo-controls__chip${isLive ? ' is-active' : ''}`}
          onClick={() => applyDemoParams({ accountIndex, live: true })}
        >
          실시간
        </button>
      </label>

      <label className="demo-controls__field demo-controls__field--account">
        <span className="demo-controls__label">계정</span>
        <select
          className="demo-controls__select"
          value={accountIndex}
          onChange={(e) => {
            const next = Number(e.target.value)
            applyDemoParams({ accountIndex: next, timeHHmm: timeValue, live: isLive })
          }}
        >
          {DEMO_ACCOUNTS.map((a, i) => (
            <option key={a.studentId} value={i}>
              {i}. {a.name}
            </option>
          ))}
        </select>
      </label>

      <div className="demo-controls__field demo-controls__field--gps" role="group" aria-label="테스트 GPS">
        <span className="demo-controls__label">위치</span>
        <button
          type="button"
          className={`demo-controls__chip${gpsMode === 'truth' ? ' is-active' : ''}`}
          onClick={() => setGps('truth')}
        >
          {DEMO_GPS_PRESETS.truth.label}
        </button>
        <button
          type="button"
          className={`demo-controls__chip${gpsMode === 'hq' ? ' is-active' : ''}`}
          onClick={() => setGps('hq')}
        >
          {DEMO_GPS_PRESETS.hq.label}
        </button>
        <button
          type="button"
          className={`demo-controls__chip${gpsMode === 'live' ? ' is-active' : ''}`}
          onClick={() => setGps('live')}
          title="브라우저 실제 GPS"
        >
          실제위치
        </button>
      </div>
    </div>
  )
}
