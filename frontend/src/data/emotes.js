// 마스코트 이모티콘(표정) 세트 & 게임 리액션 대사
// MascotSvg 가 MOOD_SPEC 으로 눈/입/포즈/이펙트를 조합해 그린다.

// eyes : dot | arc | heart | wide | sad | flat | squint | wink
// mouth: smile | open | big | o | frown | wave
// pose : down | wave | up | open | tuck   (마중이 날개 / 중앙이 손)
// fx   : null | lines | hearts | bang | tear | zzz | blush | sparkle | sweat
export const MOOD_SPEC = {
  idle:      { eyes: 'dot',    mouth: 'smile', pose: 'down', fx: null },
  happy:     { eyes: 'dot',    mouth: 'open',  pose: 'wave', fx: null },
  excited:   { eyes: 'arc',    mouth: 'big',   pose: 'up',   fx: 'lines' },
  love:      { eyes: 'heart',  mouth: 'open',  pose: 'down', fx: 'hearts' },
  surprised: { eyes: 'wide',   mouth: 'o',     pose: 'open', fx: 'bang' },
  sad:       { eyes: 'sad',    mouth: 'frown', pose: 'tuck', fx: 'tear' },
  sleepy:    { eyes: 'flat',   mouth: 'o',     pose: 'tuck', fx: 'zzz' },
  shy:       { eyes: 'squint', mouth: 'wave',  pose: 'tuck', fx: 'blush' },
  cheer:     { eyes: 'wink',   mouth: 'big',   pose: 'up',   fx: 'sparkle' },
  oops:      { eyes: 'squint', mouth: 'wave',  pose: 'open', fx: 'sweat' },
}

export const MASCOTS = {
  majung:  { id: 'majung',  name: '마중이' },
  jungang: { id: 'jungang', name: '중앙이' },
}

// 이모티콘 세트 (스프라이트 시트 순서)
export const EMOTES = [
  { id: 'idle',      label: '기본' },
  { id: 'happy',     label: '반가워요' },
  { id: 'excited',   label: '신나요' },
  { id: 'love',      label: '좋아요' },
  { id: 'cheer',     label: '화이팅' },
  { id: 'surprised', label: '깜짝!' },
  { id: 'shy',       label: '부끄부끄' },
  { id: 'oops',      label: '앗차' },
  { id: 'sad',       label: '시무룩' },
  { id: 'sleepy',    label: '졸려요' },
]

// 게임 상황별 리액션: 표정 + 캐릭터별 대사 후보
export const REACTIONS = {
  arrive: {
    emote: 'surprised',
    lines: {
      majung:  ['도착했어요! 여기서 기억을 찾아봐요', '바로 여기예요! 주변을 둘러봐요'],
      jungang: ['오! 여기 냄새가 달라요!', '도착! 단서가 숨어 있을 거예요'],
    },
  },
  wrong: {
    emote: 'oops',
    lines: {
      majung:  ['괜찮아요, 다시 해봐요!', '앗, 길을 살짝 잘못 들었네요'],
      jungang: ['으앗, 아깝다! 한 번 더!', '단서를 다시 보면 보일 거예요'],
    },
  },
  correct: {
    emote: 'happy',
    lines: {
      majung:  ['맞아요! 잘하고 있어요', '좋아요, 그대로 가요!'],
      jungang: ['정답! 역시!', '바로 그거예요!'],
    },
  },
  win: {
    emote: 'cheer',
    lines: {
      majung:  ['미션 성공! 지도가 물들고 있어요', '해냈어요! 다음 길도 마중 갈게요'],
      jungang: ['성공이다! 기억 조각 획득!', '최고예요! 시장도 신났어요'],
    },
  },
  sad: {
    emote: 'sad',
    lines: {
      majung:  ['조금 쉬었다 가도 괜찮아요'],
      jungang: ['힝… 다시 해볼까요?'],
    },
  },
}
