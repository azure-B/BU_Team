# Git 변경 목록 및 배포 복구

- 일시: 2026-10-25
- 영역: Front / Git

## 원인

- 실제 저장소는 `AI-project/BU_Team`이지만 상위 `react_workspace`에도 커밋·원격 연결이 없는 Git 저장소가 있어 상위 `node_modules`와 다른 프로젝트가 IDE 변경 목록에 표시됐다.
- 실제 저장소는 원격 main보다 18개 커밋 뒤처져 있었으며, 로컬 레이아웃·알림 수정과 원격 변경이 겹쳐 pull이 중단됐다.

## 처리

- 로컬 변경을 보존용 커밋으로 기록하고 원격 main과 병합했다.
- 공통 라우트 레이아웃과 알림 배지를 유지하면서 원격의 지연 로딩, 데모 로그인, 실시간 API 알림, 일정 서버 연동 및 새 페이지를 함께 반영했다.
- 알림 데이터 조회 및 상태를 `NotificationProvider`로 이동하고 기존 읽음 ID 저장 형식을 유지했다.
- 최신 빌드를 `Front/publish`에 반영했다. 기존 산출물과 임시 빌드 폴더는 휴지통에 보관했다.
- 저장소 외부의 `AI-project/.vscode/settings.json`에 상위 저장소 제외 설정을 추가하고 `AI-project/BU_Team.code-workspace`를 생성했다. 상위 의존성과 다른 프로젝트 파일은 유지했다.

## 변경 파일

- `Front/src/App.jsx`
- `Front/src/components/layout/Header/{Header.jsx,Header.css,NotificationContext.jsx,NotificationPanel.jsx}`
- `Front/src/components/layout/Layout/Layout.jsx`
- `Front/src/pages/{HomePage,MyPage,SchedulePage,NotFoundPage,CampusPage,ChatStatsPage}.jsx`
- `Front/publish/index.html`, `Front/publish/assets/*`
- `md/folder.md`

## 사용 API

- `POST /api/auth/login` — 기존 데모 로그인 유지
- `GET /api/schedules`, `GET /api/tasks`, `GET /api/notices` — 기존 실시간 알림 조회 유지
- `POST /api/schedules`, `DELETE /api/schedules/:id` — 원격 일정 서버 연동 유지

## 검증

- `npm --prefix Front run test:schedule`: 26건 통과
- `npm --prefix Back run build`: 통과
- Front Vite production build: 통과 (`VITE_API_URL=https://bu-team.onrender.com/api`)
- HTML의 빌드 자산 참조 5개, 실제 자산 파일 일치 및 production API 주소 검증: 통과
- `node_modules`가 실제 저장소에서 추적되지 않고 ignore되는 것을 확인
