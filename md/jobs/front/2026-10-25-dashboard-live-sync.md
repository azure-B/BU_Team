# [2026.10.25] 홈 대시보드 실데이터 연동

## 요약
- CLASS 일정을 **요일 템플릿**으로 오늘에 투영 → 오늘 일정/다음 수업이 실제 시간표와 맞춤
- 과제 Top3·건물·동선·공지를 하드코딩 대신 API 연동
- 과제 조회 API는 optional auth (토큰 없이도 mocked_user_id)

## 사용 API
| 엔드포인트 | 용도 |
|------------|------|
| `GET /api/schedules` | 전체 일정 → 프론트 요일 투영 |
| `GET /api/tasks/today/recommendations` | 우선순위 Top 3 |
| `GET /api/campus/buildings` | 건물명 표시 |
| `POST /api/campus/route/lateness` | 학생회관→수업 건물 동선 |
| `GET /api/notices` | 주요 공지 |
| `GET /api/dashboard/today` | 인사말·오늘 수업 수 |

## 변경 파일
| 파일 | 내용 |
|------|------|
| `Front/src/utils/todaySchedules.js` | 요일 투영·다음 수업 선택 |
| `Front/src/components/dashboard/DashboardSections.jsx` | 카드별 실데이터 연동 |
| `Front/src/pages/HomePage.jsx` | 대시보드 greeting 연동 |
| `Front/src/api/dashboardApi.js` | `getBuildings` |
| `Back/src/services/dashboard.service.ts` | 오늘 투영·공지·건물명 |
| `Back/src/routes/tasks.routes.ts` | 조회 optional auth |
