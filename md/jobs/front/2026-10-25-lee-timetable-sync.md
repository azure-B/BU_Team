# [2026.10.25] 이승빈 실제 시간표 DB 연동

## 작업 개요
- Course 테이블과 요일·강의실·시간을 대조해 이승빈(`mocked_user_id`) Schedule 8건 삽입
- 서버 CLASS 일정을 주간 시간표 `courses`로 동기화

## 대조 결과
| 수업 | Course code | 시간 | 강의실 |
|------|-------------|------|--------|
| 프런티어십(기업가정신) | 3174401 | 월 09:00-09:50 | 본부502 |
| 채플과 섬김 | 0851701 | 월 11:00-11:50 | 백석홀대강당 |
| 인공지능 | 0957601 | 화 10:00-12:50 | 본부514 |
| 머신러닝이론 및 실습 | 0994601 | 화 13:00-16:50 | 본부210 |
| OpenCV프로그래밍 | 0685501 | 수 15:00-17:50 | 본부505 |
| 선형대수학 | 0449402 | 목 09:00-11:50 | 본부513 |
| 캡스톤디자인 | 0623902 | 목 13:00-14:50 | 본부515 |
| 사람다운 사람의 길 | 0770858 | 목 15:00-15:50 | 목양B101 |

## 사용 API
- `GET /api/schedules`

## 변경 파일
| 파일 | 변경 내용 |
|------|-----------|
| `Front/src/components/schedule/ScheduleContext.jsx` | CLASS → 주간 courses 매핑, 수업별 색상 |
| `Front/src/pages/ScheduleWeeklyPage.jsx` | 정각 스냅 표시, 강의실 표기, 글자 잘림 완화 |
| `Front/src/pages/SchedulePage.css` | 시간표 블록 스타일·색상 팔레트 |
| `Front/src/components/schedule/ScheduleDetails.jsx` | 주차별 기간 표시·해당 주 과제만 노출,「매주 반복」제거 |
| `Back/src/routes/schedules.routes.ts` | 조회용 optional auth |
| `Back/src/middlewares/optional-auth.middleware.ts` | 토큰 없으면 mocked_user_id |
