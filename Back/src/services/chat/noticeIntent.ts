import supabase from '../../config/supabase'
import type { ScheduleIntentCode } from './llm'

export type NoticeIntentResult = {
  handled: boolean
  answer?: string
  badge?: string
  sourceUrl?: string | null
  choices?: string[]
  intentCode?: ScheduleIntentCode
}

type NoticeRow = {
  id: string
  title: string
  content: string | null
  category: string | null
  tags: string | null
  createdAt: string
}

const NOTICE_HINT_RE =
  /대회|공모|모집|해킹|페스티벌|인턴|채용|특강|설문|창업|비교과|공지|부트\s*캠프|경진|부트캠프|취업|포상|수상|자퇴|휴학|병결|조기취업|출석\s*인정|원격수업|만족도|다빈치|핀테크|블록체인/

const STOP = new Set([
  '있는', '있어', '있나요', '있나', '해줘', '알려', '알려줘', '관련', '대한', '해서', '하는',
  '좀', '뭐', '뭐야', '요즘', '이번', '올해', '학부', '학교', '대학', '내용', '정보',
])

function extractLink(content: string | null) {
  return String(content || '').match(/https?:\/\/\S+/)?.[0] ?? null
}

function tokens(raw: string) {
  return String(raw || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP.has(t))
}

function dateLabel(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function scoreNotice(row: NoticeRow, qTokens: string[], department?: string | null) {
  const hay = `${row.title} ${row.tags || ''} ${row.category || ''} ${row.content || ''}`.toLowerCase()
  let score = 0
  for (const t of qTokens) {
    if (hay.includes(t)) score += t.length >= 4 ? 3 : 2
  }
  // 대회·모집 계열 가산
  if (/대회|경진|공모|모집|해킹|페스티벌|인턴|채용|특강|창업/.test(hay) && NOTICE_HINT_RE.test(qTokens.join(' '))) {
    score += 2
  }
  if (department) {
    const dep = department.replace(/\s/g, '')
    const tag = String(row.tags || '').replace(/\s/g, '')
    if (tag.includes(dep) || (dep.includes('컴퓨터') && tag.includes('컴퓨터'))
      || (dep.includes('첨단') && tag.includes('첨단'))) {
      score += 4
    }
  }
  // 최신 가중
  const ageDays = (Date.now() - new Date(row.createdAt).getTime()) / 86400000
  if (ageDays >= 0 && ageDays < 45) score += 2
  else if (ageDays < 120) score += 1
  return score
}

const OPENERS = [
  (n: number) => (n === 1 ? '관련해서 이런 공지가 있어요.' : `관련 공지를 ${n}건 골라 봤어요.`),
  (n: number) => (n === 1 ? '학부·학교 공지에 딱 맞는 글이 있네요.' : `공지판에서 ${n}건이 눈에 띄어요.`),
  (n: number) => (n === 1 ? '찾아보니 이런 게시글이 올라와 있어요.' : `비슷한 주제 공지가 ${n}건 있어요.`),
]

function formatHit(row: NoticeRow) {
  const link = extractLink(row.content)
  const src = row.tags || row.category || '학부공지'
  const when = dateLabel(row.createdAt)
  const head = `「${row.title}」`
  const meta = [src, when].filter(Boolean).join(' · ')
  return link ? `${head} (${meta})\n${link}` : `${head} (${meta})`
}

export function looksLikeNoticeCandidate(question: string) {
  const q = String(question || '')
  if (/교수|교원|선생님/.test(q) && /전화|이메일|메일|연락처|번호/.test(q)) return false
  if (/사무실|과사/.test(q) && /어디|위치|몇호|전화/.test(q)) return false
  // 개인 일정 조회/등록 톤이면 공지 아님
  if (/일정\s*있|스케줄|등록해|넣어줘|밥먹|스터디\s*잡/.test(q) && !NOTICE_HINT_RE.test(q)) {
    return false
  }
  return NOTICE_HINT_RE.test(q)
}

export async function searchNotices(question: string, department?: string | null, limit = 4) {
  // 최근 N건만 가져와 점수화 (전체 공지 풀스캔 방지)
  const { data, error } = await supabase
    .from('Notice')
    .select('id, title, content, category, tags, createdAt')
    .order('createdAt', { ascending: false })
    .limit(80)

  if (error || !data?.length) return [] as Array<NoticeRow & { score: number; link: string | null }>

  const qTokens = tokens(question)
  const scored = (data as NoticeRow[])
    .map((row) => ({
      ...row,
      score: scoreNotice(row, qTokens, department),
      link: extractLink(row.content),
    }))
    .filter((r) => r.score >= 3)
    .sort((a, b) => b.score - a.score || String(b.createdAt).localeCompare(String(a.createdAt)))

  return scored.slice(0, limit)
}

export async function tryHandleNoticeIntent(input: {
  question: string
  department?: string | null
  now?: Date
}): Promise<NoticeIntentResult> {
  const hits = await searchNotices(input.question, input.department, 4)

  if (!hits.length) {
    return {
      handled: true,
      intentCode: 4,
      badge: '공지 안내',
      answer:
        '지금 쌓아 둔 학부·학교 공지에서는 딱 맞는 글을 못 찾았어요. '
        + '첨단IT·컴퓨터공학부 학부공지 게시판을 한번 훑어보셔도 좋아요.\n'
        + '첨단IT: https://community.bu.ac.kr/smartit/6301/subview.do\n'
        + '컴퓨터공학부: https://community.bu.ac.kr/info/1788/subview.do',
      sourceUrl: 'https://community.bu.ac.kr/info/1788/subview.do',
      choices: ['최근 학부 공지 보여줘', '대회·모집 공지 알려줘'],
    }
  }

  const seed = hits[0].title.length + hits.length
  const opener = OPENERS[seed % OPENERS.length](hits.length)
  const body = hits.map((h, i) => `${i + 1}. ${formatHit(h)}`).join('\n\n')
  const tip = hits.length === 1
    ? '자세한 일정·자격은 원문에서 한번 확인해 주세요.'
    : '관심 있는 글 제목을 말해 주시면 그걸로 더 짚어 드릴게요.'

  return {
    handled: true,
    intentCode: 4,
    badge: '공지 매칭',
    answer: `${opener}\n\n${body}\n\n${tip}`,
    sourceUrl: hits[0].link || null,
    choices: hits.slice(0, 3).map((h) => h.title.replace(/^\[\s*[^\]]+\s*\]\s*/, '').slice(0, 40)),
  }
}
