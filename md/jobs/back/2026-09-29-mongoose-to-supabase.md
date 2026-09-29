# 작업 내역

- **작업일**: 2026-09-29
- **작업 내용**: MongoDB(Mongoose) 환경에서 Supabase 환경으로 전면 교체
- **변경 파일**: 
  - `Back/package.json` (`mongoose` 삭제, `@supabase/supabase-js` 추가)
  - `Back/src/config/db.js`, `Back/src/models/User.js` (삭제)
  - `Back/src/config/supabase.js` (생성)
  - `Back/src/server.js` (MongoDB 연결 로직 제거)
  - `Back/src/controllers/userController.js` (Supabase 쿼리로 교체)
  - `Back/src/middlewares/errorHandler.js` (PostgreSQL 에러 핸들링으로 교체)
  - `Back/.env.example`, `render.yaml` (`MONGO_URI` 제거)
