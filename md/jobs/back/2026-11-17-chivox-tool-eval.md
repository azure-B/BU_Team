# Chivox 툴 기반 언어 평가

- `chivox.service.ts` — `tool` 인자로 FC/MCP 호출 (`en_sentence_eval` / `en_open_eval` / `en_semi_open_eval` / `cn_sentence_eval` / `cn_aitalk_eval`)
- `GET /api/language/tools`, `GET /api/language/status`에 툴 카탈로그·샘플 주제 포함
- `POST /api/language/eval` — body `tool` + `refText` + `audioBase64` (`locale`만 오면 문장 평가 툴로 하위 호환)
- Front: 영어 문장 따라 읽기 → 사용자 노출 문구에서 제공사·툴명 제거, 평가 결과만 비서 메시지로 표시
- 점수 파싱: FC `{ result: { result: { overall } } }` 중첩 해제
- Front 녹음 webm → 16kHz mono WAV base64 변환 후 전송 (`audioWav.js`)
