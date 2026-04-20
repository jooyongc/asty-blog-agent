/**
 * Pre-curated direction templates for the direction page.
 * Focused on ASTY Cabin's core audience: medium-to-long-stay foreign guests
 * (business travelers, medical tourists, families, corporate relocations).
 *
 * Each template's `text` is the full Korean direction that gets injected into
 * the Director input textarea. Keep them 100–200 chars, specific enough to
 * yield distinct topic proposals but open-ended enough for Director to choose.
 */

export type DirectionCategory =
  | 'seasonal'
  | 'food'
  | 'transport'
  | 'practical'
  | 'festival'
  | 'medical'
  | 'family'
  | 'corporate'

export type DirectionTemplate = {
  id: string
  emoji: string
  title: string
  hint: string
  category: DirectionCategory
  text: string
  seasonal_months?: number[] // 1-12; if set, template is highlighted in those months
}

export const DIRECTION_TEMPLATES: DirectionTemplate[] = [
  // --- 계절 ---
  {
    id: 'spring-guide',
    emoji: '🌸',
    title: '봄 장기체류',
    hint: '벚꽃·봄나들이·실내외 전환기',
    category: 'seasonal',
    seasonal_months: [3, 4, 5],
    text:
      '봄(3~5월)에 서울에 장기체류하는 외국인 게스트를 대상으로, ASTY Cabin 주변에서 벚꽃·한강·봄 산책을 즐기는 방법과, 환절기 건강·공기질·복장 팁 등 실용 정보를 균형 있게 다루자. 각 글은 "가는 법(ASTY Cabin 기준 이동 시간)"과 "장기 투숙객에게 왜 유용한지"를 명확히 하자.',
  },
  {
    id: 'summer-guide',
    emoji: '☀️',
    title: '여름 장기체류',
    hint: '장마·폭염·시원한 공간',
    category: 'seasonal',
    seasonal_months: [6, 7, 8],
    text:
      '여름(6~8월) 장마·폭염기 동안 ASTY Cabin 장기 투숙객이 실내외를 현명하게 오가는 법을 중심으로 가자. 실내 쇼핑몰·박물관·실내 놀이·야간 산책 스팟, 그리고 장기 거주자가 알아야 할 에어컨 전기요금·빨래·식료품 배송 팁을 포함하자.',
  },
  {
    id: 'autumn-guide',
    emoji: '🍁',
    title: '가을 장기체류',
    hint: '단풍·야외활동·축제 성수기',
    category: 'seasonal',
    seasonal_months: [9, 10, 11],
    text:
      '가을(9~11월) 성수기에 장기 투숙 중인 외국인 게스트를 위한 가이드. ASTY Cabin 인근 단풍 명소, 한강 자전거·산책, 서울 축제(불꽃축제·김장 문화제·재즈 페스티벌 등) 일정, 그리고 한국 첫 가을을 맞는 사람을 위한 복장·도시락·기온 변화 대비.',
  },
  {
    id: 'winter-guide',
    emoji: '❄️',
    title: '겨울 장기체류',
    hint: '실내 위주·찜질방·온수매트',
    category: 'seasonal',
    seasonal_months: [12, 1, 2],
    text:
      '겨울(12~2월) 장기 투숙객이 ASTY Cabin에서 쾌적하게 보내는 방법 중심. 찜질방·온수매트·실내 온천, 눈 내리는 한강 야경 코스, 뜨끈한 한식(설렁탕·해장국·전골) 추천, 보일러·난방비 관리 실용 팁을 묶어서 장기 거주자 관점으로 정리.',
  },

  // --- 맛집 / 식당 ---
  {
    id: 'food-long-stay',
    emoji: '🍜',
    title: '장기투숙 맛집',
    hint: '질리지 않는 동네 식당 루틴',
    category: 'food',
    text:
      '3주~3개월 장기 투숙객이 같은 식당을 반복해서 가도 질리지 않는 ASTY Cabin 근처 로테이션 식당들. 가격대별(만원 미만·1~2만원·가심비), 한식·아시안·서양식 믹스, 배달 가능 vs 방문 전용, 영어 메뉴 가능 여부로 분류해서 "장기체류 루틴"을 완성.',
  },
  {
    id: 'food-late-night',
    emoji: '🌙',
    title: '야간·새벽 식사',
    hint: '비즈니스·시차 적응 게스트',
    category: 'food',
    text:
      '시차 적응 중이거나 늦게 퇴근하는 비즈니스 게스트를 위한, ASTY Cabin 도보권 24시간·새벽 영업 식당. 해장국·포장마차·편의점 핫푸드·24시 카페를 실제 영업 시간과 함께 정리. 택시 잡는 법, 야간 안전까지 포함.',
  },
  {
    id: 'food-halal',
    emoji: '🕌',
    title: '할랄·베지·글루텐프리',
    hint: '식단 제약 있는 장기 게스트',
    category: 'food',
    text:
      '할랄·베지테리언·글루텐프리 식단이 필요한 장기 투숙객을 위한 ASTY Cabin 인근 식당/마트 가이드. 영어로 주문 가능한지, 조리 교차 오염 대처, 한식 중 자연스럽게 할랄/베지인 메뉴, 장보기 루트(이태원·외국인 마트)까지.',
  },

  // --- 교통 / 찾아가기 ---
  {
    id: 'transport-first-48h',
    emoji: '🛬',
    title: '도착 첫 48시간',
    hint: '공항→ASTY Cabin→정착',
    category: 'transport',
    text:
      '인천/김포 공항에 도착한 첫 방문 외국인 게스트가 ASTY Cabin까지 오는 가장 편한 경로(공항철도·리무진·택시 비용·시간 비교), 체크인 당일 해야 할 것(유심·T-money·환전·근처 편의점 위치), 둘째 날까지 준비할 것(병원 확인·약국·은행).',
  },
  {
    id: 'transport-gangnam',
    emoji: '🚇',
    title: '강남·삼성동 출퇴근',
    hint: '장기 비즈니스 거주자',
    category: 'transport',
    text:
      'ASTY Cabin에서 강남·삼성동·여의도 오피스로 통근하는 장기 체류 비즈니스 게스트를 위한 교통 가이드. 출근 시간대별 지하철 혼잡도, 버스 노선, 따릉이 활용, 야근 후 귀가(심야 택시·대리), 매달 정기권이 이득인 경계선까지.',
  },

  // --- 실용 생활 ---
  {
    id: 'practical-settle',
    emoji: '📋',
    title: '장기체류 체크리스트',
    hint: '첫 주·첫 달 정착',
    category: 'practical',
    text:
      'ASTY Cabin 30일 이상 투숙하는 외국인이 첫 주·첫 달에 순차적으로 해결해야 할 것들. 유심/알뜰폰, 카카오톡·네이버 회원가입, 은행 계좌(없이 살 수 있는지), 배달 앱, 병원 예약 방법, 세탁/드라이클리닝, 한국어 배우기 루트.',
  },
  {
    id: 'practical-grocery',
    emoji: '🛒',
    title: '동네 장보기',
    hint: '마트·배달·가락시장',
    category: 'practical',
    text:
      'ASTY Cabin 도보·자전거권의 마트·시장·편의점 가이드. 가락시장(도매·저녁 세일), 인근 대형마트 vs 창고형, 쿠팡·마켓컬리 배달(외국인 신용카드 되는지), 외국인 마트(이태원·한남) 방문이 필요한 경우만 골라서.',
  },

  // --- 서울 축제 / 이벤트 ---
  {
    id: 'festival-quarter',
    emoji: '🎆',
    title: '이번 분기 서울 축제',
    hint: '3개월 내 주요 이벤트',
    category: 'festival',
    text:
      '앞으로 3개월 안에 서울에서 열리는 주요 축제·이벤트(불꽃·등축제·재즈·한강 수영장·야시장 등) 중 ASTY Cabin에서 가기 좋은 것들. 각 축제별 날짜·무료/유료·ASTY Cabin 출발 최적 이동·외국인 친화도 정리.',
  },
  {
    id: 'festival-cultural',
    emoji: '🎭',
    title: '문화·공연 가이드',
    hint: 'K-pop·뮤지컬·국립극장',
    category: 'festival',
    text:
      'K-pop 콘서트·뮤지컬·국립국악원·예술의전당·롯데월드타워 공연 등 서울의 공연 문화를 ASTY Cabin 장기 투숙객이 즐기는 법. 외국인 예매 사이트(인터파크·멜론티켓 영어 모드), 당일 취소표, 한국어 없는 공연, ASTY Cabin에서 각 공연장 이동 시간.',
  },

  // --- 의료 관광 ---
  {
    id: 'medical-first-week',
    emoji: '🏥',
    title: '의료관광 첫 주',
    hint: '진료 전후 회복 루틴',
    category: 'medical',
    text:
      'ASTY Cabin을 의료 관광 베이스캠프로 삼는 외국인 환자의 첫 주 가이드. 삼성서울병원·아산·세브란스 진료 전 준비, 통역사 예약, 회복 중 식사(죽·보양식 배달), 처방전 영문 받기, 약국 찾는 법, 보험 청구용 영수증 요청 팁.',
  },
  {
    id: 'medical-kbeauty',
    emoji: '💉',
    title: 'K-뷰티 클리닉',
    hint: '강남 피부과·성형·치과',
    category: 'medical',
    text:
      'ASTY Cabin에서 15분 거리 강남 K-뷰티 클리닉(피부과·성형·치과) 중 영어·일본어·중국어 응대가 되는 곳 중심으로, 장기 체류 중 여러 번 방문하는 경우 어떻게 일정 짜는지, 시술 후 회복 기간별 외출 가능 범위, 숙소에서 필요한 용품까지.',
  },

  // --- 가족 ---
  {
    id: 'family-kids',
    emoji: '👨‍👩‍👧',
    title: '아이 동반 장기체류',
    hint: '국제학교·주말 나들이',
    category: 'family',
    text:
      '아이와 함께 ASTY Cabin에 장기 체류하는 가족을 위한 가이드. 롯데월드 연간권이 이득인 기간, 주말마다 갈 어린이 체험관·박물관·키즈카페, 국제학교 근처 정보, 아프면 가는 소아과, 놀이터·실내 놀이방.',
  },
  {
    id: 'family-parents',
    emoji: '👴',
    title: '부모 동반 장기체류',
    hint: '3대 가족·고령 게스트',
    category: 'family',
    text:
      '조부모·부모와 함께 장기 체류하는 3대 가족을 위한 가이드. ASTY Cabin에서 이동 적게 하고 편히 즐길 수 있는 코스(한강 유람·창덕궁·궁중 음식), 휠체어/엘리베이터 접근성, 병원 동행, 한국인이 자주 가는 탕·찜질방 중 외국 노인에게 편한 곳.',
  },

  // --- 비즈니스 / 코퍼레이트 ---
  {
    id: 'corporate-relocation',
    emoji: '💼',
    title: '기업 주재원 정착',
    hint: '1~3개월 relocation',
    category: 'corporate',
    text:
      '1~3개월짜리 기업 주재(relocation)로 ASTY Cabin에 입주한 외국인 임직원 가이드. 법인카드 쓸 수 있는 근처 식당, 회의 가능한 카페, 드라이클리닝·양복 수선, 공항까지 이동 전략, 주말에 가족 불러올 때 숙소 업그레이드 여부.',
  },
  {
    id: 'corporate-meeting',
    emoji: '🤝',
    title: '비즈니스 미팅 공간',
    hint: '회의실·네트워킹 카페',
    category: 'corporate',
    text:
      'ASTY Cabin 장기 투숙 중 외부 미팅이 많은 비즈니스 게스트를 위한 공간 가이드. 조용한 카페, 시간 단위 회의실, 공유 오피스 일일권, ASTY Cabin 로비/라운지에서 해결되는 경우, 프린트/팩스·국제 전화 대응.',
  },
]

/** Returns templates ordered with seasonal ones first (current month). */
export function orderedTemplates(now: Date = new Date()): DirectionTemplate[] {
  const m = now.getMonth() + 1
  const seasonal = DIRECTION_TEMPLATES.filter((t) => t.seasonal_months?.includes(m))
  const rest = DIRECTION_TEMPLATES.filter((t) => !seasonal.includes(t))
  return [...seasonal, ...rest]
}

export const CATEGORY_LABEL: Record<DirectionCategory, string> = {
  seasonal: '계절',
  food: '맛집',
  transport: '교통',
  practical: '생활',
  festival: '축제',
  medical: '의료',
  family: '가족',
  corporate: '비즈니스',
}
