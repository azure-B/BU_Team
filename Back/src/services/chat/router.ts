import { FAQ_SEEDS, GLOSSARY, type FaqSeed } from '../../data/faqSeeds'
import {
  DEPARTMENT_CHOICES,
  DEPARTMENT_OFFICES,
  findDepartmentOffice,
  type DepartmentOffice,
} from '../../data/departmentOffices'
import {
  academicCalendarContextSnippet,
  answerAcademicCalendar,
} from '../../data/academicCalendar'
import {
  detectProfessorDepartment,
  extractProfessorNameQuery,
  findProfessor,
  formatProfessorAnswer,
  formatProfessorList,
  isProfessorIntent,
  PROFESSOR_DEPARTMENTS,
  professorsContextBlock,
  searchProfessors,
} from '../../data/professors'
import { campusBuildingsContextBlock } from '../../data/campusBuildings'
import { askGpt, classifyScheduleCode } from './llm'
import { ensureKbLoaded, getKbSnapshot } from './kbStore'
import {
  classifyScheduleCodeLocal,
  looksLikeScheduleCandidate,
  tryHandleScheduleIntent,
  type ScheduleAction,
} from './scheduleIntent'
import { looksLikeNoticeCandidate, tryHandleNoticeIntent } from './noticeIntent'
import { looksLikeCampusCandidate, tryHandleCampusIntent } from './campusIntent'
import { looksLikeShuttleCandidate, tryHandleShuttleIntent } from './shuttleIntent'
import { looksLikeGapCandidate, tryHandleGapIntent } from './gapIntent'

export type ChatRoute =
  | 'faq'
  | 'faq_clarify'
  | 'engine'
  | 'rag_llm'
  | 'no_source'
  | 'blocked'
  | 'schedule'
  | 'notice'
  | 'campus'
  | 'shuttle'
  | 'gap'

export type ChatSentContext = {
  department?: string | null
  grade?: string | number | null
  todaySummary?: string
  routeHint?: string
  blocks?: string[]
}

export type ChatResponse = {
  route: ChatRoute
  answer: string
  badge: string
  sourceUrl?: string | null
  faqId?: string | null
  choices?: string[]
  model?: string
  latencyMs: number
  needsReview?: boolean
  /** 즉시 응답일 때 Front에서 「AI 연결하기」 노출 */
  canEscalateToAi?: boolean
  kbSource?: 'db' | 'seed'
  scheduleAction?: ScheduleAction
  /** GPT/즉시응답에 쓰인 요약 — Front 「보낸 정보」 */
  sentContext?: ChatSentContext | null
}

export type ChatInput = {
  question: string
  department?: string | null
  now?: Date
  /** true면 FAQ 건너뛰고 GPT로 */
  forceLlm?: boolean
  userId?: string | null
}

function normalize(raw: string) {
  let q = String(raw || '').toLowerCase().replace(/[\s?!.，。、]/g, '')
  for (const g of GLOSSARY) {
    if (q.includes(g.term.replace(/\s/g, ''))) {
      q = q.split(g.term.replace(/\s/g, '')).join(g.official.replace(/\s/g, ''))
    }
  }
  return q
}

function scoreFaq(faq: FaqSeed, q: string) {
  const kwHits = faq.keywords.filter((k) => q.includes(k.replace(/\s/g, ''))).length
  const reqOk = faq.required_any.every((group) =>
    group.some((k) => q.includes(k.replace(/\s/g, ''))),
  )
  if (!reqOk) return -1
  return kwHits * 10 + (faq.priority || 0)
}

function fillTemplate(tpl: string, office: DepartmentOffice | null) {
  return tpl
    .split('{{department}}').join(office?.department || '소속 학부')
    .split('{{building}}').join(office?.building || '(건물)')
    .split('{{room}}').join(office?.room || '(호실)')
    .split('{{phones}}').join(office?.phones?.join(' · ') || '(연락처 미확인)')
}

function officeContextBlock() {
  return [
    '[학부사무실]',
    ...DEPARTMENT_OFFICES.map(
      (o) => `${o.department}: ${o.building} ${o.room}, ${o.phones.join(' · ')}`,
    ),
  ].join('\n')
}

