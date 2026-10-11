# [2026.10.11] 대시보드 화면 백엔드 DB API 연동 작업

## 작업 개요
- 프론트엔드 대시보드 화면의 하드코딩 더미 데이터를 실제 백엔드 DB 연동 데이터로 교체
- 백엔드에 구축된 백석대 실제 시간표(Schedule), 과제(Task Top 3 우선순위) 데이터가 대시보드 화면에 실시간으로 표시되도록 연동
- 학번 기반 실제 로그인 인증 연동 (`LoginPage` ↔ `/api/v1/auth/login`) 구현 및 세션 유지

---

## 사용된 백엔드 API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/api/v1/auth/login` | 학번/비밀번호 로그인 및 JWT 토큰/유저 정보 수신 |
| `GET` | `/api/v1/schedules` | 날짜 범위(`from`, `to`) 기준 오늘 수업/일정 조회 |
| `GET` | `/api/v1/tasks/today/recommendations` | 조장님 모듈 기반 긴급도/중요도 가중 Top 3 마감 과제 조회 |
| `POST` | `/api/v1/campus/route/lateness` | 이동 동선 및 지각 위험도 계산 |

---

## 변경 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `Front/.env` | 백엔드 API URL 환경변수 설정 (`VITE_API_URL=http://localhost:5001/api/v1`) |
| `Front/src/api/index.js` | 백엔드 포트(5001/api/v1) fallback 설정 |
| `Front/src/api/authApi.js` | **(신규)** 학번 기반 로그인, 회원가입, 세션 조회 API 모듈 |
| `Front/src/api/dashboardApi.js` | **(신규)** 오늘 일정, 우선순위 과제 Top 3, 캠퍼스 동선 API 모듈 |
| `Front/src/pages/HomePage.jsx` | 로그인된 유저(이승빈 학우님 등) 정보 동적 인사말 바인딩 |
| `Front/src/components/dashboard/DashboardSections.jsx` | 다음 수업, 오늘 일정, 우선순위 과제 Top 3 실시간 DB 데이터 렌더링 |
| `Front/src/pages/LoginPage.jsx` | 실제 백엔드 로그인 API 연동 및 토큰 저장 후 홈 이동 처리 |
| `Front/publish/` | 배포 번들 빌드 최신화 |

---

## 검증 결과
- `npm run build` 정상 통과 (오류 0건)
- DB 시드 데이터(`20221001` 테스트 계정, 시간표, 우선순위 과제) 연동 확인
