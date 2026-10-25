# [2026.10.25] 비서 일정 등록 후 시간표 동기화

## 변경
- `POST /api/chat` 응답 `scheduleAction.status === created`이면 `syncServerSchedules()`
- 추천 질문 풀에 「매주 화 4~5시 스터디 등록」추가

## 파일
- `Front/src/components/layout/Footer/Footer.jsx`

## 사용 API
- `POST /api/chat`
- `GET /api/schedules` (동기화)
