/**
 * 이승빈(mocked_user_id) 수강 과목별 주간 과제 시드
 * 사용: node scripts/seed-lee-tasks.mjs  (Back 폴더에서, 루트 .env 필요)
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const envText = readFileSync(resolve(root, '.env'), 'utf8')
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line && !line.trimStart().startsWith('#') && line.includes('='))
    .map((line) => {
      const i = line.indexOf('=')
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()]
    }),
)

const SUPABASE_URL = env.SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !KEY) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요')
  process.exit(1)
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=representation',
}

const USER = 'mocked_user_id'

/** 2026-2학기 개강 이후 ~ 현재(10월 말) 주차 마감(금 23:59) */
const WEEKS = [
  { n: 1, due: '2026-09-05T23:59:00+09:00' },
  { n: 2, due: '2026-09-12T23:59:00+09:00' },
  { n: 3, due: '2026-09-19T23:59:00+09:00' },
  { n: 4, due: '2026-09-26T23:59:00+09:00' },
  { n: 5, due: '2026-10-02T23:59:00+09:00' },
  { n: 6, due: '2026-10-10T23:59:00+09:00' },
  { n: 7, due: '2026-10-17T23:59:00+09:00' },
  { n: 8, due: '2026-10-24T23:59:00+09:00' },
  { n: 9, due: '2026-10-31T23:59:00+09:00' },
]

function statusForWeek(n) {
  if (n <= 7) return 'COMPLETED'
  if (n === 8) return 'IN_PROGRESS'
  return 'PENDING'
}

