# [2026.10.13] 대시보드 공지를 API 데이터로 교체

## 작업 개요
- 주요 공지사항 하드코딩을 제거하고 `GET /notices` 결과로 표시
- 항목을 누르면 백석대 원문 공지로 이동

## 사용 API
- `GET /notices?limit=8`

## 변경 파일
| 파일 | 변경 내용 |
|------|-----------|
| `Front/src/api/dashboardApi.js` | `getNotices` |
| `Front/src/components/dashboard/DashboardSections.jsx` | NoticeList가 API 공지를 렌더 |
| `Front/src/components/dashboard/DashboardSections.css` | 공지 링크 밑줄 제거 |
