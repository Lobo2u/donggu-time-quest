// 실제 장소 정보는 공개된 사실 기반이며, 게임 스토리·캐릭터는 창작입니다.

export const LOCATIONS = {
  sojedom: {
    id: 'sojedom',
    name: '소제동',
    subtitle: '옛 철도 관사촌 골목',
    mapX: 48,
    mapY: 252,
    // 실제 소제동 좌표 (공개 지도 기반)
    lat: 36.3449,
    lng: 127.4436,
    arrivalRadius: 300, // meters
    buddyId: 'sojo',
    missionId: 'sojedom-memory-match',
    unlockCondition: null,
    realNote: '실제 소제동은 대전 동구의 역사 문화 마을로, 1930년대 철도 관사 건물들이 보존되어 있습니다.',
    storyContext: [
      '소제동 골목에 도착했어요.',
      '1930년대 지어진 철도 관사들이 줄지어 선 이곳.',
      '오래된 담벼락 사이로 뭔가 작은 빛이 깜빡이고 있어요.',
      '가까이 다가가보니, 기억 조각들이 흩어진 채 잠들어 있었어요.',
    ],
    storyNote: '[이 이야기는 창작 시나리오입니다. 실제 역사와 다를 수 있어요.]',
  },
  jungang: {
    id: 'jungang',
    name: '중앙시장',
    subtitle: '대전의 오래된 전통 시장',
    mapX: 146,
    mapY: 470,
    lat: 36.3264,
    lng: 127.4203,
    arrivalRadius: 300,
    buddyId: 'jungja',
    missionId: 'jungang-order-game',
    unlockCondition: 'sojedom',
    realNote: '대전 중앙시장은 1960년대부터 이어져 온 전통 시장입니다.',
    storyContext: ['중앙시장에 도착했어요. 수십 년의 이야기가 쌓인 곳이에요.'],
    storyNote: '[창작 시나리오]',
  },
  heredi: {
    id: 'heredi',
    name: '한의약거리',
    subtitle: '약령시장 일대',
    mapX: 236,
    mapY: 310,
    lat: 36.3251,
    lng: 127.4185,
    arrivalRadius: 300,
    buddyId: 'heomi',
    missionId: 'heredi-pattern',
    unlockCondition: 'jungang',
    realNote: '대전 한의약거리는 전통 약재 상점이 밀집한 지역입니다.',
    storyContext: ['한의약거리에 도착했어요. 진한 약재 향기가 퍼져나와요.'],
    storyNote: '[창작 시나리오]',
  },
  indong: {
    id: 'indong',
    name: '인동시장',
    subtitle: '골목 안 작은 시장',
    mapX: 260,
    mapY: 558,
    lat: 36.3268,
    lng: 127.4215,
    arrivalRadius: 300,
    buddyId: 'indo',
    missionId: 'indong-timeline',
    unlockCondition: 'heredi',
    realNote: '인동시장은 대전 동구 인근에 위치한 소규모 전통 시장입니다.',
    storyContext: ['인동시장에 도착했어요. 좁은 골목 사이로 오랜 가게들이 이어져 있어요.'],
    storyNote: '[창작 시나리오]',
  },
}

export const BUDDIES = {
  sojo: {
    id: 'sojo',
    name: '소조',
    subtitle: '기억을 지키는 빛의 조각',
    location: '소제동',
    description: '소제동 골목을 홀로 지켜온 시간 친구예요. 오래된 기억들을 조각조각 모아 빛으로 만들어요. 낯선 사람에게는 수줍어하지만, 마음을 열면 잊힌 장면들을 슬쩍 보여줄 수 있어요.',
    personality: '수줍음 · 호기심 · 따뜻함',
    ability: {
      name: '기억 현상',
      description: '미션 중 단서 카드 하나를 잠깐 공개해요.',
      useLabel: '소조의 능력 사용',
    },
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
          { label: '게임 규칙 설명하기', correct: false, hint: '소조가 관심 없다는 듯 고개를 돌렸어요. 소조가 가장 좋아하는 건 무엇일까요?' },
          { label: '기억을 같이 보자고 하기', correct: true, reaction: '소조의 몸 안에서 작은 빛이 반짝였어요.' },
          { label: '어디서 왔냐고 묻기', correct: false, hint: '소조가 잠깐 눈을 깜빡이더니 주춤했어요. 소조에게 의미 있는 건 뭘까요?' },
        ],
      },
      {
        situation: '소조가 주변에 모아둔 기억 조각들을 조심스럽게 보여줘요.',
        question: '소조에게 마지막으로 뭐라고 할까요?',
        choices: [
          { label: '빨리 다음 장소로 가자고 하기', correct: false, hint: '소조의 눈빛이 잠깐 흔들렸어요. 혼자 남겨질까봐 걱정하는 것 같아요.' },
          { label: '여기서 계속 기억을 지켜달라고 하기', correct: false, hint: '소조가 고개를 살짝 숙였어요. 혼자가 아니라 같이가 소조에게 필요한 것 같아요.' },
          { label: '항상 함께하자고 약속하기', correct: true, reaction: '소조의 안테나 별이 환하게 빛났어요. 동료가 되었어요!' },
        ],
      },
    ],
    xpReward: 50,
    shardsReward: 1,
  },
  // 미구현 버디 (도감에 "미발견"으로 표시)
  jungja: {
    id: 'jungja',
    name: '???',
    subtitle: '아직 발견되지 않았어요',
    location: '중앙시장',
    description: '중앙시장에 숨어 있는 시간 친구. 소제동 탐험을 완료하면 만날 수 있어요.',
    locked: true,
  },
  heomi: {
    id: 'heomi',
    name: '???',
    subtitle: '아직 발견되지 않았어요',
    location: '한의약거리',
    description: '한의약거리를 지키는 시간 친구.',
    locked: true,
  },
  indo: {
    id: 'indo',
    name: '???',
    subtitle: '아직 발견되지 않았어요',
    location: '인동시장',
    description: '인동시장 골목의 시간 친구.',
    locked: true,
  },
}

export const MISSIONS = {
  'sojedom-memory-match': {
    id: 'sojedom-memory-match',
    locationId: 'sojedom',
    title: '흩어진 기억을 맞춰라',
    intro: '소제동 골목에 기억 조각들이 흩어져 있어요. 같은 기억끼리 연결하면 잠든 시간 친구가 깨어날 거예요.',
    type: 'memory-match',
    pairs: [
      { id: 'train',  icon: 'train',    label: '철길의 기억',  color: '#4CB5AB' },
      { id: 'clock',  icon: 'schedule', label: '멈춘 시계',    color: '#FF9F1C' },
      { id: 'house',  icon: 'cottage',  label: '골목의 집',    color: '#61788C' },
    ],
    hintText: '소조의 능력으로 카드 하나를 잠깐 볼 수 있어요.',
  },
}
