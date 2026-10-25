# [2026.10.25] 데모 GPS 위치 전환 (진리관·본부동·실제위치)

## 변경
- 헤더 DemoControls에 위치 버튼 3개 추가
  - 진리관 / 본부동 / 실제위치
- `demoGps.js`: sessionStorage + `?gps=truth|hq|live`
- `readCurrentPosition`이 오버라이드 좌표 우선 사용
- 카드들이 `bu-demo-gps` 이벤트로 즉시 재평가

## 파일
- `Front/src/utils/demoGps.js`
- `Front/src/components/dashboard/DemoControls.jsx`
- `Front/src/components/dashboard/DemoControls.css`
- `Front/src/components/dashboard/DashboardSections.jsx`
- `Front/src/utils/campusRouteTimes.js`