/** scheduleId → 수업명(Schedule title에서 강의실 괄호 제거한 값과 동일) + 주차별 과제 */
const COURSE_WEEKLY = {
  'sch-3174401': {
    course: '프런티어십(기업가정신)',
    importance: 3,
    titles: [
      '1주차: 창업 동기·문제의식 1페이지 브리프',
      '2주차: 고객 페르소나 3인 정의',
      '3주차: 문제-해결 가설 린캔버스 초안',
      '4주차: 경쟁사·유사서비스 벤치마킹 표',
      '5주차: 가치제안(Value Proposition) 문장화',
      '6주차: 비즈니스 모델 수익구조 스케치',
      '7주차: 피치 스토리보드(5장)',
      '8주차: 중간 피치 대본·피드백 반영본',
      '9주차: MVP 기능 우선순위 MoSCoW',
    ],
  },
  'sch-0851701': {
    course: '채플과 섬김',
    importance: 2,
    titles: [
      '1주차: 채플 소감문 (예배 주제 중심)',
      '2주차: 섬김 실천 일지 1회',
      '3주차: 공동체 섬김 사례 조사 요약',
      '4주차: 자기성찰 저널 (감사·회개)',
      '5주차: 채플 메시지 핵심 3문장 정리',
      '6주차: 봉사 활동 계획서(개인/팀)',
      '7주차: 섬김 실천 일지 2회',
      '8주차: 중간 성찰 에세이(800자)',
      '9주차: 이웃 돌봄 실천 체크리스트',
    ],
  },
  'sch-0957601': {
    course: '인공지능',
    importance: 5,
    titles: [
      '1주차: AI 개념·역사 타임라인 정리',
      '2주차: 상태공간 탐색(BFS/DFS) 연습문제',
      '3주차: 휴리스틱·A* 경로 찾기 보고서',
      '4주차: 지식표현(규칙/온톨로지) 예시 작성',
      '5주차: 지도학습 vs 비지도학습 비교표',
      '6주차: 퍼셉트론·손실함수 손계산 과제',
      '7주차: 단순 분류기 실험 노트북 제출',
      '8주차: 중간고사 대비 오답·개념 노트',
      '9주차: CNN 구조 도식화·하이퍼파라미터 메모',
    ],
  },
  'sch-0994601': {
    course: '머신러닝이론 및 실습',
    importance: 5,
    titles: [
      '1주차: NumPy/Pandas 전처리 실습 리포트',
      '2주차: 선형회귀 구현·잔차 분석',
      '3주차: 로지스틱 회귀 분류 실습',
      '4주차: 교차검증·정규화(L1/L2) 비교',
      '5주차: 결정트리·랜덤포레스트 실험',
      '6주차: SVM 커널별 성능 비교',
      '7주차: K-means 클러스터링 시각화',
      '8주차: PCA 차원축소 중간 리포트',
      '9주차: 전처리~모델 파이프라인 초안',
    ],
  },
  'sch-0685501': {
    course: 'OpenCV프로그래밍',
    importance: 4,
    titles: [
      '1주차: OpenCV 환경설정·이미지 입출력',
      '2주차: 색공간 변환·히스토그램 실습',
      '3주차: 블러·샤프닝 필터 비교',
      '4주차: Canny 엣지·이진화 과제',
      '5주차: 컨투어 검출·도형 면적 계산',
      '6주차: ORB 특징점 매칭 예제',
      '7주차: Haar/HOG 객체검출 기초',
      '8주차: 영상 추적(Meanshift) 데모',
      '9주차: 미니프로젝트 주제·데이터 제안서',
    ],
  },
  'sch-0449402': {
    course: '선형대수학',
    importance: 4,
    titles: [
      '1주차: 행렬 연산·역행렬 연습문제',
      '2주차: 가우스 소거법으로 연립방정식',
      '3주차: 벡터공간·부분공간 예제',
      '4주차: 기저·차원·좌표변환 과제',
      '5주차: 행렬식·크라메르 공식 연습',
      '6주차: 고유값·고유벡터 계산 세트',
      '7주차: 그람-슈미트 직교화 실습',
      '8주차: 최소제곱법 응용 문제',
      '9주차: SVD 개념 예습·요약 노트',
    ],
  },
  'sch-0623902': {
    course: '캡스톤디자인',
    importance: 5,
    titles: [
      '1주차: 팀 구성·주제 제안서(1페이지)',
      '2주차: 사용자 요구사항 명세서(초안)',
      '3주차: 시스템 아키텍처 다이어그램',
      '4주차: 스프린트1 진행 주간보고',
      '5주차: UI 와이어프레임·화면 흐름',
      '6주차: 중간 데모 시나리오 작성',
      '7주차: 테스트 계획·이슈 트래킹 정리',
      '8주차: 중간발표 슬라이드·시연 체크',
      '9주차: 핵심 기능 구현 체크리스트',
    ],
  },
  'sch-0770858': {
    course: '사람다운 사람의 길',
    importance: 2,
    titles: [
      '1주차: ‘사람다움’ 주제 자유 에세이',
      '2주차: 지정 독서 노트(핵심 인용 3)',
      '3주차: 일상 윤리 딜레마 사례 분석',
      '4주차: 배려·공감 실천 일지',
      '5주차: 토론 질문지 작성(팀)',
      '6주차: 영화/다큐 감상문(인성 관점)',
      '7주차: 자기이해 워크시트 제출',
      '8주차: 중간 성찰 포트폴리오 정리',
      '9주차: 공동체 기여 계획 한 장',
    ],
  },
}

const tasks = []
for (const [scheduleId, meta] of Object.entries(COURSE_WEEKLY)) {
  for (const week of WEEKS) {
    const weekTitle = meta.titles[week.n - 1]
    const id = `task-lee-${scheduleId.replace('sch-', '')}-w${String(week.n).padStart(2, '0')}`
    tasks.push({
      id,
      userId: USER,
      title: `${meta.course} · ${weekTitle}`,
      dueAt: week.due,
      importance: meta.importance,
      status: statusForWeek(week.n),
    })
  }
}

async function upsert(batch) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/Task?on_conflict=id`, {
    method: 'POST',
    headers,
    body: JSON.stringify(batch),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${text}`)
  return text ? JSON.parse(text) : []
}

const chunk = 40
let saved = 0
for (let i = 0; i < tasks.length; i += chunk) {
  const part = tasks.slice(i, i + chunk)
  const rows = await upsert(part)
  saved += Array.isArray(rows) ? rows.length : part.length
  console.log(`upsert ${i + 1}–${i + part.length}`)
}
console.log(`완료: ${saved}건 (요청 ${tasks.length}건)`)
