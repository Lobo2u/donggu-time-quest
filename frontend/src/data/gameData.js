// 실제 장소 정보는 공개된 사실 기반, 게임 스토리·캐릭터는 창작입니다.

export const LOCATIONS = {
  sojedom: {
    id: 'sojedom', name: '소제동', subtitle: '옛 철도 관사촌 골목',
    mapX: 48, mapY: 252, lat: 36.3338, lng: 127.4378, arrivalRadius: 300,
    buddyId: 'sojo', missionId: 'sojedom-field',
    unlockCondition: null,
    qrCode: 'DTQR-SOJEDOM-2025',
    realNote: '실제 소제동은 대전 동구의 역사 문화 마을로, 1930년대 철도 관사 건물들이 보존되어 있습니다.',
    shareMessage: '소제동의 골목을 거닐며 오래된 철도 관사의 이야기를 직접 느껴보세요. 대전 동구의 숨겨진 명소입니다.',
    storyContext: [
      '소제동 골목에 도착했어요.',
      '1930년대 지어진 철도 관사들이 줄지어 선 이곳.',
      '오래된 담벼락 사이로 뭔가 작은 빛이 깜빡이고 있어요.',
      '가까이 다가가보니, 기억 조각들이 흩어진 채 잠들어 있었어요.',
    ],
    storyNote: '[이 이야기는 창작 시나리오입니다. 실제 역사와 다를 수 있어요.]',
  },
  jungang: {
    id: 'jungang', name: '중앙시장', subtitle: '대전의 오래된 전통 시장',
    mapX: 146, mapY: 470, lat: 36.3278, lng: 127.4310, arrivalRadius: 300,
    buddyId: 'jungja', missionId: 'jungang-field',
    unlockCondition: 'sojedom',
    qrCode: 'DTQR-JUNGANG-2025',
    realNote: '대전 중앙시장은 1960년대부터 이어져 온 전통 시장으로, 다양한 먹거리와 생활용품을 판매합니다.',
    shareMessage: '대전 중앙시장에서 활기찬 시장의 맛과 이야기를 만나보세요. 오래된 맛집과 정겨운 상인들이 기다리고 있어요.',
    storyContext: [
      '중앙시장 입구에 도착했어요.',
      '좌판마다 물건들이 가득하고, 상인들의 목소리가 활기차요.',
      '그런데 한쪽 구석에서 뭔가 빠르게 움직이는 것이 보여요.',
      '물건들 사이를 종종종 달리는 작은 존재... 뭔가 기억을 찾고 있는 것 같아요.',
    ],
    storyNote: '[이 이야기는 창작 시나리오입니다.]',
  },
  heredi: {
    id: 'heredi', name: '한의약거리', subtitle: '약령시장 일대',
    mapX: 236, mapY: 310, lat: 36.3263, lng: 127.4295, arrivalRadius: 300,
    buddyId: 'heomi', missionId: 'heredi-field',
    unlockCondition: 'jungang',
    qrCode: 'DTQR-HEREDI-2025',
    realNote: '대전 한의약거리는 전통 약재 상점이 밀집한 지역으로, 한의학 문화를 엿볼 수 있는 곳입니다.',
    shareMessage: '한의약거리에서 전통 약재의 향기와 오랜 의학 문화의 숨결을 느껴보세요. 대전 동구의 특별한 거리입니다.',
    storyContext: [
      '한의약거리에 들어섰어요. 진한 약재 향기가 퍼져나와요.',
      '골목 안쪽 어디선가 부드러운 빛이 깜빡이고 있어요.',
      '가까이 가니 빛이 특정한 패턴으로 움직이고 있었어요.',
      '이 빛의 패턴이 이곳에 숨어있는 기억의 열쇠인 것 같아요.',
    ],
    storyNote: '[이 이야기는 창작 시나리오입니다.]',
  },
  indong: {
    id: 'indong', name: '인동시장', subtitle: '골목 안 작은 시장',
    mapX: 260, mapY: 558, lat: 36.3300, lng: 127.4365, arrivalRadius: 300,
    buddyId: 'indo', missionId: 'indong-field',
    unlockCondition: 'heredi',
    qrCode: 'DTQR-INDONG-2025',
    realNote: '인동시장은 대전 동구 인근에 위치한 소규모 전통 시장으로, 지역 주민들의 생활과 밀접하게 연결된 곳입니다.',
    shareMessage: '인동시장 골목에서 지역 주민들의 일상과 함께하는 소소하지만 따뜻한 시장의 매력을 발견해보세요.',
    storyContext: [
      '인동시장 골목에 도착했어요.',
      '오래된 가게들이 좁은 골목을 따라 이어져 있어요.',
      '골목 모퉁이에서 무언가를 꼼꼼히 기록하고 있는 존재가 보여요.',
      '흩어진 시간의 조각들을 다시 올바른 순서로 맞춰야 할 것 같아요.',
    ],
    storyNote: '[이 이야기는 창작 시나리오입니다.]',
  },
}

