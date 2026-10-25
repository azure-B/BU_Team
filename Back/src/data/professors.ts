/**
 * 교원 연락처 (학부 공개 교수소개)
 * - 컴퓨터공학부: https://community.bu.ac.kr/info/1768/subview.do
 * - 첨단IT학부: https://www.bu.ac.kr/smartit/6309/subview.do
 * - 관광학부: https://community.bu.ac.kr/web/3642/subview.do
 * - 디자인영상학부: https://community.bu.ac.kr/web/3654/subview.do
 * - 안경광학과(보건): https://www.bu.ac.kr/opt/1884/subview.do
 */

export type Professor = {
  name: string
  aliases?: string[]
  department: string
  phone?: string | null
  email?: string | null
  source_url: string
}

export const DEPT_ALIASES: Record<string, string[]> = {
  컴퓨터공학부: ['컴공', '컴퓨터공학과', '컴퓨터', '정보통신'],
  첨단IT학부: ['첨단IT', '첨단아이티', '스마트IT', 'smartit', 'ARVR'],
  관광학부: ['관광', '항공서비스'],
  디자인영상학부: ['디자인', '영상', '디영'],
  안경광학과: ['안경광학', '안경'],
}

const SRC = {
  cs: 'https://community.bu.ac.kr/info/1768/subview.do',
  it: 'https://www.bu.ac.kr/smartit/6309/subview.do',
  tourism: 'https://community.bu.ac.kr/web/3642/subview.do',
  design: 'https://community.bu.ac.kr/web/3654/subview.do',
  opt: 'https://www.bu.ac.kr/opt/1884/subview.do',
} as const

function phone(raw?: string | null) {
  if (!raw) return null
  const t = String(raw).trim().replace(/\s/g, '')
  if (!t) return null
  if (t.includes('/')) {
    // 041-550-2259/2146 → 대표 첫 번호
    const first = t.split('/')[0]
    return phone(first)
  }
  if (t.startsWith('041-') || t.startsWith('02-') || t.startsWith('070-')) return t
  if (/^\d{3,4}-\d{4}$/.test(t)) return `041-${t}`
  if (/^550-\d{4}$/.test(t)) return `041-${t}`
  return t
}

function p(
  name: string,
  department: string,
  tel: string | null,
  email: string | null,
  source_url: string,
  aliases: string[] = [],
): Professor {
  return { name, department, phone: phone(tel), email: email || null, source_url, aliases }
}

const CS: Professor[] = [
  p('윤택현', '컴퓨터공학부', '041-550-2534', 'ythyun@bu.ac.kr', SRC.cs),
  p('강경우', '컴퓨터공학부', '041-550-0496', 'kwkang@bu.ac.kr', SRC.cs),
  p('강윤희', '컴퓨터공학부', '550-0504', 'yhkang@bu.ac.kr', SRC.cs),
  p('곽노윤', '컴퓨터공학부', '041-550-0505', 'nykwak@bu.ac.kr', SRC.cs),
  p('구미순', '컴퓨터공학부', '041-550-0482', 'mskoo83@bu.ac.kr', SRC.cs),
  p('김경희', '컴퓨터공학부', '041-550-0485', 'kkhee86@bu.ac.kr', SRC.cs),
  p('김귀정', '컴퓨터공학부', '041-550-2172', 'gjkim@bu.ac.kr', SRC.cs),
  p('김민기', '컴퓨터공학부', '041-550-0601', 'mkworks@bu.ac.kr', SRC.cs),
  p('김병철', '컴퓨터공학부', '041-550-9176', 'bckim@bu.ac.kr', SRC.cs),
  p('박현수', '컴퓨터공학부', '041-550-0488', 'parkhs@bu.ac.kr', SRC.cs),
  p('빈상도', '컴퓨터공학부', null, 'bubin@bu.ac.kr', SRC.cs),
  p('윤성현', '컴퓨터공학부', '041-550-2537', 'shyoon@bu.ac.kr', SRC.cs),
  p('이근호', '컴퓨터공학부', '041-550-2740', 'root1004@bu.ac.kr', SRC.cs),
  p('이면재', '컴퓨터공학부', '041-550-2856', null, SRC.cs),
  p('이수연', '컴퓨터공학부', '041-550-0593', 'sylee243@bu.ac.kr', SRC.cs),
  p('이승화', '컴퓨터공학부', '041-550-2480', 'sh.lee@bu.ac.kr', SRC.cs),
  p('이시은', '컴퓨터공학부', '041-550-0506', 'leese@bu.ac.kr', SRC.cs),
  p('이현섭', '컴퓨터공학부', '041-550-2739', 'hyunseob@bu.ac.kr', SRC.cs),
  p('정은화', '컴퓨터공학부', '041-550-2405', 'ehjeong@bu.ac.kr', SRC.cs),
  p('최미영', '컴퓨터공학부', null, 'utopia@bu.ac.kr', SRC.cs),
  p('한군희', '컴퓨터공학부', '041-550-2475', 'hankh@bu.ac.kr', SRC.cs),
  p('한정수', '컴퓨터공학부', '041-550-2476', 'jshan@bu.ac.kr', SRC.cs),
  p('홍경호', '컴퓨터공학부', '041-550-2446', 'khhong@bu.ac.kr', SRC.cs),
]

