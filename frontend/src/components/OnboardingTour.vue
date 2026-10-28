<script setup>
import { ref } from 'vue'
import BuddySvg from './BuddySvg.vue'

const emit = defineEmits(['done'])
const TOUR_KEY = 'dtq-onboarded'

const show = ref(!localStorage.getItem(TOUR_KEY))
const stepIdx = ref(0)

const steps = [
  {
    icon: 'map', variant: null,
    title: '지도에서 장소를 찾아요',
    body: '대전 동구 곳곳에 시간 친구가 숨어 있어요. 지도의 핀을 눌러 탐험을 시작해요.',
  },
  {
    icon: 'extension', variant: null,
    title: '미니게임을 풀어요',
    body: '장소마다 다른 미니게임이 있어요. 기억·순서·패턴·타임라인을 해결하면 시간 친구가 깨어나요.',
  },
  {
    icon: null, variant: 'sojo',
    title: '시간 친구를 동료로',
    body: '교감에 성공하면 시간 친구가 동료가 돼요. 도감에 등록하고 함께 성장해요.',
  },
  {
    icon: 'qr_code_scanner', variant: null,
    title: '매장 QR로 캐릭터 강화',
    body: '실제 장소에 가서 QR을 스캔하면 동료가 강화돼 능력이 강해지고, 방문 카드·쿠폰을 받아요!',
  },
]

function next() {
  if (stepIdx.value < steps.length - 1) stepIdx.value++
  else finish()
}
function skip() { finish() }
function finish() {
  localStorage.setItem(TOUR_KEY, '1')
  show.value = false
  emit('done')
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="tour-overlay">
      <div class="tour-card">
        <button class="tour-skip" @click="skip">건너뛰기</button>

        <div class="tour-visual">
          <BuddySvg v-if="steps[stepIdx].variant" :variant="steps[stepIdx].variant" mood="happy" :size="100" />
          <div v-else class="tour-icon">
            <span class="msr" style="font-size:56px; color:var(--teal)">{{ steps[stepIdx].icon }}</span>
          </div>
        </div>

        <div class="tour-step-badge">{{ stepIdx + 1 }} / {{ steps.length }}</div>
        <h2 class="tour-title">{{ steps[stepIdx].title }}</h2>
        <p class="tour-body">{{ steps[stepIdx].body }}</p>

        <div class="tour-dots">
          <span v-for="(s, i) in steps" :key="i" class="tour-dot" :class="{ active: i === stepIdx }"></span>
        </div>

        <button class="tour-next" @click="next">
          {{ stepIdx < steps.length - 1 ? '다음' : '탐험 시작!' }}
          <span class="msr" style="font-size:20px; color:var(--navy)">{{ stepIdx < steps.length - 1 ? 'arrow_forward' : 'explore' }}</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.tour-overlay {
  position: fixed; inset: 0; z-index: 3000;
  background: #08233Fee;
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.tour-card {
  background: white; border-radius: 28px; padding: 28px 24px;
  width: 100%; max-width: 330px; position: relative;
  display: flex; flex-direction: column; align-items: center; text-align: center;
}
.tour-skip {
  position: absolute; top: 16px; right: 16px;
  background: none; border: none; font-family: var(--font);
  font-size: 12px; font-weight: 700; color: var(--muted); cursor: pointer;
}
.tour-visual {
  height: 110px; display: flex; align-items: center; justify-content: center; margin-top: 8px;
}
.tour-icon {
  width: 100px; height: 100px; border-radius: 28px; background: var(--sky);
  display: flex; align-items: center; justify-content: center;
}
.tour-step-badge {
  background: var(--sky); color: var(--teal-dark); border-radius: 10px;
  padding: 3px 12px; font-size: 11px; font-weight: 900; margin: 8px 0 6px;
}
.tour-title { font-size: 20px; font-weight: 900; color: var(--ink); margin-bottom: 8px; }
.tour-body { font-size: 14px; font-weight: 700; color: var(--muted); line-height: 1.6; word-break: keep-all; }
.tour-dots { display: flex; gap: 7px; margin: 18px 0; }
.tour-dot { width: 7px; height: 7px; border-radius: 50%; background: #DCEAE9; transition: all 0.3s; }
.tour-dot.active { background: var(--orange); width: 22px; border-radius: 4px; }
.tour-next {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  height: 54px; background: var(--orange); border: none; border-radius: 16px;
  font-family: var(--font); font-size: 16px; font-weight: 800; color: var(--navy);
  cursor: pointer; box-shadow: 0 5px 12px #9C5B1E3D;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
