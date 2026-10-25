# [2026.10.25] 챗봇 일정: 벽시계 시각 + 개인/WEEKLY 타입

## 문제
- `toISOString()` UTC가 DB(timestamp w/o tz)에 들어가 13:00 → 04:00, 16:00 → 07:00으로 표시
- 스터디·약속 등이 `type=CLASS`로 저장되어 시간표에 「전공」수업으로 보임

## 변경
- `schedule.service` — 한국 벽시계 naive datetime 저장 (`toDbTimestamp`)
- `scheduleIntent` — 챗봇 등록은 `PERSONAL` / `WEEKLY` / `TASK` (수업 명시만 `CLASS`)
- 명시된 `HH:MM`은 로컬 파싱 우선 (GPT UTC 오추출 방지)
- GPT 슬롯 프롬프트: 로컬 24시·매주만 repeatWeekly

## 파일
- `Back/src/services/schedule.service.ts`
- `Back/src/services/chat/scheduleIntent.ts`
- `Back/src/services/chat/llm.ts`
- `Back/src/services/dashboard.service.ts` (`WEEKLY` 요일 투영)
