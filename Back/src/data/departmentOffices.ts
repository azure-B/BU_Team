/**
 * 학부사무실 위치·연락처 (로컬 FAQ)
 * 출처: https://www.bu.ac.kr/bbs/web/1692/38305/artclView.do
 */
export type DepartmentOffice = {
  department: string
  aliases: string[]
  building: string
  room: string
  phones: string[]
  source_url: string
  review_note?: string
}

const SOURCE = 'https://www.bu.ac.kr/bbs/web/1692/38305/artclView.do'

export let DEPARTMENT_OFFICES: DepartmentOffice[] = [
  { department: '기독교학부', aliases: ['기독교', '신학'], building: '목양관', room: '103호', phones: ['041-550-2402', '041-550-2547', '041-550-2548'], source_url: SOURCE },
  { department: '경찰학부', aliases: ['경찰', '경행'], building: '본부동', room: '715호', phones: ['041-550-9157', '041-550-2327'], source_url: SOURCE },
  { department: '경상학부', aliases: ['경상', '경영'], building: '지혜관', room: '609호', phones: ['041-550-9173', '041-550-9174', '041-550-2488'], source_url: SOURCE },
  { department: '관광학부', aliases: ['관광', '항공서비스'], building: '본부동', room: '411호', phones: ['041-550-2888'], source_url: SOURCE },
  { department: '어문학부', aliases: ['어문', '영어', '일본어'], building: '본부동', room: '411호', phones: ['041-550-9148', '041-550-9149', '041-550-2888'], source_url: SOURCE },
  { department: '간호학과', aliases: ['간호'], building: '조형관', room: '618호', phones: ['041-550-2151', '041-550-2162', '041-550-2319'], source_url: SOURCE },
  { department: '보건학부', aliases: ['보건'], building: '조형관', room: '618호', phones: ['041-550-2827', '041-550-2163', '041-550-2343'], source_url: SOURCE, review_note: "원문 '041-2995-2827' 오기 → 2827" },
  { department: '디자인영상학부', aliases: ['디자인', '영상'], building: '조형관', room: '309호', phones: ['041-550-2713', '041-550-2714', '041-550-2715'], source_url: SOURCE },
  { department: '문화예술학부', aliases: ['문예', '실용음악', '뮤지컬'], building: '예술대학동', room: '105호', phones: ['041-550-2941', '041-550-2942', '041-550-2945'], source_url: SOURCE },
  { department: '사회복지학부', aliases: ['사복', '사회복지'], building: '진리관', room: '302호', phones: ['041-550-0541', '041-550-2597'], source_url: SOURCE },
  { department: '사범학부', aliases: ['사범', '교육과'], building: '본부동', room: '601호', phones: ['041-550-9087', '041-550-9088', '041-550-9152'], source_url: SOURCE },
  { department: '스포츠과학부', aliases: ['스포츠', '체육'], building: '체육관', room: '302호', phones: ['041-550-2107', '041-550-2108'], source_url: SOURCE },
  { department: '첨단IT학부', aliases: ['첨단IT', '첨단아이티'], building: '본부동', room: '716호', phones: ['041-550-9176'], source_url: SOURCE },
  { department: '컴퓨터공학부', aliases: ['컴공', '컴퓨터공학과', '컴퓨터'], building: '본부동', room: '716호', phones: ['041-550-9176', '041-550-2514', '041-550-2515'], source_url: SOURCE },
  { department: '혁신융합학부', aliases: ['혁신융합'], building: '본부동', room: '715호', phones: ['041-550-0829'], source_url: SOURCE },
]

export function findDepartmentOffice(text: string, fallbackDepartment?: string | null): DepartmentOffice | null {
  const q = String(text || '')
  const ranked = DEPARTMENT_OFFICES
    .map((o) => {
      const names = [o.department, ...o.aliases]
      const hit = names.find((n) => n && q.includes(n))
      return hit ? { o, len: hit.length } : null
    })
    .filter(Boolean) as { o: DepartmentOffice; len: number }[]
  ranked.sort((a, b) => b.len - a.len)
  if (ranked[0]) return ranked[0].o

  if (fallbackDepartment) {
    const fb = DEPARTMENT_OFFICES.find(
      (o) => o.department === fallbackDepartment
        || o.aliases.includes(fallbackDepartment)
        || fallbackDepartment.includes(o.department.replace(/학부|학과/g, '')),
    )
    if (fb) return fb
  }
  return null
}

export let DEPARTMENT_CHOICES = DEPARTMENT_OFFICES.map((o) => o.department)

export function setDepartmentOffices(list: DepartmentOffice[]) {
  DEPARTMENT_OFFICES = list
  DEPARTMENT_CHOICES = list.map((o) => o.department)
}
