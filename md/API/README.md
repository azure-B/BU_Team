# API 명세

> **SSOT**: 이 파일이 유일한 API 명세입니다. Back 작업 시 반드시 갱신하세요.

Base URL: `http://localhost:5001/api/v1` (프론트엔드 배포 호환을 위해 `/api/*` 별칭도 전역 지원)

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

### GET /api/v1/schedules/:id/tasks
- **설명**: 특정 수업 일정에 연계된 과제 목록 조회 (일정 ↔ 과제 연계 기능)
- **응답**:
  ```json
  {
    "success": true,
    "data": {
      "schedule": { "id": "uuid", "title": "인공지능 개론", "startAt": "...", "endAt": "..." },
      "tasks": [
        { "id": "uuid", "title": "인공지능 과제 초안 작성", "dueAt": "...", "importance": 5, "status": "PENDING" }
      ]
    }
  }
  ```

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

- 설명: 백석대 공지 목록(전체공지 + 학부공지 2026). 최신순.
- Query: `limit` (기본 8, 최대 300)
- 응답: `{ success, total, notices: [{ id, title, category, tags, source, link, createdAt }] }`
  - DB 컬럼: `title, content, category, tags, createdAt` (`source`/`link` 컬럼 없음). `source`←`tags`, `link`←`content` 내 URL.
  - 학부공지 적재: `Back/scripts/crawl-dept-notices.mjs` → `category=학부공지`, `tags`=첨단IT학부|컴퓨터공학부
- 관련 파일: `Back/src/routes/notices.routes.ts`, `Back/src/services/notice.service.ts`
- 같은 핸들러를 `/api/notices`에도 연결한다. 배포 프론트의 `VITE_API_URL`이 `/api`로 끝나기 때문이다.

## 6. 개설 과목 (Course)

### GET /api/v1/courses

- 설명: 2026-2 수강 책자에서 추출한 개설 과목
- Query: `department`, `major`, `kind` (`major` | `general` | `teaching`), `q` (과목명), `limit` (기본 50, 최대 300), `offset` (기본 0, 조회 시작 위치)
- 정렬: 과목명, ID 오름차순. 프론트의 강의 검색은 `limit=300`과 `offset`으로 전체 개설 강의를 읽고 전공/영역·요일/시간·구분·검색어를 함께 적용한다.
- 응답: `{ success, total, courses }`
- 관련 파일: `Back/src/routes/courses.routes.ts`, `Back/src/services/course.service.ts`
- 같은 핸들러를 `/api/courses`에도 연결한다.

## 7. 캠퍼스 데이터 (Campus) - B파트

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
- **설명**: GPS·카카오 도보(서버 전용, 지도 UI 없음)·CampusEdge·엘리베이터 슬롯을 합쳐 지각 위험도·권장 도착 시각·상황별 멘트를 반환
- **요청 Body** (`currentBuildingId` **또는** `lat`+`lng` 중 하나 필수):
  ```json
  {
    "currentBuildingId": "bldg-stu",
    "lat": 36.8385,
    "lng": 127.184,
    "nextClassBuildingId": "bldg-hq",
    "nextClassStartAt": "2026-10-26T04:00:00.000Z",
    "nowAt": "2026-10-26T03:30:00.000Z"
  }
  ```
- **도보 분**: 캠퍼스 스냅(≈180m)이면 `CampusEdge` 우선, 아니면 카카오 도보 API(`KAKAO_REST_API_KEY`). 키 없거나 실패 시 직선거리 추정
- **대중교통 전환**: 도보 **30분 이상**이면 `travelMode=transit`. 카카오 대중교통 통합 API 시도(제휴 필요), 실패 시 도보·거리 기반 추정. 표기: `현재 위치에서 대중교통 이용시 약 N분` (`travelLabel`)
- **보행 속도**: 캠퍼스 언덕 맑은 날 **50 m/min**(≈3.0 km/h, 평지 67 대비 하향). Open-Meteo 현재 강수로 배율 적용 — 이슬비 0.9 / 비 0.8 / 폭우 0.7 (Chang 2011·Deng/Lam 강수-속도 연구 참고). `CampusEdge`는 비만 보정, 카카오 ETA는 언덕+비 보정
- **엘리베이터**: `elevatorWaitSlots`에서 수업 요일·시각 슬롯 조회 → 권장 도착 = 수업 시작 − 엘리베이터 분
- **상황(`situation`)**: `LATE` | `CRITICAL` | `URGENT` | `HURRY` | `STEADY` | `RELAXED` — `tipHighlight` / `tipSub` 멘트로 내려감
- **응답 주요 필드**: `walkingMinutes`, `walkLabel`, `walkSpeedMPerMin`, `weather`, `elevatorMinutes`, `elevatorPeak`, `totalMinutes`, `recommendArriveLabel`, `situation`, `tipHighlight`, `tipSub`, `latenessLevel`
- **관련**: `Back/src/utils/captain-route-calculator.ts`, `Back/src/utils/kakao-walking.ts`, `Back/src/utils/walk-speed.ts`

