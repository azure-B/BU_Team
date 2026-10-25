/**
 * 백석대 건물별 안내 섹션 (챗봇·캠퍼스 Q&A)
 * 시설·휴게는 Front campusSpots / 학내 안내 기준.
 * 건물 간 도보(분)는 CampusEdge 시드(seed-campus-edges)와 동일.
 */
import { DEPARTMENT_OFFICES } from './departmentOffices'
import {
  ELEVATOR_WAIT_PEAKS,
  ELEVATOR_WAIT_RULES,
  formatHourlyCrowdTable,
} from './elevatorWaitSlots'

export type CampusBuildingProfile = {
  id: string
  name: string
  aliases: string[]
  /** 층 안내 (예: B1~7층) */
  floors: string
  summary: string
  facilities: string[]
  lounges: string[]
  /** 붐비는 시간·엘리베이터 힌트 */
  busyHint: string
  tips?: string[]
}

/** CampusEdge 시드와 동일 — 맑은 날 도보(분) */
export const CAMPUS_WALK_MINUTES: Record<string, Record<string, number>> = {
  목양관: { 진리관: 5, 백석홀: 5, 지혜관: 7, 본부동: 10, 체육관: 13, 조형관: 13 },
  진리관: { 목양관: 5, 백석홀: 5, 지혜관: 5, 본부동: 7, 체육관: 13, 조형관: 13 },
  본부동: { 지혜관: 5, 진리관: 7, 목양관: 10, 체육관: 10, 조형관: 10 },
  지혜관: { 진리관: 5, 백석홀: 5, 본부동: 5, 목양관: 7, 체육관: 15, 조형관: 15 },
  체육관: { 본부동: 10, 진리관: 13, 목양관: 13, 지혜관: 15, 백석홀: 15, 조형관: 2 },
  조형관: { 본부동: 10, 진리관: 13, 목양관: 13, 지혜관: 15, 백석홀: 15, 체육관: 2 },
  백석홀: { 진리관: 5, 목양관: 5, 지혜관: 5 },
}

/** 뛰어가기 ≈ 도보의 60% 시간 (캠퍼스 언덕·가방 가정) */
export const RUN_TIME_FACTOR = 0.6