export const BUDDIES = {
  sojo: {
    id: 'sojo', name: '소조', subtitle: '기억을 지키는 빛의 조각',
    location: '소제동', variant: 'sojo',
    description: '소제동 골목을 홀로 지켜온 시간 친구예요. 오래된 기억들을 조각조각 모아 빛으로 만들어요. 낯선 사람에게는 수줍어하지만, 마음을 열면 잊힌 장면들을 슬쩍 보여줄 수 있어요.',
    personality: '수줍음 · 호기심 · 따뜻함',
    ability: {
      name: '기억 현상',
      description: '카드 미션에서 뒤집힌 카드 하나를 잠깐 공개해요.',
      awokenDescription: '카드 2장을 공개해요. 각성 후 능력이 강화됐어요.',
    },
    awokenSubtitle: '각성한 기억의 수호자',
    bondingSteps: [
      {
        situation: '소조가 담벼락 뒤에 숨어서 이쪽을 지켜보고 있어요.',
        question: '어떻게 다가갈까요?',
        choices: [
          { label: '큰 소리로 인사하기', correct: false, hint: '소조가 깜짝 놀라서 더 깊이 숨었어요. 소조는 작고 조용한 존재예요.' },
          { label: '조용히 다가가기', correct: true, reaction: '소조가 살짝 고개를 내밀었어요.' },
          { label: '뛰어가기', correct: false, hint: '소조가 후다닥 사라졌어요. 갑작스러운 움직임을 무서워해요.' },
        ],
      },
      {
        situation: '소조가 천천히 가까이 왔어요. 호기심 가득한 눈으로 쳐다보고 있어요.',
        question: '무슨 이야기를 건낼까요?',
        choices: [
          { label: '게임 규칙 설명하기', correct: false, hint: '소조가 고개를 돌렸어요. 소조가 가장 좋아하는 건 무엇일까요?' },
          { label: '기억을 같이 보자고 하기', correct: true, reaction: '소조의 몸 안에서 작은 빛이 반짝였어요.' },
          { label: '어디서 왔냐고 묻기', correct: false, hint: '소조가 주춤했어요. 소조에게 의미 있는 건 뭘까요?' },
        ],
      },
      {
        situation: '소조가 기억 조각들을 조심스럽게 보여줘요.',
        question: '소조에게 마지막으로 뭐라고 할까요?',
        choices: [
          { label: '빨리 다음 장소로 가자고 하기', correct: false, hint: '소조의 눈빛이 흔들렸어요. 혼자 남겨질까봐 걱정하는 것 같아요.' },
          { label: '여기서 계속 기억을 지켜달라고 하기', correct: false, hint: '소조가 고개를 숙였어요. 같이가 소조에게 필요한 것 같아요.' },
          { label: '항상 함께하자고 약속하기', correct: true, reaction: '소조의 안테나 별이 환하게 빛났어요!' },
        ],
      },
    ],
    xpReward: 50, shardsReward: 1,
  },
  jungja: {
    id: 'jungja', name: '중앙이', subtitle: '중앙시장 입구를 닮은 친구',
    location: '중앙시장', variant: 'jungja',
    description: '중앙시장 입구의 모습을 닮은 시간 친구예요. 빨간 지붕과 간판을 머리에 이고, 시장을 찾는 사람들을 반갑게 맞이해요. 바쁘고 활기찬 것을 좋아하고, 기억력이 뛰어나요.',
    personality: '활발함 · 기억력 강함 · 손님맞이',
    ability: {
      name: '시장 기억',
      description: '순서 기억 게임에서 첫 번째 아이템을 알려줘요.',
      awokenDescription: '첫 번째와 두 번째 아이템을 알려줘요. 각성 후 능력이 강화됐어요.',
    },
    awokenSubtitle: '각성한 중앙시장의 수호자',
    bondingSteps: [
      {
        situation: '중앙이가 시장 물건들 사이에서 빠르게 움직이고 있어요.',
        question: '어떻게 말을 걸까요?',
        choices: [
          { label: '조용히 손을 흔들기', correct: false, hint: '중앙이는 활발한 친구예요. 좀 더 적극적으로!' },
          { label: '같이 탐험하자고 크게 외치기', correct: true, reaction: '중앙이가 반갑게 돌아봤어요!' },
          { label: '멀리서 지켜보기', correct: false, hint: '중앙이는 기다리지 않아요. 말을 걸어봐요.' },
        ],
      },
      {
        situation: '중앙이가 시장 물건들에 대해 빠르게 이야기하기 시작해요.',
        question: '어떻게 반응할까요?',
        choices: [
          { label: '이야기를 끊고 다른 말 하기', correct: false, hint: '중앙이의 이야기를 존중해줘요.' },
          { label: '열심히 듣고 따라 말해보기', correct: true, reaction: '중앙이가 눈을 반짝이며 좋아했어요!' },
          { label: '너무 빨라서 이해 못했다고 하기', correct: false, hint: '중앙이는 들어주는 사람을 좋아해요.' },
        ],
      },
      {
        situation: '"나는 혼자 있을 때 외로웠어" 라고 중앙이가 말했어요.',
        question: '뭐라고 대답할까요?',
        choices: [
          { label: '나도 시장을 좋아해!', correct: false, hint: '중앙이가 한 말에 집중해봐요.' },
          { label: '앞으로 같이 다니자, 이야기도 계속 들을게!', correct: true, reaction: '중앙이가 기뻐서 빙그르르 돌았어요!' },
          { label: '시장은 원래 시끄럽잖아', correct: false, hint: '중앙이의 감정에 공감해줘요.' },
        ],
      },
    ],
    xpReward: 60, shardsReward: 1,
  },
  heomi: {
    id: 'heomi', name: '헤미', subtitle: '약재 골목의 빛의 친구',
    location: '한의약거리', variant: 'heomi',
    description: '한의약거리 약재 향기 속에 사는 조용하고 차분한 시간 친구예요. 빛의 패턴으로 감정을 표현해요.',
    personality: '차분함 · 예민함 · 섬세함',
    ability: {
      name: '빛 기억',
      description: '패턴 게임에서 한 칸을 미리 표시해줘요.',
      awokenDescription: '두 칸을 미리 표시해줘요. 각성 후 능력이 강화됐어요.',
    },
    awokenSubtitle: '각성한 빛의 수호자',
    bondingSteps: [
      {
        situation: '헤미가 멀리서 빛을 내며 천천히 이동하고 있어요.',
        question: '어떻게 다가갈까요?',
        choices: [
          { label: '천천히, 조용히 따라가기', correct: true, reaction: '헤미가 멈추고 기다려줬어요.' },
          { label: '빠르게 뛰어가기', correct: false, hint: '헤미는 소란스러운 것을 싫어해요.' },
          { label: '이름을 크게 부르기', correct: false, hint: '헤미는 조용한 접근을 좋아해요.' },
        ],
      },
      {
        situation: '헤미가 빛으로 패턴을 그려서 보여줬어요.',
        question: '어떻게 반응할까요?',
        choices: [
          { label: '무슨 뜻인지 모르겠다고 하기', correct: false, hint: '헤미의 방식으로 소통해봐요.' },
          { label: '같은 패턴을 손가락으로 따라 그리기', correct: true, reaction: '헤미가 빛을 더 밝게 했어요!' },
          { label: '말로 설명해달라고 하기', correct: false, hint: '헤미는 빛으로 이야기해요.' },
        ],
      },
      {
        situation: '헤미가 오랫동안 이 골목을 혼자 지켜왔다고 했어요.',
        question: '뭐라고 할까요?',
        choices: [
          { label: '이제 이 골목을 떠나도 돼', correct: false, hint: '헤미는 이 장소를 사랑해요.' },
          { label: '같이 이 골목의 기억을 지켜나가자', correct: true, reaction: '헤미의 빛이 따뜻하게 퍼졌어요.' },
          { label: '심심했겠다, 빨리 이동하자', correct: false, hint: '헤미에게 이 장소는 소중해요.' },
        ],
      },
    ],
    xpReward: 65, shardsReward: 1,
  },
  indo: {
    id: 'indo', name: '인도', subtitle: '골목 시간의 수호자',
    location: '인동시장', variant: 'indo',
    description: '인동시장 골목의 시간 흐름을 기억하고 있는 꼼꼼한 시간 친구예요. 모든 일에는 올바른 순서가 있다고 믿어요.',
    personality: '침착함 · 꼼꼼함 · 신뢰감',
    ability: {
      name: '시간 정렬',
      description: '타임라인 게임에서 첫 번째 사건을 알려줘요.',
      awokenDescription: '첫 번째와 마지막 사건을 알려줘요. 각성 후 능력이 강화됐어요.',
    },
    awokenSubtitle: '각성한 골목의 수호자',
    bondingSteps: [
      {
        situation: '인도가 골목 모퉁이에서 무언가를 적고 있어요.',
        question: '어떻게 말을 건낼까요?',
        choices: [
          { label: '무엇을 하고 있냐고 조용히 물어보기', correct: true, reaction: '인도가 천천히 고개를 들었어요.' },
          { label: '메모장을 슬쩍 보기', correct: false, hint: '인도는 사생활을 중요하게 여겨요.' },
          { label: '그냥 지나치기', correct: false, hint: '먼저 말을 걸어봐요.' },
        ],
      },
      {
        situation: '"이 골목의 기록을 남기고 있어" 라고 인도가 말했어요.',
        question: '어떻게 반응할까요?',
        choices: [
          { label: '그거 언제 다 끝나냐고 묻기', correct: false, hint: '인도의 일을 존중해줘요.' },
          { label: '같이 기록하고 싶다고 하기', correct: true, reaction: '인도가 펜을 내밀었어요.' },
          { label: '기록이 왜 필요하냐고 하기', correct: false, hint: '인도에게 기록은 매우 중요한 일이에요.' },
        ],
      },
      {
        situation: '인도가 오랫동안 혼자 기록해왔다고 했어요.',
        question: '뭐라고 할까요?',
        choices: [
          { label: '혼자 하는 게 더 정확하지 않아?', correct: false, hint: '인도는 함께 나누고 싶어해요.' },
          { label: '같이 기록하고, 더 많은 곳을 탐험하자', correct: true, reaction: '인도가 처음으로 환하게 웃었어요.' },
          { label: '기록보다 행동이 중요하다고 하기', correct: false, hint: '인도에게 기록의 의미를 인정해줘요.' },
        ],
      },
    ],
    xpReward: 70, shardsReward: 1,
  },
}

