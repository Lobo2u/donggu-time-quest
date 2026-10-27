<script setup>
// 장소별 과거/현재 장면 일러스트 (창작 재현). era: 'past' | 'present'
import { computed } from 'vue'
const props = defineProps({
  variant: { type: String, default: 'sojedom' },
  era: { type: String, default: 'present' },
})
const past = computed(() => props.era === 'past')

// 시대별 팔레트
const sky = computed(() => past.value ? '#C9BFA8' : '#BFE3F0')
const ground = computed(() => past.value ? '#9A8E72' : '#C9C2B0')
const wall = computed(() => past.value ? '#B8A98C' : '#F3EBDA')
const roof = computed(() => {
  const r = { sojedom: ['#6E3B2E', '#C0392B'], jungang: ['#7A5A2E', '#E67E22'],
              heredi: ['#5E4A2E', '#A98B4B'], indong: ['#5E3A3A', '#B5584F'] }[props.variant] || ['#6E3B2E', '#C0392B']
  return past.value ? r[0] : r[1]
})
</script>

<template>
  <svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" class="scene" :class="{ past }">
    <!-- 하늘 -->
    <rect width="320" height="150" :fill="sky" />
    <!-- 해/구름 -->
    <circle v-if="!past" cx="268" cy="40" r="18" fill="#FFE082" />
    <ellipse v-else cx="250" cy="42" rx="34" ry="12" fill="#D8CEB8" opacity="0.7" />

    <!-- 땅 -->
    <rect y="150" width="320" height="70" :fill="ground" />
    <!-- 철길/길 -->
    <rect y="176" width="320" height="10" :fill="past ? '#7A6E52' : '#B0A890'" />
    <template v-if="variant === 'sojedom'">
      <line v-for="x in 9" :key="x" :x1="x*36-20" y1="176" :x2="x*36-20" y2="186" :stroke="past ? '#5A4E36' : '#938B70'" stroke-width="3" />
    </template>

    <!-- 건물 본체 -->
    <rect x="60" y="92" width="200" height="60" :fill="wall" stroke="#00000022" />
    <!-- 지붕 -->
    <polygon points="50,92 160,54 270,92" :fill="roof" />
    <polygon points="160,54 270,92 270,98 160,60" fill="#00000022" />

    <!-- 창문 -->
    <rect x="80" y="104" width="26" height="30" rx="2" :fill="past ? '#7D6E50' : '#8ECAE6'" stroke="#5A4A30" stroke-width="2" />
    <rect x="214" y="104" width="26" height="30" rx="2" :fill="past ? '#7D6E50' : '#8ECAE6'" stroke="#5A4A30" stroke-width="2" />
    <!-- 문 -->
    <rect x="146" y="112" width="28" height="40" rx="2" :fill="past ? '#5E4A30' : '#4A3B28'" />

    <!-- 과거 요소: 굴뚝 연기 -->
    <template v-if="past">
      <rect x="110" y="60" width="12" height="20" fill="#6E5E42" />
      <circle cx="116" cy="52" r="7" fill="#D8CEB8" opacity="0.8" />
      <circle cx="122" cy="44" r="5" fill="#D8CEB8" opacity="0.6" />
    </template>
    <!-- 현재 요소: 카페 차양 + 간판 + 화분 -->
    <template v-else>
      <rect x="72" y="138" width="176" height="10" fill="#E74C3C" />
      <rect x="72" y="138" width="176" height="10" fill="url(#stripes)" opacity="0.4" />
      <rect x="130" y="70" width="60" height="18" rx="4" fill="#08233F" />
      <circle cx="78" cy="150" r="7" fill="#2E7D32" />
      <circle cx="242" cy="150" r="7" fill="#2E7D32" />
    </template>

    <defs>
      <pattern id="stripes" width="16" height="10" patternUnits="userSpaceOnUse">
        <rect width="8" height="10" fill="#fff" />
      </pattern>
    </defs>
  </svg>
</template>

<style scoped>
.scene { display: block; width: 100%; height: 100%; }
.scene.past { filter: sepia(0.5) contrast(0.95) brightness(0.95); }
</style>
