// 마스코트 이모티콘(표정) 세트 & 게임 리액션 대사
// MascotSvg 가 MOOD_SPEC 으로 눈/입/포즈/이펙트를 조합해 그린다.
// 값이 { majung, jungang } 객체면 캐릭터별로 다르게 그린다.

// eyes : dot | arc | wide | blank | half | angry | sad | flat | squint
// mouth: smile | open | big | o | line | shout | frown | wave   (마중이는 부리만 그림)
// pose : down | wave | up | open | tuck | forehead(이마에 손) | scratch(머리 긁기) | cheek(볼에 손)
// fx   : null | lines | bang | question | dots | anger | sigh | note | sparkle | tear | blush
// tilt : 몸 기울기(도)
export const MOOD_SPEC = {
  // 기본 표정 — 기존 화면(친구 만남·컬렉션 등)에서 쓰는 상태
  idle:    { eyes: 'dot',    mouth: 'smile', pose: 'down', fx: null },
  happy:   { eyes: 'dot',    mouth: 'open',  pose: 'wave', fx: null },
  excited: { eyes: 'arc',    mouth: 'big',   pose: 'up',   fx: 'lines' },
  shy:     { eyes: 'squint', mouth: 'wave',  pose: 'tuck', fx: 'blush' },
  sad:     { eyes: 'sad',    mouth: 'frown', pose: 'tuck', fx: 'tear' },

  // 스케치 이모티콘
  blank:     { eyes: { majung: 'blank', jungang: 'half' }, mouth: 'shout', pose: 'down', fx: 'dots' },
  angry:     { eyes: 'angry',  mouth: 'frown', pose: 'wave',     fx: 'anger' },
  sigh:      { eyes: 'flat',   mouth: 'shout', pose: 'forehead', fx: 'sigh' },
  confused:  { eyes: 'dot',    mouth: 'smile', pose: 'scratch',  fx: 'question', tilt: -8 },
  hype:      { eyes: 'squint', mouth: 'big',   pose: 'up',       fx: 'sparkle' },
  aha:       { eyes: 'dot',    mouth: 'open',  pose: 'wave',     fx: 'bang' },
  curious:   { eyes: 'dot',    mouth: 'open',  pose: 'cheek',    fx: 'question', tilt: -5 },
  surprised: { eyes: 'wide',   mouth: 'shout', pose: 'wave',     fx: 'bang' },
  laugh:     { eyes: 'squint', mouth: 'big',   pose: 'open',     fx: 'lines' },
  humming:   { eyes: 'arc',    mouth: 'big',   pose: 'down',     fx: 'note' },
}

export const MASCOTS = {
  majung:  { id: 'majung',  name: '마중이' },
  jungang: { id: 'jungang', name: '중앙이' },
}

// 캐릭터별 이모티콘 세트 (스케치 6종, 스프라이트 시트 순서)
export const EMOTE_SETS = {
  majung: [
    { id: 'blank',    label: '멍…' },
    { id: 'angry',    label: '화남' },
    { id: 'sigh',     label: '한숨' },
    { id: 'confused', label: '갸우뚱' },
    { id: 'hype',     label: '신남' },
    { id: 'aha',      label: '아하!' },
  ],
  jungang: [
    { id: 'curious',   label: '갸우뚱' },
    { id: 'surprised', label: '깜짝!' },
    { id: 'sigh',      label: '한숨' },
    { id: 'blank',     label: '멍…' },
    { id: 'laugh',     label: '폭소' },
    { id: 'humming',   label: '콧노래' },
  ],
}

// 게임 상황별 리액션: 캐릭터별 표정 + 대사 후보
export const REACTIONS = {
  arrive: {
    emote: { majung: 'aha', jungang: 'surprised' },
    lines: {
      majung:  ['도착했어요! 여기서 기억을 찾아봐요', '바로 여기예요! 주변을 둘러봐요'],
      jungang: ['오! 여기 냄새가 달라요!', '도착! 단서가 숨어 있을 거예요'],
    },
  },
  wrong: {
    emote: { majung: 'sigh', jungang: 'sigh' },
    lines: {
      majung:  ['괜찮아요, 다시 해봐요!', '앗, 길을 살짝 잘못 들었네요'],
      jungang: ['으앗, 아깝다! 한 번 더!', '단서를 다시 보면 보일 거예요'],
    },
  },
  correct: {
    emote: { majung: 'aha', jungang: 'humming' },
    lines: {
      majung:  ['맞아요! 잘하고 있어요', '좋아요, 그대로 가요!'],
      jungang: ['정답! 역시!', '바로 그거예요!'],
    },
  },
  win: {
    emote: { majung: 'hype', jungang: 'laugh' },
    lines: {
      majung:  ['미션 성공! 지도가 물들고 있어요', '해냈어요! 다음 길도 마중 갈게요'],
      jungang: ['성공이다! 기억 조각 획득!', '최고예요! 시장도 신났어요'],
    },
  },
}

// { majung, jungang } 형태면 캐릭터에 맞는 값을 고른다
export function pick(value, character) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value[character] : value
}
