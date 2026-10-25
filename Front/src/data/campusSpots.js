/**
 * 백석대 캠퍼스 콘텐츠 (카카오 로컬 검색 + 학내 안내 기준)
 * lat/lng = WGS84
 */

/** 과제용 학습·휴게 공간 (건물 이동 + 실내 2분) */
export const STUDY_LOUNGES = [
  {
    id: 'study-hq',
    buildingId: 'bldg-hq',
    name: '본부동 중앙 휴게공간',
    hint: '2층부터 각 층 중앙',
    indoorExtraMin: 2,
  },
  {
    id: 'study-truth',
    buildingId: 'bldg-truth',
    name: '진리관 학습존',
    hint: '1층 로비 또는 지하1층 CU 옆',
    indoorExtraMin: 2,
  },
  {
    id: 'study-art',
    buildingId: 'bldg-art',
    name: '조형관 층별 휴게실',
    hint: '각 층 휴게실',
    indoorExtraMin: 2,
  },
  {
    id: 'study-mogyang',
    buildingId: 'bldg-mogyang',
    name: '목양관 2층 라운지',
    hint: '2층 라운지',
    indoorExtraMin: 2,
  },
  {
    id: 'study-dorm',
    buildingId: null,
    name: '기숙사 1층 라운지',
    hint: '백석생활관 1층 라운지',
    indoorExtraMin: 2,
    lat: 36.8425016,
    lng: 127.1852033,
  },
]

const WEEKDAYS = [1, 2, 3, 4, 5]
const DORM = { lat: 36.8425016, lng: 127.1852033 }

/**
 * 공강 캠퍼스 활동 (백석대 편의시설 안내·학보 백녹담·생활관 안내 기준)
 * hours: 요일(0=일)별 운영시간, breaks: 브레이크타임
 * floor 3 이상이면 엘리베이터 시간 포함. hoursAssumed: 공식 운영시간 미확인(평일 주간 가정)
 * kind: study(과제 가능) | leisure | exercise | errand
 */
