# [2026.10.25] AI 비서 대화 유지 + 삭제 동기화

## 변경
- 대화·AI 연결 상태를 `localStorage`(`baekseok.assistant.chat.v1`)에 저장 → 닫았다 열어도 유지
- 휴지통 버튼으로 대화 내역 수동 삭제
- `scheduleAction.status === deleted` 시 `syncServerSchedules()`

## 파일
- `Front/src/components/layout/Footer/Footer.jsx`

## 사용 API
- `POST /api/chat`
- `GET /api/schedules`
