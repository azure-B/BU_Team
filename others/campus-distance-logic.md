# 캠퍼스 거리·이동시간 산출 로직

이 문서는 **현재 코드가 거리를/시간을 어떻게 잡는지**와 **근거(상수·문헌·데이터 소스)**를 정리한 것이다.  
구현 위치는 `Back/src/utils/`, `Back/src/data/campusBuildings.ts`, `Back/src/utils/captain-route-calculator.ts`, `Back/src/services/chat/campusIntent.ts`.

---

## 1. 한 줄 요약

| 상황 | 무엇을 쓰나 | 결과 단위 |
|------|-------------|-----------|
| 챗봇 「A에서 B까지」 | 건물 간 **고정 분(CampusEdge / CAMPUS_WALK_MINUTES)** | 분 (맑은 날) + 비·뛰기 보정 |
| 대시보드 지각 ETA (캠퍼스 안, GPS≤180m) | 위 Edge 분 + **날씨 배율만** | 분 |
| 대시보드 ETA (캠퍼스 밖·스냅 실패) | **카카오 도보** 거리/시간 → 언덕·날씨 보정 | 분 (+m) |
| 카카오 실패 | **Haversine 직선거리(m)** ÷ 언덕·날씨 속도 | 분 |
| 도보 ≥ 30분 | 대중교통 추정으로 전환 | 분 |
| 최종 지각 판단 | `이동분 + 엘리베이터 대기분` | 분 |

**중요:** 건물↔건물 표는 “거리(m)”가 아니라 **이미 언덕을 반영한 도보 분**이다.  
카카오/Haversine만 미터를 다루고, 곧바로 분으로 바꾼다.

---

## 2. 건물 간 고정 분 (CampusEdge)

### 어떻게 잡나
- 코드 상수: `CAMPUS_WALK_MINUTES` (`campusBuildings.ts`)
- DB: `CampusEdge.walkingMinutes` (시드와 동일 값)
- 조회: `walkMinutesBetween(from, to)` — 양방향 대칭 조회
- 챗봇 경유: 등장 순 건물마다 구간 분을 **합산**

### 맑은 날 표 (발췌 → 전체는 `campus-walk-minutes.csv`)

| From → To | 분 |
|-----------|---:|
| 진리관 → 본부동 | 7 |
| 진리관 → 목양관 | 5 |
| 본부동 → 목양관 | 10 |
| 체육관 → 조형관 | 2 |
| 지혜관 → 조형관 | 15 |

### 근거
- **실측 GPS 연속 궤적이 아니라**, 캠퍼스 안내·도보 체감·시드 작업으로 정한 **운영용 룩업 테이블**.
- “평지 m ÷ 속도”로 역산한 값이 아니라, **언덕·계단이 있는 백석 캠퍼스를 전제로 한 분**으로 시드됨.
- 따라서 Edge에는 언덕이 **이미 들어 있음** → 날씨 보정 시 `÷ speedFactor`만 적용 (`adjustCampusEdgeMinutes`).

```
edge′ = round(edgeMinutes / weather.speedFactor)
```

---

## 3. 속도 상수 (거리 → 시간 변환의 핵심)

파일: `Back/src/utils/walk-speed.ts`

| 상수 | 값 | 의미 |
|------|-----|------|
| `KAKAO_ASSUMED_M_PER_MIN` | **67** | 평지 일반 보행 ≈ 4 km/h (카카오 ETA가 가정하는 대략 속도) |
| `CAMPUS_HILL_M_PER_MIN` | **50** | 백석 캠퍼스 언덕·가방 보행, 맑은 날 ≈ 3.0 km/h |
| 언덕 보정비 | **67 / 50 ≈ 1.34** | 카카오 평지 분을 캠퍼스 언덕 분으로 늘릴 때 사용 |
| `RUN_TIME_FACTOR` | **0.6** | 뛰어가기 ≈ 도보 시간의 60% (챗봇 안내) |
| `CAMPUS_SNAP_METERS` | **180** | GPS가 이 안이면 “캠퍼스 건물 스냅” → Edge 우선 |
| `WALK_TO_TRANSIT_MIN` | **30** | 도보 예상 ≥ 30분이면 대중교통 모드 |

### 근거 (코드 주석·문헌)
1. **평지 4 km/h (67 m/min)**  
   일반 보행 속도로 널리 쓰이는 근사. 카카오 도보 API ETA를 이 가정으로 역보정.
2. **캠퍼스 50 m/min**  
   백석대 경사·가방을 반영해 의도적으로 낮춘 **프로젝트 가정값** (문헌 수치가 아니라 캠퍼스 보정).
