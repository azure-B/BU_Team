/**
 * 캠퍼스 내 시설 위치 (챗봇 「편의점 어딨어」「본부동 CU」)
 * Front campusSpots / campusBuildings 안내와 맞춤.
 */
export type CampusFacility = {
  id: string
  name: string
  /** 검색용: 편의점, CU, 학식 … */
  kinds: string[]
  aliases: string[]
  buildingName: string | null
  floorLabel: string
  blurb: string
}

export const CAMPUS_FACILITIES: CampusFacility[] = [
  {
    id: 'cvs-hq-cu',
    name: '본부동 CU',
    kinds: ['편의점', 'CU', '씨유'],
    aliases: ['본부 편의점', '본부동 편의점', '본부 CU'],
    buildingName: '본부동',
    floorLabel: '6층',
    blurb: '본부 수업 앞이면 제일 가깝습니다. 엘리베이터 대기를 조금 보세요.',
  },
  {
    id: 'cvs-truth-cu',
    name: '진리관 CU',
    kinds: ['편의점', 'CU', '씨유'],
    aliases: ['진리 편의점', '진리관 편의점', '진리관 CU'],
    buildingName: '진리관',
    floorLabel: '지하1층(B1)',
    blurb: '삼각김밥·간단 식사에 자주 씁니다. 점심·공강 때 줄이 길 수 있어요.',
  },
  {
    id: 'cvs-wisdom-cu',
    name: '지혜관 CU',
    kinds: ['편의점', 'CU', '씨유'],
    aliases: ['지혜 편의점', '지혜관 편의점'],
    buildingName: '지혜관',
    floorLabel: '3층',
    blurb: '지혜관 수업 사이 짧은 구매에 좋아요.',
  },
  {
    id: 'cvs-stu-seven',
    name: '학생복지동 세븐일레븐',
    kinds: ['편의점', '세븐', '세븐일레븐', '7eleven', '711'],
    aliases: ['복지동 편의점', '학생회관 편의점', '복지동 세븐'],
    buildingName: '학생회관',
    floorLabel: '1층',
    blurb: '학생복지동(학생회관) 1층입니다.',
  },
  {
    id: 'cvs-dorm-gs',
    name: '기숙사 GS25',
    kinds: ['편의점', 'GS', 'GS25', '지에스'],
    aliases: ['기숙사 편의점', '생활관 편의점', '생활관 GS'],
    buildingName: null,
    floorLabel: '백석생활관 2층',
    blurb: '생활관 쪽에 있을 때 가깝습니다.',
  },
  {
    id: 'cafe-startup',
    name: '본부동 창업카페',
    kinds: ['카페', '창업카페'],
    aliases: ['본부 카페', '창업 카페'],
    buildingName: '본부동',
    floorLabel: '1층',
    blurb: '음료 안 시켜도 학습 공간으로 쓸 수 있어요. PC·복사도 됩니다.',
  },
  {
    id: 'cafe-beury',
    name: '카페뷰리 분수광장점',
    kinds: ['카페', '뷰리'],
    aliases: ['뷰리', '분수광장 카페'],
    buildingName: null,
    floorLabel: '베데스다공원(분수광장) 옆',
    blurb: '캠퍼스 안쪽 산책·커피용입니다.',
  },
  {
    id: 'cafe-cafeteria-mill',
    name: '밀겨울 백석대점',
    kinds: ['학식', '식당', '구내식당', '급식'],
    aliases: ['밀겨울'],
    buildingName: null,
    floorLabel: '복지관 인근',
    blurb: '학식·국밥. 점심 피크 11:00~13:30.',
  },
  {
    id: 'cafe-faculty',
    name: '교수회관 식당',
    kinds: ['학식', '식당', '구내식당'],
    aliases: ['교수회관'],
    buildingName: null,
    floorLabel: '교수회관',
    blurb: '캠퍼스 안쪽 백반 학식입니다.',
  },
  {
    id: 'cafe-angol',
    name: '안골',
    kinds: ['학식', '식당', '구내식당'],
    aliases: ['안골 학식'],
    buildingName: null,
    floorLabel: '외식글로벌학습관 1층',
    blurb: '글로벌외식산업관(외식글로벌학습관) 1층 학식입니다.',
  },
  {
    id: 'cafe-dorm',
    name: '기숙사식당',
    kinds: ['학식', '식당', '구내식당'],
    aliases: ['생활관 식당'],
    buildingName: null,
    floorLabel: '백석생활관',
    blurb: '생활관 식당 백반입니다.',
  },
  {
    id: 'lib-reading',
    name: '학술정보관 열람실',
    kinds: ['도서관', '열람실', '학술정보관'],
    aliases: ['도서관 열람실'],
    buildingName: '도서관',
    floorLabel: '지하~1층',
    blurb: '클리커 앱으로 좌석 선택. 시험 기간에 빨리 찹니다.',
  },
  {
    id: 'lib-dream',
    name: '드림자료실',
    kinds: ['도서관', '자료실', '드림'],
    aliases: ['본부 도서관', '드림 자료실'],
    buildingName: '본부동',
    floorLabel: '지하1층',
    blurb: '본부동 분관 자료실입니다.',
  },
  {
    id: 'bookstore',
    name: '뷰리서점·우체국',
    kinds: ['서점', '우체국', '문구'],
    aliases: ['진리관 서점'],
    buildingName: '진리관',
    floorLabel: '1층',
    blurb: '진리관 1층입니다.',
  },
]

