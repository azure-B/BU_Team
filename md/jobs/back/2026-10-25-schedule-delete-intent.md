# [2026.10.25] 챗봇 일정 삭제 의도(5)

## 변경
- 의도 코드 `5` = 삭제 (`없애줘`/`지워줘`/`삭제` 등). GPT·로컬 분류·DELETE 키워드 우선
- 실제 수업(`CLASS`)은 삭제 거부. `PERSONAL`/`WEEKLY`/`TASK` 및 제목이 스터디·약속 등인 오등록 CLASS만 삭제
- `scheduleAction.status`: `deleted`
- 이승빈(`mocked_user_id`) 화 07:00~08:00 「스터디」 CLASS 오등록 건 DB 삭제

## 파일
- `Back/src/services/chat/scheduleIntent.ts`
- `Back/src/services/chat/llm.ts`
- `Back/src/services/chat/router.ts` — `5`·삭제 키워드 분기
- `md/API/README.md`