export const CAMPUS_ACTIVITIES = [
  {
    id: 'act-lib-reading',
    name: '백석학술정보관 열람실',
    buildingId: 'bldg-lib',
    floor: 1,
    kind: 'study',
    stayMin: 50,
    hint: '지하~1층 열람실 · 클리커 앱으로 좌석 선택',
    hours: [
      { days: [1, 2, 3, 4, 5, 6], open: '08:00', close: '24:00' },
      { days: [0], open: '08:00', close: '20:00' },
    ],
    title: '학술정보관 열람실에서 집중 모드 ON 해볼까요?',
  },
  {
    id: 'act-lib-books',
    name: '학술정보관 자료실',
    buildingId: 'bldg-lib',
    floor: 3,
    kind: 'errand',
    stayMin: 20,
    hint: '2~5층 분야별 자료실 · 모바일 학생증 필요',
    hours: [
      { days: [1, 2, 3, 4], open: '09:00', close: '20:00' },
      { days: [5], open: '09:00', close: '18:00' },
    ],
    title: '자료실에서 전공책 한 권 빌려 갈까요?',
  },
  {
    id: 'act-hq-startup-cafe',
    name: '본부동 창업카페',
    buildingId: 'bldg-hq',
    floor: 1,
    kind: 'study',
    stayMin: 30,
    hint: '음료 안 시켜도 무료 이용 · PC·복사 가능',
    hours: [{ days: WEEKDAYS, open: '09:00', close: '18:00' }],
    breaks: [
      { days: [3], from: '13:00', to: '14:00' },
      { days: [5], from: '14:00', to: '15:00' },
    ],
    title: '본부동 창업카페에서 노트북 펴고 한 판 어때요?',
  },
  {
    id: 'act-hq-dream',
    name: '본부동 드림자료실',
    buildingId: 'bldg-hq',
    floor: -1,
    kind: 'study',
    stayMin: 40,
    hint: '지하1층 · 콘센트 넉넉한 자습 공간',
    hours: [{ days: WEEKDAYS, open: '09:00', close: '18:00' }],
    title: '드림자료실에서 충전기 꽂고 조용히 공부해볼까요?',
  },
  {
    id: 'act-mogyang-study',
    name: '목양관 5층 스터디룸',
    buildingId: 'bldg-mogyang',
    floor: 5,
    kind: 'study',
    stayMin: 40,
    hint: '음식물 반입 금지 · 노트북 사용 가능',
    hours: [{ days: WEEKDAYS, open: '09:00', close: '18:00' }],
    title: '목양관 스터디룸에서 팀플 자료 정리 어때요?',
  },
  {
    id: 'act-stu-pingpong',
    name: '학생복지관 탁구장',
    buildingId: 'bldg-stu',
    floor: -1,
    kind: 'leisure',
    stayMin: 20,
    hint: '지하1층 · 라켓·공 개인 지참',
    hours: [{ days: WEEKDAYS, open: '09:00', close: '18:00' }],
    hoursAssumed: true,
    title: '학생복지관 탁구장에서 핑퐁 한 게임 어때요?',
  },
  {
    id: 'act-dorm-gym',
    name: '생활관 휘트니스센터',
    ...DORM,
    floor: 1,
    kind: 'exercise',
    stayMin: 40,
    hint: '1층 · 비사생은 회원제, 실내 운동화 지참',
    hours: [
      { days: [1, 2, 3, 4], open: '15:00', close: '22:00' },
      { days: [5], open: '13:00', close: '20:00' },
    ],
    title: '생활관 헬스장에서 가볍게 땀 한번 빼볼까요?',
  },
  {
    id: 'act-dorm-billiards',
    name: '생활관 백향 당구장',
    ...DORM,
    floor: 1,
    kind: 'leisure',
    stayMin: 30,
    hint: '1층 · 친구랑 한 게임',
    hours: [
      { days: [1, 2, 3, 4], open: '11:00', close: '21:00' },
      { days: [5], open: '11:00', close: '18:00' },
    ],
    title: '생활관 당구장에서 큐대 한번 잡아볼까요?',
  },
  {
    id: 'act-dorm-bookcafe',
    name: '생활관 이디야 북카페',
    ...DORM,
    floor: 2,
    kind: 'study',
    stayMin: 30,
    hint: '2층 · 1인 1주문',
    hours: [{ days: WEEKDAYS, open: '09:00', close: '23:00' }],
    title: '이디야 북카페에서 커피랑 과제 같이 할까요?',
  },
  {
    id: 'act-truth-bookstore',
    name: '진리관 뷰리서점',
    buildingId: 'bldg-truth',
    floor: 1,
    kind: 'errand',
    stayMin: 15,
    hint: '1층 서점·우체국 · 교재 미리 사두기',
    hours: [{ days: WEEKDAYS, open: '09:00', close: '17:00' }],
    hoursAssumed: true,
    title: '진리관 서점에서 교재 미리 챙겨둘까요?',
  },
  {
    id: 'act-global-cafe',
    name: '글로벌외식산업관 학생 카페',
    lat: 36.8375385,
    lng: 127.1851016,
    floor: 1,
    kind: 'leisure',
    stayMin: 15,
    hint: '외식산업학부 학생들이 만든 빵·음료',
    hours: [{ days: WEEKDAYS, open: '10:00', close: '17:00' }],
    hoursAssumed: true,
    title: '외식산업관 학생 카페에서 갓 구운 빵 어때요?',
  },
]

