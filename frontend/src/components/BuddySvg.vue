<script setup>
// 시간 친구 SVG (창작 캐릭터)
// - jungja(중앙시장): 공식 캐릭터 '중앙이' (시장 입구 게이트 모티브)
// - 그 외: 기본 빛 조각 캐릭터, variant prop으로 색상 변경
import { computed } from 'vue'

const props = defineProps({
  mood:    { type: String,  default: 'idle' }, // idle | shy | happy | excited
  size:    { type: Number,  default: 120 },
  variant: { type: String,  default: 'sojo' }, // sojo | jungja | heomi | indo
  awoken:  { type: Boolean, default: false },   // 강화 상태: 왕관 + 추가 이펙트
})

const palette = {
  sojo:   { body: '#B8EDE8', glow: '#7CE1D9', tip: '#FF9F1C', fin: '#A8E6E3', eye: '#1A4A5E' },
  jungja: { body: '#FFD9A0', glow: '#FFA940', tip: '#FF5722', fin: '#FFECC0', eye: '#5E3A0A' },
  heomi:  { body: '#B8E8C0', glow: '#68C270', tip: '#8BC34A', fin: '#A0DCA8', eye: '#1A4A2E' },
  indo:   { body: '#C8C8F0', glow: '#9090D8', tip: '#673AB7', fin: '#B8B8E8', eye: '#1A1A5E' },
}
const c = computed(() => palette[props.variant] ?? palette.sojo)

// 공식 캐릭터: jungja/jungang = 중앙이(게이트), majung = 마중이(까치 안내자)
const isGate   = computed(() => props.variant === 'jungja' || props.variant === 'jungang')
const isMajung = computed(() => props.variant === 'majung')
</script>

