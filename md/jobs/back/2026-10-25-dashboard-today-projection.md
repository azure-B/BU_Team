# [2026.10.25] 대시보드 오늘 일정 투영·과제 조회 optional auth

## 요약
- `GET /dashboard/today`: CLASS를 오늘 요일로 투영, 건물명·공지·우선순위 과제 포함
- `GET /tasks`, `GET /tasks/today/recommendations`: optional auth (데모용 mocked_user_id)

## 변경 파일
| 파일 | 내용 |
|------|------|
| `Back/src/services/dashboard.service.ts` | 오늘 투영·Building·Notice 조인 |
| `Back/src/routes/tasks.routes.ts` | 조회 optionalAuthenticate |
