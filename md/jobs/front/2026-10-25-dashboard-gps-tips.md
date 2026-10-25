# [2026.10.25] 대시보드 GPS 도보·상황별 출발 멘트

## 변경
- 다음 수업 카드: 브라우저 GPS → `POST /campus/route/lateness`
- 표기 `현재 위치에서 도보 약 N분` (학생회관 고정 문구 제거)
- 엘리베이터 반영 권장 도착·상황별 highlight/sub 멘트 표시 (말줄임·title로 overflow 대응)
- 카카오 지도 UI는 노출하지 않음 (서버에서만 도보 API)

## 사용 API
| Method | Path | 용도 |
|--------|------|------|
| POST | `/api/campus/route/lateness` | GPS·도보·엘리베이터·멘트 |

## 파일
- `Front/src/components/dashboard/DashboardSections.jsx`
- `Front/src/components/dashboard/DashboardSections.css`
- `Front/src/api/dashboardApi.js`
