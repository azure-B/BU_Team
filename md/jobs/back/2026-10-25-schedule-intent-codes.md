# [2026.10.25] 일정 의도 숫자 분류(0~3) + 조회

## 변경
- GPT가 **숫자 하나만** 출력해 의도 분류
  - `0` 무관 · `1` 조회 · `2` 등록 · `3` 애매
- `1` 조회: `Schedule` DB에서 해당 요일·시간 투영 후 안내, 비어 있으면 약속 등록 `choices`
- `2` 등록: 기존 슬롯 추출·충돌 검사·저장
- `3` 애매: 조회 vs 등록 선택지
- 「오늘 14시에 일정 있어?」가 등록 요일 선택으로 잘못 가지던 문제 수정

## 파일
- `Back/src/services/chat/llm.ts` (`classifyScheduleCode`)
- `Back/src/services/chat/scheduleIntent.ts`

## API
- `POST /api/chat` — `scheduleAction.status`에 `queried` 추가
