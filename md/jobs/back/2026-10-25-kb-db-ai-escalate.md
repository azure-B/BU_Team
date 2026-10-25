# [2026.10.25] KB DB 적재 · AI 연결하기

## 1. AI 연결하기
- 즉시 응답(`faq`/`engine`)에 `canEscalateToAi`
- Front: 「답변이 마음에 들지 않나요? AI 연결하기」 → `forceLlm`로 동일 질문 재질의 + 이후 GPT 우선

## 2. Supabase KB
스키마: `Back/supabase/kb_chat.sql`
- `professors` · `department_offices` · `kb_faq` · `kb_glossary`

시드: `cd Back && npm run kb:seed`  
런타임: `kbStore.ensureKbLoaded()` — DB 우선, 실패 시 로컬 시드

## 파일
- `Back/supabase/kb_chat.sql`
- `Back/scripts/seed-kb-chat.mjs`
- `Back/src/services/chat/kbStore.ts`, `router.ts`
- `Front/.../Footer.jsx` (+css)
