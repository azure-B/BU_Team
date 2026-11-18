import { useEffect, useState } from 'react'
import { CalendarBlank, ArrowUpRight, MapPin } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { useSchedule } from '../schedule/ScheduleContext'
import { getNextClassMoves, getTodayEndedClasses } from '../../utils/campusNextClasses'
import SectionCard from './SectionCard'

const time = (date) => date.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false })
const day = (date) => date.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', weekday: 'short' })

export default function CampusNextMoves({ buildings, buildingsLoading, fromLabel, onChoose }) {
  const { state, serverLoaded } = useSchedule()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const refresh = () => setNow(new Date())
    const timer = setInterval(refresh, 30000)
    window.addEventListener('focus', refresh)
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])
  const rows = getNextClassMoves(state.courses, buildings, now, state.removedCourseIds)
  const ended = getTodayEndedClasses(state.courses, buildings, now, state.removedCourseIds)
  return <SectionCard className="campus-next-moves" aria-label="다음 이동 일정">
    <div className="campus-next-moves__head"><h2><CalendarBlank size={18} />다음 이동 일정</h2><Link to="/schedule/weekly">시간표 보기<ArrowUpRight size={13} /></Link></div>
    <p className="campus-next-moves__intro">다가오는 수업 시간과 장소를 확인하세요.</p>
    {!serverLoaded && !rows.length ? <p className="campus-next-moves__empty" role="status">시간표를 불러오는 중…</p> : !rows.length ? <p className="campus-next-moves__empty">예정된 수업이 없습니다.</p> : <ol aria-label="예정된 수업">
      {rows.map((item, index) => <li key={item.key}>
        <div className="campus-next-moves__time"><span>{day(item.startAt)}</span><strong>{time(item.startAt)}</strong><small>~ {time(item.endAt)}</small></div>
        <div className="campus-next-moves__content"><div className="campus-next-moves__title"><h3>{item.title}</h3>{index === 0 && <span>다음 수업</span>}</div>
          <p><MapPin size={13} /><span>{item.location || item.building?.name || (item.online ? '온라인 수업' : '수업 장소 미등록')}</span></p>
          <small>{item.online ? '온라인 수업 · 이동 없음' : item.building ? `${fromLabel} → ${item.building.name}` : buildingsLoading ? '건물 정보를 불러오는 중…' : '수업 장소의 건물 확인이 필요해요.'}</small>
          <button type="button" disabled={!item.building} onClick={() => onChoose(item.building, item.title)}>{item.building ? '도착지로 설정' : item.online ? '이동 없음' : '위치 확인 필요'}<ArrowUpRight size={13} /></button>
        </div>
      </li>)}
    </ol>}
    <h3 className="campus-next-moves__ended-title">오늘 종료된 수업</h3>
    {ended.length ? <ol aria-label="오늘 종료된 수업">
      {ended.map((item) => <li key={item.key}>
        <div className="campus-next-moves__time"><span>{day(item.startAt)}</span><strong>{time(item.startAt)}</strong><small>~ {time(item.endAt)}</small></div>
        <div className="campus-next-moves__content"><div className="campus-next-moves__title"><h3>{item.title}</h3><span>종료</span></div>
          <p><MapPin size={13} /><span>{item.location || item.building?.name || (item.online ? '온라인 수업' : '수업 장소 미등록')}</span></p>
        </div>
      </li>)}
    </ol> : <p className="campus-next-moves__empty">{serverLoaded ? '오늘 종료된 수업이 없습니다.' : '오늘 수업을 확인하는 중…'}</p>}
  </SectionCard>
}
