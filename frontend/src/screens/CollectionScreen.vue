<script setup>
import { useRouter } from 'vue-router'
import BottomNavigation from '../components/BottomNavigation.vue'

const router = useRouter()

const collections = [
  {
    id: 'sojedom',
    name: '소제동',
    icon: 'train',
    status: 'complete',
    badge: { icon: 'location_on', text: '현장 방문', color: '#C66900', bg: 'var(--orange-soft)' },
    artBg: '#DFF7F4',
    iconColor: 'var(--teal)',
    cardBg: '#FFFFFF',
    nameFill: 'var(--ink)',
  },
  {
    id: 'jungang',
    name: '중앙시장',
    icon: 'storefront',
    status: 'locked',
    badge: { icon: 'lock', text: '단서 A 필요', color: '#829090', bg: '#DDE4E4' },
    artBg: '#CBD4D4',
    iconColor: '#7E8E8E',
    cardBg: '#FFFFFF',
    nameFill: 'var(--ink)',
  },
  {
    id: 'heredi',
    name: '한의약거리',
    icon: 'museum',
    status: 'locked',
    badge: { icon: 'location_on', text: '조각 A·B 필요', color: '#829090', bg: '#DDE4E4' },
    artBg: '#CBD4D4',
    iconColor: '#7E8E8E',
    cardBg: '#E8EEEE',
    nameFill: '#647474',
  },
  {
    id: 'indong',
    name: '인동시장',
    icon: 'local_mall',
    status: 'locked',
    badge: { icon: 'location_on', text: '미수집', color: '#829090', bg: '#DDE4E4' },
    artBg: '#CBD4D4',
    iconColor: '#7E8E8E',
    cardBg: '#E8EEEE',
    nameFill: '#647474',
  },
]
</script>

<template>
  <div class="screen collection-screen">
    <!-- Header -->
    <p class="collection-eyebrow">TIME ARCHIVE</p>
    <h1 class="collection-title">기억 조각 도감</h1>
    <p class="collection-count">첫 코스 3곳 중 1곳의 기억을 복원했어요</p>

    <!-- Progress bar -->
    <div class="progress-track">
      <div class="progress-fill"></div>
    </div>

    <!-- 2x2 grid -->
    <div class="collection-grid">
      <div
        v-for="col in collections"
        :key="col.id"
        class="col-card"
        :style="{ background: col.cardBg }"
        @click="col.status === 'complete' && router.push('/ending')"
      >
        <div class="col-art" :style="{ background: col.artBg }">
          <span class="msr" :style="{ fontSize: '48px', color: col.iconColor }">{{ col.icon }}</span>
        </div>
        <span class="col-name" :style="{ color: col.nameFill }">{{ col.name }}</span>
        <div class="col-badge" :style="{ background: col.badge.bg }">
          <span class="msr" :style="{ fontSize: '13px', color: col.badge.color }">{{ col.badge.icon }}</span>
          <span :style="{ color: col.status === 'complete' ? 'var(--ink)' : '#697878' }">{{ col.badge.text }}</span>
        </div>
      </div>
    </div>

    <!-- Course ending card (full width) -->
    <div class="ending-card">
      <div class="ending-art">
        <span class="msr" style="font-size:48px; color:#7E8E8E">medication</span>
      </div>
      <span class="ending-name">코스 결말</span>
      <div class="ending-badge">
        <span class="msr" style="font-size:13px; color:#829090">location_on</span>
        <span>조각 3개 필요</span>
      </div>
    </div>

    <!-- Badge rule note -->
    <p class="badge-note">미수집 카드 선택 → 획득 조건 확인 · 지도에서 보기<br>온라인 완료는 현장 방문 배지를 자동 지급하지 않아요.</p>

    <!-- Bottom navigation (도감 active) -->
    <div class="nav-wrap">
      <BottomNavigation />
    </div>
  </div>
</template>

<style scoped>
.collection-screen {
  background: var(--paper);
  overflow: hidden;
}

.collection-eyebrow {
  position: absolute;
  left: 20px; top: 54px;
  font-size: 11px;
  font-weight: 900;
  color: var(--teal);
  letter-spacing: 1.4px;
}

.collection-title {
  position: absolute;
  left: 20px; top: 78px;
  font-size: 28px;
  font-weight: 900;
  color: var(--ink);
}

.collection-count {
  position: absolute;
  left: 20px; top: 118px;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
}

.progress-track {
  position: absolute;
  left: 20px; top: 150px;
  width: 350px; height: 10px;
  background: #DCEAE9;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  width: 33%;
  height: 100%;
  background: var(--teal);
  border-radius: 5px;
}

.collection-grid {
  position: absolute;
  left: 16px; top: 184px;
  display: grid;
  grid-template-columns: 171px 171px;
  gap: 10px;
}

.col-card {
  width: 171px;
  height: 190px;
  border-radius: 22px;
  border: 1px solid #B7E2DE;
  box-shadow: 0 6px 16px #08233F1A;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  cursor: pointer;
}

.col-art {
  width: 100%;
  height: 86px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.col-name {
  font-size: 14px;
  font-weight: 900;
}

.col-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 9px;
  padding: 4px 7px;
  font-size: 9px;
  font-weight: 800;
  align-self: flex-start;
}

.ending-card {
  position: absolute;
  left: 16px; top: 596px;
  width: 358px;
  height: 128px;
  background: #E8EEEE;
  border-radius: 22px;
  border: 1px solid #D4DEDE;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 14px;
}

.ending-art {
  width: 86px; height: 100%;
  background: #CBD4D4;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ending-name {
  font-size: 14px;
  font-weight: 900;
  color: #647474;
}

.ending-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #DDE4E4;
  border-radius: 9px;
  padding: 4px 7px;
  font-size: 9px;
  font-weight: 800;
  color: #697878;
  margin-left: auto;
}

.badge-note {
  position: absolute;
  left: 22px; top: 736px;
  font-size: 10px;
  font-weight: 700;
  color: var(--muted);
  line-height: 1.5;
}

.nav-wrap {
  position: absolute;
  left: 16px; top: 754px;
}
</style>
