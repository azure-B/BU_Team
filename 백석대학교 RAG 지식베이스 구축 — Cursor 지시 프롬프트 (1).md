# 백석대학교 RAG 지식베이스 구축 — Cursor 지시 프롬프트

아래 `---` 사이의 내용을 Cursor(Agent 모드)에 그대로 붙여 넣어 사용한다.

---

## 역할과 목표

너는 이 저장소의 백엔드 개발자다. 백석대학교 학생용 AI 비서의 **RAG 지식베이스**를 만든다.
목표는 학교 공식 자료를 출처·적용 학기·대상과 함께 DB에 저장하고, 검색 가능한 조각(chunk)으로 나누는 것이다.

먼저 저장소 구조(package.json, DB 클라이언트, .env.example, 기존 마이그레이션)를 확인하고 기존 스택에 맞춰라.
DB가 정해져 있지 않다면 **Supabase(PostgreSQL) + pgvector**를 기본으로 사용한다.
작업 전 변경 계획을 짧게 보여주고, 끝나면 생성·수정한 파일 목록과 실행 방법을 정리해라.

## 절대 규칙

1. **공식 출처만 저장**: `bu.ac.kr`, `community.bu.ac.kr`, `dormitory.bu.ac.kr`, `ipsi.bu.ac.kr` 의 공개 페이지·PDF만 사용한다. 블로그·커뮤니티 글은 저장하지 않는다. 예외: 8단계의 셔틀 운행표와 병결 세부 기준은 팀이 정리한 자료이므로 `needs_review = true`로 저장하고 공식 공지를 찾으면 교체한다.
2. **로그인 영역 수집 금지**: 종합정보시스템, 수강신청 사이트, LMS 등 인증이 필요한 페이지는 요청하지 않는다.
3. **개인정보 저장 금지**: 공지 본문에 이름·학번·전화번호(개인)·이메일(개인)·명단이 있으면 해당 부분을 마스킹하거나 문서를 제외한다. 부서 대표 전화번호는 저장 가능하다.
4. **사실을 지어내지 말 것**: 아래 시드 데이터에 없는 날짜·금액·조건을 임의로 채우지 않는다. 모르면 `null`, 확인 필요 항목은 `needs_review = true`.
5. **최신성 표시**: 아래 시드 데이터는 대부분 2024~2025학년도 자료다. 현재 학기(2026-2) 자료로 확인되기 전에는 `is_current = false`, `needs_review = true` 로 저장한다.
6. **예의 있는 수집**: 요청 간 최소 2초 간격, User-Agent에 프로젝트명 명시, robots.txt 준수, 실패 시 재시도는 최대 2회.
7. **시연용 가상 데이터와 분리**: 가상 공지는 `is_synthetic = true` 로만 저장하고 공식 문서와 섞지 않는다.
8. **시연 사용자는 더미 데이터**: 학생 이름·학번은 실존 인물과 무관한 더미 값만 사용한다(학번은 실제와 겹치지 않게 `2099`로 시작). 더미 값이므로 LLM 프롬프트에 포함해도 되지만, 답변에 필요한 필드(이름·학부·학년·시간표 요약)만 보낸다. 3번 규칙(개인정보 저장 금지)은 학교에서 수집한 공지 문서에 적용되는 규칙이다.

## 1단계: 스키마 (마이그레이션 파일로 작성)

```sql
create extension if not exists vector;

create table kb_sources (
  id            text primary key,          -- 예: 'bu-notice-academic'
  name          text not null,             -- 예: '학사공지 게시판'
  base_url      text not null,
  source_type   text not null check (source_type in ('board','page','pdf')),
  category      text not null,             -- academic | scholarship | notice | facility | contact | dormitory | regulation
  active        boolean default true,
  last_fetched_at timestamptz
);

create table kb_documents (
  id             uuid primary key default gen_random_uuid(),
  source_id      text references kb_sources(id),
  title          text not null,
  category       text not null,
  subcategory    text,                     -- 예: 휴학, 수강신청, 교내장학, 도서관
  department     text,                     -- 담당 부서
  academic_year  int,                      -- 적용 학년도
  semester       text,                     -- '1' | '2' | 'summer' | 'winter' | null
  published_at   date,                     -- 게시일
  valid_from     date,                     -- 적용 시작(신청 시작 등)
  valid_until    date,                     -- 적용 종료(신청 마감 등)
  target         text[],                   -- 예: {'재학생','복학생','신입생'}
  source_url     text not null,
  attachment_urls text[],
  content        text not null,            -- 정제된 본문(Markdown)
  content_hash   text not null,            -- 중복·변경 감지
  supersedes     uuid references kb_documents(id),  -- 정정 공지가 대체하는 이전 문서
  is_current     boolean default false,
  is_synthetic   boolean default false,
  needs_review   boolean default true,
  review_note    text,
  access_level   text default 'public',
  fetched_at     timestamptz default now(),
  unique (source_url, content_hash)
);

create table kb_chunks (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid references kb_documents(id) on delete cascade,
  chunk_index  int not null,
  heading      text,                       -- 이 조각이 속한 소제목
  content      text not null,              -- 문서 제목 + 소제목을 앞에 붙인 본문
  token_count  int,
  embedding    vector(1536),               -- 사용하는 임베딩 모델 차원에 맞게 수정
  metadata     jsonb                       -- category, academic_year, semester, target, source_url 복사본
);

create index on kb_chunks using hnsw (embedding vector_cosine_ops);
create index on kb_documents (category, academic_year, semester);

-- 학생 표현 → 공식 용어 사전
create table kb_glossary (
  term         text primary key,           -- 학생이 쓰는 표현
  official     text not null,              -- 공식 명칭
  category     text,
  note         text
);
```

## 2단계: 수집 대상 소스 등록 (`kb_sources` 시드)

| id | name | base_url | type | category |
|---|---|---|---|---|
| bu-notice-all | 전체공지 | https://www.bu.ac.kr/web/3483/subview.do | board | notice |
| bu-notice-academic | 학사공지 | https://www.bu.ac.kr/web/6556/subview.do | board | academic |
| bu-notice-scholarship | 장학공지 | https://www.bu.ac.kr/web/6559/subview.do | board | scholarship |
| bu-regulation-notice | 학칙 개정 공포 | https://www.bu.ac.kr/web/3484/subview.do | board | regulation |
| bu-academic-calendar | 학사일정 | https://www.bu.ac.kr/web/3443/subview.do | page | academic |
| bu-handbook | 요람/수업시간표(학칙·교무규정 PDF) | https://www.bu.ac.kr/web/3446/subview.do | page | regulation |
| bu-scholarship-internal | 교내장학금 안내 | https://www.bu.ac.kr/web/3710/subview.do | page | scholarship |
| bu-library | 도서관 안내 | https://www.bu.ac.kr/web/3546/subview.do | page | facility |
| bu-phone | 전화번호 검색 | https://www.bu.ac.kr/web/3515/subview.do | page | contact |
| bu-dormitory-notice | 백석생활관 공지 | https://dormitory.bu.ac.kr/board/?id=notice | board | dormitory |
| bu-dormitory-faq | 백석생활관 FAQ | https://dormitory.bu.ac.kr/board/?id=faq | board | dormitory |
| bu-sitemap | 사이트맵(추가 소스 탐색용) | https://www.bu.ac.kr/web/3904/subview.do | page | notice |
| bu-tip-articles | 학생기자단 TIP 기사(보조 자료) | https://www.bu.ac.kr/web/6385/subview.do | board | notice |

`bu-tip-articles`는 학교 공식 사이트에 게시된 학생기자단 기사이므로 `department = '홍보(학생기자단)'`, `needs_review = true` 로 저장하고, 같은 내용의 원 공지가 있으면 원 공지를 우선한다.

## 3단계: 수집기 구현 (`scripts/kb/collect.ts`)

1. `kb_sources.active = true` 인 소스를 순회한다.
2. 게시판(board)은 목록 1~3페이지에서 게시글 링크·제목·작성일을 읽고, 상세 페이지 본문과 첨부파일 링크를 가져온다.
3. 첨부 PDF·HWP는 링크만 `attachment_urls`에 저장하고, PDF는 텍스트 추출이 가능하면 본문 뒤에 `## 첨부: 파일명` 섹션으로 붙인다. HWP는 추출하지 말고 `review_note`에 "HWP 첨부 수동 확인 필요"를 남긴다.
4. 본문 정제: 메뉴·푸터·스크립트 제거, 표는 Markdown 표로 유지한다.
5. 제목·본문에서 아래 값을 **규칙 기반으로** 추출하고, 실패하면 `null`로 둔다.
   - 학년도·학기: `2026-2학기`, `2026학년도 2학기` 패턴
   - 신청 기간: `YYYY. M. D.(요일) ~ M. D.(요일)` 패턴 → `valid_from`, `valid_until`
   - 대상: 재학생/복학생/신입생/편입생/교환학생/졸업예정자 키워드
   - 말머리: `[교내장학]`, `[국가장학]`, `[학자금대출]`, `[교수학습개발원]`, `[취업진로지원처]` 등 → `subcategory`