// 파트너 상점 (현장 방문 쿠폰 시스템 - 데모용 가상 정보)
export const PARTNER_STORES = {
  sojedom: {
    name: '소제동 카페 기억',
    category: '카페',
    offer: '음료 1잔 10% 할인',
    desc: '소제동 골목 한켠, 옛 관사 건물을 개조한 아늑한 카페예요.',
    hours: '10:00 – 20:00 (월요일 휴무)',
    address: '대전 동구 소제동 일대',
    couponNote: '⚠️ 이 쿠폰은 게임 데모용 가상 정보입니다. 실제 제휴 상점이 아닙니다.',
  },
  jungang: {
    name: '중앙시장 순대국밥',
    category: '식당',
    offer: '순대국밥 1,000원 할인',
    desc: '대전 중앙시장 안, 수십 년째 자리를 지켜온 국밥집이에요.',
    hours: '07:00 – 18:00 (일요일 휴무)',
    address: '대전 동구 중앙시장 내',
    couponNote: '⚠️ 이 쿠폰은 게임 데모용 가상 정보입니다. 실제 제휴 상점이 아닙니다.',
  },
  heredi: {
    name: '한의약거리 약재 상회',
    category: '전통 약재',
    offer: '구매 금액 5% 적립',
    desc: '한의약거리 중심부에 위치한 전통 약재 전문점이에요.',
    hours: '09:00 – 18:00 (일요일 휴무)',
    address: '대전 동구 한의약거리 일대',
    couponNote: '⚠️ 이 쿠폰은 게임 데모용 가상 정보입니다. 실제 제휴 상점이 아닙니다.',
  },
  indong: {
    name: '인동시장 떡 방앗간',
    category: '전통 식품',
    offer: '떡류 구매 시 500원 할인',
    desc: '인동시장 골목에서 오랫동안 떡을 만들어온 방앗간이에요.',
    hours: '08:00 – 17:00 (월요일 휴무)',
    address: '대전 동구 인동시장 내',
    couponNote: '⚠️ 이 쿠폰은 게임 데모용 가상 정보입니다. 실제 제휴 상점이 아닙니다.',
  },
}

