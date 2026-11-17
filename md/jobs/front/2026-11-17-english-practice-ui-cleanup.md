# 영어 말하기 연습 UI 정리

- 제목: `백석 영어 말하기 연습`
- 연습 선택: `따라 읽기 연습` → `en_sentence_eval`, `자유 발화 연습` → `en_open_eval` (화면에는 툴명 미노출)
- 언어 변경 / 다음 문제·주제 / 제공사·툴 id 노출 제거
- 평가 후 비서 메시지로 결과만 표시 (사용자 채팅 미추가)
- 변경 파일: `Footer.jsx`, `LanguagePractice.jsx`, `LanguagePractice.css`
- 사용 API: `GET /language/status`, `POST /language/eval`
- 녹음: 브라우저 WAV 변환 제거 → MediaRecorder 원본 base64 그대로 전송