6. `content_hash`(SHA-256)로 중복은 건너뛰고, 같은 URL의 내용이 바뀌면 새 행을 만들고 이전 행을 `supersedes`로 연결한다.
7. 제목에 `정정`, `변경`, `연장`이 있으면 같은 학기·같은 주제의 이전 문서를 찾아 `supersedes` 후보로 표시하고 `needs_review = true`.
8. 개인정보 필터: 휴대폰 번호(010-), 학번 패턴(8자리 숫자 연속), 개인 이메일, '명단'·'합격자' 표를 감지하면 마스킹하거나 문서를 `access_level = 'excluded'`로 둔다.
9. 실행 로그(가져온 수·건너뛴 수·실패 URL)를 출력한다.

## 4단계: 청킹·임베딩 (`scripts/kb/chunk.ts`)

- 소제목(`##`, `1.`, `가.`, `■`, `▶`) 경계로 먼저 나누고, 조각당 300~800토큰을 목표로 한다.
- **조건과 예외는 같은 조각에 유지**: `※`, `유의사항`, `단,` 으로 시작하는 문단은 바로 앞 조각에 붙인다.
- 표는 행 단위로 쪼개지 말고, 길면 머리글 행을 반복해 나눈다.
- 각 조각 앞에 `[문서 제목] > [소제목]` 과 `(적용: 2025-1학기 / 대상: 재학생)` 같은 한 줄 요약을 붙인다.
- 임베딩 모델과 API 키는 `.env`에서 읽는다(`EMBEDDING_MODEL`, `EMBEDDING_API_KEY`). 키를 코드에 하드코딩하지 않는다.

## 5단계: 수동 시드 데이터 (`scripts/kb/seed.ts`)

수집기가 실패해도 시연할 수 있도록, 아래 확인된 공식 자료를 `kb_documents`에 넣는다.
모든 항목은 `is_current = false`, `needs_review = true` 로 저장하고 `review_note`에 "2026-2학기 기준 재확인 필요"를 적는다.

### A. 학사 규정·학사 안내

```json
[
  {
    "title": "백석대학교 학칙 — 휴학 조항(제24조)",
    "category": "regulation", "subcategory": "휴학",
    "department": "교무처",
    "source_url": "https://community.bu.ac.kr/sites/bscon/files/baeksuk_rule_20200901.pdf",
    "content": "휴학하려면 휴학원을 제출해 총장의 허가를 받아야 하며, 휴학 신청 시기에 따라 등록금 인정액이 달라질 수 있다. 일반휴학은 1년 이하로 하며 통산 2년을 초과할 수 없다. 일반휴학 통산 4개 학기를 휴학한 자가 부득이하게 연장하려면 증빙서류를 첨부해 총장의 허가를 받아야 한다. 군입대·창업·임신·출산·육아 휴학은 휴학기간에 산입하지 않는다.",
    "review_note": "2020.9.1. 시행본. 2025년 요람 학칙 PDF(bu-handbook)로 최신 조문 대조 필요"
  },
  {
    "title": "휴학 신청 절차(공통)",
    "category": "academic", "subcategory": "휴학",
    "academic_year": 2025, "semester": "1",
    "source_url": "https://www.bu.ac.kr/web/6385/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGd2ViJTJGMTY5MiUyRjQ2MjMwJTJGYXJ0Y2xWaWV3LmRvJTNG",
    "content": "종합정보시스템 → 학적정보 → 휴학신청 → 휴학원 출력 → 담임교수·주임교수 서명 → 학부사무실 제출 → 학부 승인 → 학생이 승인 여부 확인. 재학생 휴학원 제출은 개강 전까지 가능하며, 개강 후에는 부득이한 경우 등록휴학만 가능하다. 등록휴학자는 등록금 납부 다음 날 오전 10시부터 등록 여부를 확인한 뒤 신청한다. 학기별 휴학 신청 가능 횟수는 1회이며, 휴학기간 만료 시 복학 또는 휴학 신청을 반드시 해야 한다."
  },
  {
    "title": "휴학 종류별 제출서류와 유의사항",
    "category": "academic", "subcategory": "휴학",
    "source_url": "https://www.bu.ac.kr/web/6385/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGd2ViJTJGMTY5MiUyRjMzMjc0JTJGYXJ0Y2xWaWV3LmRvJTNG",
    "content": "일반휴학: 휴학원, 보호자 사유서. 군입대휴학: 휴학원, 입영통지서(입영일 전일까지 신청). 개강 이후 입대 예정자는 일반휴학 후 입영통지서 수령 시 군입대휴학으로 재신청. 창업휴학: 휴학원, 신청자격 증빙자료, 지도교수 추천서(창업교육운영규칙 제7조). 임신·출산휴학: 임신진단서 또는 출생증명서. 육아휴학: 가족관계증명서. 장학금 지급 대상자는 미등록 휴학 시 장학금이 소멸하므로 등록금 납부 후 휴학해야 한다.",
    "review_note": "학생기자단 기사. 학부별 공지(예: 어문학부)와 세부 절차가 다를 수 있음"
  },
  {
    "title": "수업 운영·출결 기준",
    "category": "academic", "subcategory": "출결",
    "academic_year": 2026, "semester": "2",
    "source_url": "https://www.bu.ac.kr/web/6556/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGd2ViJTJGNzg4JTJGNDY5NzklMkZhcnRjbFZpZXcuZG8lM0Y=",
    "content": "출석은 '백석대학교 스마트출결(학생용)' 앱으로 확인한다. 무단결석·무단퇴실은 결석 처리하며 지각·조퇴 3회는 결석 1회로 처리한다. 실제 수업시간의 3/4 이상 출석해야 성적 처리가 가능하고, 1/4을 초과해 결석하면 출석미달 F로 처리한다. 출석인정 사유(교무규칙 제58조): 본인 결혼 5일, 직계가족 사망 5일, 출산(본인 20일/배우자 7일), 예비군·징병검사 해당기간, 입원 시 입원일로부터 2주 이내, 당일 진료는 학기당 2회 이내 등. 서류는 학부사무실에 제출한다. 개강·종강 날짜는 학사일정(https://www.bu.ac.kr/web/3443/subview.do)을 따른다: 2026-1학기 개강 3.3.(화)·종강 6.19.(금), 2026-2학기 개강 9.1.(화)·종강 12.21.(월).",
    "review_note": "출결 규칙은 학사공지 기준. 개강·종강은 2026 학사일정으로 갱신"
  },
  {
    "title": "2026학년도 학사일정(요약)",
    "category": "academic", "subcategory": "학사일정",
    "academic_year": 2026,
    "department": "교무처",
    "source_url": "https://www.bu.ac.kr/web/3443/subview.do",
    "is_current": true,
    "needs_review": false,
    "content": "출처: 백석대 학사일정(교무처 041-550-9124). 공식 일정에 「중간고사 기간」은 없음(중간 강의평가·기말고사 기간만 표기).\n\n【2026-1학기】 수강신청(재학생) 2.2.~2.6. / 신·편입생 2.20.~2.23. / 정정 2.24.~3.9. / 개강 3.3.(화) / 중간 강의평가 3.30.~4.3. / 기말고사 6.15.~6.19. / 종강 6.19.(금) / 하계방학 6.22.\n\n【2026-2학기】 수강신청(재학·복학·재입학생) 8.10.~8.14. / 정정 8.25.~9.7. / 개강 9.1.(화) / 중간 강의평가 9.28.~10.2. / 수업일수 1/2 10.26. / 진리축전 10.27.~10.29. / 건학50주년 10.30. / 기말 강의평가·동계계절 수강신청 11.23.~11.27. / 지정보강주 12.8.~12.14. / 기말고사 12.15.~12.21. / 종강 12.21.(월) / 동계방학 12.22.",
    "review_note": "2026.10.25 공식 학사일정 페이지와 대조 완료"
  }
]
```

### B. 장학금·학생 지원

