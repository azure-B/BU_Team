---
description: Front 작업 시 — 컴포넌트 구조, API 연동, 작업 내역 기록
globs: Front/**
alwaysApply: false
---

# Front 작업 시

## 코드 구조

```
Front/src/
├── api/              — Axios 인스턴스 (src/api/index.js)
├── components/
│   ├── common/       — 공통 UI (Button, Card 등)  [컴포넌트명/index.js 배럴 export]
│   └── layout/       — Header, Footer, Layout
├── pages/            — 페이지 컴포넌트 (HomePage, NotFoundPage 등)
├── hooks/            — 커스텀 훅
├── styles/
│   └── global.css    — 디자인 토큰 (CSS Variables)
├── utils/            — 유틸 함수
└── assets/           — 이미지, 폰트 등

Front/publish/        — npm run build 결과물 (정적 HTML 배포용)
```

- **컴포넌트**: 폴더 단위로 분리, 스타일은 동일 폴더에 co-locate
- **API 호출**: `src/api/index.js`에 Axios 인스턴스 집중, 서비스별 함수로 분리
- **배럴 export**: 각 컴포넌트 폴더에 `index.js` 유지

## API 연동 규칙

- API Base URL: `.env` 파일의 `VITE_API_URL` (기본값: `http://localhost:5000/api`)
- Axios 인스턴스: `src/api/index.js` — 토큰 인터셉터·에러 처리 포함
- 새 API 연동 시 `src/api/index.js`에 함수 추가

```js
// 예시 — src/api/index.js에 추가
export const fetchUsers = () => api.get('/users')
export const createUser = (data) => api.post('/users', data)
```

## Front-Back 연동 테스트

1. Back 서버를 먼저 실행: `cd Back && npm run dev`
2. Front 개발 서버 실행: `cd Front && npm run dev`
3. Vite dev proxy(`/api` → `http://localhost:5000`)가 자동으로 연결
4. 브라우저 DevTools → Network 탭에서 API 응답 확인

연동 확인 기본 엔드포인트: `GET http://localhost:5000/health`

## 작업 완료 체크리스트

1. **`md/jobs/front/`** — 작업 내역 기록 (엔드포인트·변경 파일명 필수)
2. **폴더 구조 변경 시** `md/folder.md` 갱신
3. **빌드 확인**: `npm run build` → `publish/` 폴더 정상 생성 여부

API 명세는 `md/API/README.md`를 참고한다. Front 작업 시 API md는 수정하지 않는다.

## jobs 기록 규칙

| 규모 | 방식 | 파일명 |
|------|------|--------|
| 큰 작업 (새 페이지, 기능 추가) | 개별 파일 | `YYYY-MM-DD_작업요약.md` |
| 사소한 수정 (스타일, 버그픽스) | 일별 로그에 항목 추가 | `YYYY-MM-DD.md` |

### 개별 파일 템플릿

```markdown
# 작업 요약

- 일시: YYYY-MM-DD
- 영역: Front

## 변경 요약
(1~3줄)

## 변경 파일
- Front/src/components/common/...
- Front/src/pages/...
- Front/src/api/index.js

## 사용 API
- POST /api/auth/login — 로그인 요청
```

### 일별 로그 항목 형식

```markdown
## HH:MM — 작업 요약
- 변경 파일: Front/src/...
- 사용 API: GET /api/...
```