function matchOfficeIntent(q: string) {
  if (isProfessorIntent(q)) return false
  return /사무실|과사|위치|몇호|전화|연락처|어디/.test(q)
    && DEPARTMENT_OFFICES.some((o) =>
      [o.department, ...o.aliases].some((n) => q.includes(n.replace(/\s/g, ''))),
    )
}

function withMeta(res: ChatResponse, escalate: boolean): ChatResponse {
  const kb = getKbSnapshot()
  return {
    ...res,
    canEscalateToAi: escalate && (res.route === 'faq' || res.route === 'faq_clarify' || res.route === 'engine' || res.route === 'gap' || res.route === 'shuttle' || res.route === 'campus'),
    kbSource: kb.source,
  }
}

function buildSentContext(input: ChatInput, extra?: Partial<ChatSentContext>): ChatSentContext {
  return {
    department: input.department || null,
    todaySummary: extra?.todaySummary || '오늘 일정은 로그인·시간표 기준으로 홈에서 확인',
    routeHint: extra?.routeHint,
    blocks: extra?.blocks,
  }
}

async function runLlm(question: string, department: string | null | undefined, t0: number, input: ChatInput): Promise<ChatResponse> {
  const office = findDepartmentOffice(question, department)
  const faqHints = FAQ_SEEDS
    .slice(0, 10)
    .map((f) => `- ${f.title}: ${f.answer_template.replace(/\{\{[^}]+\}\}/g, '…').slice(0, 160)}`)
    .join('\n')
  const context = [
    academicCalendarContextSnippet(),
    campusBuildingsContextBlock(),
    office
      ? `[질문자 학부] ${office.department}: ${office.building} ${office.room}, ${office.phones.join(' · ')}`
      : department
        ? `[질문자 학부] ${department}`
        : '',
    officeContextBlock(),
    professorsContextBlock(),
    `[FAQ 요약]\n${faqHints}`,
    '위 근거를 우선 사용하고, 부족하면 확인 불가로 답하세요. 건물·이동시간은 [캠퍼스 건물] 근거를 따르세요. 통학버스는 학생처 문의.',
  ]
  const llm = await askGpt(question, context)
  return withMeta({
    route: llm.ok ? 'rag_llm' : 'no_source',
    answer: llm.text,
    badge: llm.ok ? 'AI 생성 답변' : '안내',
    model: llm.model,
    latencyMs: Date.now() - t0,
    sentContext: buildSentContext(input, {
      routeHint: 'rag_llm',
      blocks: context.filter(Boolean).map((b) => b.slice(0, 200)),
    }),
  }, false)
}