```json
[
  {
    "title": "교내장학금 공통 기준",
    "category": "scholarship", "subcategory": "교내장학",
    "department": "학생처",
    "source_url": "https://www.bu.ac.kr/web/3710/subview.do",
    "content": "모든 교내장학금은 정규학기 8학기까지 지급하며 초과학기자는 지급 불가. 학비감면 장학생은 1월 말·7월 말에 선발해 등록금고지서에서 감면하고, 그 외 장학금은 본인 계좌로 입금한다. 선발 당시 휴학생은 장학 대상에서 제외되며, 선발된 학생은 다음 학기에 등록한 뒤 휴학해야 복학 시 장학금이 인정된다. 징계, 미등록, 허위 신청, 성적 미달 등은 자격 상실 사유다."
  },
  {
    "title": "재학생 성적우수장학금",
    "category": "scholarship", "subcategory": "교내장학",
    "source_url": "https://www.bu.ac.kr/web/3710/subview.do",
    "content": "직전 학기 신청학점을 전부 취득하고 평점 3.0 이상, 15학점 이상(4학년 12학점 이상) 취득, 수강철회 없음. 수석: 등록금 전액 / A(상위 2%): 60% / B(상위 5%): 40% / C(상위 10%): 30% / D(상위 20%): 20%. 신청 없이 성적 석차순 자동 선발. F학점 또는 수강철회자는 제외."
  },
  {
    "title": "면학장학금(면학장려 1~4등급·한가족·다문화)",
    "category": "scholarship", "subcategory": "교내장학",
    "source_url": "https://www.bu.ac.kr/web/3710/subview.do",
    "content": "모두 직전 학기 성적 2.0 이상. 1등급: 소년소녀가장·국민기초생활수급자 등. 2등급: 차상위계층, 150만 원. 3등급: 학부모 실직·장기입원·재해 피해 등 경제 곤란(소득 2분위 이하), 100만 원. 4등급: 소득 3~5분위, 80만 원 이하. 한가족: 가족이 동시 재학 중이며 가계 곤란, 각 100만 원. 다문화가족: 각 100만 원.",
    "review_note": "1등급 지급액 표기가 원문에서 불명확 — 원문 대조 필요"
  },
  {
    "title": "성적향상 장학금",
    "category": "scholarship", "subcategory": "교내장학",
    "source_url": "https://www.bu.ac.kr/web/3710/subview.do",
    "content": "A등급: 이전 학기 평점 2.5 이하 → 직전 학기 3.5 이상, 80만 원. B등급: 학사경고자(1.5 미만) → 2.5 이상, 70만 원. C등급: 이전 학기 3.5 이상 → 0.5 이상 상승, 30만 원. 재학 중 1회 수혜."
  },
  {
    "title": "교내장학금 신청 방법과 신청 시기(예시: 2025-1학기)",
    "category": "scholarship", "subcategory": "교내장학",
    "academic_year": 2025, "semester": "1",
    "valid_from": "2024-12-23", "valid_until": "2024-12-31",
    "target": ["재학생"],
    "source_url": "https://www.bu.ac.kr/web/6559/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGd2ViJTJGODE4JTJGNDYyMjIlMkZhcnRjbFZpZXcuZG8lM0Y=",
    "content": "신청 경로: 신규종합정보시스템 → 장학/등록 → 장학금신청 → 해당 장학금 선택 → 조회 → 신규 → 저장 → 개인동의 완료(필수) → 구비서류 업로드. 온라인 신청만 인정되며 신청서 출력·직접 제출은 불필요. 구비서류 PDF는 비밀번호 잠금을 해제해 업로드해야 한다. 2025-1학기 재학생 신청: 2024.12.23.~12.31., 복학생·교환학생: 2025.1.13.~1.31. 성적우수장학금은 신청 없이 자동 선발.",
    "review_note": "날짜는 2025-1학기 기준. 매 학기 장학공지에서 갱신"
  }
]
```

### C. 학사·학과 공지(수강신청)

```json
[
  {
    "title": "수강신청·정정 일정(2026학년도 학사일정)",
    "category": "academic", "subcategory": "수강신청",
    "academic_year": 2026,
    "source_url": "https://www.bu.ac.kr/web/3443/subview.do",
    "content": "학사일정 기준. 학년별 시간대 세부(09:30~ 등)는 매 학기 수강신청 공지를 본다.\n2026-1학기: 재학생 수강신청 2.2.~2.6., 신·편입생 2.20.~2.23., 정정(전체) 2.24.~3.9., 개강 3.3.\n2026-2학기: 재학·복학·재입학생 수강신청 8.10.~8.14., 정정(전체) 8.25.~9.7., 개강 9.1.\n개강 후 정정은 졸업학점 부족 등 부득이한 경우만 가능하며, 정정으로 인한 결석은 출석 인정 불가. 대학예배(채플과섬김)는 좌석 배정 때문에 정정 불가.",
    "review_note": "기간은 2026 학사일정. 학년별 슬롯·시각은 학사공지에서 재확인"
  },
  {
    "title": "학칙 개정 공포 공지 예시",
    "category": "regulation",
    "published_at": "2024-05-27",
    "source_url": "https://www.bu.ac.kr/web/3484/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGd2ViJTJGODM2JTJGNDIzODQlMkZhcnRjbFZpZXcuZG8lM0Y=",
    "content": "대학 및 대학원 학칙 일부 개정 공포(2024.5.27. 시행). 개정 공포 공지는 이전 조문을 대체하므로 supersedes 관계를 기록한다."
  }
]
```

### D. 시설 이용 안내

```json
[
  {
    "title": "도서관(백석학술정보관) 위치·운영시간",
    "category": "facility", "subcategory": "도서관",
    "department": "도서관",
    "source_url": "https://www.bu.ac.kr/web/6385/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGd2ViJTJGMTY5MiUyRjQ3OTAzJTJGYXJ0Y2xWaWV3LmRvJTNG",
    "content": "위치: 본부동 정면(천국의 계단) 기준 오른쪽, 글로벌외식관(안골식당 건물) 옆. 지하~1층: 열람실 3개·무인카페, 2~5층: 분야별 자료실·복사기·스터디룸. 일반 도서관: 월~목 09:00~20:00, 금 09:00~18:00, 주말·공휴일 휴관. 열람실: 월~토 08:00~24:00, 일·공휴일 08:00~20:00. 출입·대출에는 '클리커' 앱 모바일 학생증이 필요하며, 열람실 좌석은 클리커 앱으로 선택한다.",
    "review_note": "시험기간·방학 중 운영시간 변경 공지 확인 필요"
  },
  {
    "title": "도서관 그룹토의실(스터디룸) 예약 방법",
    "category": "facility", "subcategory": "도서관",
    "source_url": "https://www.bu.ac.kr/web/6385/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGd2ViJTJGMTY5MiUyRjQ0MTk5JTJGYXJ0Y2xWaWV3LmRvJTNG",
    "content": "도서관 홈페이지 상단 '도서관 서비스' → '그룹토의실 이용신청' → 날짜·스터디룸·시간 선택 → 학번·비밀번호 로그인 → 모임명 입력 및 동반자 학번 등록(동반자 2명 이상이어야 예약 버튼 활성화) → 저장. 입실 전 클리커 앱 QR 스캐너로 토의실 입구의 도착 인증 QR코드를 스캔해야 한다."
  },
  {
    "title": "백석생활관 연락처",
    "category": "dormitory",
    "department": "백석생활관",
    "source_url": "https://dormitory.bu.ac.kr/board/?id=notice",
    "content": "주소: 충청남도 천안시 동남구 백석대학로 1-19 백석생활관. 전화 041-580-3603~5. 2026-2학기 백석생활관 입사안내(2026-08-24 게시) 등 입사·방배정 공지는 생활관 공지 게시판에서 확인."
  }
]
```

### E. 부서 안내·연락처

