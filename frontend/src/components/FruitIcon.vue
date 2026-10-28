<script setup>
// 등급 과일 아이콘 (배 · 밤 · 감 · 사과 · 대추)
defineProps({
  id:   { type: String, required: true },
  size: { type: Number, default: 26 },
})
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true">
    <template v-if="id === 'pear'">
      <path d="M12 5c-2 0-3 2-3 4-3 2-4 5-3 8 1 3 4 4 6 4s5-1 6-4c1-3 0-6-3-8 0-2-1-4-3-4z" fill="#E6C85A" />
      <path d="M12 5c0-1.5.5-2.5 1.5-3" stroke="#6B4E12" stroke-width="1.6" fill="none" stroke-linecap="round" />
    </template>
    <template v-else-if="id === 'chestnut'">
      <path d="M12 4c4 3 8 6 8 11a8 6 0 0 1-16 0c0-5 4-8 8-11z" fill="#8B5A2B" />
      <path d="M4.5 16a8 6 0 0 0 15 0c-2 1.5-5 2.2-7.5 2.2S6.5 17.5 4.5 16z" fill="#D9B47A" />
    </template>
    <template v-else-if="id === 'persimmon'">
      <circle cx="12" cy="14" r="8" fill="#F08A24" />
      <path d="M7 8l2.5 1.5L12 7l2.5 2.5L17 8l-1 3H8z" fill="#4F6B0A" />
    </template>
    <template v-else-if="id === 'apple'">
      <path d="M12 8c-3-2-8-1-8 5s4 9 8 8c4 1 8-2 8-8s-5-7-8-5z" fill="#D9302B" />
      <path d="M12 8c0-2 .5-3.5 1.5-4.5" stroke="#6B4E12" stroke-width="1.6" fill="none" stroke-linecap="round" />
      <path d="M13 5c2-2 4-1.5 5-1-1 2-3 2.5-5 1z" fill="#8DB02A" />
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="11" fill="#FFE9A8" />
      <ellipse cx="12" cy="13" rx="6" ry="8" fill="#A8321E" />
      <ellipse cx="10" cy="10" rx="1.6" ry="3" fill="#D9604A" />
      <path d="M12 5c0-1.5.8-2.5 2-3" stroke="#4F6B0A" stroke-width="1.8" fill="none" stroke-linecap="round" />
    </template>
  </svg>
</template>
