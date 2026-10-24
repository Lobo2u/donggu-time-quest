<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BottomNavigation from '../components/BottomNavigation.vue'
import { game } from '../store/gameStore.js'
import { LOCATIONS, BUDDIES } from '../data/gameData.js'
import { resetGame } from '../store/gameStore.js'

const router = useRouter()

const completedLocs = computed(() =>
  Object.values(LOCATIONS).filter(l => game.locations[l.id]?.status === 'complete')
)

const ownedBuddyList = computed(() =>
  Object.values(BUDDIES).filter(b => game.buddies[b.id]?.owned)
)

function confirmReset() {
  if (confirm('모든 진행 상황을 초기화할까요? 되돌릴 수 없어요.')) {
    resetGame()
    router.replace('/')
  }
}
</script>

<template>
  <div class="screen record-screen">
    <p class="record-eyebrow">MY QUEST LOG</p>
    <h1 class="record-title">내 탐험 기록</h1>
    <p class="record-sub">지금까지 탐험한 기록이에요.</p>

    <!-- 통계 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="msr stat-icon">explore</span>
        <span class="stat-value">{{ completedLocs.length }}</span>
        <span class="stat-label">탐험 완료</span>
      </div>
      <div class="stat-item">
        <span class="msr stat-icon">diamond</span>
        <span class="stat-value">{{ game.player.shards }}</span>
        <span class="stat-label">시간 조각</span>
      </div>
      <div class="stat-item">
        <span class="msr stat-icon">auto_stories</span>
        <span class="stat-value">{{ ownedBuddyList.length }}</span>
        <span class="stat-label">동료</span>
      </div>
      <div class="stat-item">
        <span class="msr stat-icon">military_tech</span>
        <span class="stat-value">{{ game.player.level }}</span>
        <span class="stat-label">레벨</span>
      </div>
    </div>

    <!-- XP 게이지 -->
    <div class="xp-bar-wrap">
      <div class="xp-bar-header">
        <span>Lv.{{ game.player.level }}</span>
        <span>{{ game.player.xp }} / 100 XP</span>
      </div>
      <div class="xp-track">
        <div class="xp-fill" :style="{ width: game.player.xp + '%' }"></div>
      </div>
    </div>

    <!-- 탐험 기록 -->
    <p class="section-title" v-if="completedLocs.length">탐험 완료 장소</p>
    <div class="record-list" v-if="completedLocs.length">
      <div
        v-for="loc in completedLocs"
        :key="loc.id"
        class="record-item"
        @click="router.push(`/location/${loc.id}`)"
      >
        <div class="rec-icon">
          <span class="msr" style="font-size:24px; color:var(--teal)">location_on</span>
        </div>
        <div class="rec-texts">
          <span class="rec-title">{{ loc.name }}</span>
          <span class="rec-sub">{{ loc.subtitle }}</span>
        </div>
        <div class="rec-status">
          <span class="msr" style="font-size:20px; color:var(--teal)">check_circle</span>
          <span>완료</span>
        </div>
        <span class="msr" style="font-size:20px; color:var(--muted)">chevron_right</span>
      </div>
    </div>

    <!-- 동료 기록 -->
    <p class="section-title" v-if="ownedBuddyList.length">만난 동료</p>
    <div class="buddy-row" v-if="ownedBuddyList.length">
      <div
        v-for="b in ownedBuddyList"
        :key="b.id"
        class="buddy-chip"
        @click="router.push(`/buddy/${b.id}`)"
      >
        <span class="msr" style="font-size:18px; color:var(--teal)">face</span>
        <div>
          <p class="chip-name">{{ b.name }}</p>
          <p class="chip-lv">Lv.{{ game.buddies[b.id]?.level }}</p>
        </div>
      </div>
    </div>

    <!-- 아무것도 없을 때 -->
    <div class="empty-state" v-if="!completedLocs.length">
      <span class="msr" style="font-size:48px; color:#CBD4D4">explore</span>
      <p>아직 탐험한 장소가 없어요.</p>
      <button class="btn-primary" style="margin-top:12px" @click="router.push('/map')">
        지도로 이동
      </button>
    </div>

    <!-- 시연 초기화 -->
    <div class="reset-section">
      <p class="reset-label">시연 초기화</p>
      <button class="reset-btn" @click="confirmReset">
        <span class="msr" style="font-size:16px">refresh</span>
        처음부터 다시 시작
      </button>
    </div>

    <div class="nav-wrap">
      <BottomNavigation />
    </div>
  </div>
