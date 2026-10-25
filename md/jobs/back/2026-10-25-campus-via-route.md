# 캠퍼스 경유지 이동 시간

날짜: 2026-10-25

## 변경
- `campusIntent.ts`: 「찍고·거쳐」 등 경유 경로를 구간 도보 합산 (예: 진리관→본부동→목양관)
- 표에 없는 구간·경유 파싱 실패 시 `deferToLlm` → GPT
- `router.ts`: defer 시 바로 `runLlm`
