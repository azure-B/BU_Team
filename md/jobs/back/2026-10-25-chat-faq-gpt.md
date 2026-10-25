# [2026.10.25] 백석AI 비서 — FAQ 우선 · GPT 위임

## 흐름
1. **faq** — 학부사무실·병결·휴학·도서관·장학 등 로컬 시드
2. **faq_clarify** — 학부 미지정 시 선택지 반환
3. **engine** — 학사일정(공식 2026)
4. **rag_llm** — 그 외 GPT (`gpt-5-mini` Responses API)

## 엔드포인트
- `POST /api/chat` · `/api/v1/chat`

## 파일
- `Back/src/data/departmentOffices.ts`
- `Back/src/data/faqSeeds.ts`
- `Back/src/data/academicCalendar.ts`
- `Back/src/services/chat/*`
- `Back/src/controllers/chat.controller.ts`
- `Back/src/routes/chat.routes.ts`
