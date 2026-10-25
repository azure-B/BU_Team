# [2026.10.25] 개인·WEEKLY 일정 표시

## 변경
- 서버 `PERSONAL`/`WEEKLY` → 이벤트 `kind: personal`, 배지 「개인 일정」
- `WEEKLY`는 `repeatWeekly`로 요일 반복 표시 (`eventsForDate`)
- `todaySchedules` 투영에 `WEEKLY` 포함
- 로컬 스토리지 이벤트 kind에 `personal` 허용

## 파일
- `Front/src/components/schedule/ScheduleContext.jsx`
- `Front/src/components/schedule/ScheduleDetails.jsx`
- `Front/src/components/schedule/scheduleModel.js`
- `Front/src/utils/todaySchedules.js`

## 사용 API
- `GET /api/schedules`
- `POST /api/chat` (일정 등록 후 동기화)
