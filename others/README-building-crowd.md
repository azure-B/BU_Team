# others 데이터셋 안내

## Chivox MCP (영어 발음 평가)
- Cursor MCP 예시: [`chivox-mcp.cursor.example.json`](chivox-mcp.cursor.example.json) — `Authorization: Bearer <키>`
- 앱 연동: 루트 `.env`의 `CHIVOX=…` → `POST /api/language/eval` → Footer 언어 트레이닝 마이크

## 거리·이동시간 산출 로직
- 문서: [`campus-distance-logic.md`](campus-distance-logic.md) — 어떻게 계산하는지 + 근거(상수·문헌·API)
- 표: [`campus-walk-minutes.csv`](campus-walk-minutes.csv) — 건물 간 맑은 날 도보 분(CampusEdge)

## 음성 혼잡도 (CrowdioSet 일부)
- 경로: `others/crowd-audio/`
- 라벨 `0` 한산 / `1` 보통 / `2` 혼잡 (임시 RMS·이벤트 규칙, 청취 재라벨링 예정)
- 상세: [`crowd-audio/README.md`](crowd-audio/README.md)

---

# 건물·시간대 인원 쏠림 (Course DB)

## 산출
- 출처: Supabase `Course.capacity` + `meetings`/`day`/`startTime` + `room` 접두어 → 건물
- **그 시각 인원**은 `estimated_people`만 보면 됨 (아래 컬럼 표 참고)
- 실제 출석·복도 유동이 아니라 **강의 정원(capacity) 기준 쏠림 지표**
- 재생성: `node Back/scripts/export-building-crowd-csv.mjs`

## 파일
| 파일 | 내용 |
|------|------|
| `building-crowd-by-hour.csv` | 건물 × 월–금 × 08–21시 전체 격자 |
| `building-crowd-peaks.csv` | 건물별 피크 슬롯만 |
| `building-crowd-meta.json` | 생성 시각·피크값·스킵 room 통계 |

---

## `building-crowd-by-hour.csv` 컬럼

| 컬럼 | 의미 | 비고 |
|------|------|------|
| `building` | 건물명 | `room` 접두어로 매핑 (본부→본부동, 진리→진리관 등) |
| `day` | 요일 숫자 | 1=월 … 5=금 |
| `day_label` | 요일 한글 | 월/화/수/목/금 |
| `hour` | 시(0–23) | 정수. 격자 08–21 |
| `start_label` | 시각 표시 | `HH:00` |
| `class_start_count` | **그 슬롯에 시작하는** 강의 수 | 0이면 그 시각 시작 수업 없음 |
| `estimated_people` | **그 슬롯 예상 인원** | 그 시각 시작 수업들의 `capacity` 합. **이 값이 해당 시각 인원** |
| `building_peak_people` | 그 건물 **전체 중** 최다 `estimated_people` | 모든 행에 같은 건물이면 같은 값. **그 시각 인원이 아님** (예: 화 20:00에 0명이어도 피크가 210이면 여기만 210) |
| `peak_share_pct` | 피크 대비 비율(%) | `estimated_people / building_peak_people × 100` |
| `is_peak` | 건물 내 피크 슬롯 여부 | `1` = 그 건물에서 `estimated_people`이 최대인 슬롯, 아니면 `0` |
| `sample_rooms` | 샘플 강의실 | 해당 슬롯 room 최대 5개, `\|` 구분 |

### 읽는 법 (헷갈리기 쉬운 점)
```
글로벌관,2,화,20,20:00,0,0,210,0,0,
                         │ │  └── building_peak_people (건물 피크 참조, 월 13:00의 210)
                         │ └── estimated_people = 0  ← 화 20:00 실제 슬롯 인원
                         └── class_start_count = 0
```
→ **20시에 210명이 아니라**, 글로벌관 피크가 210명이라는 뜻.

---

## `building-crowd-peaks.csv` 컬럼

피크 슬롯만 모은 요약 파일.

| 컬럼 | 의미 |
|------|------|
| `building` | 건물명 |
| `day_label` | 피크 요일 |
| `start_label` | 피크 시각 |
| `estimated_people` | 그 피크 슬롯의 capacity 합 |
| `class_start_count` | 그 피크 슬롯 시작 강의 수 |
| `sample_rooms` | 샘플 강의실 |

---

## `building-crowd-meta.json`
생성 시각, 건물 목록, 건물별 피크값, 건물 미매핑으로 스킵한 `room` 상위 목록.
