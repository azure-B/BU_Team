# [2026.10.13] Render 시작 시 서버 빌드

## 작업 개요
- Render가 `dist/server.js` 없이 `npm start`만 실행해 배포가 실패함
- `typescript`와 타입 패키지를 dependencies로 옮기고, `npm start`가 `tsc` 후 서버를 실행하도록 변경

## 변경 파일
| 파일 | 변경 내용 |
|------|-----------|
| `Back/package.json` | `start`를 `tsc && node dist/server.js`로 변경, TypeScript를 dependencies로 이동 |
| `Back/package-lock.json` | 의존성 구분 반영 |
| `Back/.gitignore` | `dist/` 제외 |
