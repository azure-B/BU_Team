# [2026.10.25] 챗봇 개인 일정 주간 시간표 표시

## 문제
- AI 등록 `PERSONAL`/`WEEKLY`가 하단 목록에는 보이지만 주간 격자에 거의 안 보임
- `personal` 스타일·종료시각 미반영, 이벤트 z-index 없음

## 변경
- 서버 동기화 시 `endTime` 포함
- 주간 격자: 분 단위 시작·종료로 블록 배치, 최소 높이·청록 스타일
- 월간 점·상세 배지 `personal` 추가

## 파일
- `Front/src/components/schedule/ScheduleContext.jsx`
- `Front/src/pages/ScheduleWeeklyPage.jsx`
- `Front/src/pages/SchedulePage.css`
- `Front/src/pages/ScheduleMonthlyPage.jsx`
- `Front/src/components/schedule/ScheduleDetails.jsx`

## 사용 API
- `GET /api/schedules`