```json
[
  {
    "title": "주요 부서 연락처",
    "category": "contact",
    "source_url": "https://www.bu.ac.kr/web/3515/subview.do",
    "content": "천안 국번 041-550. 교무처 9123·9154(학사 9154), 학생처 9036·9037(장학·등록금 대출 9036), 재무처 9093, 도서관 2613·2615, 학생생활상담센터 2089, 취업진로지원처 2784, 전산정보원 2301, 장애학생지원센터 2708, 인권센터 0795, 보건실 0728, 교수학습개발원 2863, 국제교류처 9069, 사회봉사센터 2689, 컴퓨터공학부 9176, 첨단IT학부 9176.",
    "review_note": "부서 대표번호 기준. 같은 부서가 업무별로 인접 번호를 함께 사용함 — 학생처 9036·9037(장학·등록금 대출 9036), 교무처 9123·9154(학사 9154), 도서관 2613·2615. 모두 같은 부서 번호로 함께 표시"
  },
  {
    "title": "업무별 문의처(입학처 모집요강 기준)",
    "category": "contact",
    "source_url": "https://ipsi.bu.ac.kr/files/ipsi/_upload/handbook/20251229174330569.pdf",
    "content": "입학 관련: 입학관리처 041-550-0800~3. 장학 및 등록금 대출: 학생처 041-550-9036. 학사: 교무처 041-550-9154. 등록: 재무처 041-550-9093. 장애학생 지원: 장애학생지원센터 041-550-2708(목양관 114호). 기숙사: 백석생활관 041-580-3603~5. ROTC: 학생군사교육단 041-550-9137."
  }
]
```

### F. 용어 사전 시드 (`kb_glossary`)

```json
[
  {"term": "도서관", "official": "백석학술정보관", "category": "facility"},
  {"term": "기숙사", "official": "백석생활관", "category": "dormitory"},
  {"term": "채플", "official": "대학예배(채플과섬김)", "category": "academic"},
  {"term": "출첵 앱", "official": "백석대학교 스마트출결(학생용)", "category": "academic"},
  {"term": "학생증 앱", "official": "클리커(모바일 학생증)", "category": "facility"},
  {"term": "포털", "official": "종합정보시스템", "category": "academic"},
  {"term": "스터디룸", "official": "그룹토의실", "category": "facility"},
  {"term": "수강정정", "official": "수강신청 정정", "category": "academic"},
  {"term": "성적장학금", "official": "재학생 성적우수장학금", "category": "scholarship"}
]
```

학생들이 실제로 쓰는 약칭은 팀원이 확인한 것만 추가하고, 뜻이 여러 개인 약칭은 등록하지 않는다.

## 6단계: 검색 함수 (`lib/kb/search.ts`)

- 입력: 질문, 선택적 필터(category, academic_year, semester, target).
- 처리: 용어 사전으로 질문 확장 → 메타데이터 필터 + 벡터 유사도 검색(top 8) → `is_current = true` 우선, 같은 주제면 `supersedes`로 대체된 문서 제외 → 상위 4개 반환.
- 출력: 조각 본문, 문서 제목, `source_url`, 적용 학기, `needs_review` 여부.
- 연락처 안내 시 같은 부서의 인접 번호(예: 학생처 9036·9037)는 충돌로 보지 말고 같은 부서 번호로 함께 보여준다. 업무별 번호가 명시된 경우(장학·등록금 대출 9036)는 그 번호를 먼저 안내한다.
- 검색 결과가 없거나 유사도가 임계값 미만이면 `{ found: false }`를 반환한다. LLM은 이때 "확인 가능한 공식 자료를 찾지 못했다"고 답하고 담당 부서 연락처를 안내한다.

## 7단계: 검증

`scripts/kb/eval.ts`에 아래 질문을 넣고, 기대 문서가 상위 4개 안에 나오는지 확인하는 테스트를 만든다.

| 질문 | 기대 문서 |
|---|---|
| 휴학 신청 절차가 어떻게 돼? | 휴학 신청 절차(공통) |
| 군대 가는데 휴학 서류 뭐 내야 해? | 휴학 종류별 제출서류와 유의사항 |
| 지각 몇 번이면 결석이야? | 수업 운영·출결 기준 |
| 성적장학금 받으려면 몇 학점 들어야 해? | 재학생 성적우수장학금 |
| 장학금 신청은 어디서 해? | 교내장학금 신청 방법과 신청 시기 |
| 수강정정 기간에 채플도 바꿀 수 있어? | 수강신청·정정 일정 구조 |
| 도서관 금요일 몇 시까지 해? | 도서관 위치·운영시간 |
| 스터디룸 혼자 예약 돼? | 도서관 그룹토의실 예약 방법 |
| 장학금 문의는 어디로 전화해? | 업무별 문의처 |
| 학생식당 메뉴 알려줘 | found: false (자료 없음 처리 확인) |

## 8단계: 빠른 응답 — LLM 없이 처리하는 FAQ 라우터

학부사무실 위치, 병결 서류, 휴학·복학 절차처럼 답이 정해진 질문은 **GPT를 호출하지 않고** DB의 정답 템플릿으로 바로 답한다. 비용과 응답 시간을 줄이고, 답변이 매번 같게 나오도록 하는 것이 목적이다.

### 8-1. 테이블

```sql
create table kb_faq (
  id            text primary key,          -- 예: 'office-location'
  title         text not null,
  keywords      text[] not null,           -- 하나라도 포함되면 후보
  required_any  text[][],                  -- 묶음별로 하나씩은 꼭 포함돼야 함. 예: {{'병결','결석','아파서','진료'},{'서류','제출','인정'}}
  slots         text[],                    -- 필요한 변수. 예: {'department'}
  answer_template text not null,           -- {{department}} 같은 변수 사용
  source_url    text not null,
  academic_year int,
  needs_review  boolean default true,
  review_note   text,
  priority      int default 0
);

create table department_offices (
  department    text primary key,          -- 공식 학부명
  aliases       text[],                    -- 예: {'컴공','컴퓨터공학과'}
  building      text not null,
  room          text not null,
  phones        text[] not null,
  source_url    text not null,
  needs_review  boolean default true,
  review_note   text
);

create table chat_logs (
  id            uuid primary key default gen_random_uuid(),
  demo_user_id  text,
  question      text not null,
  route         text not null check (route in ('faq','faq_clarify','engine','rag_llm','no_source','blocked')),
  faq_id        text,
  model         text,
  input_tokens  int,
  cached_tokens int,
  output_tokens int,
  cost_usd      numeric(10,6),
  latency_ms    int,
  created_at    timestamptz default now()
);
```

### 8-2. 라우터 (`lib/chat/router.ts`) 처리 순서

1. **정규화**: 공백·문장부호 제거, 소문자화, `kb_glossary`로 학생 표현을 공식 용어로 바꾼다. 예: 컴공 → 컴퓨터공학부, 병결 → 질병 결석.
2. **FAQ 규칙 매칭**: `keywords`에 해당하는 단어 수 + `required_any` 충족 여부로 점수를 매긴다. 동점이면 `priority`가 높은 FAQ를 선택한다.
3. **변수 채우기**: `department` 변수가 필요하면 질문에 나온 학부명 → 없으면 로그인한 더미 사용자의 학부 순서로 채운다. 그래도 없으면 `faq_clarify`로 "어느 학부인가요?"와 학부 선택 버튼을 반환한다(LLM 호출 없음).
4. **임베딩 유사도 보조 매칭**: 규칙 매칭이 실패하면 FAQ 대표 질문과 질문 임베딩의 유사도를 계산한다. 0.85 이상이면 해당 FAQ로 답한다. 임계값은 `eval`로 조정한다. 임베딩 비용은 거의 없지만 LLM 호출은 아니다.
5. **계산 질문**: 셔틀 다음 차(8-5)와 "공강", "지금 뭐 하지", "과제 언제 해" 같은 질문은 `engine` 경로로 보내 자체 추천 엔진을 실행한다. 계산 결과를 카드로 바로 보여주고, LLM 설명은 사용자가 "자세히"를 누를 때만 호출한다.
6. **그 외**: `rag_llm` 경로(9단계)로 넘긴다. 검색 결과가 없으면 `no_source`로 담당 부서 연락처만 안내한다.
7. 모든 응답에 `route`, `source_url`, 기준 학기, `needs_review` 표시 여부를 함께 반환하고 `chat_logs`에 기록한다.

화면에는 FAQ 응답에 `즉시 응답 · 공식 안내 기준`, LLM 응답에 `AI 생성 답변` 배지를 붙인다.

### 8-3. 학부사무실 시드 (`department_offices`)

출처: https://www.bu.ac.kr/bbs/web/1692/38305/artclView.do (학생홍보기자단 학부사무실 안내, 2025). 전체를 `needs_review = true`로 저장한다. 같은 부서의 인접 번호는 함께 표시한다.

