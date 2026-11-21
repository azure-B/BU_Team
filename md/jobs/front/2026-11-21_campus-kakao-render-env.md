# 캠퍼스 카카오 API → Render env 통일

- 일시: 2026-11-21
- 영역: Front (Back 주석만)
- 사용 API: `GET /api/campus/map/config`, `POST /api/campus/map/route`, `GET /api/campus/buildings`
- 원인: DEV에서만 `/campus-api` → localhost:5180으로 분리되어 Render에 설정된 `KAKAO_*` env를 타지 않음
- 수정: `campusMapApi.js`가 건물 API와 같이 `VITE_API_URL`(배포/로컬 공통 axios)만 사용. Vite `/campus-api` 프록시 제거
- 서버 키: 지도 SDK=`KAKAO_JAVASCRIPT_KEY`, 도보=`KAKAO_REST_API_KEY` (render.yaml·루트 .env)
- 변경 파일: `Front/src/api/campusMapApi.js`, `Front/vite.config.js`, `Back/src/services/campus-map.service.ts`, `md/folder.md`
