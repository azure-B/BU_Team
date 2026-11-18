# 언어 트레이닝 — Chivox 툴 UI

- `LanguagePractice.jsx` — `CHIVOX_TOOLS` 카탈로그, 툴 id 표시, read/speak 안내
- `Footer.jsx` — 언어(일·독 등) 칩 → Chivox 툴 칩, 「다음 주제」로 샘플 순환
- `languageApi.js` — `postLanguageEval({ tool, refText, ... })`, `getLanguageTools`
- 사용 API: `GET /language/status`, `POST /language/eval` (`tool` 필수 권장)