```json
[
  {"department": "기독교학부", "aliases": ["기독교","신학"], "building": "목양관", "room": "103호", "phones": ["041-550-2402","041-550-2547","041-550-2548"]},
  {"department": "경찰학부", "aliases": ["경찰","경행"], "building": "본부동", "room": "715호", "phones": ["041-550-9157","041-550-2327"]},
  {"department": "경상학부", "aliases": ["경상","경영"], "building": "지혜관", "room": "609호", "phones": ["041-550-9173","041-550-9174","041-550-2488"]},
  {"department": "관광학부", "aliases": ["관광","항공서비스"], "building": "본부동", "room": "411호", "phones": ["041-550-2888"]},
  {"department": "어문학부", "aliases": ["어문","영어","일본어"], "building": "본부동", "room": "411호", "phones": ["041-550-9148","041-550-9149","041-550-2888"]},
  {"department": "간호학과", "aliases": ["간호"], "building": "조형관", "room": "618호", "phones": ["041-550-2151","041-550-2162","041-550-2319"]},
  {"department": "보건학부", "aliases": ["보건"], "building": "조형관", "room": "618호", "phones": ["041-550-2827","041-550-2163","041-550-2343"], "review_note": "원문 표기 '041-2995-2827'은 오기로 보임. 전화번호 검색 페이지 기준 2827로 저장"},
  {"department": "디자인영상학부", "aliases": ["디자인","영상"], "building": "조형관", "room": "309호", "phones": ["041-550-2713","041-550-2714","041-550-2715"]},
  {"department": "문화예술학부", "aliases": ["문예","실용음악","뮤지컬"], "building": "예술대학동", "room": "105호", "phones": ["041-550-2941","041-550-2942","041-550-2945"]},
  {"department": "사회복지학부", "aliases": ["사복","사회복지"], "building": "진리관", "room": "302호", "phones": ["041-550-0541","041-550-2597"]},
  {"department": "사범학부", "aliases": ["사범","교육과"], "building": "본부동", "room": "601호", "phones": ["041-550-9087","041-550-9088","041-550-9152"]},
  {"department": "스포츠과학부", "aliases": ["스포츠","체육"], "building": "체육관", "room": "302호", "phones": ["041-550-2107","041-550-2108"]},
  {"department": "첨단IT학부", "aliases": ["첨단IT","첨단아이티"], "building": "본부동", "room": "716호", "phones": ["041-550-9176"]},
  {"department": "컴퓨터공학부", "aliases": ["컴공","컴퓨터공학과","컴퓨터"], "building": "본부동", "room": "716호", "phones": ["041-550-9176","041-550-2514","041-550-2515"]},
  {"department": "혁신융합학부", "aliases": ["혁신융합"], "building": "본부동", "room": "715호", "phones": ["041-550-0829"]}
]
```

"학부사무실" 대신 "과사", "과사무실"이라는 표현도 `kb_glossary`에 추가한다.

### 8-4. FAQ 시드 (`kb_faq`)

답변 템플릿에는 원문 또는 팀 정리 자료에 있는 내용만 넣는다. 팀 정리 자료에서 온 내용은 `review_note`에 표시한다.

```json
[
  {
    "id": "office-location",
    "title": "학부사무실 위치·연락처",
    "keywords": ["학부사무실","과사","과사무실","사무실"],
    "required_any": [["학부사무실","과사","과사무실","사무실"],["어디","위치","몇호","전화","번호","연락처"]],
    "slots": ["department"],
    "answer_template": "{{department}} 사무실은 {{building}} {{room}}에 있습니다. 연락처: {{phones}}",
    "source_url": "https://www.bu.ac.kr/bbs/web/1692/38305/artclView.do"
  },
  {
    "id": "sick-absence",
    "title": "병결(질병 결석) 출석인정 서류",
    "keywords": ["병결","질병 결석","아파서","진료","입원","출석인정"],
    "required_any": [["병결","질병","아파서","진료","입원","결석"],["서류","제출","인정","언제","뭐"]],
    "slots": ["department"],
    "answer_template": "질병 결석은 두 가지로 인정됩니다.\n- 입원: 입원일로부터 2주 이내, 입원확인서 제출\n- 당일 진료: 해당일만 인정, 학기당 2회 이내, 진료확인서와 진료비 납부영수증 제출. 출석에 상응하는 과제물·발표 등으로 출석을 인정합니다.\n서류는 소속 학부사무실({{department}}, {{building}} {{room}})에 제출하며, 학부장 명의 출석인정 확인서 또는 학부에서 보낸 문자·이메일을 교수님이 확인한 뒤 출석으로 처리됩니다.\n제출 기한: 입원은 입원일로부터 2주 이내, 당일 진료는 진료 후 5일 이내(주말 제외). 학부사무실에서 처리된 서류는 보통 2일 뒤 받아 교수님께 제출합니다.\n유의: 과목당 학기 2회까지, 최종 인정은 교수님 재량, 비대면(전화) 진료는 인정 불가, 실제 진료 날짜가 확인되는 서류만 인정. 학과별 세부 기준은 학부사무실({{phones}})에 확인하세요.",
    "source_url": "https://www.bu.ac.kr/web/6556/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGd2ViJTJGNzg4JTJGNDY5NzklMkZhcnRjbFZpZXcuZG8lM0Y=",
    "academic_year": 2025,
    "review_note": "입원 2주·당일 진료 서류는 2025-1학기 수업운영 공지 기준. 당일 진료 5일 이내, 2일 뒤 수령, 비대면 진료 불인정은 팀 정리 자료 기준이며 공식 공지에서 미확인"
  },
  {
    "id": "other-absence",
    "title": "기타 출석인정 사유(예비군·경조사 등)",
    "keywords": ["예비군","결혼","장례","사망","출산","징병","공결"],
    "required_any": [["예비군","결혼","장례","사망","출산","징병","공결"]],
    "slots": ["department"],
    "answer_template": "출석인정 사유와 서류: 본인 결혼 5일(청첩장), 본인·배우자의 직계가족 사망 5일(사망진단서 등), 출산 본인 20일·배우자 7일(출산증명서 등), 징병검사·예비군훈련 해당 기간(징병검사통지서·훈련 참석확인서), 학부 행사 등 학부장 승인 시 해당 기간(공문서). 서류는 소속 학부사무실({{building}} {{room}})에 제출합니다.",
    "source_url": "https://www.bu.ac.kr/web/6556/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGd2ViJTJGNzg4JTJGNDY5NzklMkZhcnRjbFZpZXcuZG8lM0Y=",
    "academic_year": 2025
  },
  {
    "id": "attendance-rule",
    "title": "지각·결석 기준",
    "keywords": ["지각","조퇴","결석","출석미달","F"],
    "required_any": [["지각","조퇴","결석","출석"]],
    "answer_template": "지각·조퇴 3회는 결석 1회로 처리합니다. 실제 수업시간의 3/4 이상 출석해야 성적 처리가 가능하며, 1/4을 초과해 결석하면 성적과 관계없이 출석미달 F입니다. 출석은 '백석대학교 스마트출결(학생용)' 앱으로 확인합니다.",
    "source_url": "https://www.bu.ac.kr/web/6556/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGd2ViJTJGNzg4JTJGNDY5NzklMkZhcnRjbFZpZXcuZG8lM0Y=",
    "academic_year": 2025
  },
  {
    "id": "leave-of-absence",
    "title": "휴학 신청 절차",
    "keywords": ["휴학"],
    "required_any": [["휴학"]],
    "slots": ["department"],
    "answer_template": "휴학 절차: 종합정보시스템 → 학적정보 → 휴학신청 → 휴학원 출력 → 담임교수·주임교수 서명 → 학부사무실({{building}} {{room}}) 제출 → 학부 승인 → 승인 여부 확인.\n- 재학생은 개강 전까지 제출, 개강 후에는 부득이한 경우 등록휴학만 가능\n- 학기별 휴학 신청은 1회\n- 일반휴학은 1년 이하, 통산 2년 이내(군입대·창업·임신·출산·육아 휴학은 미산입)\n- 장학금 대상자는 등록금 납부 후 휴학해야 장학금이 유지됩니다.\n휴학 종류별 서류가 궁금하면 '군휴학 서류'처럼 물어보세요.",
    "source_url": "https://www.bu.ac.kr/web/6385/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGd2ViJTJGMTY5MiUyRjQ2MjMwJTJGYXJ0Y2xWaWV3LmRvJTNG",
    "academic_year": 2025,
    "priority": 0
  },
  {
    "id": "leave-documents",
    "title": "휴학 종류별 서류",
    "keywords": ["군휴학","군입대","입영","창업휴학","육아휴학","임신","출산휴학","일반휴학"],
    "required_any": [["휴학"],["군","입영","창업","육아","임신","출산","일반","서류"]],
    "answer_template": "휴학 종류별 서류\n- 일반휴학: 휴학원, 보호자 사유서\n- 군입대휴학: 휴학원, 입영통지서(입영일 전일까지 신청)\n- 창업휴학: 휴학원, 신청자격 증빙자료, 지도교수 추천서\n- 임신·출산휴학: 임신진단서 또는 출생증명서\n- 육아휴학: 가족관계증명서\n개강 후 입대하는 경우 일반휴학을 먼저 신청하고, 입영통지서를 받으면 군입대휴학으로 다시 신청합니다.",
    "source_url": "https://www.bu.ac.kr/web/6385/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGd2ViJTJGMTY5MiUyRjMzMjc0JTJGYXJ0Y2xWaWV3LmRvJTNG",
    "priority": 10,
    "review_note": "학생기자단 기사 기준. 학부별 공지와 다를 수 있음"
  },
  {
    "id": "return-to-school",
    "title": "복학 신청 절차",
    "keywords": ["복학","조기복학"],
    "required_any": [["복학"]],
    "slots": ["department"],
    "answer_template": "복학 절차: 종합정보시스템 → 학적정보 → 복학신청 → 학부 승인 → 승인 여부 확인(서류 제출 없음).\n- 복학 승인을 받아야 수강신청이 가능하므로 수강신청 기간 전에 신청하세요.\n- 학기별 복학 신청은 1회\n- 개강 후 복학은 수업일수 1/4선 이내에만 가능하며 학부사무실({{phones}})에 먼저 문의\n- 군필 조기복학자는 전역(예정)증명서, 수강허가증 또는 휴가증 첨부\n- 미등록 복학생은 등록기간에 종합정보시스템에서 고지서를 출력해 납부\n- 군필 복학자는 학생 예비군 전입신고 필요\n신청 기간은 매 학기 학사공지에서 확인하세요(예: 2024-2학기 7.15.~8.2.).",
    "source_url": "https://www.bu.ac.kr/web/6556/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGd2ViJTJGNzg4JTJGNDI3MDElMkZhcnRjbFZpZXcuZG8lM0Y=",
    "academic_year": 2024
  },
  {
    "id": "library-hours",
    "title": "도서관 운영시간",
    "keywords": ["도서관","열람실","학술정보관"],
    "required_any": [["도서관","열람실","학술정보관"],["몇시","시간","운영","열어","닫아","언제까지"]],
    "answer_template": "일반 도서관: 월~목 09:00~20:00, 금 09:00~18:00, 주말·공휴일 휴관. 열람실: 월~토 08:00~24:00, 일·공휴일 08:00~20:00. 시험기간·방학에는 바뀔 수 있습니다.",
    "source_url": "https://www.bu.ac.kr/web/6385/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGd2ViJTJGMTY5MiUyRjQ3OTAzJTJGYXJ0Y2xWaWV3LmRvJTNG"
  },
  {
    "id": "study-room",
    "title": "그룹토의실 예약",
    "keywords": ["스터디룸","그룹토의실","토의실"],
    "required_any": [["스터디룸","그룹토의실","토의실"]],
    "answer_template": "도서관 홈페이지 '도서관 서비스' → '그룹토의실 이용신청'에서 날짜·방·시간을 고르고 로그인 후 동반자 학번을 등록합니다(동반자 2명 이상이어야 예약 가능). 입실 전 클리커 앱으로 입구 QR 도착 인증을 해야 합니다.",
    "source_url": "https://www.bu.ac.kr/web/6385/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGd2ViJTJGMTY5MiUyRjQ0MTk5JTJGYXJ0Y2xWaWV3LmRvJTNG"
  },
  {
    "id": "scholarship-apply",
    "title": "교내장학금 신청 방법",
    "keywords": ["장학금","장학"],
    "required_any": [["장학"],["신청","어디서","방법","어떻게"]],
    "answer_template": "신규종합정보시스템 → 장학/등록 → 장학금신청 → 장학금 선택 → 조회 → 신규 → 저장 → 개인동의 → 구비서류 업로드. 온라인 신청만 인정되고, PDF는 비밀번호 잠금을 해제해 올려야 합니다. 성적우수장학금은 신청 없이 자동 선발됩니다. 문의: 학생처 041-550-9036·9037",
    "source_url": "https://www.bu.ac.kr/web/6559/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGd2ViJTJGODE4JTJGNDYyMjIlMkZhcnRjbFZpZXcuZG8lM0Y="
  }
]
```