</template>

<style scoped>
.record-screen { background: var(--white); overflow: hidden; }

.record-eyebrow { position: absolute; left: 16px; top: 54px; font-size: 11px; font-weight: 900; color: var(--teal); letter-spacing: 1.4px; }
.record-title   { position: absolute; left: 16px; top: 74px; font-size: 26px; font-weight: 900; color: var(--ink); }
.record-sub     { position: absolute; left: 16px; top: 114px; font-size: 13px; font-weight: 600; color: var(--muted); }

.stats-row {
  position: absolute; left: 16px; top: 142px; width: 358px;
  background: var(--sky); border-radius: 20px;
  display: flex; justify-content: space-around; align-items: center;
  padding: 14px 8px;
}
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.stat-icon { font-size: 22px; color: var(--teal); }
.stat-value { font-size: 24px; font-weight: 900; color: var(--ink); line-height: 1; }
.stat-label { font-size: 10px; font-weight: 700; color: var(--muted); }

.xp-bar-wrap {
  position: absolute; left: 16px; top: 248px; width: 358px;
}
.xp-bar-header { display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; color: var(--muted); margin-bottom: 5px; }
.xp-track { height: 8px; background: #DCEAE9; border-radius: 4px; overflow: hidden; }
.xp-fill { height: 100%; background: var(--teal); border-radius: 4px; transition: width 0.6s; }

.section-title {
  font-size: 13px; font-weight: 900; color: var(--muted);
}

/* Record list + section-title positioning: use flow layout below fixed elements */
.record-screen {
  display: flex; flex-direction: column;
}

.stats-row, .record-eyebrow, .record-title, .record-sub, .xp-bar-wrap {
  /* keep absolute positioning from above */
}

.section-title { position: absolute; }
.record-list   { position: absolute; }
.buddy-row     { position: absolute; }
.empty-state   { position: absolute; }
.reset-section { position: absolute; }
.nav-wrap      { position: absolute; left: 16px; top: 754px; }

/* Dynamic positioning via top values */
.section-title:nth-of-type(1) { left: 16px; top: 276px; }
.record-list   { left: 16px; top: 302px; width: 358px; display: flex; flex-direction: column; gap: 8px; }
.record-item {
  display: flex; align-items: center; gap: 10px;
  background: var(--white); border: 1px solid #E2EEEC;
  border-radius: 16px; padding: 12px 14px; cursor: pointer;
}
.rec-icon { width: 44px; height: 44px; background: var(--sky); border-radius: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.rec-texts { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.rec-title { font-size: 15px; font-weight: 900; color: var(--ink); }
.rec-sub   { font-size: 11px; font-weight: 600; color: var(--muted); }
.rec-status { display: flex; flex-direction: column; align-items: center; font-size: 10px; font-weight: 800; color: var(--teal); gap: 1px; }

/* Second section title (buddy) - placed after the record list */
.buddy-row {
  left: 16px; top: 480px; width: 358px;
  display: flex; gap: 8px; flex-wrap: wrap;
}
.buddy-chip {
  display: flex; align-items: center; gap: 8px;
  background: var(--sky); border-radius: 14px; padding: 10px 12px;
  cursor: pointer;
}
.chip-name { font-size: 13px; font-weight: 900; color: var(--ink); }
.chip-lv   { font-size: 10px; font-weight: 700; color: var(--muted); }

.empty-state {
  left: 16px; top: 280px; width: 358px;
  display: flex; flex-direction: column; align-items: center;
  gap: 6px; padding: 32px; text-align: center;
  font-size: 14px; font-weight: 700; color: var(--muted);
}

.reset-section {
  left: 16px; top: 690px; width: 358px;
  display: flex; align-items: center; justify-content: space-between;
}
.reset-label { font-size: 12px; font-weight: 800; color: var(--muted); }
.reset-btn {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1px solid #D4DEDE; border-radius: 12px;
  padding: 8px 14px; font-family: var(--font); font-size: 12px; font-weight: 800;
  color: var(--muted); cursor: pointer;
}
</style>
