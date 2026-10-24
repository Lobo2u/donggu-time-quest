<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tabs = [
  { label: '탐험', icon: 'explore',      route: '/map',        matchPrefix: '/map' },
  { label: '도감', icon: 'auto_stories', route: '/collection', matchPrefix: '/collection' },
  { label: '내 기록', icon: 'timeline',  route: '/record',     matchPrefix: '/record' },
]

function isActive(tab) {
  return route.path === tab.route || route.path.startsWith(tab.matchPrefix + '/')
}
</script>

<template>
  <div class="bottom-nav">
    <button
      v-for="tab in tabs"
      :key="tab.route"
      class="tab"
      :class="{ active: isActive(tab) }"
      @click="router.push(tab.route)"
    >
      <span class="msr" :style="{ fontSize: '25px' }">{{ tab.icon }}</span>
      <span class="label">{{ tab.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.bottom-nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 358px;
  height: 74px;
  background: #07243EF2;
  border-radius: 24px;
  box-shadow: 0 8px 20px #00152555;
  padding: 8px 14px;
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 88px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
}

.tab .msr {
  color: #9FC1C8;
}

.tab .label {
  font-family: var(--font);
  font-size: 11px;
  font-weight: 600;
  color: #9FC1C8;
}

.tab.active .msr {
  color: var(--orange);
  font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
}

.tab.active .label {
  color: var(--white);
  font-weight: 800;
}
</style>
