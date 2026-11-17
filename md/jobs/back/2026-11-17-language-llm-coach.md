# 말하기 평가 LLM 2차 패스

- `askPronunciationCoach` (`chat/llm.ts`) — 점수 JSON → 한국어 코칭 문장
- `chivox.service.ts` — 평가 성공 후 LLM 호출, 실패 시 기존 템플릿 폴백
- 응답 `feedbackSource`: `llm` | `template`
- 환경변수: `OPENAI_API_KEY`, `OPENAI_MODEL`
