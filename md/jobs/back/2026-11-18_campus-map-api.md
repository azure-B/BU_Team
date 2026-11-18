# 캠퍼스 지도·도보 API 구현

- 일시: 2026-11-18
- 영역: Back
- 새 API: `GET /api/campus/map/config`, `POST /api/campus/map/route` (`/api/v1` 별칭 지원).
- 지도 설정은 JavaScript 키만 클라이언트에 제공한다. REST 키는 서버 내부에 유지한다.
- 실제 도보 상세 응답의 거리·초 단위 시간·경도/위도 배열을 검증하고 `{ lat, lng }` 경로로 변환한다. 미설정·권한·한도·경로 없음·통신 실패를 분리하며 가짜 경로를 반환하지 않는다.
- 키와 GPS 좌표를 제외한 HTTP 상태·결과 코드 로그를 제공한다. 기존 채팅 시드·지각 ETA 로직은 유지한다.
- 변경 파일: `Back/src/services/campus-map.service.ts`, `Back/src/services/campus-map.service.test.ts`, `Back/src/controllers/campus.controller.ts`, `Back/src/routes/campus.routes.ts`, `Back/src/validations/campus.validation.ts`, `Back/.env.example`, `render.yaml`, `md/API/README.md`, `md/folder.md`.
- 검증: TypeScript 컴파일 및 테스트 11개 통과. 로컬 HTTP 설정 조회 200, 키 미설정 503, 잘못된 좌표 400 확인. 공급자 응답 테스트는 fixture fetch로 진행했으며 실제 카카오 서버 성공 검증과 구분한다.
- 로컬 `tsx` 실행 파일이 없어 컴파일 산출물을 무시되는 `.codex-local/backend-check`에 생성하여 테스트·서버 실행. 개발 백엔드 포트 5180, Front의 `/campus-api` 프록시 사용. 루트 `.env` 로딩 및 NODE_PATH를 실행 프로세스에서만 지정했다.
- 로컬 Supabase 조회는 fetch 실패로 확인됐다. 새 테이블·컬럼은 필요하지 않으며 DB 변경 없음. 프론트 건물 목록은 기존 `VITE_API_URL`의 배포 API를 사용한다.
- 미확인: Render 환경변수·호출 로그(로그인 필요), 실제 키·제휴 권한, 카카오 응답 성공. 배포·커밋·push는 실행하지 않았다.
