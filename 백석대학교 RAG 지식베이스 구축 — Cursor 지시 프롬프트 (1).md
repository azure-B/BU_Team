# 백석AI — 챗봇 · 대시보드 기능 요약

> 프로젝트 현재 구현 기준 (2026-10-25). API 상세는 `md/API/README.md`.

---

## 1. 백석AI 비서 (챗봇)

**진입**: 하단 네비 「AI 비서」시트 (`Front/.../Footer/Footer.jsx`)  
**API**: `POST /api/chat` (별칭 `/api/v1/chat`)  
**라우터**: `Back/src/services/chat/router.ts`

### 1.1 공통 UX
| 기능 | 설명 |
|------|------|
| 대화 유지 | `localStorage`에 메시지·AI 연결 상태 저장. 닫았다 열어도 유지. 휴지통으로 삭제 |
| 추천 질문 | 열 때 풀에서 3개 랜덤 (교수·과사·학사·일정·캠퍼스 등) |
| 초이스 칩 | 응답 `choices` 탭 → 바로 재질문 전송 |
| AI 연결 | 즉시 응답 불만 시 `forceLlm`으로 GPT 재질문 (`canEscalateToAi`) |
| 일정 동기화 | `scheduleAction`이 `created`/`deleted`면 시간표 `syncServerSchedules()` |

### 1.2 응답 분기 (`route`)

처리 우선순위 대략:

1. **campus** — 건물·이동  
2. **schedule / notice** — 의도 코드(0~5) 분류 후  
3. **faq / faq_clarify** — 교수·과사·FAQ 시드  
4. **engine** — 학사일정 엔진  
5. **rag_llm** — GPT (+ KB·근거 블록)

| route | 내용 |
|-------|------|
| `campus` | 건물 안내·건물 간 이동 시간 |
| `schedule` | 일정 조회·등록·삭제·충돌 |
| `notice` | 공지·대회·모집 DB 매칭 |
| `faq` / `faq_clarify` | 즉시 응답 (과사·교수·FAQ) |
| `engine` | 학사일정(중간고사·개강 등) |
| `rag_llm` | AI 생성 답변 |
| `no_source` | 근거/키 부족 |

### 1.3 캠퍼스 (`campus`)
- 데이터: `Back/src/data/campusBuildings.ts`
- **건물명만** (예: 진리관) → 층·휴게·시설·학부사무실·붐빔·엘리베이터 피크
- **A에서 B까지** → CampusEdge 도보 분 (언덕 반영)
- **뛰어가면** ≈ 도보 × 0.6
- **비 오면** → walk-speed 비 배율로 분 증가 (현재 날씨 Open-Meteo 참고)

### 1.4 일정 (`schedule`) — 의도 코드
| 코드 | 의미 |
|------|------|
| 0 | 일정 무관 |
| 1 | 조회 |
| 2 | 등록 |
| 3 | 애매 (조회/등록/삭제 선택) |
| 4 | 공지성 → notice 분기 |
| 5 | 삭제 |

**등록**
- 슬롯: 요일·시작·종료·제목·매주 여부 (로컬 파싱 우선 + GPT 보조)
- 시각: 분 단위·「부터/까지」수용 (예: 12시 30분부터 15시). 한국 **벽시계** naive datetime 저장
- 타입: 개인=`PERSONAL`, 매주 개인=`WEEKLY`, 과제=`TASK`, 수업 명시만 `CLASS`
- 실제 수업(`CLASS`)과 겹치면 등록 거절 + 다른 시간 `choices`

**삭제**
- 키워드: 없애줘·지워줘·삭제 등 (GPT가 등록으로 오분류해도 삭제 우선)
- **실제 수업은 삭제 불가**. `PERSONAL`/`WEEKLY`/`TASK` 및 제목이 스터디·약속 등인 오등록 CLASS만 삭제

**조회**
- 오늘/내일/요일·시간대 투영 후 안내. 비면 약속 등록 유도

### 1.5 공지 (`notice`)
- 의도 4 또는 공지성 키워드 → Notice DB 검색
- 학부공지 크롤: `Back/scripts/crawl-dept-notices.mjs`

### 1.6 FAQ · 교수 · 학사
- **과사**: 학부명 → 건물·호실·전화 (`departmentOffices`)
- **교수**: 성함·학부 목록·연락처 (`professors`)
- **FAQ 시드** / **KB**(Supabase `kb_chat` 우선, 없으면 시드)
- **학사일정**: `academicCalendar` 엔진 즉시 응답

