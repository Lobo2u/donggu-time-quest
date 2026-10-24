<script setup>
// 소조 - 소제동의 시간 친구 (창작 캐릭터)
// CSS SVG 일러스트, 외부 에셋 없음

const props = defineProps({
  mood: { type: String, default: 'idle' }, // idle | shy | happy | excited
  size: { type: Number, default: 120 },
})
</script>

<template>
  <svg
    :width="size"
    :height="size * 1.17"
    viewBox="0 0 120 140"
    xmlns="http://www.w3.org/2000/svg"
    class="buddy-svg"
    :class="mood"
    aria-label="소조 캐릭터"
  >
    <!-- 그림자 -->
    <ellipse cx="60" cy="134" rx="28" ry="5" fill="#08233F22" />

    <!-- 몸 발광 링 (happy/excited 시 밝아짐) -->
    <ellipse cx="60" cy="77" rx="48" ry="56"
      fill="none" stroke="#7CE1D9"
      :stroke-width="mood === 'excited' ? 4 : 2"
      :opacity="mood === 'idle' || mood === 'shy' ? 0.35 : 0.7"
      class="glow-ring"
    />

    <!-- 몸통 -->
    <ellipse cx="60" cy="77" rx="42" ry="50" fill="#B8EDE8" />
    <!-- 몸통 하이라이트 -->
    <ellipse cx="50" cy="56" rx="14" ry="10" fill="white" opacity="0.25" />

    <!-- 기억 창 (film frame windows) - 몸통 안 -->
    <rect x="33" y="53" width="22" height="15" rx="3"
      fill="none" stroke="white" stroke-width="1.5" opacity="0.65" />
    <line x1="35" y1="53" x2="35" y2="68" stroke="white" stroke-width="1" opacity="0.4" />
    <line x1="53" y1="53" x2="53" y2="68" stroke="white" stroke-width="1" opacity="0.4" />
    <!-- 창 안의 희미한 빛 -->
    <rect x="33" y="53" width="22" height="15" rx="3"
      :fill="mood === 'happy' || mood === 'excited' ? '#7CE1D933' : '#FFFFFF11'" />

    <rect x="65" y="53" width="22" height="15" rx="3"
      fill="none" stroke="white" stroke-width="1.5" opacity="0.65" />
    <rect x="65" y="53" width="22" height="15" rx="3"
      :fill="mood === 'happy' || mood === 'excited' ? '#FF9F1C22' : '#FFFFFF11'" />

    <!-- 지느러미 (side fins) -->
    <path d="M18 75 Q8 63 18 51 Q24 66 18 75" fill="#A8E6E3" />
    <path d="M102 75 Q112 63 102 51 Q96 66 102 75" fill="#A8E6E3" />

    <!-- 눈 -->
    <ellipse :cx="mood === 'shy' ? 45 : 47" cy="76" rx="8" ry="9" fill="#1A4A5E" />
    <ellipse :cx="mood === 'shy' ? 73 : 73" cy="76" rx="8" ry="9" fill="#1A4A5E" />
    <!-- 눈 하이라이트 -->
    <ellipse :cx="mood === 'shy' ? 47 : 49" cy="73" rx="3" ry="3.5" fill="white" />
    <ellipse :cx="mood === 'shy' ? 75 : 75" cy="73" rx="3" ry="3.5" fill="white" />
    <!-- 눈동자 색 (mood별) -->
    <ellipse :cx="mood === 'shy' ? 47.5 : 49.5" cy="72.5" rx="1.3" ry="1.5"
      :fill="mood === 'happy' || mood === 'excited' ? '#7CE1D9' : '#4A8A9E'" />
    <ellipse :cx="mood === 'shy' ? 75.5 : 75.5" cy="72.5" rx="1.3" ry="1.5"
      :fill="mood === 'happy' || mood === 'excited' ? '#7CE1D9' : '#4A8A9E'" />

    <!-- shy 눈꺼풀 -->
    <template v-if="mood === 'shy'">
      <ellipse cx="45" cy="74" rx="8" ry="5" fill="#B8EDE8" />
      <ellipse cx="73" cy="74" rx="8" ry="5" fill="#B8EDE8" />
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
      stroke="#7CE1D9" stroke-width="2.5" stroke-linecap="round" />
    <!-- 안테나 별 -->
    <circle cx="60" cy="22" r="8" fill="#FF9F1C" class="antenna-star" />
    <circle cx="60" cy="22" r="5" fill="#FFE19A" />
    <circle cx="60" cy="22" r="2.5" fill="white" opacity="0.7" />
    <!-- 별 광선 (excited 시) -->
    <template v-if="mood === 'excited'">
      <line x1="60" y1="10" x2="60" y2="14" stroke="#FF9F1C" stroke-width="2" stroke-linecap="round" />
      <line x1="72" y1="22" x2="68" y2="22" stroke="#FF9F1C" stroke-width="2" stroke-linecap="round" />
      <line x1="48" y1="22" x2="52" y2="22" stroke="#FF9F1C" stroke-width="2" stroke-linecap="round" />
      <line x1="69" y1="13" x2="66" y2="16" stroke="#FF9F1C" stroke-width="2" stroke-linecap="round" />
      <line x1="51" y1="13" x2="54" y2="16" stroke="#FF9F1C" stroke-width="2" stroke-linecap="round" />
    </template>
  </svg>
</template>

<style scoped>
.buddy-svg {
  display: block;
  transition: transform 0.3s ease;
}

.buddy-svg.idle {
  animation: float 3s ease-in-out infinite;
}

.buddy-svg.shy {
  animation: shrink 0.4s ease forwards;
  transform-origin: center bottom;
}

.buddy-svg.happy {
  animation: bounce 0.6s ease-in-out 2;
}

.buddy-svg.excited {
  animation: spin-bounce 0.5s ease-in-out infinite alternate;
}

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

.glow-ring {
  transition: opacity 0.4s, stroke-width 0.4s;
}

.antenna-star {
  transition: r 0.3s;
}
</style>
