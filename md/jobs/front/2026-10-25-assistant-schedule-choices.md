# [2026.10.25] 비서 일정 선택지 클릭 → 바로 등록 요청

## 변경
- `route === 'schedule'` 또는 「일정 등록」 문구 칩 클릭 시 `askAssistant(choice)`로 전송
- (기존) 학부/교수 칩만 사무실·교수 질의로 바꾸던 분기와 분리

## 파일
- `Front/src/components/layout/Footer/Footer.jsx`

## 사용 API
- `POST /api/chat`