const SMART_IT: Professor[] = [
  p('채규수', '첨단IT학부', '041-550-2658', null, SRC.it),
  p('강상규', '첨단IT학부', '041-550-9187', 'sgkang@bu.ac.kr', SRC.it),
  p('구민정', '첨단IT학부', null, 'mjkoo@bu.ac.kr', SRC.it),
  p('김동우', '첨단IT학부', '02-550-2116', 'dongwoo.kim@bu.ac.kr', SRC.it),
  p('김현숙', '첨단IT학부', '041-550-9049', 'hsjedi@bu.ac.kr', SRC.it),
  p('신은정', '첨단IT학부', '041-550-9071', 'eunjungshin@bu.ac.kr', SRC.it),
  p('유진호', '첨단IT학부', '041-550-0493', 'yoojh@bu.ac.kr', SRC.it),
  p('임장훈', '첨단IT학부', '041-550-9048', 'baspace@bu.ac.kr', SRC.it),
  p('지세현', '첨단IT학부', '041-550-2169', 'sehyun@bu.ac.kr', SRC.it),
  p('진영훈', '첨단IT학부', '041-550-2931', null, SRC.it),
  p('차대현', '첨단IT학부', '041-550-2117', 'daehyun@bu.ac.kr', SRC.it),
  p('홍성혁', '첨단IT학부', '041-550-2590', 'shong@bu.ac.kr', SRC.it),
  p('홍진근', '첨단IT학부', '041-550-2445', null, SRC.it),
]