export const CAMPUS_BUILDINGS: CampusBuildingProfile[] = [
  {
    id: 'bldg-truth',
    name: '진리관',
    aliases: ['진리'],
    floors: 'B1~5층대',
    summary: '사회복지·강의실이 많은 본관 인근 건물. 지하에 CU, 1층에 서점·학습 공간이 있어요.',
    facilities: ['CU(지하1층)', '뷰리서점·우체국(1층)', '사회복지학부 사무실(302호)'],
    lounges: ['1층 로비 학습존', '지하1층 CU 옆 학습존'],
    busyHint: '수업 교체 직후(정각·50분경) 로비·엘리베이터가 붐빕니다. 지하 CU는 점심·공강 때 줄이 길어요.',
    tips: ['급하면 지하 CU에서 간단 식사', '본부동까지 도보 약 7분'],
  },
  {
    id: 'bldg-hq',
    name: '본부동',
    aliases: ['본부', '본관'],
    floors: 'B1~7층대',
    summary: '첨단IT·컴퓨터공학 등 주요 학부와 행정·편의시설이 모인 중심 건물입니다.',
    facilities: [
      '창업카페(1층, 음료 없이도 이용 가능)',
      '드림자료실(지하1층)',
      'CU(6층)',
      '컴퓨터공학부·첨단IT학부 사무실(716호)',
      '경찰학부·혁신융합(715호), 사범학부(601호) 등',
    ],
    lounges: ['2층부터 각 층 중앙 휴게공간', '창업카페', '드림자료실'],
    busyHint:
      '엘리베이터 피크는 화 13시대가 특히 붐빔(대기 최대 약 10분). 여유 있으면 계단·조금 일찍 이동을 추천해요.',
    tips: ['6층 CU는 엘리베이터 대기 포함해 시간 계산', '진리관까지 도보 약 7분'],
  },
  {
    id: 'bldg-wisdom',
    name: '지혜관',
    aliases: ['지혜'],
    floors: '저~고층 강의동',
    summary: '경상학부 등 강의·사무실이 있는 건물입니다.',
    facilities: ['CU(3층)', '경상학부 사무실(609호)'],
    lounges: ['층별 휴게·복도 벤치'],
    busyHint: '화 10시대 엘리베이터·복도가 붐빌 수 있어요(대기 최대 약 7분).',
    tips: ['본부동·진리관과 각 약 5분'],
  },
  {
    id: 'bldg-mogyang',
    name: '목양관',
    aliases: ['목양'],
    floors: '저~고층',
    summary: '기독교학부 중심 건물로, 라운지·스터디룸이 있어요.',
    facilities: ['기독교학부 사무실(103호)', '5층 스터디룸'],
    lounges: ['2층 라운지', '5층 스터디룸'],
    busyHint: '예배·수업 전후로 1층·계단이 붐빕니다.',
    tips: ['진리관·백석홀까지 각 약 5분', '본부동까지 약 10분'],
  },
  {
    id: 'bldg-art',
    name: '조형관',
    aliases: ['조형'],
    floors: '저~고층',
    summary: '간호·보건·디자인영상 등 실습·강의가 많은 건물입니다.',
    facilities: ['간호학과·보건학부 사무실(618호)', '디자인영상학부 사무실(309호)'],
    lounges: ['각 층 휴게실'],
    busyHint: '수 14시대 엘리베이터 피크(대기 최대 약 10분). 체육관과는 바로 옆(약 2분).',
    tips: ['본부동까지 약 10분', '진리관까지 약 13분'],
  },
  {
    id: 'bldg-gym',
    name: '체육관',
    aliases: ['체육'],
    floors: '저층 중심',
    summary: '스포츠과학부·체육 시설이 있는 건물입니다.',
    facilities: ['스포츠과학부 사무실(302호)', '실내 체육 시설'],
    lounges: ['로비·대기 공간'],
    busyHint: '수업·동아리 활동 시간대에 로비가 붐빕니다. 엘리베이터는 상대적으로 짧아요.',
    tips: ['조형관까지 약 2분', '본부동까지 약 10분'],
  },
  {
    id: 'bldg-hall',
    name: '백석홀',
    aliases: ['홀', '대강당'],
    floors: '대강당·부대시설',
    summary: '채플·행사·대형 강의에 쓰는 홀입니다.',
    facilities: ['대강당', '행사 로비'],
    lounges: ['로비'],
    busyHint: '채플·특강 직전·직후에 출입구가 매우 붐빕니다.',
    tips: ['진리관·목양관·지혜관과 각 약 5분'],
  },
  {
    id: 'bldg-lib',
    name: '도서관',
    aliases: ['학술정보관', '백석학술정보관', '열람실'],
    floors: '지하~5층대',
    summary: '백석학술정보관. 열람실·자료실이 있어 과제·시험 기간에 특히 붐벼요.',
    facilities: ['열람실(지하~1층, 클리커 좌석)', '자료실(2~5층, 모바일 학생증)'],
    lounges: ['열람실', '자료실 열람 공간'],
    busyHint: '중간·기말 기간과 평일 저녁에 좌석이 빨리 찹니다. 주말 운영 시간이 평일과 달라요.',
    tips: ['평일 열람실 08:00~24:00대(학기 기준, 변동 가능)', '자료실은 평일 주간·금요일은 일찍 마감하는 편'],
  },
  {
    id: 'bldg-stu',
    name: '학생회관',
    aliases: ['학생복지동', '복지동'],
    floors: '저층 중심',
    summary: '학생 복지·편의 시설이 있는 동입니다.',
    facilities: ['세븐일레븐(1층)'],
    lounges: ['로비·휴게 공간'],
    busyHint: '점심·공강 때 편의점·로비가 붐빕니다.',
    tips: ['간단 식사는 1층 세븐일레븐'],
  },
  {
    id: 'bldg-arts',
    name: '예술대학동',
    aliases: ['예술대', '예대'],
    floors: '저층 중심',
    summary: '문화예술학부 등 예술 계열 공간이 있는 건물입니다.',
    facilities: ['문화예술학부 사무실(105호)'],
    lounges: ['로비'],
    busyHint: '공연·연습 전후로 출입이 붐빌 수 있어요.',
    tips: ['사무실·연습실 위치는 학부 안내에 따라 달라질 수 있어요'],
  },
]

