/** 출처: https://www.bu.ac.kr/web/3443/subview.do */
export const ACADEMIC_CALENDAR_URL = 'https://www.bu.ac.kr/web/3443/subview.do'

const EVENTS = {
  final1: { from: '2026-06-15', to: '2026-06-19', title: '1학기 기말고사' },
  final2: { from: '2026-12-15', to: '2026-12-21', title: '2학기 기말고사' },
  midEval1: { from: '2026-03-30', to: '2026-04-03', title: '1학기 중간 강의평가' },
  midEval2: { from: '2026-09-28', to: '2026-10-02', title: '2학기 중간 강의평가' },
  festival: { from: '2026-10-27', to: '2026-10-29', title: '진리축전' },
  open1: '2026-03-03',
  close1: '2026-06-19',
  open2: '2026-09-01',
  close2: '2026-12-21',
}

function fmt(iso: string) {
  const [, m, d] = iso.split('-')
  return `${Number(m)}.${d}`
}

function fmtRange(from: string, to?: string) {
  if (!to || to === from) return fmt(from)
  return `${fmt(from)}~${fmt(to)}`
}

export function currentSemester(now = new Date()) {
  const m = now.getMonth() + 1
  return m >= 3 && m <= 8 ? '1' : '2'
}

/** 학사일정 관련이면 답변 문자열, 아니면 null */
export function answerAcademicCalendar(question: string, now = new Date()): string | null {
  const q = String(question || '').replace(/\s+/g, '')
  if (!/학사일정|개강|종강|진리축전|축제|기말고사|중간고사|중간강의평가|강의평가|수업일수|기말|시험언제|축전/.test(q)
    && !/기말.*언제|중간.*언제|시험.*언제|축전.*언제/.test(q)) {
    return null
  }

  const sem = currentSemester(now)

  if (/중간고사/.test(q)) {
    return [
      '공식 학사일정(2026학년도)에는 「중간고사 기간」이 따로 없습니다.',
      `대신 「중간 강의평가」만 있어요. 1학기 ${fmtRange(EVENTS.midEval1.from, EVENTS.midEval1.to)}, 2학기 ${fmtRange(EVENTS.midEval2.from, EVENTS.midEval2.to)}.`,
      '과목별 중간고사는 강의계획서·교수님 공지를 확인하세요.',
      `출처: ${ACADEMIC_CALENDAR_URL}`,
    ].join('\n')
  }

  if (/기말고사|기말시험|기말/.test(q)) {
    const cur = sem === '1' ? EVENTS.final1 : EVENTS.final2
    const other = sem === '1' ? EVENTS.final2 : EVENTS.final1
    return [
      `지금 기준 2026-${sem}학기 기말고사 기간은 ${fmtRange(cur.from, cur.to)}예요.`,
      `(참고) 다른 학기: ${fmtRange(other.from, other.to)}`,
      `출처: ${ACADEMIC_CALENDAR_URL}`,
    ].join('\n')
  }

  if (/진리축전|축제/.test(q)) {
    return `진리축전은 ${fmtRange(EVENTS.festival.from, EVENTS.festival.to)}예요.\n출처: ${ACADEMIC_CALENDAR_URL}`
  }

  if (/개강/.test(q)) {
    return `2026-1학기 개강 ${fmt(EVENTS.open1)}(화), 2026-2학기 개강 ${fmt(EVENTS.open2)}(화).\n출처: ${ACADEMIC_CALENDAR_URL}`
  }

  if (/종강/.test(q)) {
    return `2026-1학기 종강 ${fmt(EVENTS.close1)}(금), 2026-2학기 종강 ${fmt(EVENTS.close2)}(월).\n출처: ${ACADEMIC_CALENDAR_URL}`
  }

  return [
    `2026-${sem}학기 주요 학사일정 요약입니다.`,
    `· 개강 ${fmt(sem === '1' ? EVENTS.open1 : EVENTS.open2)}`,
    `· 기말고사 ${fmtRange(sem === '1' ? EVENTS.final1.from : EVENTS.final2.from, sem === '1' ? EVENTS.final1.to : EVENTS.final2.to)}`,
    `· 종강 ${fmt(sem === '1' ? EVENTS.close1 : EVENTS.close2)}`,
    sem === '2' ? `· 진리축전 ${fmtRange(EVENTS.festival.from, EVENTS.festival.to)}` : null,
    `출처: ${ACADEMIC_CALENDAR_URL}`,
  ].filter(Boolean).join('\n')
}

/** GPT 컨텍스트용 짧은 요약 */
export function academicCalendarContextSnippet() {
  return [
    '[학사일정 2026 · https://www.bu.ac.kr/web/3443/subview.do]',
    '공식에 중간고사 기간 없음. 중간 강의평가·기말고사만 표기.',
    `1학기 개강 ${fmt(EVENTS.open1)} / 기말 ${fmtRange(EVENTS.final1.from, EVENTS.final1.to)} / 종강 ${fmt(EVENTS.close1)}`,
    `2학기 개강 ${fmt(EVENTS.open2)} / 진리축전 ${fmtRange(EVENTS.festival.from, EVENTS.festival.to)} / 기말 ${fmtRange(EVENTS.final2.from, EVENTS.final2.to)} / 종강 ${fmt(EVENTS.close2)}`,
  ].join('\n')
}
