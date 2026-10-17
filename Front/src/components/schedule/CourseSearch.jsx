import { useEffect, useMemo, useState } from 'react'
import { getCachedCourseCatalog, getCourseCatalog } from '../../api'
import { hourLabel } from './scheduleModel'
import { catalogAreas, catalogScheduleLabel, COURSE_KINDS, createCatalogCourses, filterCatalog } from './courseCatalog'
import './CourseSearch.css'

export default function CourseSearch({ onAdd, onClose, existingCourses }) {
  const [courses, setCourses] = useState(() => getCachedCourseCatalog() ?? [])
  const [loading, setLoading] = useState(() => getCachedCourseCatalog() === null)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [filters, setFilters] = useState({ area: '', kind: '', day: '', start: 0, end: 24, q: '' })
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState('')
  const [visibleCount, setVisibleCount] = useState(30)
  useEffect(() => {
    let active = true
    setLoading(getCachedCourseCatalog() === null)
    setLoadError('')
    getCourseCatalog().then((data) => {
      if (active) {
        setCourses(data)
        const availableAreas = catalogAreas(data)
        setFilters((previous) => previous.area && !availableAreas.some((area) => area.value === previous.area) ? { ...previous, area: '' } : previous)
        setSelectedId(null)
      }
    }).catch(() => {
      if (active) setLoadError('개설 강의를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [attempt])
  const areas = useMemo(() => catalogAreas(courses), [courses])
  const results = useMemo(() => filterCatalog(courses, filters), [courses, filters])
  const selected = results.find((course) => String(course.id) === selectedId)
  const selectedMeetings = selected ? createCatalogCourses(selected) : []
  const updateFilter = (field, value) => {
    setFilters((previous) => ({ ...previous, [field]: value, ...(field === 'kind' ? { area: '' } : {}) }))
    setSelectedId(null)
    setError('')
    setVisibleCount(30)
  }
  const addSelected = () => {
    if (!selectedMeetings.length) return
    const problem = onAdd(selectedMeetings)
    if (problem) { setError(problem); return }
    onClose()
  }
  const timeFiltered = filters.day || filters.start !== 0 || filters.end !== 24
  return (
    <section className="course-search" aria-label="개설 강의 검색">
      <div className="course-search__filters">
        <label>전공/영역<select value={filters.area} onChange={(event) => updateFilter('area', event.target.value)}>
          <option value="">전공/영역 전체</option>
          {Object.entries(COURSE_KINDS).filter(([kind]) => !filters.kind || kind === filters.kind).map(([kind, label]) => <optgroup key={kind} label={label}>{areas.filter((area) => area.kind === kind).map((area) => <option key={area.value} value={area.value}>{label} - {area.label}</option>)}</optgroup>)}
        </select></label>
        <div className="course-search__time-field"><span>시간</span><details className="course-search__time">
          <summary>{timeFiltered ? `${filters.day ? `${['월', '화', '수', '목', '금', '토', '일'][Number(filters.day) - 1]} · ` : ''}${hourLabel(filters.start)}–${hourLabel(filters.end)}` : '요일·시간 전체'}</summary>
          <div className="course-search__time-options">
            <label>요일<select value={filters.day} onChange={(event) => updateFilter('day', event.target.value)}><option value="">전체</option>{['월', '화', '수', '목', '금', '토', '일'].map((day, index) => <option key={day} value={index + 1}>{day}요일</option>)}</select></label>
            <label>시작<select value={filters.start} onChange={(event) => updateFilter('start', Number(event.target.value))}>{Array.from({ length: 48 }, (_, index) => index / 2).filter((hour) => hour < filters.end).map((hour) => <option key={hour} value={hour}>{hourLabel(hour)}</option>)}</select></label>
            <label>종료<select value={filters.end} onChange={(event) => updateFilter('end', Number(event.target.value))}>{Array.from({ length: 48 }, (_, index) => (index + 1) / 2).filter((hour) => hour > filters.start).map((hour) => <option key={hour} value={hour}>{hourLabel(hour)}</option>)}</select></label>
            <small>선택한 시간과 겹치는 수업을 표시합니다.</small>
            <button type="button" onClick={() => { setFilters((previous) => ({ ...previous, day: '', start: 0, end: 24 })); setSelectedId(null); setVisibleCount(30); setError('') }}>시간 초기화</button>
          </div>
        </details></div>
        <label>구분<select value={filters.kind} onChange={(event) => updateFilter('kind', event.target.value)}><option value="">전공/교양 전체</option>{Object.entries(COURSE_KINDS).map(([kind, label]) => <option key={kind} value={kind}>{label}</option>)}</select></label>
        <label>검색어<input type="search" value={filters.q} onChange={(event) => updateFilter('q', event.target.value)} placeholder="과목명, 교수명, 학수번호" /></label>
      </div>
      <div className="course-search__count" role="status">{loading ? '개설 강의를 불러오는 중…' : loadError ? '강의 조회 실패' : `검색 결과 ${results.length.toLocaleString()}개`}</div>
      {loadError && <div className="course-search__message" role="alert"><p>{loadError}</p><button type="button" onClick={() => setAttempt((previous) => previous + 1)}>다시 불러오기</button></div>}
      {!loading && !loadError && <>
        <div className="course-search__results" aria-label="강의 목록">
          {results.slice(0, visibleCount).map((course) => {
            const added = existingCourses.some((existing) => existing.catalogId === String(course.id))
            return <button type="button" key={course.id} className={`course-search__result ${selectedId === String(course.id) ? 'is-selected' : ''}`} aria-pressed={selectedId === String(course.id)} disabled={added} onClick={() => { setSelectedId(String(course.id)); setError('') }}>
              <span className="course-search__result-title"><strong>{course.title}</strong><span className={`schedule-kind schedule-kind--${course.kind}`}>{added ? '추가됨' : COURSE_KINDS[course.kind] || course.kind}</span></span>
              <span>{[course.professor, course.credit != null ? `${course.credit}학점` : '', course.code].filter(Boolean).join(' · ')}</span>
              <span>{catalogScheduleLabel(course)}</span>
              <small>{[course.department, course.major, course.room].filter(Boolean).filter((value, index, all) => all.indexOf(value) === index).join(' · ')}</small>
            </button>
          })}
          {!results.length && <p className="course-search__message">조건에 맞는 강의가 없습니다. 검색어나 필터를 변경해 주세요.</p>}
          {results.length > visibleCount && <button className="course-search__more" type="button" onClick={() => setVisibleCount((previous) => previous + 30)}>강의 더 보기 ({Math.min(visibleCount, results.length)}/{results.length})</button>}
        </div>
        {selected && <div className="course-search__selection" role="status"><strong>{selected.title}</strong><span>{selectedMeetings.length ? `${catalogScheduleLabel(selected)} · 매주 반복` : '등록할 수 있는 요일·시작·종료 시간이 없는 강의입니다.'}</span></div>}
      </>}
      {error && <p className="schedule-dialog__error" role="alert">{error}</p>}
      <button className="schedule-save-button" type="button" disabled={loading || !!loadError || !selectedMeetings.length} onClick={addSelected}>선택한 수업 추가</button>
    </section>
  )
}
