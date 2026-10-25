/**
 * 백석대학교 학사일정 (공식)
 * 출처: https://www.bu.ac.kr/web/3443/subview.do
 * 확인 기준: 2026학년도 전체일정 (교무처 041-550-9124)
 *
 * 주의: 공식 일정에 「중간고사 기간」은 없음.
 * 「중간 강의평가」·「기말고사 기간」만 표기됨 → 중간고사 날짜를 단정하지 말 것.
 */

export const ACADEMIC_CALENDAR_SOURCE = {
  name: '학사일정',
  url: 'https://www.bu.ac.kr/web/3443/subview.do',
  department: '교무처',
  phone: '041-550-9124',
  academicYear: 2026,
}

/** @type {{ id: string, from: string, to?: string, title: string, semester?: '1'|'2'|null }[]} */
export const ACADEMIC_EVENTS_2026 = [
  // —— 1학기 ——
  { id: 'reg-1', from: '2026-02-02', to: '2026-02-06', title: '2026-1학기 수강신청 기간(재학생)', semester: '1' },
  { id: 'reg-1-new', from: '2026-02-20', to: '2026-02-23', title: '2026-1학기 수강신청 기간(신·편입생)', semester: '1' },
  { id: 'reg-1-fix', from: '2026-02-24', to: '2026-03-09', title: '2026-1학기 수강신청 정정 기간(전체)', semester: '1' },
  { id: 'open-1', from: '2026-03-03', title: '제1학기 개시일 / 개강일', semester: '1' },
  { id: 'mid-eval-1', from: '2026-03-30', to: '2026-04-03', title: '중간 강의평가 기간', semester: '1' },
  { id: 'final-1', from: '2026-06-15', to: '2026-06-19', title: '1학기 기말고사 기간', semester: '1' },
  { id: 'close-1', from: '2026-06-19', title: '종강일', semester: '1' },
  { id: 'summer-break', from: '2026-06-22', title: '하계방학 시작', semester: '1' },

  // —— 2학기 ——
  { id: 'reg-2', from: '2026-08-10', to: '2026-08-14', title: '2학기 수강신청 기간(재학·복학·재입학생)', semester: '2' },
  { id: 'reg-2-fix', from: '2026-08-25', to: '2026-09-07', title: '2학기 수강신청 정정 기간(전체)', semester: '2' },
  { id: 'open-2', from: '2026-09-01', title: '제2학기 개시일 / 개강일', semester: '2' },
  { id: 'mid-eval-2', from: '2026-09-28', to: '2026-10-02', title: '중간 강의평가 기간', semester: '2' },
  { id: 'half-2', from: '2026-10-26', title: '수업일수 1/2', semester: '2' },
  { id: 'festival', from: '2026-10-27', to: '2026-10-29', title: '진리축전', semester: '2' },
  { id: 'founding-50', from: '2026-10-30', title: '백석학원 건학50주년 기념일', semester: '2' },
  { id: 'three-quarter-2', from: '2026-11-23', title: '수업일수 3/4', semester: '2' },
  { id: 'final-eval-2', from: '2026-11-23', to: '2026-11-27', title: '기말 강의평가 기간', semester: '2' },
  { id: 'winter-reg', from: '2026-11-23', to: '2026-11-27', title: '동계 계절학기 수강신청 기간', semester: '2' },
  { id: 'makeup-2', from: '2026-12-08', to: '2026-12-14', title: '지정보강주', semester: '2' },
  { id: 'final-2', from: '2026-12-15', to: '2026-12-21', title: '2학기 기말고사 기간', semester: '2' },
  { id: 'close-2', from: '2026-12-21', title: '종강일', semester: '2' },
  { id: 'winter-break', from: '2026-12-22', title: '동계방학 시작', semester: '2' },
]

function parseDay(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fmtRange(from, to) {
  const a = parseDay(from)
  const label = (dt) => `${dt.getMonth() + 1}.${String(dt.getDate()).padStart(2, '0')}`
  if (!to || to === from) return label(a)
  return `${label(a)}~${label(parseDay(to))}`
}

/** 현재(또는 데모) 시각 기준 학기: 3~8월 → 1, 그 외 → 2 */
export function currentSemester(now = new Date()) {
  const m = now.getMonth() + 1
  return m >= 3 && m <= 8 ? '1' : '2'
}

/**
 * 학사일정·기말·진리축전 질의에 대한 짧은 안내 (공식 일정만)
 * @returns {string | null}
 */
export function answerAcademicCalendarQuestion(question, now = new Date()) {
  const q = String(question || '').replace(/\s+/g, '')
  if (!q) return null

  const wantsCalendar = /학사일정|개강|종강|진리축전|축제|기말고사|중간고사|중간강의평가|강의평가|수업일수/.test(q)
    || /기말.*언제|중간.*언제|시험.*언제|축전.*언제/.test(q)
  if (!wantsCalendar) return null

  const sem = currentSemester(now)
  const src = ACADEMIC_CALENDAR_SOURCE

  if (/중간고사/.test(q)) {
    return [
      `공식 학사일정(${src.academicYear}학년도)에는 「중간고사 기간」이 따로 적혀 있지 않아요.`,
      `대신 「중간 강의평가」만 있어요.`,
      `· 1학기: ${fmtRange('2026-03-30', '2026-04-03')}`,
      `· 2학기: ${fmtRange('2026-09-28', '2026-10-02')}`,
      `과목별 중간고사 일정은 강의계획서·교수님 공지를 확인해 주세요.`,
      `출처: ${src.url}`,
    ].join('\n')
  }

  if (/기말고사|기말시험|기말/.test(q)) {
    const event = ACADEMIC_EVENTS_2026.find((e) => e.id === (sem === '1' ? 'final-1' : 'final-2'))
    const other = ACADEMIC_EVENTS_2026.find((e) => e.id === (sem === '1' ? 'final-2' : 'final-1'))
    return [
      `지금 기준 ${src.academicYear}-${sem}학기 기말고사 기간은 ${fmtRange(event.from, event.to)}예요.`,
      `(참고) ${src.academicYear}-${other.semester}학기: ${fmtRange(other.from, other.to)}`,
      `출처: ${src.url}`,
    ].join('\n')
  }

  if (/진리축전|축제/.test(q)) {
    return [
      `진리축전은 ${fmtRange('2026-10-27', '2026-10-29')}예요.`,
      `출처: ${src.url}`,
    ].join('\n')
  }

  if (/개강/.test(q)) {
    return [
      `2026-1학기 개강: 3.03(화)`,
      `2026-2학기 개강: 9.01(화)`,
      `출처: ${src.url}`,
    ].join('\n')
  }

  if (/종강/.test(q)) {
    return [
      `2026-1학기 종강: 6.19(금)`,
      `2026-2학기 종강: 12.21(월)`,
      `출처: ${src.url}`,
    ].join('\n')
  }

  // 이번 학기 주요 일정 요약
  const upcoming = ACADEMIC_EVENTS_2026
    .filter((e) => e.semester === sem)
    .filter((e) => parseDay(e.to || e.from) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    .slice(0, 5)

  const lines = upcoming.length
    ? upcoming.map((e) => `· ${fmtRange(e.from, e.to)} ${e.title}`)
    : ['· 남은 주요 일정이 없어요. 전체는 학사일정 페이지를 확인해 주세요.']

  return [
    `${src.academicYear}-${sem}학기 앞으로의 주요 학사일정이에요.`,
    ...lines,
    `출처: ${src.url}`,
  ].join('\n')
}
