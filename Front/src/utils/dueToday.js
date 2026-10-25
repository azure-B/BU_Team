/**
 * 오늘 마감인 사이버강의·과제 안내
 * 사이버강의는 Task 제목의 「사이버강의」로 구분 (Task에 type 컬럼 없음)
 */

import { courseOf, isCyberLecture, makeDeadlineComparator } from './courseCategory'

function isDone(task) {
  const st = String(task?.status || '').toUpperCase()
  return task?.done === true || st === 'COMPLETED' || st === 'DONE' || st === 'SUBMITTED'
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function restOf(task) {
  const parts = String(task?.title || '').trim().split(/\s+·\s+/)
  return parts.length > 1 ? parts.slice(1).join(' · ') : parts[0]
}

/** 아직 안 끝났고 오늘 안에 마감 (이미 지난 건 제외) */
export function pickDueToday(tasks = [], now = new Date()) {
  return (tasks || [])
    .filter((t) => t?.dueAt && !isDone(t))
    .map((t) => ({ ...t, due: new Date(t.dueAt) }))
    .filter((t) => !Number.isNaN(t.due.getTime()) && sameDay(t.due, now) && t.due > now)
    .sort(makeDeadlineComparator(now))
}

const IN_CLASS = {
  cyber: [
    (c) => ({ highlight: `이런.. 오늘 「${c}」 사이버 강의가 마감이에요!`, sub: '교수님 몰래.. 한번 들어볼까요?' }),
    (c) => ({ highlight: `앗, 「${c}」 사이버 강의 오늘까지예요!`, sub: '이어폰 한쪽만 살짝… 교수님껜 비밀로 할게요.' }),
  ],
  task: [
    (c) => ({ highlight: `이런.. 오늘 「${c}」 과제가 마감이에요!`, sub: '교수님 몰래.. 살짝 손대볼까요?' }),
    (c) => ({ highlight: `앗, 「${c}」 과제 제출이 오늘이에요!`, sub: '필기하는 척, 과제 한 줄씩… 교수님껜 비밀이에요.' }),
  ],
}

const FREE = {
  cyber: [
    (c) => ({ highlight: `「${c}」 사이버강의, 오늘 자정에 문 닫아요!`, sub: '출석 도장 찍으러 재생 버튼 꾹 눌러볼까요?' }),
    (c) => ({ highlight: `「${c}」 사강이 신데렐라처럼 자정에 사라져요!`, sub: '유리구두 대신 출석 체크 챙기러 가볼까요?' }),
    (c) => ({ highlight: `오늘이 「${c}」 사이버강의 마지막 날이에요`, sub: '1.5배속이면 커피 한 잔 식기 전에 끝나요!' }),
  ],
  task: [
    (c) => ({ highlight: `「${c}」 과제 마감이 오늘 밤이에요!`, sub: '지금 시작하면 23:59에 손 떨면서 제출할 일 없어요.' }),
    (c) => ({ highlight: `오늘 마감인 「${c}」 과제가 기다려요`, sub: '미루기 장인도 오늘만큼은 쉬어가요. 한 줄이라도 써볼까요?' }),
    (c) => ({ highlight: `「${c}」 과제, 자정의 신데렐라가 되기 전에!`, sub: '호박마차 타기 전에 제출 버튼부터 눌러둬요.' }),
  ],
}

function leftLabel(due, now) {
  const min = Math.max(0, Math.round((due - now) / 60000))
  const h = Math.floor(min / 60)
  const m = min % 60
  const hm = `${String(due.getHours()).padStart(2, '0')}:${String(due.getMinutes()).padStart(2, '0')}`
  return `마감 ${hm} · ${h ? `${h}시간 ` : ''}${m}분 남음`
}

/**
 * @param {{ tasks: object[], now: Date, inClass: boolean }} opts
 * @returns {{ highlight: string, sub: string, kind: 'cyber'|'task', items: {name: string, detail: string}[] } | null}
 */
export function buildDueTodayPrompt({ tasks = [], now = new Date(), inClass = false } = {}) {
  const due = pickDueToday(tasks, now)
  if (!due.length) return null
  const top = due[0]
  const kind = isCyberLecture(top) ? 'cyber' : 'task'
  const pool = (inClass ? IN_CLASS : FREE)[kind]
  const seed = Math.floor(now.getTime() / (10 * 60 * 1000)) + String(top.id || '').length
  const copy = pool[Math.abs(seed) % pool.length](courseOf(top))
  return {
    ...copy,
    kind,
    items: due.slice(0, 3).map((t) => ({
      name: isCyberLecture(t) ? restOf(t) : `과제 · ${restOf(t)}`,
      detail: `${courseOf(t)} · ${leftLabel(t.due, now)}`,
    })),
  }
}
