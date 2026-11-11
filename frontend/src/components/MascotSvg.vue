<script setup>
// 공식 마스코트 SVG 스프라이트 (표정 세트 포함)
// - majung : 마중이 (역무원 제복을 입은 까치 안내자)
// - jungang: 중앙이 (중앙시장 아치 간판 캐릭터)
// mood 목록은 data/emotes.js 의 MOOD_SPEC / EMOTE_SETS 를 따른다.
import { computed } from 'vue'
import { MOOD_SPEC, pick } from '../data/emotes.js'

const props = defineProps({
  character: { type: String,  default: 'majung' }, // majung | jungang
  mood:      { type: String,  default: 'idle' },
  size:      { type: Number,  default: 120 },
  awoken:    { type: Boolean, default: false },   // 강화 상태: 왕관
  animated:  { type: Boolean, default: true },    // 스프라이트 내보내기 시 false
})

const isMajung = computed(() => props.character !== 'jungang')
const spec = computed(() => {
  const raw = MOOD_SPEC[props.mood] ?? MOOD_SPEC.idle
  const who = isMajung.value ? 'majung' : 'jungang'
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, pick(v, who)]))
})

// 캐릭터별 얼굴 좌표 (눈 / 입 / 볼 / 이펙트 기준점)
const g = computed(() => isMajung.value
  ? { ex1: 50, ex2: 70, ey: 61, er: 4.6, my: 71, cy: 70, cx1: 42, cx2: 78, fx: 104, fy: 22, ink: '#141821' }
  : { ex1: 47, ex2: 73, ey: 82, er: 4.4, my: 90, cy: 90, cx1: 34, cx2: 86, fx: 108, fy: 16, ink: '#1E2229' })

// 날개(마중이) 회전 / 손(중앙이) 위치
const wingRot = computed(() => ({
  down:  [0, 0],
  wave:  [95, 0],
  up:    [95, 95],
  open:  [30, 30],
  tuck:  [-12, -12],
  point:    [120, 0],
  forehead: [155, 0],
  scratch:  [136, 0],
  cheek:    [136, 0],
}[spec.value.pose] ?? [0, 0]))

const hands = computed(() => ({
  down:  [[11, 90], [109, 90]],
  wave:  [[11, 62], [109, 90]],
  up:    [[11, 60], [109, 60]],
  open:  [[10, 78], [110, 78]],
  tuck:  [[16, 98], [104, 98]],
  point:    [[12, 48], [109, 90]],
  forehead: [[36, 72], [109, 90]],
  scratch:  [[14, 40], [109, 90]],
  cheek:    [[28, 93], [109, 90]],
}[spec.value.pose] ?? [[11, 90], [109, 90]]))

// 날개는 어깨(42,86) 기준으로 회전, 이마에 댈 때는 얼굴을 다 가리지 않게 살짝 줄인다
function wingT(deg) {
  const k = { forehead: 0.72, point: 0.8 }[spec.value.pose]
  const scale = k ? ` translate(42 86) scale(${k}) translate(-42 -86)` : ''
  return `rotate(${deg} 42 86)${scale}`
}

// 이마·볼에 댄 왼손(날개)은 얼굴 위에 그려야 하므로 앞 레이어로 옮긴다
const frontHand = computed(() => ['forehead', 'cheek'].includes(spec.value.pose))
const SPARK = 'M0 -5 Q1 -1 5 0 Q1 1 0 5 Q-1 1 -5 0 Q-1 -1 0 -5 Z'
</script>

