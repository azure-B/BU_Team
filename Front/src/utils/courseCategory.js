/**
 * 전공/교양 구분 + 마감 우선 정렬
 * Course에 이수구분 컬럼이 없어 과목명으로 교양을 판별 (백석대 교양 필수·선택 위주)
 */

const LIBERAL_ARTS_RE = /채플과\s*섬김|대학예배|채플|기독교|성서|성경|교양|글쓰기|영어|English|리더십|진로|봉사|인성|커리어|인문|철학|역사|예술|체육|심리학개론|대학생활/i

/** "과목 · 9주차 …" → 과목 */
export function courseOf(task) {
  const raw = String(task?.title || '').trim()
  return raw.split(/\s+·\s+/)[0] || raw
}

export function isLiberalArts(courseName = '') {
  return LIBERAL_ARTS_RE.test(String(courseName))
}

export function isCyberLecture(task) {
  return /사이버\s*강의/.test(String(task?.title || '')) || String(task?.id || '').startsWith('cyber-')
}

function dayKey(date) {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
}

/**
 * 마감 우선 비교 (task.due: Date 필요)
 * 1) 아직 안 지난 것 먼저, 지난 건 뒤로
 * 2) 마감일(날짜) 빠른 순
 * 3) 같은 날 마감이면 전공 → 교양
 * 4) 같은 날·같은 구분이면 마감 시각 빠른 순, 그다음 사이버강의(출석) 먼저
 */
export function makeDeadlineComparator(now = new Date()) {
  return (a, b) => {
    const pa = a.due < now ? 1 : 0
    const pb = b.due < now ? 1 : 0
    if (pa !== pb) return pa - pb
    const da = dayKey(a.due)
    const db = dayKey(b.due)
    if (da !== db) return pa ? db - da : da - db
    const la = isLiberalArts(courseOf(a)) ? 1 : 0
    const lb = isLiberalArts(courseOf(b)) ? 1 : 0
    if (la !== lb) return la - lb
    if (a.due - b.due) return a.due - b.due
    return (isCyberLecture(a) ? 0 : 1) - (isCyberLecture(b) ? 0 : 1)
  }
}
