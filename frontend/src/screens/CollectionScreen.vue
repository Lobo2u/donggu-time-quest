<script setup>
import { useRouter } from 'vue-router'
import BottomNavigation from '../components/BottomNavigation.vue'
import BuddySvg from '../components/BuddySvg.vue'
import { game } from '../store/gameStore.js'
import { BUDDIES, LOCATIONS } from '../data/gameData.js'

const router = useRouter()

const buddyList = Object.values(BUDDIES).map(b => ({
  ...b,
  owned: game.buddies[b.id]?.owned ?? false,
  level: game.buddies[b.id]?.level ?? 1,
  locationStatus: game.locations[
    Object.values(LOCATIONS).find(l => l.buddyId === b.id)?.id
  ]?.status ?? 'locked',
}))

const ownedCount = buddyList.filter(b => b.owned).length
const totalCount = buddyList.length
</script>

<template>
  <div class="screen collection-screen">
    <div class="col-header">
      <p class="col-eyebrow">TIME ARCHIVE</p>
      <h1 class="col-title">기억 조각 도감</h1>
      <p class="col-count">{{ ownedCount }} / {{ totalCount }} 동료를 만났어요</p>

      <div class="progress-track">
        <div class="progress-fill" :style="{ width: (ownedCount / totalCount * 100) + '%' }"></div>
      </div>
    </div>

    <div class="buddy-grid">
      <div
        v-for="buddy in buddyList"
        :key="buddy.id"
        class="buddy-card"
        :class="{ owned: buddy.owned, locked: !buddy.owned }"
        @click="buddy.owned && router.push(`/buddy/${buddy.id}`)"
      >
        <!-- 획득한 버디 -->
        <template v-if="buddy.owned">
          <div class="card-art owned-art">
            <BuddySvg mood="idle" :size="70" />
          </div>
          <div class="card-info">
            <span class="card-name">{{ buddy.name }}</span>
            <span class="card-subtitle">{{ buddy.subtitle }}</span>
            <div class="card-badge owned-badge">
              <span class="msr" style="font-size:12px; color:#C66900">location_on</span>
              <span>{{ buddy.location }}</span>
            </div>
          </div>
          <div class="card-level">Lv.{{ buddy.level }}</div>
        </template>

        <!-- 잠긴 버디 -->
        <template v-else>
          <div class="card-art locked-art">
            <span class="msr" style="font-size:40px; color:#9FC1C8">question_mark</span>
          </div>
          <div class="card-info">
            <span class="card-name locked-name">???</span>
            <span class="card-subtitle">{{ buddy.subtitle }}</span>
            <div class="card-badge locked-badge">
              <span class="msr" style="font-size:12px; color:#829090">
                {{ buddy.locationStatus === 'available' ? 'near_me' : 'lock' }}
              </span>
              <span>{{ buddy.locationStatus === 'available' ? '탐험 가능' : buddy.location }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <p class="collection-note">
      획득하지 못한 동료는 해당 장소를 탐험하면 만날 수 있어요.<br>
      온라인 시연 모드로도 모든 동료를 만날 수 있어요.
    </p>

    <div class="nav-wrap">
      <BottomNavigation />
    </div>
  </div>
</template>

<style scoped>
.collection-screen { background: var(--paper); overflow: hidden; }

.col-header {
  position: absolute; left: 20px; top: 54px; right: 20px;
}
.col-eyebrow { font-size: 11px; font-weight: 900; color: var(--teal); letter-spacing: 1.4px; }
.col-title { font-size: 26px; font-weight: 900; color: var(--ink); margin: 2px 0 4px; }
.col-count { font-size: 13px; font-weight: 700; color: var(--muted); }

.progress-track {
  width: 100%; height: 8px; background: #DCEAE9;
  border-radius: 4px; overflow: hidden; margin-top: 8px;
}
.progress-fill {
  height: 100%; background: var(--teal); border-radius: 4px;
  transition: width 0.6s ease;
}

.buddy-grid {
  position: absolute; left: 16px; top: 186px;
  width: 358px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}

.buddy-card {
  border-radius: 22px; padding: 14px;
  display: flex; flex-direction: column; gap: 8px;
  position: relative;
  min-height: 180px;
  transition: transform 0.15s;
}
.buddy-card.owned {
  background: var(--white); border: 1px solid #B7E2DE;
  box-shadow: 0 6px 16px #08233F1A; cursor: pointer;
}
.buddy-card.owned:active { transform: scale(0.97); }
.buddy-card.locked { background: #E8EEEE; border: 1px solid #D4DEDE; }

.card-art {
  width: 100%; border-radius: 16px; height: 90px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.owned-art { background: #DFF7F4; }
.locked-art { background: #CBD4D4; }

.card-info { display: flex; flex-direction: column; gap: 4px; }
.card-name { font-size: 15px; font-weight: 900; color: var(--ink); }
.locked-name { color: #647474; }
.card-subtitle { font-size: 10px; font-weight: 700; color: var(--muted); word-break: keep-all; line-height: 1.3; }

.card-badge {
  display: flex; align-items: center; gap: 4px;
  border-radius: 8px; padding: 3px 7px; align-self: flex-start;
  font-size: 9px; font-weight: 800;
}
.owned-badge { background: var(--orange-soft); color: var(--ink); }
.locked-badge { background: #DDE4E4; color: #697878; }

.card-level {
  position: absolute; top: 10px; right: 10px;
  background: var(--navy); color: var(--orange);
  border-radius: 8px; padding: 3px 8px;
  font-size: 11px; font-weight: 900;
}

.collection-note {
  position: absolute; left: 20px; right: 20px; top: 700px;
  font-size: 10px; font-weight: 700; color: var(--muted);
  line-height: 1.5; word-break: keep-all;
}

.nav-wrap { position: absolute; left: 16px; top: 754px; }
</style>
