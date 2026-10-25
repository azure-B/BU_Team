# [2026.10.25] 일정 시각 분 단위·구간 표현

## 변경
- `parseTimeLocal`: `12시 30분부터 15시까지`, `12:30~15:00`, `시 반`, `오후 2시 30분부터 4시` 등 사용자 표기 그대로 반영 (1시간 강제 금지)
- 끝 시각 없을 때만 +1시간 (12:30 → 13:30)
- GPT 슬롯 프롬프트: 분 단위·부터/까지 명시

## 파일
- `Back/src/services/chat/scheduleIntent.ts`
- `Back/src/services/chat/llm.ts`