<template>
  <svg
    :width="size"
    :height="size * 1.17"
    viewBox="0 0 120 140"
    xmlns="http://www.w3.org/2000/svg"
    class="mascot-svg"
    :class="animated ? mood : ''"
    :aria-label="(isMajung ? '마중이' : '중앙이') + ' ' + mood"
  >
    <!-- 그림자 -->
    <ellipse cx="60" cy="134" rx="30" ry="5" fill="#08233F22" />

    <g :transform="spec.tilt ? `rotate(${spec.tilt} 60 130)` : null">
    <!-- ─────────── 마중이 ─────────── -->
    <g v-if="isMajung">
      <!-- 꼬리 깃 -->
      <path d="M62 100 Q92 104 116 124 Q114 133 106 133 Q82 124 60 116 Z" fill="#1B1F2A" />
      <path d="M84 110 Q102 118 113 127 Q110 130 106 130 Q94 122 82 116 Z" fill="#2F5FB8" />

      <!-- 발 -->
      <rect x="47" y="112" width="6" height="14" rx="2" fill="#1B1F2A" />
      <rect x="67" y="112" width="6" height="14" rx="2" fill="#1B1F2A" />
      <path d="M41 132 L50 122 L59 132 Q50 129 41 132 Z" fill="#2B2F38" />
      <path d="M61 132 L70 122 L79 132 Q70 129 61 132 Z" fill="#2B2F38" />

      <!-- 흰 배 -->
      <ellipse cx="60" cy="112" rx="21" ry="10" fill="#FFFFFF" stroke="#C9CED6" stroke-width="1" />

      <!-- 제복 상의 -->
      <path d="M36 92 Q36 82 46 82 L74 82 Q84 82 84 92 L86 110 Q60 118 34 110 Z" fill="#1F2D55" stroke="#141E3C" stroke-width="1" />
      <!-- 셔츠 + 넥타이 -->
      <path d="M51 82 L60 96 L69 82 Z" fill="#FFFFFF" />
      <path d="M58 84 L62 84 L63 87.5 L61.2 99 L58.8 99 L57 87.5 Z" fill="#E53935" />
      <!-- 금색 깃 라인 -->
      <path d="M49 82 L58 99" stroke="#E3B23C" stroke-width="1.5" fill="none" stroke-linecap="round" />
      <path d="M71 82 L62 99" stroke="#E3B23C" stroke-width="1.5" fill="none" stroke-linecap="round" />
      <!-- 단추 / 주머니 -->
      <circle cx="65" cy="103" r="1.8" fill="#F5B301" />
      <circle cx="65" cy="109" r="1.8" fill="#F5B301" />
      <line x1="41" y1="103" x2="50" y2="103" stroke="#E3B23C" stroke-width="1.4" stroke-linecap="round" />

      <!-- 크로스백 -->
      <line x1="45" y1="84" x2="75" y2="108" stroke="#15181E" stroke-width="2.4" stroke-linecap="round" />
      <rect x="70" y="105" width="15" height="12" rx="2.5" fill="#22252B" stroke="#0F1115" stroke-width="1" />
      <path d="M70 108 L85 108" stroke="#0F1115" stroke-width="1" />
      <circle cx="77.5" cy="110" r="1.2" fill="#F5B301" />

      <!-- 머리 -->
      <circle cx="60" cy="60" r="29" fill="#1B1F2A" />
      <path d="M33 56 Q26 50 30 44 Q34 50 37 52 Z" fill="#1B1F2A" />
      <ellipse cx="60" cy="66" rx="23" ry="17" fill="#FFFDF8" />
      <!-- 날개 (왼쪽 / 거울 반전한 오른쪽) -->
      <g v-if="!frontHand" :transform="wingT(wingRot[0])">
        <path d="M46 84 Q24 86 18 104 Q14 114 15 125 L20 120 L21 128 L26 121 L28 127 Q37 112 47 98 Z" fill="#1B1F2A" />
        <path d="M41 92 Q29 98 25 110 Q31 106 37 102 Q41 99 43 96 Z" fill="#FFFFFF" />
        <path d="M24 108 Q18 116 18 123 L21 119 Q24 113 28 109 Z" fill="#3D7BE0" />
      </g>
      <g transform="translate(120 0) scale(-1 1)">
        <g :transform="wingT(wingRot[1])">
          <path d="M46 84 Q24 86 18 104 Q14 114 15 125 L20 120 L21 128 L26 121 L28 127 Q37 112 47 98 Z" fill="#1B1F2A" />
          <path d="M41 92 Q29 98 25 110 Q31 106 37 102 Q41 99 43 96 Z" fill="#FFFFFF" />
          <path d="M24 108 Q18 116 18 123 L21 119 Q24 113 28 109 Z" fill="#3D7BE0" />
        </g>
      </g>
    </g>

    <!-- ─────────── 중앙이 ─────────── -->
    <g v-else>
      <!-- 다리 + 신발 -->
      <rect x="38" y="104" width="9" height="18" rx="2" fill="#9AA1AA" stroke="#6B7280" stroke-width="1.5" />
      <rect x="73" y="104" width="9" height="18" rx="2" fill="#9AA1AA" stroke="#6B7280" stroke-width="1.5" />
      <ellipse cx="42" cy="126" rx="12" ry="7" fill="#FFFFFF" stroke="#9AA1AA" stroke-width="2" />
      <ellipse cx="78" cy="126" rx="12" ry="7" fill="#FFFFFF" stroke="#9AA1AA" stroke-width="2" />

      <!-- 아치 유리창 -->
      <path d="M26 52 Q26 24 60 24 Q94 24 94 52 Z" fill="#74AEEA" />
      <line x1="44" y1="27" x2="44" y2="52" stroke="#FFFFFF" stroke-width="1.3" opacity="0.85" />
      <line x1="60" y1="24" x2="60" y2="52" stroke="#FFFFFF" stroke-width="1.3" opacity="0.85" />
      <line x1="76" y1="27" x2="76" y2="52" stroke="#FFFFFF" stroke-width="1.3" opacity="0.85" />
      <path d="M30 38 Q60 33 90 38" stroke="#FFFFFF" stroke-width="1.3" fill="none" opacity="0.6" />
      <!-- 빨간 아치 지붕 -->
      <path d="M14 56 Q14 12 60 12 Q106 12 106 56 L94 56 Q94 24 60 24 Q26 24 26 56 Z" fill="#E8463C" stroke="#B8322A" stroke-width="1.5" />
      <path d="M18 44 Q22 22 44 16" stroke="#FF8A7F" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7" />
      <rect x="52" y="7" width="16" height="12" rx="3" fill="#E8463C" stroke="#B8322A" stroke-width="1.5" />

      <!-- 손 -->
      <circle v-if="!frontHand" :cx="hands[0][0]" :cy="hands[0][1]" r="9" fill="#FFFFFF" stroke="#9AA1AA" stroke-width="2" />
      <circle :cx="hands[1][0]" :cy="hands[1][1]" r="9" fill="#FFFFFF" stroke="#9AA1AA" stroke-width="2" />

      <!-- 간판 몸통 -->
      <rect x="16" y="46" width="88" height="61" rx="10" fill="#9AA1AA" stroke="#6B7280" stroke-width="2" />
      <rect x="22" y="51" width="76" height="14" rx="3" fill="#FFFFFF" />
      <circle cx="33" cy="58" r="5" fill="#F39A1E" />
      <g fill="#FFFFFF" transform="translate(33 58)">
        <circle cx="-1.6" cy="-2" r="1" /><circle cx="1.6" cy="-2" r="1" />
        <rect x="-2.4" y="-0.8" width="1.6" height="3.4" rx="0.6" />
        <rect x="0.8" y="-0.8" width="1.6" height="3.4" rx="0.6" />
      </g>
      <text x="64" y="62" text-anchor="middle" font-size="10.5" font-weight="900" fill="#2A2F3A"
        font-family="'Noto Sans KR', sans-serif">중앙시장</text>
      <rect x="22" y="68" width="76" height="34" rx="4" fill="#FBF8F1" />
    </g>

    <!-- ─────────── 공통 얼굴 ─────────── -->
    <!-- 볼 홍조 -->
    <ellipse :cx="g.cx1" :cy="g.cy" rx="5.5" ry="3.3" fill="#FF9BA0" :opacity="spec.fx === 'blush' ? 0.9 : 0.5" />
    <ellipse :cx="g.cx2" :cy="g.cy" rx="5.5" ry="3.3" fill="#FF9BA0" :opacity="spec.fx === 'blush' ? 0.9 : 0.5" />
    <template v-if="spec.fx === 'blush'">
      <path v-for="cx in [g.cx1, g.cx2]" :key="cx"
        :d="`M${cx - 3} ${g.cy + 1.5} l2 -3 M${cx} ${g.cy + 1.5} l2 -3 M${cx + 3} ${g.cy + 1.5} l2 -3`"
        stroke="#E0607A" stroke-width="1" stroke-linecap="round" />
    </template>

    <!-- 눈 -->
    <g v-for="(ex, i) in [g.ex1, g.ex2]" :key="'eye' + i">
      <!-- 동그란 눈 -->
      <template v-if="spec.eyes === 'dot' || spec.eyes === 'sad' || spec.eyes === 'angry'">
        <ellipse :cx="ex" :cy="g.ey" :rx="g.er" :ry="g.er * 1.25" :fill="g.ink" />
        <circle :cx="ex + 1.5" :cy="g.ey - 2" r="1.7" fill="#FFFFFF" />
        <circle :cx="ex - 1.3" :cy="g.ey + 2" r="0.8" fill="#FFFFFF" />
      </template>
      <path v-else-if="spec.eyes === 'arc'"
        :d="`M${ex - 5} ${g.ey + 2} Q${ex} ${g.ey - 5} ${ex + 5} ${g.ey + 2}`"
        :stroke="g.ink" stroke-width="3" fill="none" stroke-linecap="round" />
      <ellipse v-else-if="spec.eyes === 'tiny'" :cx="ex" :cy="g.ey" rx="2.2" ry="2.6" :fill="g.ink" />
      <template v-else-if="spec.eyes === 'half'">
        <path :d="`M${ex - 5} ${g.ey - 1} Q${ex} ${g.ey + 7} ${ex + 5} ${g.ey - 1} Z`" :fill="g.ink" />
        <path :d="`M${ex - 6} ${g.ey - 1} L${ex + 6} ${g.ey - 1}`" :stroke="g.ink" stroke-width="2.2" stroke-linecap="round" />
      </template>
      <template v-else-if="spec.eyes === 'wide'">
        <circle :cx="ex" :cy="g.ey" r="6" fill="#FFFFFF" :stroke="g.ink" stroke-width="2" />
        <circle :cx="ex" :cy="g.ey" r="2.4" :fill="g.ink" />
      </template>
      <path v-else-if="spec.eyes === 'flat'"
        :d="`M${ex - 5} ${g.ey} Q${ex} ${g.ey + 2.5} ${ex + 5} ${g.ey}`"
        :stroke="g.ink" stroke-width="2.6" fill="none" stroke-linecap="round" />
      <path v-else-if="spec.eyes === 'squint'"
        :d="i === 0
          ? `M${ex - 4} ${g.ey - 4} L${ex + 3} ${g.ey} L${ex - 4} ${g.ey + 4}`
          : `M${ex + 4} ${g.ey - 4} L${ex - 3} ${g.ey} L${ex + 4} ${g.ey + 4}`"
        :stroke="g.ink" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      <!-- 화남 눈썹 -->
      <path v-if="spec.eyes === 'angry'"
        :d="i === 0
          ? `M${ex - 5} ${g.ey - 11} L${ex + 4} ${g.ey - 7}`
          : `M${ex - 4} ${g.ey - 7} L${ex + 5} ${g.ey - 11}`"
        :stroke="g.ink" stroke-width="2.4" stroke-linecap="round" />
      <!-- 시무룩 눈썹 -->
      <path v-if="spec.eyes === 'sad'"
        :d="i === 0
          ? `M${ex - 5} ${g.ey - 8} L${ex + 4} ${g.ey - 11}`
          : `M${ex - 4} ${g.ey - 11} L${ex + 5} ${g.ey - 8}`"
        :stroke="g.ink" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- 입 (중앙이) — 마중이는 부리만 그린다 -->
    <g v-if="!isMajung">
      <path v-if="spec.mouth === 'open'"
        :d="`M${55} ${g.my} Q60 ${g.my + 9} 65 ${g.my} Z`"
        fill="#E86A7A" :stroke="g.ink" stroke-width="1.3" stroke-linejoin="round" />
      <path v-else-if="spec.mouth === 'big'"
        :d="`M${53} ${g.my - 1} Q60 ${g.my + 13} 67 ${g.my - 1} Z`"
        fill="#E86A7A" :stroke="g.ink" stroke-width="1.3" stroke-linejoin="round" />
      <path v-else-if="spec.mouth === 'shout'"
        :d="`M54 ${g.my} L66 ${g.my} L64 ${g.my + 6} L56 ${g.my + 6} Z`"
        fill="#E86A7A" :stroke="g.ink" stroke-width="1.3" stroke-linejoin="round" />
      <ellipse v-else-if="spec.mouth === 'o'" cx="60" :cy="g.my + 3" rx="2.8" ry="3.3"
        fill="#E86A7A" :stroke="g.ink" stroke-width="1.2" />
      <template v-else-if="!isMajung">
        <path v-if="spec.mouth === 'smile'" :d="`M53 ${g.my} Q60 ${g.my + 6} 67 ${g.my}`"
          :stroke="g.ink" stroke-width="2.4" fill="none" stroke-linecap="round" />
        <path v-else-if="spec.mouth === 'frown'" :d="`M54 ${g.my + 4} Q60 ${g.my - 1} 66 ${g.my + 4}`"
          :stroke="g.ink" stroke-width="2.4" fill="none" stroke-linecap="round" />
        <path v-else-if="spec.mouth === 'line'" :d="`M55 ${g.my + 2} L65 ${g.my + 2}`"
          :stroke="g.ink" stroke-width="2.4" stroke-linecap="round" />
        <path v-else-if="spec.mouth === 'wave'"
          :d="`M52 ${g.my + 2} Q55 ${g.my - 1} 58 ${g.my + 2} Q61 ${g.my + 5} 64 ${g.my + 2} Q67 ${g.my - 1} 68 ${g.my + 1}`"
          :stroke="g.ink" stroke-width="2" fill="none" stroke-linecap="round" />
      </template>
    </g>

    <!-- 얼굴에 댄 손 / 날개 (앞 레이어) -->
    <template v-if="frontHand">
      <g v-if="isMajung" :transform="wingT(wingRot[0])">
          <path d="M46 84 Q24 86 18 104 Q14 114 15 125 L20 120 L21 128 L26 121 L28 127 Q37 112 47 98 Z" fill="#1B1F2A" />
          <path d="M41 92 Q29 98 25 110 Q31 106 37 102 Q41 99 43 96 Z" fill="#FFFFFF" />
          <path d="M24 108 Q18 116 18 123 L21 119 Q24 113 28 109 Z" fill="#3D7BE0" />
      </g>
      <circle v-else :cx="hands[0][0]" :cy="hands[0][1]" r="9" fill="#FFFFFF" stroke="#9AA1AA" stroke-width="2" />
    </template>

    <!-- 마중이 부리 + 역무원 모자 (얼굴 위에 그림) -->
    <g v-if="isMajung">
      <!-- 부리: 입을 따로 그리지 않고 늘 닫힌 부리 (표정은 눈·이펙트로) -->
      <path :d="spec.mouth === 'frown' ? 'M54 67 Q60 65 66 67 L60 71.5 Z' : 'M54 66 Q60 63 66 66 L60 71 Z'"
        fill="#4A4F5A" stroke="#2B2F38" stroke-width="0.8" stroke-linejoin="round" />
      <path d="M30 40 Q28 18 60 16 Q94 18 92 38 Q86 44 60 44 Q36 44 30 40 Z" fill="#1E2D5A" stroke="#141E3C" stroke-width="1.2" />
      <rect x="33" y="38" width="54" height="6" fill="#141E3C" />
      <line x1="35" y1="40.5" x2="85" y2="40.5" stroke="#E3B23C" stroke-width="1.6" />
      <path d="M33 44 Q60 55 87 44 Q83 51 60 53 Q37 51 33 44 Z" fill="#0F1424" />
      <path d="M42 47 Q52 50 60 50" stroke="#FFFFFF" stroke-width="1.2" fill="none" opacity="0.35" stroke-linecap="round" />
      <circle cx="35" cy="42" r="2.2" fill="#F5B301" />
      <circle cx="85" cy="42" r="2.2" fill="#F5B301" />
      <path d="M40 24 Q50 19 62 19" stroke="#3A4F8A" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7" />
      <!-- 엠블럼: 두 사람 -->
      <circle cx="60" cy="29" r="7" fill="#F39A1E" stroke="#FFFFFF" stroke-width="1" />
      <g fill="#FFFFFF" transform="translate(60 29) scale(1.4)">
        <circle cx="-1.6" cy="-2" r="1" /><circle cx="1.6" cy="-2" r="1" />
        <rect x="-2.4" y="-0.8" width="1.6" height="3.4" rx="0.6" />
        <rect x="0.8" y="-0.8" width="1.6" height="3.4" rx="0.6" />
      </g>
    </g>

    <!-- 강화 왕관 -->
    <g v-if="awoken" :transform="isMajung ? 'translate(0 -2)' : 'translate(0 -2)'">
      <polygon points="60,2 65,11 76,9 68,16 72,24 60,18 48,24 52,16 44,9 55,11"
        fill="#FFD700" stroke="#C98A00" stroke-width="0.8" />
      <circle cx="60" cy="3" r="2" fill="#FFFFFF" opacity="0.9" />
    </g>

    </g>

    <!-- ─────────── 감정 이펙트 ─────────── -->
    <g class="fx">
      <template v-if="spec.fx === 'bang'">
        <text :x="g.fx" :y="g.fy + 16" text-anchor="middle" font-size="22" font-weight="900"
          fill="#F39A1E" stroke="#FFFFFF" stroke-width="1" font-family="sans-serif">!</text>
        <path :d="`M${g.fx - 12} ${g.fy - 2} l-4 -4 M${g.fx + 10} ${g.fy - 4} l3 -5`"
          stroke="#F39A1E" stroke-width="2.2" stroke-linecap="round" />
      </template>
      <text v-else-if="spec.fx === 'question'" :x="g.fx" :y="g.fy + 18" text-anchor="middle" font-size="22" font-weight="900"
        fill="#3D7BE0" stroke="#FFFFFF" stroke-width="1" font-family="sans-serif">?</text>
      <g v-else-if="spec.fx === 'dots'" fill="#5B6B8C">
        <circle :cx="g.fx - 4" :cy="g.fy + 18" r="2.2" />
        <circle :cx="g.fx + 3" :cy="g.fy + 18" r="2.2" />
        <circle :cx="g.fx + 10" :cy="g.fy + 18" r="2.2" />
      </g>
      <!-- 💢 화남 표시 -->
      <g v-else-if="spec.fx === 'anger'" :transform="`translate(${g.fx + 4} ${g.fy + 2})`"
        stroke="#E53935" stroke-width="2.6" fill="none" stroke-linecap="round">
        <path d="M-7 -2 Q-2 -2 -2 -7" /><path d="M2 -7 Q2 -2 7 -2" />
        <path d="M-7 2 Q-2 2 -2 7" /><path d="M2 7 Q2 2 7 2" />
      </g>
      <g v-else-if="spec.fx === 'note'" fill="#7B5BD6" font-weight="900" font-family="sans-serif">
        <text :x="g.fx - 12" :y="g.fy + 22" font-size="15">♪</text>
        <text :x="g.fx - 2" :y="g.fy + 8" font-size="12">♫</text>
        <path :d="`M${g.fx - 26} ${g.fy + 26} q4 -4 8 0 t8 0`" stroke="#7B5BD6" stroke-width="1.8" fill="none" stroke-linecap="round" />
      </g>
      <template v-else-if="spec.fx === 'tear'">
        <path :d="`M${g.ex2 + 5} ${g.ey + 5} q-3 5 0 7 q3 -2 0 -7 Z`" fill="#6FB6FF" stroke="#3D8FE0" stroke-width="0.8" />
      </template>
      <template v-else-if="spec.fx === 'sparkle'">
        <path :d="SPARK" :transform="`translate(${g.fx} ${g.fy + 8}) scale(1.4)`" fill="#FFC83D" />
        <path :d="SPARK" :transform="`translate(${g.fx - 8} ${g.fy - 6}) scale(0.8)`" fill="#FFE08A" />
        <path :d="SPARK" :transform="`translate(14 ${g.fy + 10}) scale(1.1)`" fill="#FFC83D" />
      </template>
      <template v-else-if="spec.fx === 'lines'">
        <!-- 중앙이는 아치 옆에 붙으면 띠처럼 보여서 위쪽 바깥으로 뺀다 -->
        <path :d="isMajung
            ? 'M12 40 l6 6 M8 54 l7 2 M108 40 l-6 6 M112 54 l-7 2'
            : 'M6 10 l6 5 M2 22 l7 1 M114 10 l-6 5 M118 22 l-7 1'"
          stroke="#FF9F1C" stroke-width="2.5" stroke-linecap="round" />
      </template>
    </g>
  </svg>