// 버디 AI 대화 퀵 질문
export const BUDDY_QUICK_QUESTIONS = {
  sojo:   ['소제동에 대해 알려줘', '네 능력이 뭐야?', '다음엔 어디 가면 좋을까?', '소제동에서 뭘 봐야 해?'],
  jungja: ['중앙시장에 뭐가 있어?', '시장에서 뭘 먹을 수 있어?', '네 능력이 뭐야?', '중앙시장 역사는?'],
  heomi:  ['한의약거리에 대해 알려줘', '네 능력이 뭐야?', '한의약거리에서 뭘 볼 수 있어?', '약재 거리가 뭐야?'],
  indo:   ['인동시장에 대해 알려줘', '네 능력이 뭐야?', '인동시장 가는 방법은?', '인동시장에서 뭘 볼 수 있어?'],
}

// 버디 AI 폴백 응답 (API 없을 때)
export const BUDDY_FALLBACKS = {
  sojo: {
    default: '음... 소제동은 조용하고 따뜻한 곳이에요. 철길 옆 오래된 건물들이 저를 닮은 것 같아서 좋아요.',
    '소제동에 대해 알려줘': '소제동은 1930년대 철도 관사들이 지금도 남아있는 특별한 마을이에요. 시간이 천천히 흐르는 것 같아요.',
    '네 능력이 뭐야?': '저는 잊힌 기억들을 조각 내서 보여줄 수 있어요. 각성하면 카드를 2장이나 볼 수 있어요!',
    '다음엔 어디 가면 좋을까?': '중앙시장에 중앙이라는 친구가 있어요. 활발하고 이야기 좋아하는 친구예요 :)',
    '소제동에서 뭘 봐야 해?': '옛 철도 관사 건물들이 줄지어 있는 골목을 천천히 걸어봐요. 시간이 멈춘 것 같아요.',
  },
  jungja: {
    default: '오! 반가워요! 저는 중앙시장의 중앙이예요! 시장에 오면 정말 신나요!',
    '중앙시장에 뭐가 있어?': '먹거리, 옷, 생활용품 다 있어요! 순대국밥이 진짜 맛있어요! 꼭 먹어봐요!',
    '시장에서 뭘 먹을 수 있어?': '순대국밥, 빈대떡, 튀김이 유명해요! 저도 맨날 돌아다니면서 먹어요!',
    '네 능력이 뭐야?': '시장 물건 순서 기억은 저한테 맡겨요! 각성하면 두 번째 힌트도 알려줄 수 있어요!',
    '중앙시장 역사는?': '1960년대부터 이어온 대전의 전통 시장이에요. 아직도 옛날 정취가 남아있어요!',
  },
  heomi: {
    default: '...안녕하세요. 한의약거리는... 조용하고 좋은 곳이에요.',
    '한의약거리에 대해 알려줘': '전통 약재 상점들이 모여있는 거리예요. 약재 향기가... 마음을 차분하게 해줘요.',
    '네 능력이 뭐야?': '빛의 패턴을 기억해요. 각성하면 두 칸을 미리 알려드릴 수 있어요.',
    '한의약거리에서 뭘 볼 수 있어?': '오래된 약재 상점들과... 한의학 관련 용품들이요. 천천히 걸으면 좋아요.',
    '약재 거리가 뭐야?': '한의약을 파는 상점들이 모인 거리예요. 대전 동구에서 오랫동안 지켜온 장소예요.',
  },
  indo: {
    default: '안녕하세요. 인동시장의 인도입니다. 무엇이 궁금하신가요?',
    '인동시장에 대해 알려줘': '인동시장은 지역 주민들의 생활과 함께해온 소규모 전통 시장입니다. 정겨운 분위기가 있어요.',
    '네 능력이 뭐야?': '시간의 순서를 기억하는 것이 특기입니다. 각성 후에는 처음과 끝 사건을 알려드릴 수 있어요.',
    '인동시장 가는 방법은?': '대전 동구 방면으로 이동하시면 됩니다. 실제 위치는 지도에서 확인하세요.',
    '인동시장에서 뭘 볼 수 있어?': '오래된 골목과 소규모 상점들이요. 지역 주민들의 일상을 가까이서 느낄 수 있어요.',
  },
}