export const CAMPUS_SPOTS = [
  {
    id: 'bethesda-park',
    name: '베데스다공원',
    type: 'park',
    lat: 36.8402407,
    lng: 127.1834893,
    blurb: '분수광장 옆 짧은 산책',
  },
  {
    id: 'cafe-beury',
    name: '카페뷰리 분수광장점',
    type: 'cafe',
    lat: 36.8402029,
    lng: 127.1834611,
    blurb: '베데스다 옆 커피',
  },
  // 학식·구내 (11:00–13:30 방문 권장)
  {
    id: 'cafeteria-mill',
    name: '밀겨울 백석대점',
    type: 'cafeteria',
    lat: 36.8405682,
    lng: 127.1826324,
    blurb: '복지관 인근 학식·국밥',
    quips: [
      '밀겨울에서 뜨끈한 국밥으로 한겨울 미리 녹여볼까요?',
      '이름은 겨울이어도 국밥은 뜨거워요, 밀겨울 어때요?',
    ],
  },
  {
    id: 'cafeteria-faculty',
    name: '교수회관 식당',
    type: 'cafeteria',
    lat: 36.8397053,
    lng: 127.1847795,
    blurb: '캠퍼스 안쪽 구내식당 백반',
    quips: [
      '교수회관에서 든든한 백반으로 학점까지 채워볼까요?',
    ],
  },
  {
    id: 'cafeteria-angol',
    name: '안골',
    type: 'cafeteria',
    // 카카오: 백석대학교 글로벌외식산업관 (외식글로벌학습관) 1층
    lat: 36.8375385,
    lng: 127.1851016,
    blurb: '외식글로벌학습관(글로벌외식산업관) 1층 학식',
    quips: [
      '안골에서 안 골고루 먹으면 섭섭하죠, 학식 한 판 어때요?',
      '오늘 학식은 안골 각? 외식산업관 1층으로 가볼까요?',
    ],
  },
  {
    id: 'cafeteria-dorm',
    name: '기숙사식당',
    type: 'cafeteria',
    lat: 36.8425016,
    lng: 127.1852033,
    blurb: '백석생활관 식당 백반',
    quips: [
      '기숙사식당에서 집밥 느낌 백반 한 상 어때요?',
      '생활관 식당에서 엄마 밥 대신 든든하게 채워볼까요?',
    ],
  },
  // 일반 식당
  {
    id: 'rest-bapstory',
    name: '밥스토리 백석대점',
    type: 'restaurant',
    lat: 36.8405829,
    lng: 127.1824889,
    blurb: '덮밥·한식',
    quips: [
      '오늘 점심 스토리는 밥스토리에서 써볼까요?',
      '밥스토리에서 덮밥 한 그릇으로 오후 1장 시작해요!',
    ],
  },
  {
    id: 'rest-ironie',
    name: '이런이궈',
    type: 'restaurant',
    lat: 36.8413341,
    lng: 127.1809323,
    blurb: '마라탕·마라샹궈',
    quips: [
      '이런이궈에서 마라탕 한 사발 때리고 갈까요?',
      '이런 날엔 이런이궈! 얼얼한 마라탕 어때요?',
    ],
  },
  {
    id: 'rest-chunli',
    name: '춘리마라탕 백석대점',
    type: 'restaurant',
    lat: 36.8415572,
    lng: 127.1817569,
    blurb: '마라탕·꿔바로우',
    quips: [
      '가을인데 입안은 봄(春)! 춘리마라탕에서 땀 한번 쫙 빼볼까요?',
      '마라가 땡기면 춘리마라탕으로 직행 어때요?',
    ],
  },
  // 백석대 주변 식당 (+6)
  {
    id: 'rest-yongwoo',
    name: '용우동 천안백석대점',
    type: 'restaurant',
    lat: 36.8409437,
    lng: 127.1810581,
    blurb: '우동·돈까스·김밥',
    quips: [
      '용우동에서 우동 한 그릇 후루룩, 용기 충전 어때요?',
      '오후 수업 버틸 용기는 용우동 국물에서 나와요!',
    ],
  },
  {
    id: 'rest-jijigo',
    name: '지지고 천안백석대점',
    type: 'restaurant',
    lat: 36.8409546,
    lng: 127.1809987,
    blurb: '철판 볶음밥·부리또',
    quips: [
      '지지고에서 마음 한번 지지는 거 어때요?',
      '철판에 지지고 볶고, 오후 걱정도 같이 지져버려요!',
    ],
  },
  {
    id: 'rest-cheonwon',
    name: '천원국수',
    type: 'restaurant',
    lat: 36.8406962,
    lng: 127.1808524,
    blurb: '잔치국수·비빔국수',
    quips: [
      '천원국수에서 잔치국수로 혼자만의 잔치 어때요?',
      '지갑은 가볍게, 배는 무겁게! 천원국수 가볼까요?',
    ],
  },
  {
    id: 'rest-guksu',
    name: '국수나무 백석대점',
    type: 'restaurant',
    lat: 36.8409411,
    lng: 127.1810245,
    blurb: '국수·덮밥·돈까스',
    quips: [
      '국수나무 그늘 아래서 면치기 한 판 어때요?',
      '국수나무에서 면 한 가닥씩 오후 에너지 키워볼까요?',
    ],
  },
  {
    id: 'rest-eunhwa',
    name: '은화수식당 천안백석대점',
    type: 'restaurant',
    lat: 36.8409141,
    lng: 127.1809818,
    blurb: '돈까스·카레',
    quips: [
      '은화수식당에서 바삭한 돈까스로 텐션 튀겨볼까요?',
      '오늘은 돈까스가 답! 은화수식당에서 바삭하게 충전해요',
    ],
  },
  {
    id: 'rest-jumeok',
    name: '주먹밥하우스 백석대점',
    type: 'restaurant',
    lat: 36.8415769,
    lng: 127.1818007,
    blurb: '주먹밥·라면',
    quips: [
      '주먹밥하우스에서 주먹 불끈, 오후 수업 정면돌파!',
      '주먹밥 한 손에 라면 한 젓가락, 주먹밥하우스 어때요?',
    ],
  },
]
