# API 명세

> **SSOT**: 이 파일이 유일한 API 명세입니다. Back 작업 시 반드시 갱신하세요.

Base URL: `http://localhost:5001/api/v1`

---

## 1. 공통 / 헬스 체크

### GET /health
- **설명**: 서버 상태 확인 (Health Check)
- **인증**: 불필요
- **응답**:
  ```json
  { "status": "ok", "env": "development" }
  ```

---

## 2. 인증 (Auth)

### POST /api/v1/auth/register
- **설명**: 학번 기반 신규 회원가입
- **요청 Body**:
  ```json
  {
    "studentId": "20221001",
    "password": "password123",
    "name": "홍길동",
    "department": "컴퓨터공학부",
    "grade": 2
  }
  ```

### POST /api/v1/auth/login
- **설명**: 학번/비밀번호 로그인 및 JWT 발급
- **요청 Body**:
  ```json
  {
    "studentId": "20221001",
    "password": "password123"
  }
  ```
- **응답**:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "uuid", "studentId": "20221001", "name": "홍길동", "department": "컴퓨터공학부", "grade": 2 },
      "token": "JWT_TOKEN_STRING"
    }
  }
  ```

---

## 3. 일정 (Schedules) - B파트

> 모든 일정 API는 `Authorization: Bearer <token>` 헤더가 필요합니다.

### GET /api/v1/schedules
- **설명**: 사용자의 일정/시간표 목록 조회
- **Query Params**:
  - `from` (선택, ISO Datetime): 조회 시작 일시
  - `to` (선택, ISO Datetime): 조회 종료 일시
- **응답**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "userId": "uuid",
        "type": "CLASS",
        "title": "인공지능 개론 (진리관 204호)",
        "startAt": "2026-10-11T10:00:00.000Z",
        "endAt": "2026-10-11T12:00:00.000Z",
        "buildingId": "uuid"
      }
    ]
  }
  ```

### POST /api/v1/schedules
- **설명**: 일정 추가 (Zod 유효성 검증 적용)
- **요청 Body**:
  ```json
  {
    "title": "인공지능 개론",
    "type": "CLASS",
    "startAt": "2026-10-11T10:00:00.000Z",
    "endAt": "2026-10-11T12:00:00.000Z",
    "buildingId": "uuid"
  }
  ```

### PATCH /api/v1/schedules/:id
- **설명**: 일정 수정 (본인 소유 검증 및 Zod 검증 적용)
- **요청 Body**: 수정할 필드 선택 전송

### DELETE /api/v1/schedules/:id
- **설명**: 일정 삭제 (본인 소유 검증)

---

## 4. 과제 (Tasks) - B파트

> 모든 과제 API는 `Authorization: Bearer <token>` 헤더가 필요합니다.

### GET /api/v1/tasks
- **설명**: 사용자의 과제 목록 조회 (마감일 순 정렬)

### GET /api/v1/tasks/today/recommendations
- **설명**: 조장님 우선순위 계산 모듈 기반 '오늘의 할 일 Top 3' 조회
- **계산 방식**: 긴급도(D-Day 기준 잔여시간 점수) + 중요도(1~5 가중치 점수) 반영
- **응답**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "title": "인공지능 캡스톤 프로젝트 1차 제안서 제출",
        "dueAt": "2026-10-12T00:00:00.000Z",
        "importance": 5,
        "status": "PENDING",
        "priorityScore": 100
      }
    ]
  }
  ```

### POST /api/v1/tasks
- **설명**: 과제 추가 (Zod 유효성 검증 적용)
- **요청 Body**:
  ```json
  {
    "title": "알고리즘 과제",
    "dueAt": "2026-10-15T23:59:59.000Z",
    "importance": 4,
    "status": "PENDING"
  }
  ```

### PATCH /api/v1/tasks/:id
- **설명**: 과제 수정 (본인 소유 검증 및 Zod 검증 적용)

### DELETE /api/v1/tasks/:id
- **설명**: 과제 삭제 (본인 소유 검증)

---

## 5. 공지 (Notice)

### GET /api/v1/notices

- 설명: 백석대 전체공지 2026년 목록. 최신순.
- Query: `limit` (기본 8, 최대 300)
- 응답: `{ success, total, notices: [{ id, title, category, tags, source, link, createdAt }] }`
- 관련 파일: `Back/src/routes/notices.routes.ts`, `Back/src/services/notice.service.ts`
- 같은 핸들러를 `/api/notices`에도 연결한다. 배포 프론트의 `VITE_API_URL`이 `/api`로 끝나기 때문이다.

## 6. 캠퍼스 데이터 (Campus) - B파트

### GET /api/v1/campus/buildings
- **설명**: 백석대 건물 목록 조회

### GET /api/v1/campus/classrooms
- **Query Params**: `buildingId` (선택)
- **설명**: 강의실 목록 조회

### GET /api/v1/campus/facilities
- **Query Params**: `type` (선택, 예: '카페', '편의점', '학식'), `buildingId` (선택)
- **설명**: 캠퍼스 편의시설 목록 조회

### GET /api/v1/campus/cafeteria
- **Query Params**: `date` (선택, 형식: `YYYY-MM-DD`)
- **설명**: 날짜별 학식 메뉴 조회

### POST /api/v1/campus/route/lateness
- **설명**: 이동 동선 및 지각 위험도/추천 시설 계산 (조장님 모듈 연동 및 Zod 검증)
- **요청 Body**:
  ```json
  {
    "currentBuildingId": "uuid",
    "nextClassBuildingId": "uuid",
    "nextClassStartAt": "2026-10-11T14:00:00.000Z"
  }
  ```
- **응답**:
  ```json
  {
    "success": true,
    "data": {
      "walkingMinutes": 6,
      "minutesLeft": 10,
      "latenessRisk": 50,
      "latenessLevel": "WARNING",
      "recommendedFacilities": [ {...} ],
      "message": "서두르는 것이 좋습니다."
    }
  }
  ```
