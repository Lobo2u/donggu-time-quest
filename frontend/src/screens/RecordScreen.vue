<script setup>
import { useRouter } from 'vue-router'
import BottomNavigation from '../components/BottomNavigation.vue'

const router = useRouter()

const stats = [
  { label: '탐험 기록', value: '3', icon: 'explore' },
  { label: '획득 조각', value: '3', icon: 'diamond' },
  { label: '대화 수집', value: '3', icon: 'chat' },
]

const records = [
  {
    title: '소제동 · 관찰 미션',
    sub: '현장 방문 · 조각 A',
    icon: 'train',
    iconColor: 'var(--teal)',
    bg: 'var(--sky)',
    status: '완료',
  },
  {
    title: '중앙시장 · 단서 초출',
    sub: '현장 방문 · 조각 B',
    icon: 'storefront',
    iconColor: '#C66900',
    bg: 'var(--orange-soft)',
    status: '완료',
  },
  {
    title: '한의약거리 · 최종 확인',
    sub: '온라인 참여 · 조각 C',
    icon: 'museum',
    iconColor: 'var(--muted)',
    bg: '#EEF3F3',
    status: '완료',
  },
]
</script>

<template>
  <div class="screen record-screen">
    <!-- Eyebrow -->
    <p class="record-eyebrow">MY QUEST LOG</p>

    <!-- Title -->
    <h1 class="record-title">내 탐험 기록</h1>
    <p class="record-sub">탐험한 곳을 돌아보며 기억을 되새기는 공간이에요.</p>

    <!-- Stats row -->
    <div class="stats-row">
      <div v-for="s in stats" :key="s.label" class="stat-item">
        <span class="msr stat-icon" :style="{ color: 'var(--teal)' }">{{ s.icon }}</span>
        <span class="stat-value">{{ s.value }}</span>
        <span class="stat-label">{{ s.label }}</span>
      </div>
    </div>

    <!-- Course title -->
    <p class="course-title">첫 코스 · 사라진 동구의 하루</p>

    <!-- Record list -->
    <div class="record-list">
      <div
        v-for="(rec, i) in records"
        :key="i"
        class="record-item"
        @click="router.push('/field')"
      >
        <div class="rec-icon-wrap" :style="{ background: rec.bg }">
          <span class="msr" :style="{ fontSize: '28px', color: rec.iconColor }">{{ rec.icon }}</span>
        </div>
        <div class="rec-texts">
          <span class="rec-title">{{ rec.title }}</span>
          <span class="rec-sub">{{ rec.sub }}</span>
        </div>
        <div class="rec-status">
          <span class="msr" style="font-size:18px; color: var(--teal)">check_circle</span>
          <span>{{ rec.status }}</span>
        </div>
        <span class="msr" style="font-size:20px; color: var(--muted)">chevron_right</span>
      </div>
    </div>

    <!-- Online note -->
    <div class="online-notice">
      <span class="msr" style="font-size:18px; color: var(--orange)">info</span>
      <p class="notice-text">온라인으로 완료한 항목은 현장 방문 배지가 자동으로 지급되지 않아요. 현장 방문 배지는 직접 재방문 후 인증하면 받을 수 있어요.</p>
    </div>

    <!-- Bottom navigation (내 기록 active) -->
    <div class="nav-wrap">
      <BottomNavigation />
    </div>
  </div>
</template>

<style scoped>
.record-screen {
  background: var(--white);
  overflow: hidden;
}

.record-eyebrow {
  position: absolute;
  left: 16px; top: 54px;
  font-size: 11px;
  font-weight: 900;
  color: var(--teal);
  letter-spacing: 1.4px;
}

.record-title {
  position: absolute;
  left: 16px; top: 78px;
  font-size: 28px;
  font-weight: 900;
  color: var(--ink);
}

.record-sub {
  position: absolute;
  left: 16px; top: 118px;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  word-break: keep-all;
}

.stats-row {
  position: absolute;
  left: 16px; top: 150px;
  width: 358px;
  height: 112px;
  background: var(--sky);
  border-radius: 22px;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 24px;
}

.stat-value {
  font-size: 28px;
  font-weight: 900;
  color: var(--ink);
  line-height: 1;
}

.stat-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
}

.course-title {
  position: absolute;
  left: 16px; top: 282px;
  font-size: 15px;
  font-weight: 900;
  color: var(--ink);
}

.record-list {
  position: absolute;
  left: 16px; top: 310px;
  width: 358px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--white);
  border: 1px solid #E2EEEC;
  border-radius: 18px;
  padding: 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.record-item:active {
  background: #F2FAF8;
}

.rec-icon-wrap {
  width: 48px; height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rec-texts {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.rec-title {
  font-size: 14px;
  font-weight: 900;
  color: var(--ink);
}

.rec-sub {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}

.rec-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  font-weight: 800;
  color: var(--teal);
}

.online-notice {
  position: absolute;
  left: 16px; top: 626px;
  width: 358px;
  background: #FFF8EC;
  border: 1px solid #FFD98C;
  border-radius: 16px;
  padding: 12px 14px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.notice-text {
  font-size: 11px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.5;
  word-break: keep-all;
}

.nav-wrap {
  position: absolute;
  left: 16px; top: 754px;
}
</style>
