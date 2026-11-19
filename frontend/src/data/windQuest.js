// 대표 퀘스트 「대동의 바람을 찾아서」 데이터 (답사 테스트용 데모)
//
// 장소별 좌표·사진·문제·정답·보상을 이 한 파일에서 교체한다.
// - 실제 답사 사진/좌표가 없으므로 지금은 demo:true 로 '답사 테스트용' 데모로만 동작한다.
// - 운영 지도(LOCATIONS)·진행 기록(gameStore)과 섞지 않는다. 진행은 windQuestStore(별도 키).
// - 참고 사이트의 사진을 그대로 복제하지 않는다. 데모 비주얼은 자체 제작 SVG(WindArt)로 그린다.
// - 캐릭터 '하늘이' 원본 이미지는 사용 허가 확인 전까지 넣지 않는다(바람 아이콘/텍스트로 대체).
//
// 답사 후 채울 것: stops[].lat/lng(좌표), stops[].photo(실사진 URL),
//   crop/zone 영역, choices 정답 근거, reveal.story(장소 이야기).

export const WIND_QUEST = {
  id: 'wind',
  title: '대동의 바람을 찾아서',
  subtitle: '흩어진 풍차 부품 3개를 찾아 나만의 풍차를 완성해요',
  demo: true, // 답사 자료(실사진·좌표) 확보 전 데모

  opening: {
    lines: [
      '대동천에서 불어온 바람에 풍차 부품이 흩어졌어요.',
      '바람의 친구 「하늘이」가 흩어진 부품 세 개를 함께 찾아달래요.',
      '벽화마을 → 하늘공원 입구 → 전망대 순서로 단서를 찾아봐요!',
    ],
    // 하늘이: 대동천과 하늘공원 풍차를 함께 상징(동구청 소개 참고). 원본 이미지 미사용.
    note: '하늘이는 대동천과 하늘공원 풍차를 함께 상징하는 바람 친구예요. (캐릭터 이미지는 사용 허가 전이라 바람 아이콘으로 표현합니다)',
    // 대동천은 '시작 이야기'로만 연결 — 방문을 강제하지 않음.
    startFrom: '대동천',
  },

  // 부품 3종 — 스톱 보상으로 지급
  parts: {
    wing: { id: 'wing', label: '날개', emoji: '🪶' },
    base: { id: 'base', label: '받침대', emoji: '🧱' },
    center: { id: 'center', label: '중앙 장식', emoji: '✦' },
  },

  // 플레이 순서대로 3개 스톱
  stops: [
    {
      id: 'maeul',
      name: '대동벽화마을',
      reward: 'wing',
      arId: 'daedong-maeul', // 입체 AR 건물(코스 모델) 연동
      type: 'crop-detective',
      // 답사 후 채우기
      lat: null, lng: null,
      photo: null,      // 실사진 URL (없으면 자체 제작 데모 그림)
      cropArt: 'mural-crop',   // WindArt 데모 조각
      fullArt: 'mural-full',   // 정답 공개용 데모 전체 그림
      prompt: '벽화의 이 작은 부분, 현장에서 보면 무엇일까요?',
      choices: [
        { id: 'a', label: '계단 옆 화분' },
        { id: 'b', label: '담벼락에 그려진 바람개비', correct: true },
        { id: 'c', label: '빨간 우체통' },
      ],
      hint: '벽을 가득 채운 그림의 일부예요. 바람과 관련이 있어요. (※ 실제 벽화 도안은 답사 후 확인해 교체)',
      reveal: {
        title: '대동벽화마을',
        story: '한국전쟁 피란 시절의 달동네가 2007년 주민·작가들의 벽화로 되살아난 골목이에요. 좁은 계단길을 오르며 그림을 구경할 수 있어요.',
      },
    },
    {
      id: 'sky-gate',
      name: '하늘공원 입구',
      reward: 'base',
      arId: 'daedong-sky', // 입체 AR 건물(붉은 풍차) 연동
      type: 'field-observation',
      lat: null, lng: null,
      photo: null,
      art: 'gate',
      prompt: '하늘공원 입구에서 확인할 수 있는 특징은 무엇일까요?',
      choices: [
        { id: 'a', label: '벽화 골목을 지나 언덕 위로 오르는 길', correct: true },
        { id: 'b', label: '넓은 주차장과 분수대' },
        { id: 'c', label: '지하철 출구 바로 앞' },
      ],
      hint: '공원은 언덕 위 전망대예요. 벽화마을을 지나 올라가요. (※ 입구 표지·조형물의 정확한 특징은 답사 후 교체)',
      reveal: {
        title: '하늘공원 입구',
        story: '대동 언덕 위(해발 약 127m)에 자리한 공원으로, 벽화 골목을 지나 올라가면 대전 시내가 한눈에 보이는 전망이 펼쳐져요.',
      },
      // 별 조형물·바람개비 등 실물/위치는 답사 확인 전까지 문제에 넣지 않음.
    },
    {
      id: 'view',
      name: '전망대',
      reward: 'center',
      arId: 'daejeon-station', // 전망 속 대전역·철도트윈타워 일대를 입체 AR 로
      type: 'zone-select',
      lat: null, lng: null,
      photo: null,          // 실제 전망 사진(답사 후). 없으면 자체 제작 스카이라인.
      viewArt: 'skyline',
      // 3x3 구역에서 정답 구역(데모 스카이라인에서 쌍둥이 타워 위치)
      grid: { cols: 3, rows: 3, answer: 5 }, // 0-indexed, 가운데 오른쪽
      prompt: '전망에서 대전역 동광장 옆 「철도트윈타워」(쌍둥이 빌딩)가 있는 구역을 고르세요.',
      hint: '힌트: 타워만 잘라낸 모습이에요. 나란히 선 두 개의 높은 건물을 찾아요.',
      cropArt: 'twin-crop', // 타워만 잘라낸 힌트 이미지(자체 제작)
      reveal: {
        title: '전망대 · 철도트윈타워',
        story: '대전역 동광장 옆에 나란히 선 쌍둥이 고층 건물이에요. 대동 언덕 전망에서 도심 쪽을 바라보면 멀리 보여요.',
      },
      allowPhotoMode: true, // 눈·안개로 현장이 안 보이면 저장된 사진으로 플레이 (완료 방식 구분)
    },
  ],

  finale: {
    wingColors: [
      { id: 'red', name: '노을빨강', hex: '#e2726b' },
      { id: 'blue', name: '하늘파랑', hex: '#4f97c4' },
      { id: 'yellow', name: '바람노랑', hex: '#f2c559' },
      { id: 'green', name: '언덕초록', hex: '#6aa37a' },
    ],
    defaultName: '대동의 바람',
  },
}

export const WIND_STOPS = WIND_QUEST.stops
export const WIND_PART_IDS = WIND_QUEST.stops.map(s => s.reward) // ['wing','base','center']
export function getStop(id) { return WIND_QUEST.stops.find(s => s.id === id) || null }
