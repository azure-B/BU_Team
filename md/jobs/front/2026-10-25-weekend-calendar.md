# 주간 캘린더 토·일 표시 및 주말 빈 일정 문구

## 요약
- 주간 시간표 초기 접근: 오늘 토·일이면 주말 표시, 평일이면 미표시
- 캘린더 하단 「주말 표시 / 주말 미표시」 슬라이딩 토글(백석 블루)
- 토·일 flex 슬라이드(`--weekend-grow`)로 월~금 너비·블록 글씨 동기 애니메이션
- 주말에 일정이 없을 때 고정 "일정 없음" 대신 주말 문구 5종 중 랜덤 표시(블루 테마·애니메이션)

## 변경 파일
| 파일 | 변경 내용 |
|------|-----------|
| `Front/src/pages/ScheduleWeeklyPage.jsx` | 주말 표시/미표시 버튼, 오늘 기준 자동 초기값 |
| `Front/src/components/schedule/scheduleModel.js` | `weekDates` 기본 length 7 |
| `Front/src/components/schedule/ScheduleDetails.jsx` | 주말 빈 일정 랜덤 문구 + 부드러운 등장 애니메이션 |
| `Front/src/pages/SchedulePage.css` | 하단 주말 토글·빈 일정 백석 블루 테마 |
| `Front/src/components/schedule/scheduleModel.test.js` | 7일 주간 기대값 반영 |
