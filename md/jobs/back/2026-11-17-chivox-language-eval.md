# Chivox MCP → 언어 트레이닝 발음 평가

## 배경
Footer AI 영어(언어) 트레이닝이 미리보기만 있었고, Chivox MCP API 키를 앱 평가에 연결.

## 변경
- `Back/src/services/chivox.service.ts` — FC(`fc-global`) 우선, 실패 시 MCP Streamable HTTP `tools/call`
- `POST /api/language/eval`, `GET /api/language/status`
- env: `CHIVOX` / `CHIVOX_API_KEY` / `MCP_API_KEY` (Bearer)
- Front `LanguagePractice` 실녹음 → 서버 평가 → 트레이닝 채팅 피드백
- `others/chivox-mcp.cursor.example.json` — Cursor MCP 연결 예시

## 지원
- 영어 `en_sentence_eval`, 중국어 `cn_sentence_eval`