### 8-5. 셔틀·통학버스 시드 (`shuttle_routes`, `shuttle_trips`)

캠퍼스 셔틀(두정역·천안역)과 통학버스 12개 노선 운행표다. 기존 팀 프로젝트에서 정리한 자료를 옮겨 온 것이고 공식 공지 URL은 아직 확인하지 않았다. 그래서 `source_url = null`, `needs_review = true`로 저장하고, 학기·방학별로 바뀔 수 있다는 문구를 답변 끝에 붙인다. 팀이 공식 통학버스 공지를 확인하면 `source_url`을 채운다.

```sql
create table shuttle_routes (
  id           text primary key,          -- 'campus', 'gyodae' ...
  name         text not null,
  kind         text not null check (kind in ('campus','commuter')),
  fare         text,
  aliases      text[],
  source_url   text,
  needs_review boolean default true
);

create table shuttle_trips (
  id           serial primary key,
  route_id     text references shuttle_routes(id) on delete cascade,
  direction    text not null check (direction in ('등교','하교')),
  days         text not null,             -- '매일' | '월~목' | '월~금' | '금'
  time_text    text not null,             -- 원문 그대로
  departures   time[],                    -- time_text에서 뽑은 HH:MM (없으면 빈 배열)
  range_start  time,                      -- '07:50 ~ 11:30 (상시운행)' 같은 구간 운행
  range_end    time,
  stops        text[],
  location     text,
  note         text
);
```

시드 원본 (`time_text`에서 `departures`·`range_*`를 파싱해 저장):

