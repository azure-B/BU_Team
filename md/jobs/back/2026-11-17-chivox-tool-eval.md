# Chivox 툴 기반 언어 평가

- `chivox.service.ts` — `tool` 인자로 FC/MCP 호출 (`en_sentence_eval` / `en_open_eval` / `en_semi_open_eval` / `cn_sentence_eval` / `cn_aitalk_eval`)
- `GET /api/language/tools`, `GET /api/language/status`에 툴 카탈로그·샘플 주제 포함
- `POST /api/language/eval` — body `tool` + `refText` + `audioBase64` (`locale`만 오면 문장 평가 툴로 하위 호환)
- Front: 영어 문장 따라 읽기 → 사용자 노출 문구에서 제공사·툴명 제거, 평가 결과만 비서 메시지로 표시
- 점수 파싱: FC/MCP 트리 BFS로 `overall` 탐색, 빈 FC result·파싱 실패 시 MCP 재시도
- `core is timeout`(53000) / MCP `isError` → 짧은 재녹음 안내
- WAV는 PCM으로만 12초 trim (base64 중간 절단 금지)
- Front 녹음 webm → 16kHz mono WAV(최대 12초) (`audioWav.js`)
