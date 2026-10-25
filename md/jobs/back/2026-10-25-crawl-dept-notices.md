# [2026.10.25] 학부공지 2026 크롤 → Notice 적재

## 작업 개요
- 첨단IT학부·컴퓨터공학부 학부공지 게시판에서 **2026년** 글만 수집
- JSON 저장 후 Supabase `Notice`에 중복(title+link / 결정적 id) 없이 upsert
- `Notice` 컬럼: `id, title, content, category, tags, deadlineAt, createdAt, updatedAt` — **source/link 컬럼 없음**. 앱은 `content`에서 URL, `tags`를 source로 사용 (`notice.service.ts`)

## 변경 파일
| 파일 | 변경 내용 |
|------|-----------|
| `Back/scripts/crawl-dept-notices.mjs` | 목록 페이징 크롤 + JSON + Notice upsert |
| `Back/supabase/dept-notices-2026.json` | 수집 결과 (75건) |

## 결과
| source | count |
|--------|------:|
| 첨단IT학부 | 55 |
| 컴퓨터공학부 | 20 |
| **합계** | **75** |

- DB insert: 성공 (75건, 기존 전체공지 283건과 중복 없음)

## 사용법
```bash
node Back/scripts/crawl-dept-notices.mjs
```
환경: 루트 `.env`의 `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (없으면 JSON만 기록)

## Notice row shape
- `title`, `content` = 원문 absolute link, `category` = `학부공지`, `tags` = source(학부명), `createdAt` = 게시일 `YYYY-MM-DDT00:00:00.000Z`, `id` = `dept-` + sha1(link) 앞 16자
