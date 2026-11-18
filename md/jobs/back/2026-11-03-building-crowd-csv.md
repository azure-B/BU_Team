# 건물·시간대 인원 쏠림 CSV

## 작업
- `Back/scripts/export-building-crowd-csv.mjs` — Course capacity를 건물·요일·시작시로 합산
- 출력: `others/building-crowd-by-hour.csv`, `building-crowd-peaks.csv`, `building-crowd-meta.json`

## 지표
`estimated_people` = 해당 슬롯 시작 수업의 `capacity` 합 (정원 기준 쏠림)