</template>

<style scoped>
.mascot-svg { display: block; overflow: visible; }

.mascot-svg.idle      { animation: float 3s ease-in-out infinite; }
.mascot-svg.happy     { animation: bounce 0.6s ease-in-out 2; }
.mascot-svg.excited   { animation: spin-bounce 0.5s ease-in-out infinite alternate; }
.mascot-svg.shy       { animation: shrink 0.4s ease forwards; transform-origin: center bottom; }
.mascot-svg.sad,
.mascot-svg.sigh      { animation: droop 0.5s ease forwards; transform-origin: center bottom; }
.mascot-svg.angry     { animation: shake 0.3s ease-in-out 3; }
.mascot-svg.confused,
.mascot-svg.curious,
.mascot-svg.humming   { animation: sway 2.4s ease-in-out infinite; transform-origin: center bottom; }
.mascot-svg.hype,
.mascot-svg.laugh     { animation: bounce 0.5s ease-in-out infinite; }
.mascot-svg.aha,
.mascot-svg.surprised { animation: jump 0.35s ease-out 1; }

.mascot-svg.humming .fx,
.mascot-svg.blank .fx { animation: rise 1.8s ease-in-out infinite; }

@keyframes float   { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes bounce  { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-12px); } }
@keyframes spin-bounce { 0% { transform: translateY(0) rotate(-3deg); } 100% { transform: translateY(-8px) rotate(3deg); } }
@keyframes jump    { 0% { transform: translateY(0); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0); } }
@keyframes droop   { to { transform: scale(0.96, 0.92); } }
@keyframes shake   { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
@keyframes sway    { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
@keyframes shrink  { 0% { transform: scale(1); } 50% { transform: scale(0.88); } 100% { transform: scale(0.94); } }
@keyframes rise    { 0%, 100% { transform: translateY(0); opacity: 1; } 50% { transform: translateY(-4px); opacity: 0.7; } }
</style>
