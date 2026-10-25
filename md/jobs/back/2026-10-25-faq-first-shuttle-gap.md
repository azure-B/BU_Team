# FAQ 우선·셔틀·공강 라우팅

날짜: 2026-10-25

## 변경
- `router.ts`: 캠퍼스 → 셔틀 → 공강(gap) → **FAQ** → 공지/일정 순으로 변경
- `noticeIntent.ts`: 병결·휴학 키워드 제거, 토큰 미겹치면 점수 0, 빈 결과 「관련 공지 없음」
- `scheduleIntent.ts`: 공지 RE에서 병결 제거, 공강·병결은 일정 후보 제외
- `shuttleTimetable.ts` + `shuttleIntent.ts`: 두정역·교대 시드, 다음 차·1교시 지각 연결, 문의는 학생처
- `gapIntent.ts`: 「다음 수업 전에 뭐하지」→ 홈 공강 추천 안내
- `faqSeeds.ts`: 학식 FAQ 추가
- `llm.ts` 분류 프롬프트: 휴학·병결 절차는 0(공지 아님)
- 응답에 `sentContext`, route `shuttle`|`gap` 추가

## API
- `POST /api/v1/chat` — md/API/README.md 갱신