```json
{
  "campus_shuttle": [
    {"direction":"등교","location":"두정역 하차 후 왼쪽 방면 승강기 및 계단 앞 승차장 (두정역 푸르지오 아파트 쪽)","days":"매일","time":"07:50 ~ 11:30 (상시운행)","note":null},
    {"direction":"하교","location":"셔틀버스 승차장 (백석대학교 운동장 옆)","days":"월~목","time":"13:30 ~ 18:00 (상시운행)","note":"백석대학교 → 천안터미널 → 천안역 → 기차 및 전철"},
    {"direction":"하교","location":"셔틀버스 승차장 (백석대학교 운동장 옆)","days":"금","time":"13:30 ~ 17:30 (30분 간격 운행)","note":"백석대학교 → 천안터미널 → 천안역 → 기차 및 전철"}
  ],
  "commuter_routes": [
    {"id": "yeongdeungpo", "name": "영등포", "fare": "승차권 5,700원 (카드·현금 7,000원)", "aliases": ["영등포"],
     "trips": [
       {"direction":"등교","days":"월~금","time":"06:50","stops":["영등포 로터리 지하쇼핑센터 5번 출구 신한은행 앞"],"note":null},
       {"direction":"하교","days":"월~금","time":"교대 노선 이용","stops":[],"note":"교대역 정차 안함"}
     ]},
    {"id": "gyodae", "name": "교대", "fare": "승차권 5,700원 (카드·현금 7,000원)", "aliases": ["교대","교대역"],
     "trips": [
       {"direction":"등교","days":"월~목","time":"1회차 07:30 / 2회차 08:30","stops":["교대역 8번 출구","교대역 14번 출구(세연타워) 커피숍 앞"],"note":null},
       {"direction":"등교","days":"금","time":"07:30","stops":["교대역 8번 출구","교대역 14번 출구(세연타워) 커피숍 앞"],"note":null},
       {"direction":"하교","days":"월~목","time":"13:30, 14:30, 15:30, 16:30, 17:30, 18:20","stops":["학교승차장","신갈정류장","죽전정류장","양재","강남"],"note":"교대역 정차 안함"},
       {"direction":"하교","days":"금","time":"14:30, 16:30","stops":["학교승차장","신갈정류장","죽전정류장","양재","강남"],"note":"교대역 정차 안함"}
     ]},
    {"id": "jamsil", "name": "잠실", "fare": "승차권 5,700원 (카드·현금 7,000원)", "aliases": ["잠실","잠실역"],
     "trips": [
       {"direction":"등교","days":"월~금","time":"06:50","stops":["잠실역 4번 출구 (롯데마트) 전방 150M 시계탑 소화전 앞"],"note":null},
       {"direction":"하교","days":"월~금","time":"교대 노선 이용","stops":[],"note":"교대역 정차 안함"}
     ]},
    {"id": "bundang", "name": "분당", "fare": "승차권 5,700원 (카드·현금 7,000원)", "aliases": ["분당","야탑","서현"],
     "trips": [
       {"direction":"등교","days":"월~목","time":"1회차 07:30 / 2회차 08:30","stops":["야탑역 4번 출구 택시승강장 (MG새마을금고)"],"note":null},
       {"direction":"등교","days":"금","time":"07:30","stops":["야탑역 4번 출구 택시승강장 (MG새마을금고)"],"note":null},
       {"direction":"하교","days":"월~목","time":"15:30, 16:30, 18:20","stops":["학교승차장","죽전정류장","서현역","야탑역"],"note":null},
       {"direction":"하교","days":"금","time":"16:30","stops":["학교승차장","죽전정류장","서현역","야탑역"],"note":null}
     ]},
    {"id": "incheon-songnae", "name": "인천 · 송내", "fare": "승차권 6,500원 (카드·현금 7,000원)", "aliases": ["인천","송내","문학경기장"],
     "trips": [
       {"direction":"등교","days":"월~금","time":"06:20 (인천 문학경기장) / 06:40 (송내)","stops":["문학경기장역 1번 출구","송내(남부역) 1번 출구 바닥 14번 표시자리"],"note":null},
       {"direction":"하교","days":"월~목","time":"16:30, 18:20","stops":["학교승차장","송내 남부역"],"note":null},
       {"direction":"하교","days":"금","time":"운행 없음","stops":[],"note":"금요일 운행 없음"}
     ]},
    {"id": "ansan", "name": "안산", "fare": "승차권 6,000원 (카드·현금 7,000원)", "aliases": ["안산","상록수","중앙역"],
     "trips": [
       {"direction":"등교","days":"월~금","time":"07:00 (중앙역) / 07:10 (상록수역)","stops":["중앙역 1번 출구 택시승차장","상록수역 3번 출구 롯데리아 앞"],"note":null},
       {"direction":"하교","days":"월~목","time":"16:30, 18:20","stops":["학교승차장","상록수역","중앙역"],"note":null},
       {"direction":"하교","days":"금","time":"운행 없음","stops":[],"note":"금요일 운행 없음"}
     ]},
    {"id": "anyang", "name": "안양", "fare": "승차권 5,400원 (카드·현금 6,000원)", "aliases": ["안양","범계"],
     "trips": [
       {"direction":"등교","days":"월~목","time":"06:50 (안양역) / 07:00 (범계역)","stops":["안양역 앞 1번가 공영주차장 앞","범계역 4번 출구 택시승강장"],"note":null},
       {"direction":"하교","days":"월~목","time":"16:30","stops":["학교승차장","신갈TG","영통입구","법원사거리","범계역","안양역"],"note":null}
     ]},
    {"id": "suwon", "name": "수원", "fare": "승차권 5,400원 (카드·현금 6,000원)", "aliases": ["수원","영통","동탄"],
     "trips": [
       {"direction":"등교","days":"월~목","time":"1회차 07:30~08:00 / 2회차 08:30~09:00","stops":["법원사거리 쉐보레매장 (이브자리)","영통 고가 밑 버스정류장 (영통입구 수원, 신갈IC 방면)","수원 T/G 입구 버스정류장 (BMW 매장 앞)","동탄 이마트 버스정류장 (동탄IC 방면)"],"note":"1회차: 07:30 법원사거리, 07:40 영통입구, 07:45 수원 T/G, 08:00 동탄이마트 / 2회차: 08:30, 08:40, 08:45, 09:00"},
       {"direction":"등교","days":"금","time":"운행 없음","stops":[],"note":"금요일 운행 없음"},
       {"direction":"하교","days":"월~목","time":"안양 노선 이용","stops":[],"note":null}
     ]},
    {"id": "yongin", "name": "용인", "fare": "승차권 5,400원 (카드·현금 6,000원)", "aliases": ["용인","강남대","신갈"],
     "trips": [
       {"direction":"등교","days":"월~금","time":"07:10 / 07:15 / 07:30 / 07:35","stops":["용인 시외버스터미널 공영주차장 앞","명지대 사거리 근처 삼성디지털 앞","강남대 삼거리 굿모닝외과 건물 앞","신갈 고속시외버스 정류소"],"note":"07:10 용인시외버스터미널, 07:15 삼성디지털프라자, 07:30 강남대 삼거리, 07:35 신갈시외버스정류소"},
       {"direction":"하교","days":"월~금","time":"교대 · 안양 · 수원 노선 이용","stops":["신갈정류장 (고속도로)"],"note":"노선 이용 후 신갈정류장 하차"}
     ]},
    {"id": "suwon-byeongjeong", "name": "수원 · 병점 · 오산 · 평택", "fare": "승차권 5,400원 (카드·현금 6,000원)", "aliases": ["병점","오산","평택","수원역"],
     "trips": [
       {"direction":"등교","days":"월~목","time":"07:00 / 07:15 / 07:30 / 08:10","stops":["수원역 파출소 우측 50m 앞","병점 홈플러스 버스정류장","오산역 환승센터 파출소 20M 앞 (온누리약국)","평택대 입구 GS25 편의점 버스승강장 앞","평택 안성스타필드(마트킹) 버스승강장"],"note":"07:00 수원역, 07:15 병점, 07:30 오산, 08:10 평택"},
       {"direction":"하교","days":"월~목","time":"하교차량 없음","stops":[],"note":null}
     ]},
    {"id": "jukjeon", "name": "죽전", "fare": "승차권 5,700원 (카드·현금 7,000원)", "aliases": ["죽전"],
     "trips": [
       {"direction":"등교","days":"월~목","time":"1회차 07:30~07:50 / 2회차 08:50~09:00 (수시운행)","stops":["죽전 간이정류장 (고속도로 하행 부산 방면)"],"note":null},
       {"direction":"등교","days":"금","time":"운행 없음","stops":[],"note":"금요일 운행 없음"},
       {"direction":"하교","days":"월~금","time":"서울 방면 노선 이용","stops":["죽전 간이정류장 (고속도로 상행 서울 방면)"],"note":"서울 방면 노선 이용 후 하차"}
     ]},
    {"id": "asan", "name": "아산", "fare": "승차권 2,000원", "aliases": ["아산","배방","천안"],
     "trips": [
       {"direction":"등교","days":"월~금","time":"07:30 / 07:35 / 07:45","stops":["아산시외버스터미널(모종환승장) 앞","아산이마트 옆 LG전자 앞","배방역 사거리 천안 13Km 표지판 앞"],"note":"07:30 터미널, 07:35 LG전자, 07:45 배방역 / 승차권: 진리관 CU편의점 앞 발권기"},
       {"direction":"하교","days":"월~금","time":"하교차량 없음","stops":[],"note":null}
     ]}
  ]
}
```

- `departures` 파싱: `HH:MM` 토큰을 모두 뽑는다. 예: `1회차 07:30 / 2회차 08:30` → 07:30, 08:30. 
- `HH:MM ~ HH:MM (상시운행)` 또는 `(30분 간격 운행)`은 `range_start`·`range_end`로 저장한다.
- 시각이 없는 값(`교대 노선 이용`, `운행 없음`, `하교차량 없음`)은 `departures`를 비우고 원문만 안내한다.
- 아산 노선 승차권은 진리관 CU편의점 앞 발권기에서 산다는 안내를 `note`에 둔다.

**셔틀 다음 차 계산 (`engine` 경로, LLM 없음)**

- 트리거: "다음", "지금", "곧", "막차", "몇 시" 중 하나 + 셔틀·통학·노선명(`aliases`)
  - 예: "교대 다음 버스", "지금 캠퍼스 셔틀 있어?", "분당 막차"
- 방향
  - 질문에 "등교" 또는 "하교"가 있으면 그 방향을 쓴다.
  - 없으면 12시 이전은 등교, 이후는 하교로 본다.
  - 답변에 어느 방향 기준인지 밝힌다.
- 현재 시각(Asia/Seoul)과 요일로 다음 출발을 계산한다.
  - 예: "【교대 통학버스 · 하교】 오늘(목) 다음 출발 15:30, 이후 16:30·17:30·18:20. 정류장: 학교승차장 → 신갈정류장 → 죽전정류장 → 양재 → 강남 (교대역 정차 안함)"
  - 구간 운행 중이면 "지금 상시 운행 중"이라고 답한다.
  - 남은 차가 없으면 "오늘 운행 종료"와 다음 운행일 첫차를 안내한다.
