<script setup>
// 탐험 동반자 고르기 (마중이 · 중앙이) — 캐릭터 카드를 눌러 고르고 '함께하기'로 확정.
// 첫 장소에서 QR 을 처음 인식했을 때 뜬다.
import { ref } from 'vue'
import BuddySvg from './BuddySvg.vue'

const emit = defineEmits(['pick'])

const guides = [
  { id: 'majung',  name: '마중이', role: '길 안내',   desc: '장소까지 가는 길과 힌트를 알려줘요.' },
  { id: 'jungang', name: '중앙이', role: '단서 해독', desc: '미션 속 단서 해석을 도와줘요.' },
]
const selected = ref('majung')
</script>

<template>
  <div class="gp-overlay">
    <div class="gp-sheet">
      <p class="gp-kicker">QR 인식 완료!</p>
      <h2 class="gp-title">함께 탐험할 친구를 골라요</h2>

      <div class="gp-cards">
        <button
          v-for="g in guides"
          :key="g.id"
          class="gp-card"
          :class="[`gp-${g.id}`, { active: selected === g.id }]"
          :aria-pressed="selected === g.id"
          @click="selected = g.id"
        >
          <span v-if="selected === g.id" class="gp-check">
            <span class="msr" style="font-size:16px; color:var(--navy)">check</span>
          </span>
          <BuddySvg :variant="g.id" :mood="selected === g.id ? 'happy' : 'idle'" :size="88" />
          <span class="gp-name">{{ g.name }} · {{ g.role }}</span>
          <span class="gp-desc">{{ g.desc }}</span>
        </button>
      </div>

      <button class="gp-go" @click="emit('pick', selected)">
        {{ guides.find(g => g.id === selected).name }}와(과) 함께하기
      </button>
    </div>
  </div>
</template>

<style scoped>
.gp-overlay {
  position: absolute; inset: 0; z-index: 5;
  background: #07243ECC; display: flex; align-items: flex-end;
}
.gp-sheet {
  width: 100%; background: var(--paper); border-radius: 28px 28px 0 0;
  padding: 22px 16px 28px; display: flex; flex-direction: column; gap: 12px;
  animation: gp-up 0.3s ease-out;
}
.gp-kicker { font-size: 12px; font-weight: 900; color: var(--orange); letter-spacing: 1px; text-align: center; }
.gp-title { font-size: 20px; font-weight: 900; color: var(--ink); text-align: center; }

.gp-cards { display: flex; gap: 12px; }
.gp-card {
  position: relative; flex: 1;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 12px 10px 14px; border-radius: 24px; border: 3px solid transparent;
  font-family: var(--font); cursor: pointer;
  opacity: 0.6; transform: scale(0.96);
  transition: opacity 0.15s, transform 0.15s, border-color 0.15s;
}
.gp-card.active { opacity: 1; transform: none; border-color: var(--orange); box-shadow: 0 8px 22px #0B2A4540; }
.gp-majung { background: linear-gradient(135deg, #2D5F8E, #0B2A45); }
.gp-jungang { background: linear-gradient(135deg, #FFE1D9, #F4A79B); }
.gp-check {
  position: absolute; top: 10px; right: 10px;
  width: 26px; height: 26px; border-radius: 50%; background: var(--orange);
  display: flex; align-items: center; justify-content: center;
}
.gp-name { font-size: 12px; font-weight: 900; color: var(--navy); background: #FFFFFFE0; border-radius: 10px; padding: 3px 10px; }
.gp-desc { font-size: 11px; font-weight: 700; line-height: 1.35; text-align: center; word-break: keep-all; }
.gp-majung .gp-desc { color: #DCE6F0; }
.gp-jungang .gp-desc { color: #6B2E26; }

.gp-go {
  height: 54px; border: none; border-radius: 18px; cursor: pointer;
  background: var(--orange); color: var(--navy);
  font-family: var(--font); font-size: 16px; font-weight: 900;
  box-shadow: 0 5px 12px #9C5B1E3D;
}
@keyframes gp-up { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
</style>