3. **비 배율** (보행 속도 감소 문헌을 배율로 단순화)

| rainBand | speedFactor | 조건(요약) | 유효 속도 |
|----------|------------:|------------|----------:|
| clear | 1.0 | 맑음 | 50 m/min |
| drizzle | 0.9 | 약한 비·이슬비 | 45 |
| rain | 0.8 | 비 | 40 |
| heavy | 0.7 | 폭우·뇌우 | 35 (하한 28) |

문헌 근거 (코드 주석 그대로):
- **Chang et al. (2011, Hong Kong crosswalk)**  
  맑음 1.22 m/s → 비 0.85 m/s (약 −30%) → heavy ≈ 0.70
- **Deng / Lam et al. (HKSTS·교차로)**  
  강수강도↑ → free-flow ↓ (예: 0.1 mm/h → 73.6 m/min, 15 mm/h → 55.5 m/min)
- **Shi / Tam / Lam (2017)**  
  강수강도에 따라 free-flow 75.6 → 54.7 m/min 수준 감소

날씨 데이터: **Open-Meteo** 현재 강수·WMO weather_code (천안 백석 좌표 36.8391, 127.1855), 5분 캐시.

```
speedMPerMin = max(28, 50 × speedFactor)
```

---

## 4. GPS·카카오·Haversine 경로

파일: `kakao-walking.ts`, `captain-route-calculator.ts`

### 4-1. Haversine (직선 거리 m)
지구 반지름 6371000 m 기준 구면 직선거리.

```
minutes = max(1, round(meters / speedMPerMin))
```

### 4-2. 카카오 도보 API
- URL: Kakao Mobility Walking Directions
- 입력: 현재 GPS → 목적지 Building 좌표 (`Building.x`=lat, `Building.y`=lng)
- 출력: `duration`(초), `distance`(m)
- 보정:

```
kakao′ = round( (durationSec/60) × (67/50) / speedFactor )
```

평지 ETA × 언덕비 ÷ 비배율.

### 4-3. 소스 우선순위 (대시보드)
1. GPS가 있고 최근접 건물 **≤ 180m** 이며 CampusEdge 존재 → **`campus-edge`** (날씨만 보정)
2. 그 외 GPS → **카카오** (실패 시 Haversine)
3. GPS 없고 건물 ID만 → CampusEdge
4. 없으면 기본 **10분**
5. 도보 ≥ 30분 → **transit** (카카오/추정 대중교통)

---

## 5. 엘리베이터 (거리에 포함되지 않음)

- Edge/카카오 **실외 도보**에 엘리베이터·실내 이동은 **미포함**.
- 대시보드만 `ELEVATOR_WAIT_SLOTS`(Course capacity 기반 시간대별 대기분)를 가산.

```
totalMinutes = travelMinutes + elevatorMinutes
```

챗봇 ETA 문구에는 “엘리베이터는 별도”라고 안내.

---

## 6. 챗봇 vs 대시보드

| | 챗봇 (`campusIntent`) | 대시보드 (`calculateRouteAndLateness`) |
|--|------------------------|----------------------------------------|
| 기본 | CAMPUS_WALK_MINUTES | Edge 또는 카카오/Haversine |
| 비 | `÷ factor` (가정 비 또는 실황) | Open-Meteo 실황 |
| 뛰기 | ×0.6 | (기본 도보만) |
| 엘리베이터 | 합산 안 함 | 합산 |
| 경유 | 구간 합 | 단일 OD |

---

## 7. 코드 맵

| 파일 | 역할 |
|------|------|
| `Back/src/utils/walk-speed.ts` | 속도·날씨·보정 공식 |
| `Back/src/utils/kakao-walking.ts` | Haversine + 카카오 도보 |
| `Back/src/utils/captain-route-calculator.ts` | 대시보드 경로·지각 |
| `Back/src/data/campusBuildings.ts` | CAMPUS_WALK_MINUTES, RUN_TIME_FACTOR |
| `Back/src/services/chat/campusIntent.ts` | 챗봇 ETA·경유 합산 |
| `others/campus-walk-minutes.csv` | 건물 간 맑은 날 분 표 |

---

## 8. 한계 (발표·문서용)

1. CampusEdge 분은 **실측 궤적 평균이 아닌 시드 룩업**이다.
2. 카카오 보정은 “평지 67 → 언덕 50” **비율 가정**; 구간별 경사 프로파일은 없음.
3. 비 배율은 홍콩 교차로 문헌을 **캠퍼스에 단순 이식**.
4. 엘리베이터는 Course 정원 기반 **추정 대기**, 실제 센서 아님.
5. 실내 복도·층간 이동 거리는 모델 밖.
