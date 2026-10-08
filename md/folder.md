# 프로젝트 폴더 구조

> **SSOT**: 폴더·파일이 실제로 추가·삭제·이동될 때만 갱신한다.
> 마지막 갱신: 2026-10-08

```
asdasd/
├── AGENTS.md                    — 에이전트 가이드 (진입점)
├── netlify.toml                 — Netlify Front 배포 설정
├── render.yaml                  — Render Back 배포 설정
├── .env                         — 전역 환경 변수 (Supabase, Render 등)
├── .agents/
│   └── rules/                   — Antigravity 에이전트 규율
│       ├── project-overview.md
│       ├── git-workflow.md
│       ├── front-workflow.md
│       ├── back-workflow.md
│       └── md-documentation.md
│
├── Front/                       — React + Vite 클라이언트
│   ├── designs/                 — 원본 HTML 보관소 (JSX 변환 참고용)
│   │   ├── dashboard.html       — 메인 대시보드 원본
│   │   ├── mypage.html          — 마이페이지 원본
│   │   ├── README.md            — 디자인 원본 안내
│   │   ├── sample.html          — 참고용 샘플
│   │   ├── sample2.html         — 참고용 샘플 2
│   │   ├── schedule-monthly.html — 월간 일정 원본
│   │   ├── schedule-weekly.html  — 주간 시간표 원본
│   │   └── setting.html         — 설정 페이지 원본
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js         — Axios 인스턴스 (토큰 인터셉터 포함)
│   │   ├── assets/              — 이미지, 폰트
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button/      — Button.jsx, Button.css, index.js
│   │   │   │   ├── Card/        — Card.jsx, Card.css, index.js
│   │   │   │   └── SectionCard/ — SectionCard.jsx, SectionCard.css, index.js
│   │   │   ├── dashboard/       — DashboardSections.jsx, DashboardSections.css
│   │   │   ├── mypage/          — MyPageSections.jsx, MyPageSections.css
│   │   │   ├── schedule/        — ScheduleContext.jsx, ScheduleDetails.jsx, scheduleModel.js, scheduleModel.test.js
│   │   │   ├── setting/         — 마이페이지에 통합된 프로필·알림·계정 컴포넌트 (SettingSections.jsx, SettingSections.css)
│   │   │   └── layout/
│   │   │       ├── Header/      — Header.jsx, Header.css, index.js
│   │   │       ├── Footer/      — Footer.jsx, Footer.css, index.js
│   │   │       └── Layout/      — Layout.jsx, Layout.css, index.js
│   │   ├── hooks/               — 커스텀 훅
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── HomePage.css
│   │   │   ├── LoginPage.jsx
│   │   │   ├── LoginPage.css     — 로그인 화면 공통 타이포그래피 토큰 적용
│   │   │   ├── MyPage.jsx
│   │   │   ├── MyPage.css
│   │   │   ├── SchedulePage.jsx  — 일정 진입·보기 전환·일정 추가
│   │   │   ├── SchedulePage.css  — 메인 디자인 토큰 기반 일정 공통 스타일
│   │   │   ├── ScheduleMonthlyPage.jsx — 월간 달력 및 날짜별 상세
│   │   │   ├── ScheduleWeeklyPage.jsx  — 주간 시간표 및 연계 일정
│   │   │   └── NotFoundPage.jsx
│   │   ├── styles/
│   │   │   └── global.css       — CSS 디자인 토큰 (Variables)
│   │   ├── utils/               — 유틸 함수
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── publish/                 — npm run build 결과 (정적 배포용 HTML)
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
│
├── Back/                        — Express MVC 서버
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js      — Supabase(PostgreSQL) 클라이언트 설정
│   │   ├── controllers/
│   │   │   └── userController.js
│   │   ├── routes/
│   │   │   └── userRoutes.js
│   │   ├── middlewares/
│   │   │   ├── errorHandler.js
│   │   │   └── notFound.js
│   │   ├── utils/
│   │   │   └── response.js      — sendSuccess / sendError 헬퍼
│   │   └── server.js            — 앱 진입점
│   ├── package.json
│   └── .env.example
│
└── md/                          — 문서 (SSOT)
    ├── AGENTS.md                — 원본 규율 (조별과제 기반)
    ├── API/
    │   └── README.md            — API 명세
    ├── folder.md                — 이 파일
    ├── jobs/
    │   ├── back/                — Back 작업 내역
    │   └── front/               — Front 작업 내역 (2026-10-03.md, 2026-10-07.md 일별 로그 포함)
    ├── back-workflow.mdc
    ├── front-workflow.mdc
    ├── git-workflow.mdc
    ├── md-documentation.mdc
    └── project-overview.mdc
```