// ── 미션투어 코스 (스팟을 테마별로 묶은 투어) ───────────────────────────────
export const COURSES = {
  'donggu-day': {
    id: 'donggu-day',
    name: '사라진 동구의 하루',
    theme: '역사·기억',
    icon: 'history_edu',
    color: '#FF9F1C',
    desc: '철도 관사촌부터 전통시장까지, 동구의 하루를 따라 걷는 대표 코스예요.',
    estimatedMin: 90,
    stops: ['sojedom', 'jungang', 'heredi', 'indong'],
    reward: { shards: 3, badge: '동구 시간탐험가' },
  },
  'market-tour': {
    id: 'market-tour',
    name: '동구 전통시장 한바퀴',
    theme: '전통시장',
    icon: 'storefront',
    color: '#0E9F9A',
    desc: '활기 넘치는 중앙시장과 인동시장을 잇는 짧은 시장 코스예요.',
    estimatedMin: 45,
    stops: ['jungang', 'indong'],
    reward: { shards: 2, badge: '시장 골목 미식가' },
  },
}

// ── 현장 탐사 미션 (사진 인식 + 방탈출식 단서 조합) ──────────────────────────
// 각 타깃은 현장에 부착(또는 발표장에 인쇄 지참)하는 '유물 팻말' QR 코드로 인식.
// 창작 미션이며 실제 역사 주장이 아닙니다.
export const FIELD_QUESTS = {
  'sojedom-field': {
    id: 'sojedom-field', locationId: 'sojedom', type: 'field', buddyId: 'sojo',
    title: '관사촌의 흔적을 찾아라',
    intro: '소제동 골목을 둘러보며 옛 철도 관사의 흔적을 사진으로 담아요. 모은 단서를 이으면 잠든 시간 친구가 깨어나요.',
    targets: [
      { id: 'sign', code: 'DTQF-SOJEDOM-SIGN', icon: 'signpost',  label: '관사촌 안내 팻말', findHint: '골목 입구의 안내 팻말을 찾아 카메라로 담아요', clue: '철길의 방향', symbol: 'train' },
      { id: 'roof', code: 'DTQF-SOJEDOM-ROOF', icon: 'roofing',   label: '낮은 기와지붕',   findHint: '줄지어 선 관사의 낮은 지붕을 담아요',       clue: '기와의 결',   symbol: 'home' },
      { id: 'wall', code: 'DTQF-SOJEDOM-WALL', icon: 'grid_view', label: '오래된 담벼락',   findHint: '세월이 묻은 담벼락 문양을 담아요',          clue: '벽돌의 겹',   symbol: 'wallpaper' },
    ],
    solveOrder: ['sign', 'roof', 'wall'],
    solveHint: '철길을 따라 → 지붕을 지나 → 담벼락에 이르는 길을 순서대로 이어요',
    note: '창작 미션 · 실제 역사 주장 아님. 타깃 팻말을 인쇄해 현장에 부착하거나 발표장에서 스캔해요.',
  },
  'jungang-field': {
    id: 'jungang-field', locationId: 'jungang', type: 'field', buddyId: 'jungja',
    title: '시장 골목의 단서를 모아라',
    intro: '중앙시장 골목을 누비며 시장의 흔적을 사진으로 담아요.',
    targets: [
      { id: 'gate',  code: 'DTQF-JUNGANG-GATE',  icon: 'storefront',       label: '중앙시장 간판', findHint: '시장 입구의 간판을 찾아 담아요',    clue: '시장의 입구', symbol: 'storefront' },
      { id: 'stall', code: 'DTQF-JUNGANG-STALL', icon: 'shopping_basket',  label: '좌판의 물건',   findHint: '좌판에 놓인 물건을 담아요',          clue: '활기의 소리', symbol: 'shopping_basket' },
      { id: 'alley', code: 'DTQF-JUNGANG-ALLEY', icon: 'store',            label: '시장 골목',     findHint: '사람들이 오가는 시장 골목을 담아요', clue: '오랜 발걸음', symbol: 'directions_walk' },
    ],
    solveOrder: ['gate', 'stall', 'alley'],
    solveHint: '입구를 지나 → 좌판을 둘러보고 → 골목으로 이어지는 하루를 복원해요',
    note: '창작 미션 · 실제 역사 주장 아님.',
  },
  'heredi-field': {
    id: 'heredi-field', locationId: 'heredi', type: 'field', buddyId: 'heomi',
    title: '약재 거리의 향기를 쫓아라',
    intro: '한의약거리를 걸으며 전통 약재의 흔적을 사진으로 담아요.',
    targets: [
      { id: 'shop',   code: 'DTQF-HEREDI-SHOP',   icon: 'medication', label: '약재 상점 간판', findHint: '약재 상점의 간판을 찾아 담아요',     clue: '약재의 이름', symbol: 'medication' },
      { id: 'herb',   code: 'DTQF-HEREDI-HERB',   icon: 'spa',        label: '진열된 약재',   findHint: '진열된 약재의 모습을 담아요',         clue: '은은한 향기', symbol: 'spa' },
      { id: 'street', code: 'DTQF-HEREDI-STREET', icon: 'storefront', label: '거리의 표식',   findHint: '한의약거리를 알리는 표식을 담아요',   clue: '거리의 기억', symbol: 'signpost' },
    ],
    solveOrder: ['street', 'shop', 'herb'],
    solveHint: '거리로 들어서 → 상점을 지나 → 약재의 향기에 이르는 길을 이어요',
    note: '창작 미션 · 실제 역사 주장 아님.',
  },
  'indong-field': {
    id: 'indong-field', locationId: 'indong', type: 'field', buddyId: 'indo',
    title: '골목 시간의 조각을 맞춰라',
    intro: '인동시장 골목을 돌며 오래된 가게의 흔적을 사진으로 담아요.',
    targets: [
      { id: 'entry', code: 'DTQF-INDONG-ENTRY', icon: 'storefront', label: '골목 입구',   findHint: '시장 골목 입구를 찾아 담아요',       clue: '골목의 시작', symbol: 'storefront' },
      { id: 'store', code: 'DTQF-INDONG-STORE', icon: 'store',      label: '오래된 가게', findHint: '오랜 세월의 가게를 담아요',         clue: '세월의 간판', symbol: 'store' },
      { id: 'mark',  code: 'DTQF-INDONG-MARK',  icon: 'signpost',   label: '시장 표식',   findHint: '인동시장을 알리는 표식을 담아요',    clue: '골목의 이름', symbol: 'signpost' },
    ],
    solveOrder: ['entry', 'store', 'mark'],
    solveHint: '골목에 들어서 → 가게를 지나 → 표식에 이르는 하루를 복원해요',
    note: '창작 미션 · 실제 역사 주장 아님.',
  },
}

