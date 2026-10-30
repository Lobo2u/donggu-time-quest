// 스토리 / 튜토리얼 대화 (초안)
// who: majung | jungang, emote: data/emotes.js 의 표정 id
// 게임 스토리·캐릭터는 창작이며, 장소 설명은 LOCATIONS.realNote 의 공개 사실을 따른다.

export const STORIES = {
  // 첫 시작 — 게임 방법 안내
  intro: [
    { who: 'majung',  emote: 'aha',       text: '어서 와요, 탐험가님! 저는 동구 길을 안내하는 역무원 까치, 마중이예요.' },
    { who: 'jungang', emote: 'humming',   text: '나는 중앙시장 입구 간판, 중앙이! 반가워요~' },
    { who: 'majung',  emote: 'sigh',      text: '그런데 큰일이에요… 동구 지도에서 장소들의 기억이 하나둘 사라지고 있어요.' },
    { who: 'jungang', emote: 'blank',     text: '그래서 지도가 이렇게 흑백이 돼 버렸어요…' },
    { who: 'majung',  emote: 'confused',  text: '기억을 되찾으려면 직접 그 장소까지 걸어가 봐야 해요.' },
    { who: 'jungang', emote: 'surprised', text: '현장에 숨은 단서를 찾아 미션을 풀면, 그 구역에 다시 색이 돌아와요!' },
    { who: 'majung',  emote: 'hype',      text: '첫 목적지는 소제동 철도관사촌이에요. 지도에서 장소를 눌러 출발해요!' },
    { who: 'jungang', emote: 'laugh',     text: '미션을 깨면 근처 가게 쿠폰도 받을 수 있어요. 가자!' },
  ],

  // 장소 도착
  'arrive-sojedom': [
    { who: 'majung',  emote: 'aha',      text: '도착! 여기가 1930년대 철도 관사들이 남아 있는 소제동이에요.' },
    { who: 'majung',  emote: 'confused', text: '방금 저 담벼락 사이에서 뭔가 깜빡였는데… 보셨어요?' },
    { who: 'jungang', emote: 'curious',  text: '기억 조각인가 봐요! 골목의 흔적을 살펴보고 자물쇠 번호를 찾아봐요.' },
  ],
  'arrive-jungang': [
    { who: 'jungang', emote: 'laugh',     text: '여기가 바로 내 고향, 중앙시장이에요!' },
    { who: 'jungang', emote: 'humming',   text: '1960년대부터 이어진 시장이라 골목마다 이야기가 가득해요~' },
    { who: 'majung',  emote: 'confused',  text: '근데 저쪽 좌판 사이로 뭔가 종종종 뛰어다니는데요?' },
    { who: 'jungang', emote: 'surprised', text: '앗, 시장의 기억을 찾는 친구 같아요! 따라가 봐요!' },
  ],
  'arrive-heredi': [
    { who: 'majung',  emote: 'sigh',    text: '킁킁… 약재 향이 정말 진하네요.' },
    { who: 'jungang', emote: 'curious', text: '골목 안쪽에서 빛이 일정한 모양으로 깜빡이고 있어요.' },
    { who: 'majung',  emote: 'aha',     text: '그 빛의 패턴이 기억의 열쇠예요! 잘 보고 똑같이 따라 해 봐요.' },
  ],
  'arrive-indong': [
    { who: 'jungang', emote: 'humming',  text: '인동시장은 동네 사람들의 하루가 담긴 작은 시장이에요~' },
    { who: 'majung',  emote: 'confused', text: '그런데 여기서 일어난 일들의 순서가 뒤죽박죽 섞여 버렸어요.' },
    { who: 'jungang', emote: 'laugh',    text: '우리가 순서를 다시 맞춰 주자!' },
  ],

  // 첫 미션 성공 — 보상 안내
  'first-win': [
    { who: 'majung',  emote: 'hype',    text: '해냈어요! 지도에 색이 돌아오고 있어요!' },
    { who: 'jungang', emote: 'laugh',   text: '단서 조각도 얻었어요! 모으면 시간 친구를 강화할 수 있어요.' },
    { who: 'majung',  emote: 'aha',     text: '받은 쿠폰은 근처 제휴 가게에서 쓸 수 있어요. 다음 장소도 열렸으니 지도로 가 봐요!' },
  ],
}