---

## 9. 백석AI 비서 (Chat)

### POST /api/v1/chat  (별칭 `/api/chat`)
- **설명**: FAQ·학사일정은 즉시 응답, 그 외·`forceLlm`은 GPT. 일정·공지 후보는 GPT가 **숫자 하나**(0~4)로 의도 분류 후 분기. KB는 Supabase 우선, 없으면 로컬 시드
- **의도 코드(숫자 하나)**: `0` 기타 · `1` 일정 조회 · `2` 일정 등록 · `3` 일정 애매 · `4` 공지·대회·모집(Notice DB 매칭) · `5` 일정 삭제
- **인증**: 선택(`optionalAuthenticate`) — body `department` 또는 토큰 사용자 학부. 일정 조회·등록은 `userId` 필요(없으면 로그인 안내)
- **요청 Body**:
  ```json
  { "question": "보건학부 사무실 어디야?", "department": "컴퓨터공학부", "forceLlm": false }
  ```
- **응답 `data`**: `route`, `answer`, `badge`, `choices`, `canEscalateToAi`, `kbSource`(`db`|`seed`), `faqId`, `latencyMs`, `scheduleAction`, `sourceUrl`, `sentContext` …
- **route**: `faq` | `faq_clarify` | `engine` | `rag_llm` | `no_source` | `blocked` | `schedule` | `notice` | `campus` | `shuttle` | `gap`
- **처리 순서**: 캠퍼스 → 셔틀 → 공강(gap) → **FAQ** → 공지/일정 → 교수 → 학사일정 → GPT
- **sentContext**: 학부·경로·근거 요약 (Front 「내가 GPT에 보낸 정보」)
- **캠퍼스(`campus`)**: 건물명만(「진리관」) → 층·휴게·시설·붐빔. 「A에서 B까지」→ 도보분. 「뛰어가면」「비 오면」보정. 데이터 `Back/src/data/campusBuildings.ts`
- **`scheduleAction.status`**: `queried` | `created` | `deleted` | `conflict` | `need_login` | `need_clarify`
- 챗봇 등록 타입: 개인=`PERSONAL`, 매주 개인=`WEEKLY`(요일 투영·수업 아님), 과제=`TASK`, 수업 명시 시에만 `CLASS`
- 챗봇 삭제(`5`): 개인·WEEKLY·TASK만. 실제 수업(`CLASS`)은 삭제 불가(잘못 CLASS로 남은 스터디·약속 제목은 예외 삭제)
- 일정 시각은 한국 벽시계 naive datetime 으로 저장 (UTC `toISOString` 그대로 넣지 않음)
- **개인 일정**: 「오늘 14시에 일정 있어?」→ 조회+비면 약속 유도. 「목요일에 밥먹기로 함」→ 등록(시간 없으면 `choices`)
- **공지(`4`)**: Notice DB 매칭. 학부공지 크롤 `node Back/scripts/crawl-dept-notices.mjs` — [첨단IT](https://community.bu.ac.kr/smartit/6301/subview.do) · [컴퓨터공학부](https://community.bu.ac.kr/info/1788/subview.do)
- **KB 준비**: Supabase SQL Editor에 `Back/supabase/kb_chat.sql` 실행 → `cd Back && npm run kb:seed`
- **환경변수**: `OPENAI_API_KEY`, `OPENAI_MODEL`, `MAX_OUTPUT_TOKENS`
- **관련**: `router.ts`, `kbStore.ts`, `Back/src/data/*`

