<script setup>
// 게임 상황(정답/오답/도착/성공)에 가이드 마스코트가 표정으로 반응하는 말풍선
import { game } from '../store/gameStore.js'
import { reaction } from '../store/reactionStore.js'
import { story } from '../store/storyStore.js'
import MascotSvg from './MascotSvg.vue'
</script>

<template>
  <Transition name="guide-pop">
    <div class="guide-reaction" v-if="reaction.visible && !story.open" :key="reaction.key" aria-live="polite">
      <MascotSvg :character="game.guide ?? 'majung'" :mood="reaction.emote" :size="64" />
      <div class="guide-bubble">{{ reaction.text }}</div>
    </div>
  </Transition>
</template>

<style scoped>
.guide-reaction {
  position: fixed; left: 12px; bottom: 84px; z-index: 900;
  display: flex; align-items: flex-end; gap: 6px;
  max-width: calc(100% - 24px); pointer-events: none;
}
.guide-bubble {
  background: var(--white); color: var(--ink);
  border: 2px solid var(--navy); border-radius: 16px 16px 16px 4px;
  padding: 8px 12px; margin-bottom: 30px;
  font-size: 13px; font-weight: 800; line-height: 1.4; word-break: keep-all;
  box-shadow: 0 4px 12px #0002;
}
.guide-pop-enter-active, .guide-pop-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.guide-pop-enter-from, .guide-pop-leave-to { transform: translateY(16px) scale(0.9); opacity: 0; }
</style>