const FACILITY_KIND_RE =
  /편의점|씨유|\bCU\b|세븐|세븐일레븐|GS25?|지에스|카페|창업카페|뷰리|학식|구내식당|급식|식당|열람실|도서관|학술정보관|자료실|드림|서점|우체국/

export function looksLikeFacilityQuestion(question: string) {
  const q = String(question || '')
  if (FACILITY_KIND_RE.test(q)) return true
  return CAMPUS_FACILITIES.some((f) =>
    [f.name, ...f.aliases, ...f.kinds].some((k) => k.length >= 2 && q.includes(k)),
  )
}

function scoreFacility(f: CampusFacility, q: string, buildingHint: string | null) {
  let score = 0
  const hay = `${f.name} ${f.aliases.join(' ')} ${f.kinds.join(' ')} ${f.buildingName || ''} ${f.floorLabel}`
  for (const k of [...f.kinds, ...f.aliases, f.name]) {
    if (k.length >= 2 && q.includes(k.replace(/\s/g, ''))) score += k.length >= 4 ? 5 : 3
    else if (k.length >= 2 && q.includes(k)) score += 2
  }
  if (/편의점/.test(q) && f.kinds.includes('편의점')) score += 4
  if (/\bCU\b|씨유|CU/.test(q) && f.kinds.includes('CU')) score += 4
  if (/세븐/.test(q) && /세븐/.test(f.name)) score += 5
  if (/GS|지에스/.test(q) && /GS/.test(f.name)) score += 5
  if (/학식|구내|급식/.test(q) && f.kinds.includes('학식')) score += 4
  if (/카페/.test(q) && f.kinds.includes('카페')) score += 3
  if (/도서관|열람/.test(q) && (f.kinds.includes('도서관') || f.kinds.includes('열람실'))) score += 4
  if (buildingHint && f.buildingName === buildingHint) score += 8
  if (buildingHint && hay.includes(buildingHint)) score += 3
  return score
}

export function searchCampusFacilities(
  question: string,
  buildingHint?: string | null,
  limit = 6,
) {
  const q = String(question || '')
  const scored = CAMPUS_FACILITIES
    .map((f) => ({ f, score: scoreFacility(f, q, buildingHint || null) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((x) => x.f)
}

export function formatFacilityAnswer(
  facilities: CampusFacility[],
  opts?: { buildingHint?: string | null; listAllCvs?: boolean },
) {
  if (!facilities.length) {
    return (
      '해당하는 시설을 못 찾았어요.\n'
      + '예: 「편의점 어딨어」, 「본부동 편의점」, 「학식」, 「창업카페」'
    )
  }

  const title = opts?.buildingHint
    ? `【${opts.buildingHint} 근처 시설】`
    : facilities.length === 1
      ? `【${facilities[0].name}】`
      : '【캠퍼스 시설 위치】'

  const lines = [title, '']
  for (const f of facilities) {
    const where = f.buildingName
      ? `${f.buildingName} ${f.floorLabel}`
      : f.floorLabel
    lines.push(`· ${f.name} — ${where}`)
    if (f.blurb) lines.push(`  ${f.blurb}`)
  }
  if (opts?.listAllCvs || (facilities.length === 1 && facilities[0].kinds.includes('편의점'))) {
    // already listed
  }
  lines.push('', '건물 전체 안내가 필요하면 「본부동 정보」처럼 물어보세요.')
  return lines.join('\n')
}