const TOURISM: Professor[] = [
  p('이우진', '관광학부', '041-550-2835', 'wjblue@bu.ac.kr', SRC.tourism),
  p('고영길', '관광학부', '041-550-2929', 'wakky66@bu.ac.kr', SRC.tourism),
  p('구정대', '관광학부', '041-550-2743', 'progoo@hanmail.net', SRC.tourism),
  p('권봉헌', '관광학부', '041-550-2438', 'bongdal@bu.ac.kr', SRC.tourism),
  p('김두중', '관광학부', '041-550-0776', 'jydalma@naver.com', SRC.tourism),
  p('김판영', '관광학부', null, 'tourservice@bu.ac.kr', SRC.tourism),
  p('김화연', '관광학부', null, 'hyeeumcom@bu.ac.kr', SRC.tourism),
  p('나윤서', '관광학부', '041-550-2439', 'rafume@bu.ac.kr', SRC.tourism),
  p('노선희', '관광학부', null, 'sunshine@bu.ac.kr', SRC.tourism),
  p('박성구', '관광학부', '041-550-0438', 'hparksg@bu.ac.kr', SRC.tourism),
  p('박수영', '관광학부', null, 'psy@bu.ac.kr', SRC.tourism),
  p('박슬기', '관광학부', null, 'sgpark@bu.ac.kr', SRC.tourism),
  p('박영진', '관광학부', '041-550-2219', 'baenangpark@bu.ac.kr', SRC.tourism),
  p('송근석', '관광학부', null, 'kssong88@bu.ac.kr', SRC.tourism),
  p('심지연', '관광학부', '041-550-2367', 'jgrace@bu.ac.kr', SRC.tourism),
  p('엄경아', '관광학부', '041-550-2837', 'uka@bu.ac.kr', SRC.tourism),
  p('연지영', '관광학부', null, 'jyyeon@bu.ac.kr', SRC.tourism),
  p('오정학', '관광학부', '041-550-2928', 'jhoh@bu.ac.kr', SRC.tourism),
  p('윤지현', '관광학부', '041-550-2836', 'jhyun@bu.ac.kr', SRC.tourism),
  p('이광옥', '관광학부', '041-550-2764', 'golee@bu.ac.kr', SRC.tourism),
  p('이웅규', '관광학부', null, 'unikorea@bu.ac.kr', SRC.tourism),
  p('이향정', '관광학부', null, 'skyangel@bu.ac.kr', SRC.tourism),
  p('임성택', '관광학부', '02-967-4175', 'stlim@bu.ac.kr', SRC.tourism),
  p('장현종', '관광학부', '041-550-2256', 'hjjang@bu.ac.kr', SRC.tourism),
  p('정민의', '관광학부', '550-0456', 'mineuijung@bu.ac.kr', SRC.tourism),
  p('조원섭', '관광학부', '041-550-2927', 'wonseb@bu.ac.kr', SRC.tourism),
  p('채숙향', '관광학부', '041-550-9114', 'schae0823@bu.ac.kr', SRC.tourism),
  p('최현정', '관광학부', '041-550-0425', 'chj043@bu.ac.kr', SRC.tourism),
]

