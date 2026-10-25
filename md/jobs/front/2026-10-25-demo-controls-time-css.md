# [2026.10.25] 데모 시각 input Netlify/모바일 잘림 수정

## 문제
- `type="time"`이 한국어 로케일에서 「오후 12:30」+아이콘인데 `width: 7.5rem`이라 「오후 12:3」처럼 잘림

## 변경
- 시간 입력 `min-width: 11.5rem` · shrink 방지 · webkit indicator 여유
- 좁은 화면에서 데모 컨트롤 세로 스택·시간 입력 full width
- 인사말 `nowrap` 제거 (긴 이름·학번 줄바꿈)

## 파일
- `Front/src/components/dashboard/DemoControls.css`
- `Front/src/pages/HomePage.css`
