<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import FruitIcon from '../components/FruitIcon.vue'
import { game } from '../store/gameStore.js'
import { GRADES, gradeForLevel } from '../data/gameData.js'

const router = useRouter()
const current = computed(() => gradeForLevel(game.player.level))
const next = computed(() => GRADES.find(g => g.level === current.value.level + 1) ?? null)

function state(g) {
  if (g.level < current.value.level) return 'done'
  if (g.level === current.value.level) return 'current'
  return 'locked'
}
const label = { done: '달성', current: '현재', locked: '잠김' }
</script>

<template>
  <div class="screen grade-screen">
    <header class="gr-header">
      <button class="back-btn" aria-label="지도로 돌아가기" @click="router.push('/map')">
        <span class="msr" style="font-size:24px; color:white">arrow_back</span>
      </button>
      <h1 class="gr-title">등급 혜택</h1>
    </header>

    <div class="gr-body">
      <section class="my-card">
        <div class="my-row">
          <span class="fruit big"><FruitIcon :id="current.id" :size="36" /></span>
          <div>
            <p class="my-kicker">나의 등급 · Lv.{{ current.level }}</p>
            <p class="my-name">{{ current.name }} 등급</p>
          </div>
        </div>
        <p v-if="next" class="my-next">{{ next.name }} 등급까지 스탬프 [N]개 남았어요</p>
        <p v-else class="my-next">가장 높은 등급이에요</p>
      </section>

      <div v-for="g in GRADES" :key="g.id" class="gr-row" :class="state(g)">
        <span class="fruit"><FruitIcon :id="g.id" /></span>
        <div class="gr-text">
          <p class="gr-name">{{ g.name }} 등급 · Lv.{{ g.level }}</p>
          <p class="gr-benefit">{{ g.benefits.join(' · ') }}</p>
        </div>
        <span class="gr-chip">{{ label[state(g)] }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grade-screen { background: var(--white); display: flex; flex-direction: column; }
.gr-header { height: 68px; padding: 0 16px 0 12px; display: flex; align-items: center; gap: 10px; background: var(--lime); }
.back-btn { width: 44px; height: 44px; border: none; background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.gr-title { font-size: 18px; font-weight: 900; color: var(--white); }
.gr-body { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
.my-card { background: var(--sky); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 2px 10px #2222221a; }
.my-row { display: flex; align-items: center; gap: 12px; }
.my-kicker { font-size: 12px; font-weight: 700; color: var(--teal-dark); }
.my-name { font-size: 20px; font-weight: 900; color: var(--ink); }
.my-next { font-size: 12px; color: #4A4A4A; }
.fruit { width: 44px; height: 44px; border-radius: 50%; background: #F2F7E3; flex: none; display: flex; align-items: center; justify-content: center; }
.fruit.big { width: 56px; height: 56px; background: var(--orange-soft); }
.gr-row { background: var(--white); border: 1px solid #E6E6E2; border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; gap: 12px; }
.gr-text { flex: 1; min-width: 0; }
.gr-name { font-size: 15px; font-weight: 700; color: var(--ink); }
.gr-benefit { font-size: 12px; line-height: 1.45; color: var(--muted); }
.gr-chip { height: 24px; padding: 0 10px; border-radius: 12px; font-size: 11px; font-weight: 700; display: flex; align-items: center; flex: none; background: #F2F7E3; color: var(--teal-dark); }
.gr-row.current { border: 2px solid var(--orange); }
.gr-row.current .fruit { background: var(--orange-soft); }
.gr-row.current .gr-name { font-weight: 900; }
.gr-row.current .gr-chip { background: var(--orange); color: var(--ink); font-weight: 900; }
.gr-row.locked { background: #FAFAF8; border-color: #EFEFEC; }
.gr-row.locked .fruit, .gr-row.locked .gr-chip { background: var(--locked); }
.gr-row.locked .gr-name, .gr-row.locked .gr-benefit, .gr-row.locked .gr-chip { color: var(--locked-ink); }
</style>