/** 디자인영상 — 전화 공개 위주(목록이 길어 연락처 있는 교원 우선) */
const DESIGN: Professor[] = [
  p('강화선', '디자인영상학부', '041-550-2533', 'kakukei@bu.ac.kr', SRC.design),
  p('강은정', '디자인영상학부', '041-550-9091', 'eunice20000@bu.ac.kr', SRC.design),
  p('공현희', '디자인영상학부', null, 'hanikong@bu.ac.kr', SRC.design),
  p('김경남', '디자인영상학부', '041-550-9104', 'hsfruit@bu.ac.kr', SRC.design),
  p('김금주', '디자인영상학부', null, 'epi517@bu.ac.kr', SRC.design),
  p('김민성', '디자인영상학부', '041-557-9664', 'minsung9664@hanmail.net', SRC.design),
  p('김향아', '디자인영상학부', '041-550-9092', 'hakim@bu.ac.kr', SRC.design),
  p('노정은', '디자인영상학부', null, 'smallsun@bu.ac.kr', SRC.design),
  p('민신기', '디자인영상학부', null, 'skmin@bu.ac.kr', SRC.design),
  p('박성철', '디자인영상학부', null, 'pscmetal@bu.ac.kr', SRC.design),
  p('박영우', '디자인영상학부', '041-550-2437', 'parkbu@bu.ac.kr', SRC.design),
  p('박정순', '디자인영상학부', '041-550-2505', 'jspark@bu.ac.kr', SRC.design),
  p('박지연', '디자인영상학부', '041-550-2657', 'jpark@bu.ac.kr', SRC.design),
  p('박혜련', '디자인영상학부', '041-550-2788', 'shane@bu.ac.kr', SRC.design),
  p('박혜선', '디자인영상학부', '041-550-9062', 'hyesunpark@bu.ac.kr', SRC.design),
  p('사영재', '디자인영상학부', '070-4131-7427', 'sayj0502@bu.ac.kr', SRC.design),
  p('성창경', '디자인영상학부', '02-449-0303', 'ossac@bu.ac.kr', SRC.design),
  p('심연보', '디자인영상학부', '041-550-2751', 'ybpottery@bu.ac.kr', SRC.design),
  p('안소미', '디자인영상학부', null, 'somian@bu.ac.kr', SRC.design),
  p('안진근', '디자인영상학부', '041-550-2097', 'paris1970@bu.ac.kr', SRC.design),
  p('유연수', '디자인영상학부', '041-550-2975', 'ysyu@bu.ac.kr', SRC.design),
  p('유용우', '디자인영상학부', '041-550-2355', 'ywyoo@bu.ac.kr', SRC.design),
  p('윤진영', '디자인영상학부', null, 'jyoon@bu.ac.kr', SRC.design),
  p('이강무', '디자인영상학부', '041-620-2660', 'lkangmoo@bu.ac.kr', SRC.design),
  p('이미애', '디자인영상학부', '041-550-0437', 'miaart2010@bu.ac.kr', SRC.design),
  p('이영하', '디자인영상학부', null, 'wing6802@bu.ac.kr', SRC.design),
  p('이지수', '디자인영상학부', null, 'leezeesoo@bu.ac.kr', SRC.design),
  p('이진경', '디자인영상학부', null, 'blesjk@bu.ac.kr', SRC.design),
  p('전서영', '디자인영상학부', '041-550-2701', 'baishi@bu.ac.kr', SRC.design),
  p('정광호', '디자인영상학부', null, 'jkh@bu.ac.kr', SRC.design),
  p('조용재', '디자인영상학부', '041-550-9141', 'yjcho@bu.ac.kr', SRC.design),
  p('조용준', '디자인영상학부', null, 'foto-design@bu.ac.kr', SRC.design),
  p('조은환', '디자인영상학부', '041-550-2712', 'drex1@bu.ac.kr', SRC.design),
  p('최동성', '디자인영상학부', '041-550-2532', 'hcilab@bu.ac.kr', SRC.design),
  p('최은희', '디자인영상학부', null, 'ehchoi@bu.ac.kr', SRC.design),
  p('홍수정', '디자인영상학부', null, 'redmotion@bu.ac.kr', SRC.design),
]

const OPT: Professor[] = [
  p('권오현', '안경광학과', '041-550-2273', null, SRC.opt),
  p('김세진', '안경광학과', '041-550-0830', 'sjkim@bu.ac.kr', SRC.opt),
  p('김태훈', '안경광학과', '041-550-2259', 'kth@bu.ac.kr', SRC.opt),
  p('김효진', '안경광학과', '041-550-2841', 'khj@bu.ac.kr', SRC.opt),
  p('심정규', '안경광학과', null, 'jgsim@bu.ac.kr', SRC.opt),
  p('예기훈', '안경광학과', '041-550-2180', 'eyelovebaekseok@bu.ac.kr', SRC.opt),
  p('최가을', '안경광학과', '041-550-2731', 'autumn@bu.ac.kr', SRC.opt),
]

export let PROFESSORS: Professor[] = [...CS, ...SMART_IT, ...TOURISM, ...DESIGN, ...OPT]

export let PROFESSOR_DEPARTMENTS = Object.keys(DEPT_ALIASES)

export function setProfessors(list: Professor[]) {
  PROFESSORS = list
  const fromData = [...new Set(list.map((p) => p.department))]
  PROFESSOR_DEPARTMENTS = [...new Set([...Object.keys(DEPT_ALIASES), ...fromData])]
}

export function isProfessorIntent(q: string) {
  return /교수|코수|선생님|강사|연구실|교원/.test(q)
}

export function detectProfessorDepartment(question: string): string | null {
  const q = String(question || '').replace(/\s+/g, '').toLowerCase()
  let best: { dept: string; len: number } | null = null
  for (const [dept, aliases] of Object.entries(DEPT_ALIASES)) {
    for (const a of [dept, ...aliases]) {
      const key = a.replace(/\s+/g, '').toLowerCase()
      if (key && q.includes(key) && (!best || key.length > best.len)) {
        best = { dept, len: key.length }
      }
    }
  }
  return best?.dept || null
}

