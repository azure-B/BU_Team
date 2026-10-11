# AI 비서 모달 자동 확장

- 일시: 2026-10-11
- 영역: Front

## 변경 요약

- 최초 호출에는 헤더·입력창·추천 질문만 보이는 컴팩트 모드를 유지한다.
- `isExpanded`는 입력 내용 또는 대화 내역 유무에서 계산한다. 입력을 시작하거나 추천 칩을 선택하면 확장되고, 메시지가 없는 상태에서 입력을 지우면 컴팩트 모드로 돌아간다.
- 전송한 질문을 대화 내역에 추가하고 입력창을 비운다. 기존 650ms 후 자동 닫기 동작을 제거했다. AI 답변 API는 연결하지 않는다.
- 콘텐츠 높이를 측정하여 기존 버튼→모달 스프링 모션으로 높이와 상단 위치를 함께 변경한다. 하단 위치는 고정하며 텍스트를 확대하지 않는다.
- 화면 높이와 모바일 visualViewport에 맞춰 최대 높이를 제한하고 대화 영역만 스크롤한다. 새 메시지에는 최신 대화로 이동한다. Escape·포커스 제한·reduced-motion 동작을 유지한다.

## 변경 파일

- `Front/src/components/layout/Footer/Footer.jsx`
- `Front/src/components/layout/Footer/Footer.css`
- `Front/publish/index.html`, `Front/publish/assets/`
- `md/jobs/front/2026-10-11-assistant-expand.md`

## 사용 API

- 없음 (프론트 대화 상태 및 모달 모션 구현).

## 검증

- 프로덕션 빌드 성공 (`--emptyOutDir false`, 기존 산출물 유지). 기존 500kB 번들 경고 유지.
- 일정 모델 테스트 9개 통과.
- Playwright/Chrome: 320·390·1440px에서 초기 컴팩트, 입력 확장·빈 입력 축소, 추천 칩, 전송 후 대화 유지, 연속 메시지에 따른 크기 증가·스크롤, 420px 높이에서 화면 내 표시, Escape 닫기 검증.
- reduced-motion에서도 확장 동작 확인. 런타임 오류 없음. 모바일 화면 검토 완료.
