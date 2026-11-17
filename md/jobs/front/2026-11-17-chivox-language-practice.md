# 언어 트레이닝 Chivox 실평가 연결

## 변경
- `LanguagePractice.jsx` — 마이크 녹음(최대 1분) 후 `POST /language/eval`
- `Footer.jsx` — `getLanguageStatus`로 키 연결 여부 표시, 평가 결과를 트레이닝 말풍선에 삽입
- `Front/src/api/languageApi.js` 추가

## 사용 API
- `GET /api/language/status`
- `POST /api/language/eval`