/** 질문에서 교수 성함 후보만 추출 (없으면 '') */
export function extractProfessorNameQuery(question: string): string {
  let nameQ = String(question || '').replace(/\s+/g, '')
  for (const [d, aliases] of Object.entries(DEPT_ALIASES)) {
    for (const a of [d, ...aliases]) {
      nameQ = nameQ.split(a.replace(/\s/g, '')).join('')
    }
  }
  return nameQ
    .replace(/교수님?|코수님?|선생님|강사님?|교원|연구실|전화|번호|이메일|메일|연락처|알려줘|궁금해|어디|몇번|목록|리스트|전체|명단/g, '')
}

/** 이름 정확/부분 검색 (학부 필터 가능) */
export function searchProfessors(question: string, department?: string | null): Professor[] {
  const dept = department || detectProfessorDepartment(question)
  const pool = dept ? PROFESSORS.filter((p) => p.department === dept) : PROFESSORS
  const nameQ = extractProfessorNameQuery(question)

  if (nameQ.length >= 2) {
    const byName = pool
      .map((p) => {
        const names = [p.name, ...(p.aliases || [])]
        const exact = names.some((n) => n === nameQ)
        const includes = names.some((n) => n.includes(nameQ) || nameQ.includes(n))
        if (!exact && !includes) return null
        return { p, score: exact ? 100 + p.name.length : p.name.length }
      })
      .filter(Boolean) as { p: Professor; score: number }[]
    byName.sort((a, b) => b.score - a.score)
    if (byName.length) return byName.map((x) => x.p)
  }

  // 이름 없이 학부만 → 학부 전체
  if (dept) return pool
  return []
}

export function findProfessor(question: string): Professor | null {
  const hits = searchProfessors(question)
  if (hits.length === 1) return hits[0]
  // 여러 명이면 가장 긴 이름 일치 1명만 확정
  const q = String(question || '').replace(/\s+/g, '')
  const ranked = hits
    .map((p) => {
      const names = [p.name, ...(p.aliases || [])]
      const hit = names.find((n) => n && q.includes(n))
      return hit ? { p, len: hit.length } : null
    })
    .filter(Boolean) as { p: Professor; len: number }[]
  ranked.sort((a, b) => b.len - a.len)
  if (ranked[0] && (ranked.length === 1 || ranked[0].len > (ranked[1]?.len || 0))) {
    return ranked[0].p
  }
  return null
}

export function formatProfessorAnswer(p: Professor) {
  return [
    `${p.name} 교수님(${p.department})`,
    p.phone ? `전화: ${p.phone}` : '전화: 교수소개에 번호가 공개되어 있지 않습니다.',
    p.email ? `이메일: ${p.email}` : '이메일: 교수소개에 이메일이 공개되어 있지 않습니다.',
    `출처: ${p.source_url}`,
  ].join('\n')
}

export function formatProfessorList(dept: string, list: Professor[]) {
  const src = list[0]?.source_url || ''
  const lines = list.slice(0, 20).map((p) => {
    const tel = p.phone || '전화 미공개'
    const mail = p.email || '메일 미공개'
    return `· ${p.name} — ${tel} / ${mail}`
  })
  const more = list.length > 20 ? `\n…외 ${list.length - 20}명` : ''
  return [
    `${dept} 교원 연락처(공개 교수소개, ${list.length}명)`,
    ...lines,
    more,
    src ? `출처: ${src}` : '',
  ].filter(Boolean).join('\n')
}

export function professorsContextBlock() {
  const byDept = PROFESSOR_DEPARTMENTS.map((dept) => {
    const rows = PROFESSORS.filter((p) => p.department === dept)
      .map((p) => `${p.name}(${p.phone || '전화없음'}/${p.email || '메일없음'})`)
      .join(', ')
    return `${dept}: ${rows}`
  })
  return ['[교원 연락처 시드]', ...byDept].join('\n')
}