- 함수는 `now`를 인자로 받는다. 테스트에서 시각을 고정할 수 있게 한다.
- 노선명 없이 "통학버스"만 물으면 노선 목록을 보여주고 `faq_clarify`로 노선 선택 버튼을 반환한다.

## 9단계: GPT-5 mini 연동 (`lib/chat/llm.ts`, `netlify/functions/chat.ts`)

### 9-1. 기본 설정

- SDK: 공식 `openai` npm 패키지, **Responses API** 사용.
- 모델: `gpt-5-mini` (환경변수 `OPENAI_MODEL`로 바꿀 수 있게).
- 가격 기준(100만 토큰당): 입력 $0.25, 캐시 입력 $0.025, 출력 $2.00 → `lib/chat/pricing.ts`에 상수로 두고 비용 계산에 사용.
- 환경변수: `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-5-mini`, `EMBEDDING_MODEL=text-embedding-3-small`, `DAILY_BUDGET_USD=1`, `MAX_OUTPUT_TOKENS=800`. `.env.example`에 키 이름만 적고 실제 값은 넣지 않는다.
- API 키는 서버(Netlify Functions 또는 기존 Node 백엔드)에서만 읽는다. 프론트엔드 번들에 `OPENAI_API_KEY`가 포함되지 않는지 빌드 결과물을 검색해 확인한다.

### 9-2. 호출 흐름 (`rag_llm` 경로)

```text
질문 → 질문 임베딩 → kb_chunks 검색(상위 4개)
     → 결과 없음: no_source 응답(LLM 호출 안 함)
     → 결과 있음: 프롬프트 조립 → gpt-5-mini 호출 → 출처 붙여 반환
```

```typescript
const res = await openai.responses.create({
  model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
  instructions: SYSTEM_PROMPT,          // 항상 같은 문자열 → 캐시 입력 할인
  input: [
    { role: "user", content: buildContext(chunks, demoUser, engineResult) },
    ...recentTurns.slice(-4),           // 최근 2턴만
    { role: "user", content: question },
  ],
  reasoning: { effort: "low" },         // 지원되면 "minimal"로 테스트
  max_output_tokens: Number(process.env.MAX_OUTPUT_TOKENS ?? 800),
});
```

- `max_output_tokens`에는 추론 토큰도 포함되므로 너무 낮게 잡아 답변이 잘리지 않는지 확인한다. 잘리면 `status`/`incomplete_details`를 확인해 "답변이 길어 일부만 표시" 처리를 한다.
- 사용자 정보는 더미 값 중 `이름`, `학부`, `학년`, `오늘 시간표 요약`만 `buildContext`에 넣는다.
- 일정 계산 결과(`engineResult`)가 있으면 "계산 결과: 14:05~14:45 도서관 이용 가능(40분)"처럼 확정된 값으로 넣고, LLM이 이 값을 바꾸지 못하게 지시한다.

### 9-3. 시스템 지침 (`lib/chat/systemPrompt.ts`)

```text
너는 백석대학교 학생 안내 비서(백석AI 비서)다.
- 아래 [근거] 안의 내용만 사용해 한국어로 답한다. 근거에 없는 날짜·금액·조건은 만들지 않는다.
- 학사일정은 https://www.bu.ac.kr/web/3443/subview.do 근거만 사용한다. 공식 일정에 「중간고사 기간」이 없으면 중간고사 날짜를 단정하지 말고, 「중간 강의평가」·「기말고사」·진리축전 등 표기된 항목만 안내한다. 과목별 시험은 강의계획서·교수 공지를 안내한다.
- 근거가 부족하면 "공식 자료에서 확인되지 않습니다"라고 말하고 [근거]의 담당 부서 연락처를 안내한다.
- 근거 문서의 적용 학기가 현재 학기와 다르면 "YYYY-N학기 기준 안내"라고 밝힌다. 현재 학기는 2026-2다.
- [계산 결과]의 시간·장소 값은 그대로 사용하고 다시 계산하지 않는다.
- 답변은 5문장 이내, 필요하면 짧은 목록을 쓴다.
- 마지막 줄에 사용한 근거 번호를 [1][2] 형태로 적는다.
```

서버는 LLM 응답의 `[n]`을 해당 조각의 `source_url`로 바꿔 화면에 출처 링크로 표시한다.

### 9-4. 비용·남용 방지

- 응답의 `usage`(input, cached, output 토큰)를 `chat_logs`에 저장하고 `cost_usd`를 계산한다.
- 호출 전에 오늘 `cost_usd` 합계가 `DAILY_BUDGET_USD`를 넘으면 LLM을 호출하지 않고 `blocked` 경로로 "오늘 AI 답변 한도에 도달했습니다. 즉시 응답 가능한 질문은 계속 이용할 수 있습니다"를 반환한다.
- 더미 사용자·IP별 분당 10회 제한.
- 같은 질문(정규화 후 해시)과 같은 근거 조합이면 24시간 캐시된 답변을 재사용한다.
- OpenAI 오류(429·5xx)는 1회만 재시도하고, 실패하면 검색된 근거 원문 요약과 출처 링크를 그대로 보여준다.

### 9-5. 시연용 통계 화면 (`/admin/stats`)

`chat_logs`를 집계해 아래를 보여준다. 발표에서 "LLM 없이 처리한 비율"을 근거로 쓴다.

- 경로별 비율: faq / faq_clarify / engine / rag_llm / no_source / blocked
- 경로별 평균 응답 시간
- 오늘·누적 토큰 사용량과 비용
- 많이 나온 질문 상위 10개, FAQ로 추가할 후보(같은 질문이 `rag_llm`으로 3회 이상 처리된 경우)

## 10단계: 라우터·LLM 검증 (`scripts/chat/eval.ts`)

| 질문 (더미 사용자: 컴퓨터공학부) | 기대 경로 | 확인 내용 |
|---|---|---|
| 과사 어디야? | faq | 본부동 716호, 9176 |
| 경찰학부 사무실 몇 호야? | faq | 질문의 학부가 사용자 학부보다 우선 |
| 학부사무실 어디야? (학부 없는 사용자) | faq_clarify | 학부 선택 버튼 반환 |
| 병결 서류 뭐 내야 하고 언제까지야? | faq | 입원 2주 이내·당일 진료 5일 이내(주말 제외), 서류 목록 |
| 예비군 가면 출석 인정돼? | faq | 해당 기간, 훈련 참석확인서 |
| 지각 3번이면? | faq | 결석 1회 |
| 휴학하려면 어떻게 해? | faq | 휴학 절차 |
| 군휴학 서류 뭐야? | faq | `leave-documents`가 `leave-of-absence`보다 우선 |
| 복학 신청 어떻게 해? | faq | 서류 없음, 수강신청 전 승인 |
| 도서관 금요일 몇 시까지? | faq | 18:00 |
| 교대 다음 버스 언제야? (목 15:00 고정) | engine | 하교 15:30, 이후 16:30·17:30·18:20 |
| 교대 다음 버스 언제야? (금 15:00 고정) | engine | 하교 16:30 |
| 인천 하교 버스 (금 17:00 고정) | engine | 금요일 운행 없음 |
| 캠퍼스 셔틀 지금 있어? (화 09:00 고정) | engine | 등교 상시 운행 중 |
| 분당 막차 (목 19:00 고정) | engine | 오늘 운행 종료 + 다음 운행일 첫차 |
| 통학버스 시간 알려줘 | faq_clarify | 노선 선택 버튼 |
| 지금 공강인데 뭐 하지? | engine | LLM 호출 0회 |
| 성적장학금 받으려면 몇 학점 들어야 해? | rag_llm | 15학점(4학년 12학점), 출처 표시 |
| 학생식당 메뉴 알려줘 | no_source | LLM 호출 0회 |

- `faq`, `faq_clarify`, `engine`, `no_source` 경로에서 OpenAI 호출이 0회인지 모의 클라이언트로 검증한다.
- `rag_llm` 응답에 출처 링크가 1개 이상 포함되는지 검증한다.

## 완료 기준

- 마이그레이션, 시드, 수집기, 청킹, 검색, 평가 스크립트가 각각 `npm run kb:migrate`, `kb:seed`, `kb:collect`, `kb:chunk`, `kb:eval` 로 실행된다.
- `npm run chat:eval`로 10단계 표의 19개 질문이 기대 경로로 처리된다.
- 시드만으로도 평가 질문 9개가 기대 문서를 찾는다.
- `npm run kb:shuttle-seed`로 셔틀 운행표가 저장되고, 다음 차 계산이 시각 고정 테스트를 통과한다.

---
