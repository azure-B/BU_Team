/**
 * 로컬 의도 분류 스모크 (tsx로 scheduleIntent/gapIntent 로드)
 * 사용: npx tsx scripts/_smoke-intent.mjs
 */
import { classifyScheduleCodeLocal, looksLikeScheduleCandidate } from '../src/services/chat/scheduleIntent.ts'
import { looksLikeGapCandidate } from '../src/services/chat/gapIntent.ts'

const cases = [
  { q: '이번 주 금요일 저녁에 약속 잡을 수 있어?', code: 1, sched: true, gap: false },
  { q: '금요일 18시에 약속 등록해줘', code: 2, sched: true, gap: false },
  { q: '오늘 뉴스 뭐 있어?', code: 0, sched: false, gap: false },
  { q: '첫 수업이 뭐야?', code: 1, sched: true, gap: false },
  { q: '다음 수업이 뭐야?', code: 1, sched: true, gap: false },
  { q: '과제 추천해줘', code: 0, sched: false, gap: true },
  { q: '추천 공지 있어?', code: 4, sched: false, gap: false },
  { q: '오늘 일정 있어?', code: 1, sched: true, gap: false },
]

let fail = 0
for (const c of cases) {
  const code = classifyScheduleCodeLocal(c.q)
  const sched = looksLikeScheduleCandidate(c.q)
  const gap = looksLikeGapCandidate(c.q)
  const ok = code === c.code && sched === c.sched && gap === c.gap
  if (!ok) fail += 1
  console.log(ok ? 'OK' : 'FAIL', { q: c.q, got: { code, sched, gap }, want: { code: c.code, sched: c.sched, gap: c.gap } })
}
process.exit(fail ? 1 : 0)