### 1.7 GPT / KB
- `OPENAI_API_KEY`, `OPENAI_MODEL` (루트 `.env`)
- 근거: 학사·캠퍼스 건물·과사·교수·FAQ 요약
- KB 시드: `Back/supabase/kb_chat.sql` → `npm run kb:seed`

---

## 2. 대시보드 (홈)

**진입**: `/` (`Front/src/pages/HomePage.jsx`)  
**카드**: `Front/src/components/dashboard/DashboardSections.jsx`

### 2.1 헤더
- 인사: 이름·학부·학년·학번·오늘 수업 건수
- **DemoControls**: 데모 계정 전환·데모 시각·GPS 오버라이드 (시연용)

### 2.2 카드별 기능

| 카드 | 역할 |
|------|------|
| **ClassEngagementCard** | 진행 중 수업 몰입/조기종료. 「끝났어요」확인 시 동선 또는 day-wrap 추천으로 연결 |
| **DueTodayCard** | 오늘 마감 과제·할 일 요약 |
| **GapActivityCard** | 다음 수업 전(또는 수업 끝난 뒤) 틈새 추천: 식사·편의점·학습존·과제·사이버강의. 이동 시간(도보+엘리베이터) 반영 |
| **NextClassCard** | 다음(또는 진행 중) 수업. GPS로 건물 체류 여부. 경로·지각 위험도·권장 도착·팁 멘트 |
| **TodaySchedule** | 오늘 일정 타임라인 (CLASS 요일 투영 + 개인 일정) |
| **DeadlineList** | 다가오는 마감 Top N (우선순위 점수) |

### 2.3 동선 · 지각 · 날씨
- API: `POST /api/campus/route/lateness`
- 입력: 현재 건물 ID **또는** lat/lng + 다음 수업 건물·시작 시각
- 도보: CampusEdge(캠퍼스 스냅) 또는 카카오 도보. 30분↑이면 대중교통 전환 시도
- 속도: 언덕 맑은 날 50 m/min + 비 배율(이슬비 0.9 / 비 0.8 / 폭우 0.7)
- 엘리베이터: 요일·시각 슬롯 대기분 → 권장 도착 = 수업시작 − 엘리베이터
- 상황: `LATE` | `CRITICAL` | `URGENT` | `HURRY` | `STEADY` | `RELAXED` + tip 문구

### 2.4 데모 · GPS
- 데모 계정: 이승빈·곽두팔·김갑순·조박필·엄가영 (`demoAccounts`)
- URL/`DemoControls`로 시각·위치 고정 가능
- GPS 반경으로 「수업 건물 안/밖」 판별 (`classEngagement`)

---

## 3. 일정 탭과의 연동

챗봇이 만든 일정은 일정 탭과 공유 (`Schedule` 테이블).

| type | 시간표 표현 |
|------|-------------|
| `CLASS` | 수업 블록 (전공/교양 색) — 챗봇으로 삭제 불가 |
| `PERSONAL` | 개인 일정 청록 블록 (해당 날짜) |
| `WEEKLY` | 개인 매주 반복 (점선 테두리, 요일 투영) |
| `TASK` | 과제/마감 이벤트 |

- 주간 격자: 분 단위 시작·종료 반영  
- 상세: 수업 연계 과제 펼치기, 개인 일정 삭제  
- 챗봇 등록/삭제 후 자동 동기화

---

## 4. 주요 파일 맵

```
Back/src/services/chat/
  router.ts          — 분기 진입
  scheduleIntent.ts  — 일정 조회·등록·삭제
  campusIntent.ts    — 건물·이동
  noticeIntent.ts    — 공지
  llm.ts / kbStore.ts / systemPrompt.ts

Back/src/data/
  campusBuildings.ts, departmentOffices.ts, professors.ts
  faqSeeds.ts, academicCalendar.ts, elevatorWaitSlots.ts

Front/src/components/layout/Footer/Footer.jsx   — AI 비서 UI
Front/src/components/dashboard/DashboardSections.jsx
Front/src/pages/HomePage.jsx
Front/src/utils/campusRouteTimes.js, gapActivities.js, todaySchedules.js
```

---

## 5. 한 줄 시연 스크립트

1. 홈: 데모 계정·시각 맞추기 → 다음 수업·공강 추천·지각 팁 확인  
2. 비서: 「진리관」→ 건물 안내 / 「진리관에서 본부동까지 비 오면?」→ 이동 분  
3. 비서: 「화요일 12시 30분부터 15시 스터디 등록」→ 일정 탭 청록 블록  
4. 비서: 「화요일 스터디 없애줘」→ 개인만 삭제, 수업은 거부  
5. 비서: 「곽노윤 교수님 전화」·「보건학부 사무실」·「기말고사 언제」→ 즉시 응답  
