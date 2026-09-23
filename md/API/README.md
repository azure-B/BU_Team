# API 명세

> **SSOT**: 이 파일이 유일한 API 명세입니다. Back 작업 시 반드시 갱신하세요.

Base URL: `http://localhost:5000/api`

---

## GET /health

- 설명: 서버 상태 확인 (Health Check)
- 요청 Body: 없음
- 응답:
  ```json
  { "status": "ok", "env": "development" }
  ```
- 관련 파일: `Back/src/server.js`

---

## GET /api/users

- 설명: 전체 유저 목록 조회
- 요청 Body: 없음
- 응답:
  ```json
  { "success": true, "count": 2, "data": [ {...}, {...} ] }
  ```
- 관련 파일: `Back/src/routes/userRoutes.js`, `Back/src/controllers/userController.js`

---

## GET /api/users/:id

- 설명: 단일 유저 조회
- 요청 Body: 없음
- 응답:
  ```json
  { "success": true, "data": { "_id": "...", "name": "...", "email": "..." } }
  ```
- 관련 파일: `Back/src/routes/userRoutes.js`, `Back/src/controllers/userController.js`

---

## POST /api/users

- 설명: 유저 생성
- 요청 Body:
  ```json
  { "name": "홍길동", "email": "hong@example.com", "password": "password123" }
  ```
- 응답:
  ```json
  { "success": true, "data": { "_id": "...", "name": "홍길동", "email": "hong@example.com" } }
  ```
- 관련 파일: `Back/src/routes/userRoutes.js`, `Back/src/controllers/userController.js`, `Back/src/models/User.js`

---

## PUT /api/users/:id

- 설명: 유저 정보 수정
- 요청 Body: 수정할 필드만 포함
  ```json
  { "name": "홍길순" }
  ```
- 응답:
  ```json
  { "success": true, "data": { "_id": "...", "name": "홍길순" } }
  ```
- 관련 파일: `Back/src/routes/userRoutes.js`, `Back/src/controllers/userController.js`

---

## DELETE /api/users/:id

- 설명: 유저 삭제
- 요청 Body: 없음
- 응답:
  ```json
  { "success": true, "message": "유저가 삭제되었습니다." }
  ```
- 관련 파일: `Back/src/routes/userRoutes.js`, `Back/src/controllers/userController.js`
