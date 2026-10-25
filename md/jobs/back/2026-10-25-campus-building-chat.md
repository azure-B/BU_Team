# [2026.10.25] 챗봇 캠퍼스 건물·이동 안내

## 변경
- 건물별 섹션: 층·휴게·시설·학부사무실·붐빔·엘리베이터 힌트
- 「진리관에서 본부동까지」→ CampusEdge 기준 도보분
- 「뛰어가면」≈ 도보 60% 시간, 「비 오면」= walk-speed 비 배율
- route `campus`, GPT 근거에 건물 블록 포함

## 파일
- `Back/src/data/campusBuildings.ts` (신규)
- `Back/src/services/chat/campusIntent.ts` (신규)
- `Back/src/services/chat/router.ts`
- `Back/scripts/smoke-campus-chat.mjs`
