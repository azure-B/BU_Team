# 월간·주간 일정 JSX 변환 및 공통 디자인 적용

- 일시: 2026-10-03
- 영역: Front

## 변경 요약

- `Front/designs/schedule-monthly.html`, `schedule-weekly.html`의 메인 콘텐츠를 월간·주간 React 컴포넌트로 변환했다.
- 두 원본의 독립 상단·하단바 대신 메인 페이지의 `Layout`, `Header`, `Footer`를 재사용한다. 페이지 폭, 카드, 색상, 폰트, 둥근 모서리와 여백은 메인 디자인 토큰을 따른다.
- 하단 `일정` 메뉴는 마지막으로 본 월간·주간 화면으로 연결하고, 홈·일정·마이페이지(`MY`) 및 헤더 설정(`GearSix`)과의 라우팅 상호 연동을 복원 및 통합했다.
- `+` 옆 월간 달력 아이콘은 월간 화면, 시계 아이콘은 주간 화면으로 전환한다.
- 마지막 보기와 선택 날짜, 추가한 개인 일정은 `localStorage`의 `baekseok.schedule.v1`에 저장하여 재진입·새로고침 시 복원한다. 저장소 접근이 제한되면 현재 세션 상태는 유지한다.
- 월·주 이동, 날짜 선택, 날짜별 상세, 학기 내 수업 반복과 개인 일정 추가 모달을 구현했다. 달력 표시와 주간 시간표는 공통 일정 데이터를 사용한다.
- 원본은 정적 예시 화면이다. 최초 진입은 원본과 같이 2026-09-17의 주간 화면으로 시작한다. 두 원본에서 달랐던 목요일 수업 시간은 월간 상세 및 메인 대시보드의 자료구조 10:00–11:30, 인공지능 15:00–16:30으로 통일했다.

## 변경 파일

- `Front/src/pages/SchedulePage.jsx`
- `Front/src/pages/SchedulePage.css`
- `Front/src/pages/ScheduleMonthlyPage.jsx`
- `Front/src/pages/ScheduleWeeklyPage.jsx`
- `Front/src/components/schedule/ScheduleContext.jsx`
- `Front/src/components/schedule/ScheduleDetails.jsx`
- `Front/src/components/schedule/scheduleModel.js`
- `Front/src/components/schedule/scheduleModel.test.js`
- `Front/src/components/layout/Footer/Footer.jsx`
- `Front/src/components/layout/Header/Header.jsx`
- `Front/src/App.jsx`
- `Front/package.json`
- `Front/publish/index.html` 및 빌드로 생성한 최신 CSS·JS 번들 (`index-BS35FX6J.css`, `index-Bwhwc7sk.js`)
- `md/folder.md`

## 사용 API

- 없음. HTML 원본의 예시 데이터를 사용하고 개인 일정은 브라우저에 저장한다.

## 검증

- `npm run test:schedule`: 보기·날짜 복원, 추가 일정 보존, 손상된 저장 값, 저장소 제한, 월말·윤년·연도 경계, 월간 5·6주 표시, 주 범위·주차 및 학기 수업 반복 검증 9건 통과.
- `npm run build`: 프로덕션 클린 번들 생성 완료 (`publish/assets/index-BS35FX6J.css`, `publish/assets/index-Bwhwc7sk.js`).
- 전역 라우팅 연결 검증: `/`, `/home`, `/schedule`, `/schedule/:view`, `/mypage`, `/setting` 상호 전환 구성 확인.