<template>
  <!-- ─────────── 중앙이 (중앙시장 게이트 캐릭터) ─────────── -->
  <svg
    v-if="isGate"
    :width="size"
    :height="size * 1.17"
    viewBox="0 0 120 140"
    xmlns="http://www.w3.org/2000/svg"
    class="buddy-svg"
    :class="mood"
    aria-label="중앙이 캐릭터"
  >
    <!-- 그림자 -->
    <ellipse cx="60" cy="134" rx="30" ry="5" fill="#08233F22" />

    <!-- 발광 링 (happy/excited 시 밝아짐) -->
    <ellipse cx="60" cy="78" rx="50" ry="56"
      fill="none" stroke="#FF9F1C"
      :stroke-width="mood === 'excited' ? 4 : 2"
      :opacity="mood === 'idle' || mood === 'shy' ? 0.25 : 0.6"
      class="glow-ring"
    />

    <!-- 다리 -->
    <rect x="44" y="114" width="12" height="16" rx="6" fill="#FFFFFF" stroke="#C3C9D0" stroke-width="2" />
    <rect x="64" y="114" width="12" height="16" rx="6" fill="#FFFFFF" stroke="#C3C9D0" stroke-width="2" />

    <!-- 팔 (양옆) -->
    <ellipse cx="24" :cy="mood === 'excited' ? 80 : 90" rx="8" ry="11" fill="#FFFFFF" stroke="#C3C9D0" stroke-width="2"
      :transform="mood === 'excited' ? 'rotate(-30 24 80)' : ''" />
    <ellipse cx="96" :cy="mood === 'excited' ? 80 : 90" rx="8" ry="11" fill="#FFFFFF" stroke="#C3C9D0" stroke-width="2"
      :transform="mood === 'excited' ? 'rotate(30 96 80)' : ''" />

    <!-- 몸통 (간판/부스) -->
    <rect x="28" y="56" width="64" height="62" rx="14" fill="#FFFFFF" stroke="#B4BCC4" stroke-width="3" />
    <!-- 측면 창틀 (파란 라인) -->
    <rect x="31" y="60" width="58" height="54" rx="11" fill="none" stroke="#3E6FB0" stroke-width="2" opacity="0.5" />

    <!-- 빨간 아치 지붕 -->
    <path d="M22 60 L22 46 Q22 20 60 18 Q98 20 98 46 L98 60 Z" fill="#E53935" stroke="#C62828" stroke-width="1.5" />
    <!-- 지붕 리브 (방사형 세로선) -->
    <line x1="60" y1="20" x2="60" y2="60" stroke="#C62828" stroke-width="1.6" opacity="0.7" />
    <line x1="44" y1="23" x2="40" y2="60" stroke="#C62828" stroke-width="1.6" opacity="0.7" />
    <line x1="76" y1="23" x2="80" y2="60" stroke="#C62828" stroke-width="1.6" opacity="0.7" />
    <line x1="31" y1="33" x2="25" y2="60" stroke="#C62828" stroke-width="1.6" opacity="0.7" />
    <line x1="89" y1="33" x2="95" y2="60" stroke="#C62828" stroke-width="1.6" opacity="0.7" />
    <!-- 지붕 하단 띠 -->
    <rect x="22" y="56" width="76" height="6" rx="3" fill="#C62828" />

    <!-- 지붕 금색 엠블럼 -->
    <circle cx="60" cy="24" r="6.5" fill="#F5B301" stroke="#C98A00" stroke-width="1" />
    <text x="60" y="27.5" text-anchor="middle" font-size="7" font-weight="900" fill="#3A2A00" font-family="sans-serif">ㅈ</text>

    <!-- 강화 왕관 -->
    <template v-if="awoken">
      <polygon points="60,2 65,11 76,9 68,16 72,26 60,19 48,26 52,16 44,9 55,11"
        fill="#FFD700" opacity="0.95" />
      <circle cx="60" cy="3" r="2.2" fill="white" opacity="0.9" />
    </template>

    <!-- 얼굴: 눈 -->
    <template v-if="mood === 'shy'">
      <path d="M40 80 Q46 76 52 80" stroke="#3A2A1A" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <path d="M68 80 Q74 76 80 80" stroke="#3A2A1A" stroke-width="2.5" fill="none" stroke-linecap="round" />
    </template>
    <template v-else-if="mood === 'happy' || mood === 'excited'">
      <path d="M41 82 Q46 76 51 82" stroke="#3A2A1A" stroke-width="3" fill="none" stroke-linecap="round" />
      <path d="M69 82 Q74 76 79 82" stroke="#3A2A1A" stroke-width="3" fill="none" stroke-linecap="round" />
    </template>
    <template v-else>
      <ellipse cx="46" cy="81" rx="5" ry="6" fill="#3A2A1A" />
      <ellipse cx="74" cy="81" rx="5" ry="6" fill="#3A2A1A" />
      <circle cx="47.5" cy="78.5" r="1.8" fill="white" />
      <circle cx="75.5" cy="78.5" r="1.8" fill="white" />
    </template>

    <!-- 볼 홍조 -->
    <ellipse cx="38" cy="90" rx="6" ry="3.5" fill="#FF9BA0" opacity="0.5" />
    <ellipse cx="82" cy="90" rx="6" ry="3.5" fill="#FF9BA0" opacity="0.5" />

    <!-- 입 (mood별) -->
    <path v-if="mood === 'idle' || mood === 'shy'"
      d="M53 92 Q60 97 67 92" stroke="#3A2A1A" stroke-width="2.2" fill="none" stroke-linecap="round" />
    <path v-else-if="mood === 'happy'"
      d="M51 91 Q60 101 69 91 Z" fill="#C64B5F" stroke="#3A2A1A" stroke-width="1.5" stroke-linejoin="round" />
    <path v-else
      d="M50 90 Q60 103 70 90 Z" fill="#C64B5F" stroke="#3A2A1A" stroke-width="1.5" stroke-linejoin="round" />

    <!-- 중앙시장 간판 -->
    <rect x="37" y="101" width="46" height="12" rx="3" fill="#FFF3D6" stroke="#E0A93C" stroke-width="1" />
    <text x="62" y="110" text-anchor="middle" font-size="7.5" font-weight="900" fill="#08233F" font-family="sans-serif">중앙시장</text>
    <circle cx="43" cy="107" r="3" fill="#F5B301" />

    <!-- 신난다 효과선 (excited) -->
    <template v-if="mood === 'excited'">
      <line x1="14" y1="40" x2="20" y2="46" stroke="#FF9F1C" stroke-width="2.5" stroke-linecap="round" />
      <line x1="10" y1="52" x2="17" y2="54" stroke="#FF9F1C" stroke-width="2.5" stroke-linecap="round" />
      <line x1="106" y1="40" x2="100" y2="46" stroke="#FF9F1C" stroke-width="2.5" stroke-linecap="round" />
      <line x1="110" y1="52" x2="103" y2="54" stroke="#FF9F1C" stroke-width="2.5" stroke-linecap="round" />
    </template>
  </svg>

  <!-- ─────────── 마중이 (까치 안내자) ─────────── -->
  <svg
    v-else-if="isMajung"
    :width="size"
    :height="size * 1.17"
    viewBox="0 0 120 140"
    xmlns="http://www.w3.org/2000/svg"
    class="buddy-svg"
    :class="mood"
    aria-label="마중이 캐릭터"
  >
    <!-- 그림자 -->
    <ellipse cx="60" cy="134" rx="28" ry="5" fill="#08233F22" />

    <!-- 발광 링 -->
    <ellipse cx="60" cy="82" rx="46" ry="54"
      fill="none" stroke="#4A7FC0"
      :stroke-width="mood === 'excited' ? 4 : 2"
      :opacity="mood === 'idle' || mood === 'shy' ? 0.22 : 0.55"
      class="glow-ring"
    />

    <!-- 발 -->
    <ellipse cx="50" cy="128" rx="8" ry="4.5" fill="#F5A623" />
    <ellipse cx="70" cy="128" rx="8" ry="4.5" fill="#F5A623" />

    <!-- 날개 (양옆) -->
    <path d="M24 86 Q10 78 16 62 Q26 74 30 92 Z"
      fill="#2B5CA8"
      :transform="mood === 'excited' || mood === 'happy' ? 'rotate(-24 24 86)' : ''" />
    <path d="M96 86 Q110 78 104 62 Q94 74 90 92 Z"
      fill="#2B5CA8"
      :transform="mood === 'excited' || mood === 'happy' ? 'rotate(24 96 86)' : ''" />

    <!-- 몸통 (검은 까치) -->
    <ellipse cx="60" cy="88" rx="33" ry="40" fill="#20303F" />
    <!-- 흰 배 -->
    <ellipse cx="60" cy="96" rx="20" ry="28" fill="#FFFFFF" />
    <!-- 흰 얼굴 패치 -->
    <ellipse cx="60" cy="72" rx="23" ry="19" fill="#FFFFFF" />

    <!-- 빨간 스카프 -->
    <path d="M40 92 Q60 100 80 92 L76 100 Q60 107 44 100 Z" fill="#E53935" />
    <path d="M57 99 L53 112 L62 108 L60 99 Z" fill="#C62828" />

    <!-- 눈 -->
    <template v-if="mood === 'shy'">
      <path d="M46 70 Q51 66 56 70" stroke="#1A2838" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <path d="M64 70 Q69 66 74 70" stroke="#1A2838" stroke-width="2.5" fill="none" stroke-linecap="round" />
    </template>
    <template v-else-if="mood === 'happy' || mood === 'excited'">
      <path d="M46 72 Q51 66 56 72" stroke="#1A2838" stroke-width="3" fill="none" stroke-linecap="round" />
      <path d="M64 72 Q69 66 74 72" stroke="#1A2838" stroke-width="3" fill="none" stroke-linecap="round" />
    </template>
    <template v-else>
      <ellipse cx="51" cy="70" rx="4.5" ry="5.5" fill="#1A2838" />
      <ellipse cx="69" cy="70" rx="4.5" ry="5.5" fill="#1A2838" />
      <circle cx="52.5" cy="68" r="1.6" fill="white" />
      <circle cx="70.5" cy="68" r="1.6" fill="white" />
    </template>

    <!-- 부리 -->
    <path d="M55 77 L65 77 L60 84 Z" fill="#F5A623" stroke="#D68910" stroke-width="0.8" />

    <!-- 볼 홍조 -->
    <ellipse cx="43" cy="78" rx="5.5" ry="3.3" fill="#FF9BA0" opacity="0.5" />
    <ellipse cx="77" cy="78" rx="5.5" ry="3.3" fill="#FF9BA0" opacity="0.5" />

    <!-- 역장 모자 -->
    <!-- 챙 -->
    <ellipse cx="60" cy="52" rx="28" ry="6" fill="#16263A" />
    <!-- 모자 몸체 -->
    <path d="M37 52 Q37 33 60 33 Q83 33 83 52 Z" fill="#1E3250" />
    <!-- 모자 띠 -->
    <rect x="37" y="47" width="46" height="6" fill="#16263A" />
    <!-- 금색 엠블럼 -->
    <circle cx="60" cy="43" r="6" fill="#F5B301" stroke="#C98A00" stroke-width="1" />
    <text x="60" y="46" text-anchor="middle" font-size="7" font-weight="900" fill="#1E3250" font-family="sans-serif">마</text>

    <!-- 강화 왕관 -->
    <template v-if="awoken">
      <polygon points="60,6 65,15 76,13 68,20 72,30 60,23 48,30 52,20 44,13 55,15"
        fill="#FFD700" opacity="0.95" />
    </template>

    <!-- 신난다 효과선 (excited) -->
    <template v-if="mood === 'excited'">
      <line x1="16" y1="46" x2="22" y2="50" stroke="#4A7FC0" stroke-width="2.5" stroke-linecap="round" />
      <line x1="104" y1="46" x2="98" y2="50" stroke="#4A7FC0" stroke-width="2.5" stroke-linecap="round" />
    </template>
  </svg>

  <!-- ─────────── 기본 캐릭터 (빛 조각) ─────────── -->
  <svg
    v-else
    :width="size"
    :height="size * 1.17"
    viewBox="0 0 120 140"
    xmlns="http://www.w3.org/2000/svg"
    class="buddy-svg"
    :class="mood"
    aria-label="시간 친구 캐릭터"
  >
    <!-- 그림자 -->
    <ellipse cx="60" cy="134" rx="28" ry="5" fill="#08233F22" />

    <!-- 몸 발광 링 (happy/excited 시 밝아짐) -->
    <ellipse cx="60" cy="77" rx="48" ry="56"
      fill="none" :stroke="c.glow"
      :stroke-width="mood === 'excited' ? 4 : 2"
      :opacity="mood === 'idle' || mood === 'shy' ? 0.35 : 0.7"
      class="glow-ring"
    />

    <!-- 몸통 -->
    <ellipse cx="60" cy="77" rx="42" ry="50" :fill="c.body" />
    <!-- 몸통 하이라이트 -->
    <ellipse cx="50" cy="56" rx="14" ry="10" fill="white" opacity="0.25" />

    <!-- 기억 창 (film frame windows) - 몸통 안 -->
    <rect x="33" y="53" width="22" height="15" rx="3"
      fill="none" stroke="white" stroke-width="1.5" opacity="0.65" />
    <line x1="35" y1="53" x2="35" y2="68" stroke="white" stroke-width="1" opacity="0.4" />
    <line x1="53" y1="53" x2="53" y2="68" stroke="white" stroke-width="1" opacity="0.4" />
    <rect x="33" y="53" width="22" height="15" rx="3"
      :fill="mood === 'happy' || mood === 'excited' ? '#7CE1D933' : '#FFFFFF11'" />

    <rect x="65" y="53" width="22" height="15" rx="3"
      fill="none" stroke="white" stroke-width="1.5" opacity="0.65" />
    <rect x="65" y="53" width="22" height="15" rx="3"
      :fill="mood === 'happy' || mood === 'excited' ? '#FF9F1C22' : '#FFFFFF11'" />

    <!-- 지느러미 (side fins) -->
    <path d="M18 75 Q8 63 18 51 Q24 66 18 75" :fill="c.fin" />
    <path d="M102 75 Q112 63 102 51 Q96 66 102 75" :fill="c.fin" />

    <!-- 눈 -->
    <ellipse :cx="mood === 'shy' ? 45 : 47" cy="76" rx="8" ry="9" :fill="c.eye" />
    <ellipse :cx="mood === 'shy' ? 73 : 73" cy="76" rx="8" ry="9" :fill="c.eye" />
    <ellipse :cx="mood === 'shy' ? 47 : 49" cy="73" rx="3" ry="3.5" fill="white" />
    <ellipse :cx="mood === 'shy' ? 75 : 75" cy="73" rx="3" ry="3.5" fill="white" />
    <ellipse :cx="mood === 'shy' ? 47.5 : 49.5" cy="72.5" rx="1.3" ry="1.5"
      :fill="mood === 'happy' || mood === 'excited' ? '#7CE1D9' : '#4A8A9E'" />
    <ellipse :cx="mood === 'shy' ? 75.5 : 75.5" cy="72.5" rx="1.3" ry="1.5"
      :fill="mood === 'happy' || mood === 'excited' ? '#7CE1D9' : '#4A8A9E'" />

    <!-- shy 눈꺼풀 -->
    <template v-if="mood === 'shy'">
      <ellipse cx="45" cy="74" rx="8" ry="5" :fill="c.body" />
      <ellipse cx="73" cy="74" rx="8" ry="5" :fill="c.body" />
    </template>

    <!-- 볼 홍조 -->
    <ellipse cx="37" cy="86" rx="7" ry="4" fill="#FFB0B0" opacity="0.35" />
    <ellipse cx="83" cy="86" rx="7" ry="4" fill="#FFB0B0" opacity="0.35" />

    <!-- 입 (mood별) -->
    <path v-if="mood === 'idle' || mood === 'shy'"
      d="M52 96 Q60 100 68 96"
      stroke="#1A4A5E" stroke-width="2" fill="none" stroke-linecap="round" />
    <path v-else-if="mood === 'happy'"
      d="M50 95 Q60 104 70 95"
      stroke="#1A4A5E" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <path v-else
      d="M48 93 Q60 106 72 93"
      stroke="#1A4A5E" stroke-width="3" fill="none" stroke-linecap="round" />

    <!-- 안테나 -->
    <line x1="60" y1="27" x2="60" y2="42"
      :stroke="c.glow" stroke-width="2.5" stroke-linecap="round" />
    <!-- 강화 왕관 -->
    <template v-if="awoken">
      <polygon points="60,4 64,13 74,11 67,18 70,28 60,22 50,28 53,18 46,11 56,13"
        fill="#FFD700" opacity="0.95" />
      <circle cx="60" cy="4"  r="2.5" fill="white" opacity="0.9" />
      <circle cx="74" cy="11" r="1.8" fill="white" opacity="0.9" />
      <circle cx="46" cy="11" r="1.8" fill="white" opacity="0.9" />
    </template>

    <!-- 안테나 별 -->
    <circle cx="60" cy="22" r="8" :fill="c.tip" class="antenna-star" />
    <circle cx="60" cy="22" r="5" fill="#FFE19A" />
    <circle cx="60" cy="22" r="2.5" fill="white" opacity="0.7" />
    <!-- 별 광선 (excited 시) -->
    <template v-if="mood === 'excited'">
      <line x1="60" y1="10" x2="60" y2="14" :stroke="c.tip" stroke-width="2" stroke-linecap="round" />
      <line x1="72" y1="22" x2="68" y2="22" :stroke="c.tip" stroke-width="2" stroke-linecap="round" />
      <line x1="48" y1="22" x2="52" y2="22" :stroke="c.tip" stroke-width="2" stroke-linecap="round" />
      <line x1="69" y1="13" x2="66" y2="16" :stroke="c.tip" stroke-width="2" stroke-linecap="round" />
      <line x1="51" y1="13" x2="54" y2="16" :stroke="c.tip" stroke-width="2" stroke-linecap="round" />
    </template>
  </svg>
</template>

<style scoped>
.buddy-svg {
  display: block;
  transition: transform 0.3s ease;
}

.buddy-svg.idle    { animation: float 3s ease-in-out infinite; }
.buddy-svg.shy     { animation: shrink 0.4s ease forwards; transform-origin: center bottom; }
.buddy-svg.happy   { animation: bounce 0.6s ease-in-out 2; }
.buddy-svg.excited { animation: spin-bounce 0.5s ease-in-out infinite alternate; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
}
@keyframes shrink {
  0%   { transform: scale(1); }
  50%  { transform: scale(0.88); }
  100% { transform: scale(0.94); }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  40%       { transform: translateY(-12px); }
}
@keyframes spin-bounce {
  0%   { transform: translateY(0) rotate(-3deg); }
  100% { transform: translateY(-8px) rotate(3deg); }
}

.glow-ring { transition: opacity 0.4s, stroke-width 0.4s; }
.antenna-star { transition: r 0.3s; }
</style>
