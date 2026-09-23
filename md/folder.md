# 프로젝트 폴더 구조

> **SSOT**: 폴더·파일이 실제로 추가·삭제·이동될 때만 갱신한다.
> 마지막 갱신: 2026-09-23

```
asdasd/
├── AGENTS.md                    — 에이전트 가이드 (진입점)
├── .agents/
│   └── rules/                   — Antigravity 에이전트 규율
│       ├── project-overview.md
│       ├── git-workflow.md
│       ├── front-workflow.md
│       ├── back-workflow.md
│       └── md-documentation.md
│
├── Front/                       — React + Vite 클라이언트
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js         — Axios 인스턴스 (토큰 인터셉터 포함)
│   │   ├── assets/              — 이미지, 폰트
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button/      — Button.jsx, Button.css, index.js
│   │   │   │   └── Card/        — Card.jsx, Card.css, index.js
│   │   │   └── layout/
│   │   │       ├── Header/      — Header.jsx, Header.css, index.js
│   │   │       ├── Footer/      — Footer.jsx, Footer.css, index.js
│   │   │       └── Layout/      — Layout.jsx, Layout.css, index.js
│   │   ├── hooks/               — 커스텀 훅
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── HomePage.css
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
│   │   │   └── db.js            — MongoDB 연결
│   │   ├── models/
│   │   │   └── User.js          — Mongoose 유저 스키마
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
    │   └── front/               — Front 작업 내역
    ├── back-workflow.mdc
    ├── front-workflow.mdc
    ├── git-workflow.mdc
    ├── md-documentation.mdc
    └── project-overview.mdc
```
