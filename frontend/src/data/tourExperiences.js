export function muralPreviewUrl(base = '/') {
  return base === '/' ? '/daedong-wing-alley-preview.html' : 'https://ar.lobodoc.com/daedong-wing-alley-preview.html'
}

export const TOUR_EXPERIENCES = Object.freeze({
  'daejeon-station': {
    title: '출발 신호를 켜라', icon: '🚉', bg: '#174974',
    introduction: '역 앞 광장에서 열차에 오르기까지, 여행자가 마주치는 순서로 세 장면을 밝혀요.',
    observation: '현장에서는 역 입구부터 승강장까지 안내 표지가 어떻게 이어지는지 찾아보세요.',
    steps: [
      ['광장', '👣', '역 건물로 들어가기 전에 지나는 넓은 공간이에요.'],
      ['출발 안내판', '🕒', '역에 들어와서 열차의 출발 시간과 타는 곳을 확인해요.'],
      ['승강장', '🚆', '마지막으로 열차에 오르는 곳이에요.'],
    ],
  },
  woosong: {
    title: '캠퍼스의 윤곽', icon: '🏫', bg: '#39576f',
    introduction: '캠퍼스 건물을 스케치한다면? 아래에서 위로 세 부분을 골라 그림을 밝혀요.',
    observation: '현장에서는 출입이 허용된 길에서 한 건물의 입구·창·지붕선을 관찰해 보세요.',
    steps: [
      ['입구', '🚪', '사람이 드나드는 지면 가까운 부분이에요.'],
      ['창', '🪟', '입구 위쪽에서 건물 외벽의 반복되는 모습을 살펴봐요.'],
      ['지붕선', '📐', '건물의 가장 위에서 하늘과 만나는 윤곽이에요.'],
    ],
  },
  daedongcheon: {
    title: '물길 탐정', icon: '🌊', bg: '#166276',
    introduction: '물에서 육지까지, 하천 단면을 안쪽에서 바깥쪽으로 따라가 보세요.',
    observation: '현장에서는 산책로에서 물길과 가장자리를 비교해 보세요. 물가로 내려갈 필요는 없어요.',
    steps: [
      ['물길', '💧', '물이 흐르는 가장 안쪽이에요.'],
      ['물가', '🌾', '물과 육지가 맞닿는 가장자리예요.'],
      ['산책로', '👟', '물가 바깥, 걸으면서 하천을 바라보는 길이에요.'],
    ],
  },
  'daedong-maeul': { title: '바람 깃, 날개 담장', icon: '🪽', external: muralPreviewUrl(import.meta.env?.BASE_URL || '/') },
  'daedong-sky': {
    title: '전망대에 바람을 켜라', icon: '🌬️', bg: '#875268',
    introduction: '전망대에서 가까운 풍경부터 먼 풍경까지, 시선을 세 번 옮겨 야경을 밝혀요.',
    observation: '현장에서는 발밑 가까운 언덕과 멀리 보이는 도심의 윤곽을 나란히 찾아보세요.',
    steps: [
      ['가까운 언덕', '🌿', '먼저 발밑 가까운 풍경에 시선을 두어요.'],
      ['도시 풍경', '🏙️', '다음은 언덕 뒤에 펼쳐진 건물들이에요.'],
      ['하늘', '✨', '마지막은 도시 위로 펼쳐진 가장 먼 배경이에요.'],
    ],
  },
})

export function chooseTourStep(steps, progress, index) {
  if (progress < 0 || progress >= steps.length || index !== progress) return progress
  return progress + 1
}
