# [2026.10.25] 헤더 시각·계정 컨트롤 + 데모 문구 제거

## 변경
- 인사말 아래 `데모 account=N · …` 텍스트 제거
- `DemoControls` 추가: 시각(`type=time`)·실시간·계정 select
  - 변경 시 `?time=` / `?account=` 반영 후 새로고침
- 과목명은 Course 시드와 맞춤 (백엔드 시드 재실행 필요)

## 파일
- `Front/src/components/dashboard/DemoControls.jsx`
- `Front/src/components/dashboard/DemoControls.css`
- `Front/src/pages/HomePage.jsx`
- `Front/src/pages/HomePage.css`
- `Front/src/data/demoAccounts.js`
- `Front/src/utils/courseCategory.js` (채플과 섬김 교양 판별)
