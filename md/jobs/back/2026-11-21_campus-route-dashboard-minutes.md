# 캠퍼스 경로 시간을 대시보드 CampusEdge 기준으로 통일

- 일시: 2026-11-21
- 영역: Back + Front
- API: `POST /api/campus/map/route`
- 요청: 건물 선택 시 `buildingId`/`name` 전달
- 시간·거리: `CAMPUS_WALK_MINUTES` 우선 (지혜관↔본부동 5분 → 250m@50m/min). 표에 없으면 OSRM/카카오 ETA ×3
- geometry는 기존 폴백(카카오→OSRM→직선) 유지
- 변경 파일: `campus-map.service.ts`, `campus.validation.ts`, `campusMapApi.js`, `CampusMapPreviewPage.jsx`, `md/API/README.md`
