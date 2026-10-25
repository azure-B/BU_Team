# [2026.10.25] 진행 중 수업 GPS 출석·미도착 안내

## 변경
- `NextClassCard`: wind-down만으로 다음 수업으로 넘기지 않음 (조기종료 후에만 lookingAhead)
- 진행 중 수업이면 카드에 현재 수업 표시 (`NOW` / `수업 중`)
- 실제 GPS로 강의실 건물 체류 판별
  - 건물 안: 수업 중 응원 문구
  - 건물 밖·시작 직후: 살짝 서두르라는 부드러운 지각 안내
  - 건물 밖·한참 후: 괜찮으신지 묻는 부드러운 안내
  - GPS 없음: 수업 시간임을 알리고 동선만 참고

## 파일
- `Front/src/components/dashboard/DashboardSections.jsx`
