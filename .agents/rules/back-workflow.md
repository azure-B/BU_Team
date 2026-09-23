---
description: Back 작업 시 — MVC 구조, API 명세·작업 내역 갱신
globs: Back/**
alwaysApply: false
---

# Back 작업 시

## 코드 구조

```
Back/src/
├── config/
│   └── db.js           — MongoDB 연결
├── models/             — Mongoose 스키마 (데이터 로직)
├── controllers/        — 요청·응답 처리 (비즈니스 로직)
├── routes/             — URL 매핑만 (라우터)
├── middlewares/
│   ├── errorHandler.js — 전역 에러 처리
│   └── notFound.js     — 404 처리
├── utils/
│   └── response.js     — sendSuccess / sendError 헬퍼
└── server.js           — 앱 진입점
```

흐름: `routes/` → `controllers/` → `models/`

- **라우트**: URL 매핑만. 로직 없음
- **컨트롤러**: 요청·응답 처리, 비즈니스 로직. `try/catch` + `next(error)` 패턴 사용
- **모델**: Mongoose 스키마, 데이터 접근 로직
- 에러는 반드시 `next(error)`로 전파 → `errorHandler` 미들웨어가 처리

## API 응답 형식 (표준)

```js
// 성공
{ success: true, data: {...} }
{ success: true, count: N, data: [...] }

// 실패
{ success: false, message: "설명" }
```

`utils/response.js`의 `sendSuccess`, `sendError` 헬퍼를 사용한다.

## 환경 변수 (.env)

`.env.example`을 복사해 `.env`를 만들고 아래 값을 설정:

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/myapp
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

## Front-Back 연동 테스트

1. `.env` 파일이 올바른지 확인
2. `npm run dev` — nodemon으로 서버 실행 (port 5000)
3. Health Check: `GET http://localhost:5000/health` → `{ status: "ok" }` 응답 확인
4. API 테스트: `GET http://localhost:5000/api/users`

Front proxy 설정 (`Front/vite.config.js`):
```
/api  →  http://localhost:5000
```
Front 개발 서버에서 `/api/...` 요청 시 자동으로 Back으로 프록시됩니다.

## 작업 완료 체크리스트

1. **`md/API/README.md`** — 추가·수정·삭제된 엔드포인트 반영
2. **`md/jobs/back/`** — 작업 내역 기록
3. **폴더 구조 변경 시** `md/folder.md` 갱신

## jobs 기록 규칙

| 규모 | 방식 | 파일명 |
|------|------|--------|
| 큰 작업 (새 API, 구조 변경) | 개별 파일 | `YYYY-MM-DD_작업요약.md` |
| 사소한 수정 (버그픽스 등) | 일별 로그에 항목 추가 | `YYYY-MM-DD.md` |

### 개별 파일 템플릿

```markdown
# 작업 요약

- 일시: YYYY-MM-DD
- 영역: Back

## 변경 요약
(1~3줄)

## 변경 파일
- Back/src/routes/...
- Back/src/controllers/...
- Back/src/models/...

## API 변경
- GET /api/... (추가|수정|삭제)
→ md/API/README.md 해당 섹션 참고
```

### 일별 로그 항목 형식

```markdown
## HH:MM — 작업 요약
- 변경 파일: ...
- API: (해당 시) METHOD /api/...
```
