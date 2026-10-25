# [2026.10.25] 채팅 일정 자동 등록

## 동작
- 느슨한 의도 게이트 → GPT JSON 슬롯(`title`/`weekday`/`start`/`end`/`repeatWeekly`)
- 서버 검증 후 기존 `CLASS`와 요일·시간 겹치면 거절
- 통과 시 `createSchedule` — 매주=`CLASS`, 일회=`PERSONAL`

## 파일
- `Back/src/services/chat/scheduleIntent.ts`
- `Back/src/services/chat/llm.ts` (`extractScheduleSlots`)
- `Back/src/services/chat/router.ts`
- `Back/src/controllers/chat.controller.ts`
