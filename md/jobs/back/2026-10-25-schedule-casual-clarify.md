# [2026.10.25] 캐주얼 일정 발화 → 시간 선택·등록

## 변경
- 「목요일에 친구들이랑 밥먹기로 함」처럼 등록 요청 없이도 일정 후보로 인식
- 시간 없으면 `need_clarify` + 점심/저녁 등 선택지(`choices`)
- GPT 슬롯 추출 실패 시 로컬 휴리스틱 병합
- 학사 FAQ로 빠지지 않도록 시스템 프롬프트에 개인 일정 예외

## 파일
- `Back/src/services/chat/scheduleIntent.ts`
- `Back/src/services/chat/llm.ts`
- `Back/src/services/chat/systemPrompt.ts`
- `Back/src/services/chat/router.ts`

## API
- `POST /api/chat` — `route=schedule`, `choices`, `scheduleAction.status=need_clarify|created|…`
