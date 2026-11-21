# 캠퍼스 도보 경로 OSRM/직선 폴백

- 일시: 2026-11-21
- 영역: Back (+ Front 라벨)
- API: `POST /api/campus/map/route`
- 원인: 카카오 도보 제휴 API가 REST 키에 `403 permission denied` → 기존 503
- 수정: 카카오 제휴 성공 시 그대로 사용, 실패·미설정 시 OSRM foot, 최종 직선(haversine·캠퍼스 50m/min)
- `GET /map/config`의 `walkingConfigured`는 항상 true, `kakaoWalkingConfigured`로 제휴 키 여부 표시
- 변경 파일: `Back/src/services/campus-map.service.ts`, `campus-map.service.test.ts`, `Front/src/pages/CampusMapPreviewPage.jsx`, `md/API/README.md`
