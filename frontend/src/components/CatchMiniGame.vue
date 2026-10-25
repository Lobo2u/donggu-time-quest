<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import BuddySvg from './BuddySvg.vue'

const props = defineProps({
  variant: { type: String, default: 'sojo' },
  buddyName: { type: String, default: '시간 친구' },
})
const emit = defineEmits(['caught'])

// 마음 잇기: 줄어드는 링이 '마음의 고리'(sweet spot)와 겹칠 때 탭
// 성공 품질만큼 유대 게이지가 차고, 가득 차면 포획(연결) 성공

const SWEET = 0.42       // sweet spot 중심 (링 scale 0~1 중)
const SWEET_HALF = 0.10  // 허용 폭
const CYCLE = 1300       // 한 사이클(ms)

const ringScale = ref(1) // 1(큼) → 0(작음) 반복
const bond = ref(0)      // 0~100 유대 게이지
const feedback = ref(null) // 'perfect' | 'good' | 'miss'
const locked = ref(false)
const mood = ref('shy')

let rafId = null
let startTs = 0

function frame(ts) {
  if (!startTs) startTs = ts
  const t = ((ts - startTs) % CYCLE) / CYCLE // 0→1
  // 1 → 0 로 줄었다가 다시 1 (톱니)
  ringScale.value = 1 - t
  rafId = requestAnimationFrame(frame)
}

function tap() {
  if (locked.value) return
  const s = ringScale.value
  const dist = Math.abs(s - SWEET)
  if (dist <= SWEET_HALF * 0.45) {
    feedback.value = 'perfect'; bond.value += 50; mood.value = 'excited'
  } else if (dist <= SWEET_HALF) {
    feedback.value = 'good'; bond.value += 34; mood.value = 'happy'
  } else {
    feedback.value = 'miss'; bond.value = Math.max(0, bond.value - 4); mood.value = 'shy'
  }
  setTimeout(() => { if (feedback.value) feedback.value = null }, 500)

  if (bond.value >= 100) {
    bond.value = 100
    locked.value = true
    mood.value = 'excited'
    cancelAnimationFrame(rafId)
    setTimeout(() => emit('caught'), 900)
  }
}

onMounted(() => { rafId = requestAnimationFrame(frame) })
onBeforeUnmount(() => cancelAnimationFrame(rafId))
</script>

<template>
  <div class="catch-game">
    <!-- 유대 게이지 -->
    <div class="bond-bar">
      <span class="bond-label">마음 잇기</span>
      <div class="bond-track">
        <div class="bond-fill" :style="{ width: bond + '%' }"></div>
      </div>
      <span class="bond-pct">{{ Math.round(bond) }}%</span>
    </div>

    <!-- 링 스테이지 -->
    <div class="stage" @click="tap">
      <!-- sweet spot 고리 (고정) -->
      <div class="sweet-ring" :style="{
        width: (SWEET * 260 + 60) + 'px',
        height: (SWEET * 260 + 60) + 'px',
      }"></div>

      <!-- 줄어드는 링 -->
      <div class="shrink-ring" :class="feedback" :style="{
        width: (ringScale * 260 + 60) + 'px',
        height: (ringScale * 260 + 60) + 'px',
      }"></div>

      <!-- 버디 -->
      <div class="catch-buddy">
        <BuddySvg :variant="variant" :mood="mood" :size="120" />
      </div>

      <!-- 피드백 -->
      <Transition name="fb">
        <div v-if="feedback" class="feedback" :class="feedback">
          {{ feedback === 'perfect' ? '완벽한 교감!' : feedback === 'good' ? '좋아요!' : '아쉬워요' }}
        </div>
      </Transition>

      <!-- 완료 -->
      <Transition name="fb">
        <div v-if="locked" class="caught-badge">
          <span class="msr" style="font-size:22px; color:white">favorite</span>
          마음이 이어졌어요!
        </div>
      </Transition>
    </div>

    <!-- 안내 -->
    <p class="catch-hint" v-if="!locked">
      <b>{{ buddyName }}</b>의 마음 고리에 빛이 닿는 순간 화면을 탭해요!
    </p>
    <button v-if="!locked" class="tap-btn" @click="tap">
      <span class="msr" style="font-size:20px; color:var(--navy)">touch_app</span>
      탭!
    </button>
  </div>
</template>

<style scoped>
.catch-game { display: flex; flex-direction: column; align-items: center; gap: 16px; width: 100%; }

.bond-bar { display: flex; align-items: center; gap: 8px; width: 100%; }
.bond-label { font-size: 11px; font-weight: 800; color: #A8D8D4; white-space: nowrap; }
.bond-track { flex: 1; height: 10px; background: #FFFFFF22; border-radius: 5px; overflow: hidden; }
.bond-fill { height: 100%; background: linear-gradient(90deg, var(--teal), var(--orange)); border-radius: 5px; transition: width 0.3s; }
.bond-pct { font-size: 11px; font-weight: 900; color: white; white-space: nowrap; }

.stage {
  position: relative; width: 300px; height: 300px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; user-select: none;
}
.sweet-ring {
  position: absolute; border-radius: 50%;
  border: 3px dashed #7CE1D9; opacity: 0.6;
}
.shrink-ring {
  position: absolute; border-radius: 50%;
  border: 4px solid var(--orange); box-shadow: 0 0 16px #FF9F1C88;
  transition: border-color 0.1s;
}
.shrink-ring.perfect { border-color: #7CE1D9; box-shadow: 0 0 24px #7CE1D9; }
.shrink-ring.good { border-color: #FFD700; }
.shrink-ring.miss { border-color: #D64B5F; }
.catch-buddy { z-index: 2; }

.feedback {
  position: absolute; top: 10px; z-index: 5;
  font-size: 18px; font-weight: 900; padding: 4px 14px; border-radius: 12px;
}
.feedback.perfect { color: var(--teal-dark); background: #DFF7F4; }
.feedback.good { color: #C68A00; background: #FFF3D6; }
.feedback.miss { color: #D64B5F; background: #FFE8EA; }

.caught-badge {
  position: absolute; z-index: 6; bottom: 20px;
  display: flex; align-items: center; gap: 6px;
  background: var(--teal); color: white; border-radius: 16px; padding: 10px 18px;
  font-size: 15px; font-weight: 900; box-shadow: 0 6px 20px #0E9F9A66;
}

.catch-hint { font-size: 13px; font-weight: 700; color: #A8D8D4; text-align: center; word-break: keep-all; }
.catch-hint b { color: white; }
.tap-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  height: 56px; background: var(--orange); color: var(--navy); border: none; border-radius: 18px;
  font-family: var(--font); font-size: 18px; font-weight: 900; cursor: pointer;
  box-shadow: 0 5px 14px #FF9F1C55;
}

.fb-enter-active { transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.fb-enter-from { opacity: 0; transform: scale(0.6); }
.fb-leave-active { transition: opacity 0.2s; }
.fb-leave-to { opacity: 0; }
</style>
