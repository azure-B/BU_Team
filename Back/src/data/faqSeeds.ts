export type FaqSeed = {
  id: string
  title: string
  keywords: string[]
  required_any: string[][]
  slots?: string[]
  answer_template: string
  source_url: string
  priority?: number
  academic_year?: number
  review_note?: string
}

export let FAQ_SEEDS: FaqSeed[] = [
  {
    id: 'office-location',
    title: '학부사무실 위치·연락처',
    keywords: ['학부사무실', '과사', '과사무실', '사무실'],
    required_any: [
      ['학부사무실', '과사', '과사무실', '사무실'],
      ['어디', '위치', '몇호', '전화', '번호', '연락처'],
    ],
    slots: ['department'],
    answer_template: '{{department}} 사무실은 {{building}} {{room}}에 있습니다. 연락처: {{phones}}',
    source_url: 'https://www.bu.ac.kr/bbs/web/1692/38305/artclView.do',
    priority: 20,
  },
  {
    id: 'sick-absence',
    title: '병결(질병 결석) 출석인정 서류',
    keywords: ['병결', '질병 결석', '아파서', '진료', '입원', '출석인정'],
    required_any: [
      ['병결', '질병', '아파서', '진료', '입원', '결석'],
      ['서류', '제출', '인정', '언제', '뭐'],
    ],
    slots: ['department'],
    answer_template:
      '질병 결석은 두 가지로 인정됩니다.\n'
      + '- 입원: 입원일로부터 2주 이내, 입원확인서 제출\n'
      + '- 당일 진료: 해당일만 인정, 학기당 2회 이내, 진료확인서와 진료비 납부영수증 제출.\n'
      + '서류는 소속 학부사무실({{department}}, {{building}} {{room}})에 제출합니다.\n'
      + '제출 기한: 입원 2주 이내, 당일 진료는 진료 후 5일 이내(주말 제외).\n'
      + '유의: 과목당 학기 2회까지, 비대면(전화) 진료는 인정 불가. 세부 기준은 학부사무실({{phones}})에 확인하세요.',
    source_url: 'https://www.bu.ac.kr/web/6556/subview.do',
    academic_year: 2025,
    priority: 15,
  },
  {
    id: 'other-absence',
    title: '기타 출석인정 사유',
    keywords: ['예비군', '결혼', '장례', '사망', '출산', '징병', '공결'],
    required_any: [['예비군', '결혼', '장례', '사망', '출산', '징병', '공결']],
    slots: ['department'],
    answer_template:
      '출석인정 사유와 서류: 본인 결혼 5일(청첩장), 직계가족 사망 5일, 출산 본인 20일·배우자 7일, '
      + '징병검사·예비군훈련 해당 기간. 서류는 소속 학부사무실({{building}} {{room}})에 제출합니다.',
    source_url: 'https://www.bu.ac.kr/web/6556/subview.do',
    priority: 12,
  },
  {
    id: 'attendance-rule',
    title: '지각·결석 기준',
    keywords: ['지각', '조퇴', '결석', '출석미달', 'F'],
    required_any: [['지각', '조퇴', '결석', '출석']],
    answer_template:
      '지각·조퇴 3회는 결석 1회로 처리합니다. 실제 수업시간의 3/4 이상 출석해야 성적 처리가 가능하며, '
      + '1/4을 초과해 결석하면 출석미달 F입니다. 출석은 백석대학교 스마트출결(학생용) 앱으로 확인합니다.',
    source_url: 'https://www.bu.ac.kr/web/6556/subview.do',
    priority: 10,
  },
  {
    id: 'leave-documents',
    title: '휴학 종류별 서류',
    keywords: ['군휴학', '군입대', '입영', '창업휴학', '육아휴학', '임신', '출산휴학', '일반휴학'],
    required_any: [['휴학'], ['군', '입영', '창업', '육아', '임신', '출산', '일반', '서류']],
    answer_template:
      '휴학 종류별 서류\n'
      + '- 일반휴학: 휴학원, 보호자 사유서\n'
      + '- 군입대휴학: 휴학원, 입영통지서(입영일 전일까지 신청)\n'
      + '- 창업휴학: 휴학원, 신청자격 증빙, 지도교수 추천서\n'
      + '- 임신·출산휴학: 임신진단서 또는 출생증명서\n'
      + '- 육아휴학: 가족관계증명서',
    source_url: 'https://www.bu.ac.kr/web/6385/subview.do',
    priority: 18,
  },
  {
    id: 'leave-of-absence',
    title: '휴학 신청 절차',
    keywords: ['휴학'],
    required_any: [['휴학']],
    slots: ['department'],
    answer_template:
      '휴학 절차: 종합정보시스템 → 학적정보 → 휴학신청 → 휴학원 출력 → 담임·주임교수 서명 → '
      + '학부사무실({{building}} {{room}}) 제출 → 학부 승인.\n'
      + '- 재학생은 개강 전까지 제출, 개강 후는 등록휴학만 가능\n'
      + '- 학기별 휴학 신청 1회, 일반휴학 통산 2년 이내\n'
      + '종류별 서류는 「군휴학 서류」처럼 물어보세요.',
    source_url: 'https://www.bu.ac.kr/web/6385/subview.do',
    priority: 5,
  },
  {
    id: 'return-to-school',
    title: '복학 신청 절차',
    keywords: ['복학', '조기복학'],
    required_any: [['복학']],
    slots: ['department'],
    answer_template:
      '복학 절차: 종합정보시스템 → 학적정보 → 복학신청 → 학부 승인(서류 없음).\n'
      + '수강신청 전에 승인을 받으세요. 개강 후 복학은 수업일수 1/4선 이내만 가능하며 '
      + '학부사무실({{phones}})에 먼저 문의하세요.',
    source_url: 'https://www.bu.ac.kr/web/6556/subview.do',
    priority: 10,
  },
  {
    id: 'library-hours',
    title: '도서관 운영시간',
    keywords: ['도서관', '열람실', '학술정보관'],
    required_any: [
      ['도서관', '열람실', '학술정보관'],
      ['몇시', '시간', '운영', '열어', '닫아', '언제까지'],
    ],
    answer_template:
      '일반 도서관: 월~목 09:00~20:00, 금 09:00~18:00, 주말·공휴일 휴관. '
      + '열람실: 월~토 08:00~24:00, 일·공휴일 08:00~20:00. 시험기간·방학에는 바뀔 수 있습니다.',
    source_url: 'https://www.bu.ac.kr/web/3546/subview.do',
    priority: 10,
  },
  {
    id: 'study-room',
    title: '그룹토의실 예약',
    keywords: ['스터디룸', '그룹토의실', '토의실'],
    required_any: [['스터디룸', '그룹토의실', '토의실']],
    answer_template:
      '도서관 홈페이지 「도서관 서비스」→「그룹토의실 이용신청」에서 날짜·방·시간을 고르고 '
      + '로그인 후 동반자 학번을 등록합니다(동반자 2명 이상). 입실 전 클리커 앱으로 입구 QR 도착 인증이 필요합니다.',
    source_url: 'https://www.bu.ac.kr/web/3546/subview.do',
    priority: 10,
  },
  {
    id: 'scholarship-grade',
    title: '성적우수장학금 학점 기준',
    keywords: ['성적장학', '성적우수장학', '장학', '학점'],
    required_any: [
      ['성적장학', '성적우수', '장학'],
      ['학점', '몇학점', '평점', '기준'],
    ],
    answer_template:
      '재학생 성적우수장학금: 직전 학기 신청학점을 전부 취득하고 평점 3.0 이상, '
      + '15학점 이상(4학년 12학점 이상), 수강철회 없음. 신청 없이 성적 석차순 자동 선발. '
      + 'F학점·수강철회자는 제외. 문의: 학생처 041-550-9036·9037',
    source_url: 'https://www.bu.ac.kr/web/3710/subview.do',
    priority: 16,
  },
  {
    id: 'scholarship-apply',
    title: '교내장학금 신청 방법',
    keywords: ['장학금', '장학', '장학금지급', '장학받'],
    required_any: [['장학']],
    answer_template:
      '신규종합정보시스템 → 장학/등록 → 장학금신청 → 선택 → 조회 → 신규 → 저장 → 개인동의 → 구비서류 업로드. '
      + '온라인만 인정, PDF 비밀번호 잠금 해제. 성적우수장학금은 자동 선발(신청 불필요). '
      + '성적 기준이 궁금하면 「성적장학금 학점」으로 물어보세요. 문의: 학생처 041-550-9036·9037',
    source_url: 'https://www.bu.ac.kr/web/3710/subview.do',
    priority: 9,
  },
  {
    id: 'cafeteria-guide',
    title: '학식·구내식당 안내',
    keywords: ['학식', '급식', '구내식당', '식당 메뉴', '오늘 메뉴', '밥집'],
    required_any: [['학식', '급식', '구내식당', '식당', '메뉴']],
    answer_template:
      '캠퍼스 학식·구내식당 안내\n'
      + '- 밀겨울 백석대점 (복지관 인근)\n'
      + '- 교수회관 식당 (캠퍼스 안쪽 백반)\n'
      + '- 안골 (외식글로벌학습관 1층)\n'
      + '- 기숙사식당 (생활관)\n'
      + '점심 피크는 보통 11:00~13:30입니다. 당일 메뉴는 식당 현장·생활관 안내를 확인해 주세요.\n'
      + '캠퍼스 탭에서도 학식·카페 위치를 볼 수 있어요.',
    source_url: 'https://www.bu.ac.kr/web/3443/subview.do',
    priority: 14,
  },
  {
    id: 'contact-general',
    title: '주요 부서 연락처',
    keywords: ['교무처', '학생처', '재무처', '장학문의', '문의처'],
    required_any: [
      ['교무처', '학생처', '재무처', '장학문의', '문의처'],
      ['전화', '연락처', '번호', '어디로'],
    ],
    answer_template:
      '천안 국번 041-550. 교무처(학사) 9154, 학생처(장학·학자금) 9036·9037, 재무처(등록) 9093, '
      + '도서관 2613·2615, 보건실 0728. 전화번호 검색: https://www.bu.ac.kr/web/3515/subview.do',
    source_url: 'https://www.bu.ac.kr/web/3515/subview.do',
    priority: 8,
  },
]

export let GLOSSARY: { term: string; official: string }[] = [
  { term: '과사', official: '학부사무실' },
  { term: '과사무실', official: '학부사무실' },
  { term: '컴공', official: '컴퓨터공학부' },
  { term: '도서관', official: '학술정보관' },
  { term: '기숙사', official: '백석생활관' },
  { term: '채플', official: '대학예배' },
  { term: '병결', official: '질병 결석' },
  { term: '스터디룸', official: '그룹토의실' },
  { term: '수강정정', official: '수강신청 정정' },
  { term: '코수님', official: '교수님' },
  { term: '코수', official: '교수' },
  { term: '첨단아이티', official: '첨단IT학부' },
  { term: '스마트IT', official: '첨단IT학부' },
]

export function setFaqSeeds(list: FaqSeed[]) {
  FAQ_SEEDS = list
}

export function setGlossary(list: { term: string; official: string }[]) {
  GLOSSARY = list
}
