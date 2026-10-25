# [2026.10.25] 다음 수업 없을 때 — 수업 끝난 뒤 추천

## 변경
- 오늘 남은 수업이 없으면 `analyzeDayWrapActivity`로 밥·과제·사이버강의·캠퍼스 활동 유도
- 카드 제목: 「수업 끝난 뒤 추천」 / 「다른 코스 추천」 유지
- 수업 중·후속 수업 없음: 「끝나면 밥·과제·사이버강의 추천」 문구
- 조기종료 카드: 다음 수업 없어도 표시 → day-wrap으로 연결

## 파일
- `Front/src/utils/gapActivities.js` (`analyzeDayWrapActivity`)
- `Front/src/components/dashboard/DashboardSections.jsx`

## 사용 API
- `GET /api/schedules`, `GET /api/tasks`, `GET /api/campus/buildings`, `GET /api/campus/facilities`