export const MISSIONS = {
  'sojedom-memory': {
    id: 'sojedom-memory', locationId: 'sojedom', type: 'memory',
    title: '흩어진 기억을 맞춰라',
    intro: '소제동 골목에 기억 조각들이 흩어져 있어요. 같은 기억끼리 연결하면 잠든 시간 친구가 깨어날 거예요.',
    pairs: [
      { id: 'train', icon: 'train',    label: '철길의 기억', color: '#4CB5AB' },
      { id: 'clock', icon: 'schedule', label: '멈춘 시계',   color: '#FF9F1C' },
      { id: 'house', icon: 'cottage',  label: '골목의 집',   color: '#61788C' },
    ],
  },
  'jungang-order': {
    id: 'jungang-order', locationId: 'jungang', type: 'order',
    title: '시장 주문을 기억하라',
    intro: '중앙시장 아저씨가 원하는 물건 순서를 기억하고, 같은 순서대로 골라줘요. 물건들이 빛나는 순서를 잘 봐요!',
    items: [
      { id: 'fish',  icon: 'set_meal',      label: '고등어',  color: '#4CB5AB' },
      { id: 'tteok', icon: 'local_dining',  label: '떡볶이',  color: '#D64B5F' },
      { id: 'tofu',  icon: 'egg',           label: '두부',    color: '#61788C' },
      { id: 'kimchi',icon: 'eco',           label: '김치',    color: '#08756F' },
    ],
    showTime: 800, // ms per item highlight
  },
  'heredi-pattern': {
    id: 'heredi-pattern', locationId: 'heredi', type: 'pattern',
    title: '빛의 패턴을 기억하라',
    intro: '헤미가 보여주는 빛의 패턴을 기억하고, 같은 칸을 눌러줘요. 3번 성공하면 헤미가 나타날 거예요.',
    gridSize: 3,
    targetCount: 4,
    rounds: 3,
    showTime: 2200,
  },
  'indong-timeline': {
    id: 'indong-timeline', locationId: 'indong', type: 'timeline',
    title: '골목의 흐름을 복원하라',
    intro: '인동시장 골목에서 일어난 일들이 뒤섞였어요. 시간 순서대로 클릭해서 올바른 흐름을 복원해줘요.',
    events: [
      { id: 'open',     icon: 'storefront',      label: '가게 문 열기',    order: 1, color: '#FF9F1C' },
      { id: 'customer', icon: 'person_walking',  label: '손님 찾아오기',  order: 2, color: '#4CB5AB' },
      { id: 'buy',      icon: 'shopping_bag',   label: '물건 고르기',    order: 3, color: '#7E8E8E' },
      { id: 'go',       icon: 'home',           label: '집으로 돌아가기',order: 4, color: '#08756F' },
    ],
  },
}