function tryFaqAnswer(
  question: string,
  q: string,
  input: ChatInput,
  t0: number,
): ChatResponse | null {
  const office = findDepartmentOffice(question, input.department)
  const scored = FAQ_SEEDS
    .map((faq) => ({ faq, score: scoreFaq(faq, q) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)

  if (matchOfficeIntent(q) || (office && !isProfessorIntent(q) && /전화|번호|연락처|위치|어디|몇호|사무실|과사/.test(q))) {
    const loc = scored.find((s) => s.faq.id === 'office-location')?.faq
      || FAQ_SEEDS.find((f) => f.id === 'office-location')!
    if (!office) {
      return withMeta({
        route: 'faq_clarify',
        answer: '어느 학부 사무실을 찾으시나요?',
        badge: '즉시 응답 · 학부 선택',
        faqId: loc.id,
        choices: DEPARTMENT_CHOICES,
        sourceUrl: loc.source_url,
        latencyMs: Date.now() - t0,
        sentContext: buildSentContext(input, { routeHint: 'faq_clarify' }),
      }, true)
    }
    return withMeta({
      route: 'faq',
      answer: fillTemplate(loc.answer_template, office),
      badge: '즉시 응답 · 공식 안내 기준',
      faqId: loc.id,
      sourceUrl: office.source_url,
      needsReview: Boolean(office.review_note),
      latencyMs: Date.now() - t0,
      sentContext: buildSentContext(input, { routeHint: 'faq', blocks: [loc.title] }),
    }, true)
  }

  if (scored[0]) {
    const faq = scored[0].faq
    if (faq.slots?.includes('department') && !office && faq.id === 'office-location') {
      return withMeta({
        route: 'faq_clarify',
        answer: '어느 학부인지 알려 주세요.',
        badge: '즉시 응답 · 학부 선택',
        faqId: faq.id,
        choices: DEPARTMENT_CHOICES,
        sourceUrl: faq.source_url,
        latencyMs: Date.now() - t0,
        sentContext: buildSentContext(input, { routeHint: 'faq_clarify' }),
      }, true)
    }
    return withMeta({
      route: 'faq',
      answer: fillTemplate(faq.answer_template, office),
      badge: '즉시 응답 · 공식 안내 기준',
      faqId: faq.id,
      sourceUrl: faq.source_url,
      needsReview: Boolean(faq.review_note),
      latencyMs: Date.now() - t0,
      sentContext: buildSentContext(input, { routeHint: 'faq', blocks: [faq.title] }),
    }, true)
  }
  return null
}

/** FAQ → 학사일정(engine) → GPT(rag_llm). forceLlm이면 바로 GPT */
export async function routeChat(input: ChatInput): Promise<ChatResponse> {
  const t0 = Date.now()
  await ensureKbLoaded()

  const question = String(input.question || '').trim()
  if (!question) {
    return withMeta({
      route: 'no_source',
      answer: '질문을 입력해 주세요.',
      badge: '안내',
      latencyMs: Date.now() - t0,
    }, false)
  }

  const now = input.now || new Date()

  // 1) 캠퍼스 건물·이동
  if (looksLikeCampusCandidate(question)) {
    const campus = await tryHandleCampusIntent({ question, now })
    if (campus.handled && campus.answer) {
      return withMeta({
        route: 'campus',
        answer: campus.answer,
        badge: campus.badge || '캠퍼스 안내',
        choices: campus.choices,
        latencyMs: Date.now() - t0,
        sentContext: buildSentContext(input, { routeHint: 'campus' }),
      }, true)
    }
  }

  // 2) 셔틀·통학버스
  if (looksLikeShuttleCandidate(question)) {
    const shuttle = await tryHandleShuttleIntent({ question, now })
    if (shuttle.handled && shuttle.answer) {
      return withMeta({
        route: 'shuttle',
        answer: shuttle.answer,
        badge: shuttle.badge || '셔틀 안내',
        choices: shuttle.choices,
        sourceUrl: shuttle.sourceUrl,
        latencyMs: Date.now() - t0,
        sentContext: buildSentContext(input, { routeHint: 'shuttle' }),
      }, true)
    }
  }

  // 3) 공강·틈새 (일정 등록보다 먼저)
  if (looksLikeGapCandidate(question)) {
    const gap = await tryHandleGapIntent({ question, now })
    if (gap.handled && gap.answer) {
      return withMeta({
        route: 'gap',
        answer: gap.answer,
        badge: gap.badge || '공강 추천',
        choices: gap.choices,
        latencyMs: Date.now() - t0,
        sentContext: buildSentContext(input, { routeHint: 'gap' }),
      }, true)
    }
  }

  const q = normalize(question)

  // 4) FAQ를 공지·일정보다 먼저 (병결·휴학·학식 등)
  if (!input.forceLlm) {
    const faqHit = tryFaqAnswer(question, q, input, t0)
    if (faqHit) return faqHit
  }

  // 5) 공지 / 일정
  const scheduleLike = looksLikeScheduleCandidate(question)
  const noticeLike = looksLikeNoticeCandidate(question)
  if (scheduleLike || noticeLike) {
    const gptCode = await classifyScheduleCode(question, now)
    const code = gptCode ?? classifyScheduleCodeLocal(question)

    if (code === 4 || (noticeLike && code === 0)) {
      const noticed = await tryHandleNoticeIntent({
        question,
        department: input.department,
        now,
      })
      if (noticed.handled && noticed.answer) {
        return withMeta({
          route: 'notice',
          answer: noticed.answer,
          badge: noticed.badge || '공지 안내',
          choices: noticed.choices,
          sourceUrl: noticed.sourceUrl,
          latencyMs: Date.now() - t0,
          sentContext: buildSentContext(input, { routeHint: 'notice' }),
        }, false)
      }
    }

    const scheduleCode = /삭제|지워|없애|취소|제거|빼\s*줘|빼줘/.test(question) ? 5 : code
    if (scheduleCode === 1 || scheduleCode === 2 || scheduleCode === 3 || scheduleCode === 5) {
      const scheduled = await tryHandleScheduleIntent({
        question,
        userId: input.userId,
        now,
        intentCode: scheduleCode,
      })
      if (scheduled.handled && scheduled.answer) {
        return withMeta({
          route: 'schedule',
          answer: scheduled.answer,
          badge: scheduled.badge || '일정 안내',
          choices: scheduled.choices,
          scheduleAction: scheduled.scheduleAction,
          latencyMs: Date.now() - t0,
          sentContext: buildSentContext(input, { routeHint: 'schedule' }),
        }, false)
      }
    }
  }

  if (input.forceLlm) {
    return runLlm(question, input.department, t0, input)
  }

  const office = findDepartmentOffice(question, input.department)
  const profDept = detectProfessorDepartment(question)
  const professorHits = searchProfessors(question)
  const professor = findProfessor(question)
  const nameQuery = extractProfessorNameQuery(question)
  const wantsProf = professor || isProfessorIntent(q)
    || (profDept && /교수|교원|선생님|연락|전화|메일|이메일|목록/.test(q))

  if (wantsProf) {
    if (professor) {
      return withMeta({
        route: 'faq',
        answer: formatProfessorAnswer(professor),
        badge: '즉시 응답 · 교수소개',
        faqId: 'professor-contact',
        sourceUrl: professor.source_url,
        latencyMs: Date.now() - t0,
        sentContext: buildSentContext(input, { routeHint: 'professor', blocks: [professor.name] }),
      }, true)
    }
    if (profDept && nameQuery.length < 2) {
      const list = searchProfessors(question, profDept)
      if (list.length) {
        return withMeta({
          route: 'faq',
          answer: formatProfessorList(profDept, list),
          badge: '즉시 응답 · 교수소개',
          faqId: 'professor-list',
          sourceUrl: list[0].source_url,
          latencyMs: Date.now() - t0,
          sentContext: buildSentContext(input, { routeHint: 'professor-list' }),
        }, true)
      }
    }
    if (professorHits.length > 1) {
      return withMeta({
        route: 'faq_clarify',
        answer: '여러 명이 검색됐어요. 누구를 찾으시나요?',
        badge: '즉시 응답 · 교수 선택',
        faqId: 'professor-contact',
        choices: professorHits.slice(0, 10).map((p) => `${p.name}(${p.department})`),
        sourceUrl: professorHits[0]?.source_url,
        latencyMs: Date.now() - t0,
        sentContext: buildSentContext(input, { routeHint: 'professor-clarify' }),
      }, true)
    }
    return withMeta({
      route: 'faq_clarify',
      answer:
        '교수님 성함 또는 학부를 알려 주세요.\n'
        + '예: 「곽노윤 교수님 전화」 / 「첨단IT 교수님 목록」\n'
        + `등록 학부: ${PROFESSOR_DEPARTMENTS.join(', ')}`,
      badge: '즉시 응답 · 교수 검색',
      faqId: 'professor-contact',
      choices: PROFESSOR_DEPARTMENTS,
      sourceUrl: 'https://community.bu.ac.kr/info/1768/subview.do',
      latencyMs: Date.now() - t0,
      sentContext: buildSentContext(input, { routeHint: 'professor-search' }),
    }, true)
  }

  // FAQ는 위에서 이미 시도 — office 단독 재시도는 생략

  const cal = answerAcademicCalendar(question, input.now || new Date())
  if (cal) {
    return withMeta({
      route: 'engine',
      answer: cal,
      badge: '즉시 응답 · 학사일정',
      sourceUrl: 'https://www.bu.ac.kr/web/3443/subview.do',
      latencyMs: Date.now() - t0,
      sentContext: buildSentContext(input, { routeHint: 'engine' }),
    }, true)
  }

  void office
  return runLlm(question, input.department, t0, input)
}