export function findCampusBuildings(text: string): CampusBuildingProfile[] {
  const q = String(text || '').replace(/\s/g, '')
  const hits: { b: CampusBuildingProfile; len: number }[] = []
  for (const b of CAMPUS_BUILDINGS) {
    const names = [b.name, ...b.aliases]
    for (const n of names) {
      const key = n.replace(/\s/g, '')
      if (key && q.includes(key)) {
        hits.push({ b, len: key.length })
        break
      }
    }
  }
  hits.sort((a, b) => b.len - a.len)
  const seen = new Set<string>()
  const out: CampusBuildingProfile[] = []
  for (const h of hits) {
    if (seen.has(h.b.id)) continue
    seen.add(h.b.id)
    out.push(h.b)
  }
  return out
}

export function findCampusBuilding(text: string): CampusBuildingProfile | null {
  return findCampusBuildings(text)[0] || null
}

export function walkMinutesBetween(fromName: string, toName: string): number | null {
  if (fromName === toName) return 0
  const a = CAMPUS_WALK_MINUTES[fromName]?.[toName]
  if (typeof a === 'number') return a
  const b = CAMPUS_WALK_MINUTES[toName]?.[fromName]
  return typeof b === 'number' ? b : null
}

export function officesInBuilding(buildingName: string): string[] {
  return DEPARTMENT_OFFICES
    .filter((o) => o.building === buildingName)
    .map((o) => `${o.department} ${o.room} (${o.phones[0] || '연락처 문의'})`)
}

export function elevatorHintFor(buildingName: string): string | null {
  const rule = (ELEVATOR_WAIT_RULES as Record<string, { peak: number; high: number; low: number }>)[buildingName]
  const peak = ELEVATOR_WAIT_PEAKS.find((p) => p.building === buildingName)
  if (!rule && !peak) return null
  const parts: string[] = []
  if (rule) parts.push(`엘리베이터 대기 대략 한가 ${rule.low}분 · 보통 ${rule.high}분 · 피크 ${rule.peak}분`)
  if (peak?.peakSlots?.[0]) parts.push(`피크 예: ${peak.peakSlots[0]}`)
  return parts.join('. ')
}

export function formatBuildingAnswer(
  building: CampusBuildingProfile,
  options?: { now?: Date; crowdOnly?: boolean },
): string {
  const now = options?.now || new Date()
  const crowd = formatHourlyCrowdTable(building.name, now)

  if (options?.crowdOnly && crowd) {
    return (
      crowd
      + `\n\n참고: ${building.busyHint}`
      + '\n더 자세한 시설은 「본부동 정보」로 물어보세요.'
    )
  }

  const offices = officesInBuilding(building.name)
  const elev = elevatorHintFor(building.name)
  const lines = [
    `【${building.name}】`,
    building.summary,
    '',
    `· 층: ${building.floors}`,
    `· 휴게·학습: ${building.lounges.join(' · ') || '로비·복도'}`,
    `· 편의·시설: ${building.facilities.join(' · ')}`,
  ]
  if (offices.length) {
    lines.push(`· 학부사무실: ${offices.slice(0, 4).join(' · ')}${offices.length > 4 ? ' 외' : ''}`)
  }
  lines.push(`· 붐빔: ${building.busyHint}`)
  if (elev) lines.push(`· ${elev}`)
  if (building.tips?.length) lines.push(`· 팁: ${building.tips.join(' / ')}`)
  if (crowd) {
    lines.push('', crowd)
  }
  lines.push('', '이동 시간이 궁금하면 「진리관에서 본부동까지」「뛰어가면?」「비 오면?」처럼 물어보세요.')
  return lines.join('\n')
}

/** GPT 근거용 짧은 블록 */
export function campusBuildingsContextBlock(): string {
  return [
    '[캠퍼스 건물]',
    ...CAMPUS_BUILDINGS.map((b) => {
      const walk = Object.entries(CAMPUS_WALK_MINUTES[b.name] || {})
        .map(([to, m]) => `${to}${m}분`)
        .slice(0, 4)
        .join(', ')
      return `${b.name}(${b.id}): ${b.floors}; 휴게 ${b.lounges[0] || '-'}; 시설 ${b.facilities.slice(0, 2).join(',')}; 이동 ${walk || '표 참고'}`
    }),
  ].join('\n')
}
