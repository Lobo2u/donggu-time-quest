<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BottomNavigation from '../components/BottomNavigation.vue'
import { game, resetGame } from '../store/gameStore.js'
import { LOCATIONS } from '../data/gameData.js'

const router = useRouter()
const selected = ref(null)

const locationList = Object.values(LOCATIONS)

function markerStyle(locId) {
  const s = game.locations[locId]?.status ?? 'locked'
  const map = {
    available:   { dot: '#FF9F1C44', border: '#FF9F1C', glow: '#FF9F1C99', label: '#08233FE8' },
    in_progress: { dot: '#0E9F9A44', border: '#0E9F9A', glow: '#0E9F9A99', label: '#08233FE8' },
    complete:    { dot: '#08756F44', border: '#08756F', glow: '#08756F66', label: '#08756FE8' },
    locked:      { dot: '#8EA4AF33', border: '#8EA4AF', glow: '#8EA4AF33', label: '#8EA4AFE8' },
  }
  return map[s] ?? map.locked
}

function statusLabel(locId) {
  const s = game.locations[locId]?.status ?? 'locked'
  return { available: '탐험 가능', in_progress: '탐험 중', complete: '완료', locked: '잠김' }[s]
}

function canSelect(locId) {
  const s = game.locations[locId]?.status ?? 'locked'
  return s !== 'locked'
}

function selectLocation(loc) {
  if (!canSelect(loc.id)) return
  selected.value = selected.value?.id === loc.id ? null : loc
}

function goExplore() {
  if (!selected.value) return
  router.push(`/location/${selected.value.id}`)
}

// Objective text
const objective = computed(() => {
  const inProg = locationList.find(l => game.locations[l.id]?.status === 'in_progress')
  if (inProg) return `${inProg.name} 탐험 중 · 미션을 계속해요`
  const avail = locationList.find(l => game.locations[l.id]?.status === 'available')
  if (avail) return `${avail.name}에서 첫 번째 기억을 찾아요`
  return '모든 장소 탐험 완료!'
})

const guideName = computed(() => game.guide === 'jungang' ? '중앙이' : '마중이')
const guideMsg = computed(() => {
  const avail = locationList.find(l => game.locations[l.id]?.status === 'available' || game.locations[l.id]?.status === 'in_progress')
  if (avail) return `${avail.name} 핀을 눌러 탐험을 시작해요!`
  return '모든 기억을 복원했어요. 대단해요!'
})

const completedCount = computed(() =>
  locationList.filter(l => game.locations[l.id]?.status === 'complete').length
)
</script>

<template>
  <div class="screen map-screen" @click.self="selected = null">
    <div class="map-bg"></div>
    <div class="map-tint"></div>

    <!-- 시연 모드 배지 -->
    <div class="demo-badge" v-if="game.demoMode">
      <span class="msr" style="font-size:13px; color:#7CE1D9">science</span>
      시연 모드
    </div>

    <!-- 플레이어 상태 -->
    <div class="player-status">
      <div class="level-badge">
        <span style="font-size:14px; font-weight:900; color:var(--orange)">{{ game.player.level }}</span>
      </div>
      <span class="level-text">Lv.{{ game.player.level }}</span>
      <div class="status-divider"></div>
      <span class="msr" style="font-size:20px; color:var(--orange)">diamond</span>
      <span class="shard-text">{{ game.player.shards }} / {{ locationList.length }}</span>
    </div>

    <!-- 지도 컨트롤 -->
    <div class="map-controls">
      <button class="map-ctrl-btn" @click="$router.push('/collection')">
        <span class="msr" style="font-size:22px; color:var(--navy)">auto_stories</span>
      </button>
      <button class="map-ctrl-btn" @click="resetGame(); $router.replace('/')">
        <span class="msr" style="font-size:22px; color:var(--navy)">refresh</span>
      </button>
    </div>

    <!-- 현재 목표 -->
    <div class="objective">
      <div class="obj-step">
        <span class="msr" style="font-size:18px; color:var(--navy)">flag</span>
      </div>
      <div class="obj-texts">
        <span class="obj-label">현재 목표 · {{ completedCount }} / {{ locationList.length }} 완료</span>
        <span class="obj-action">{{ objective }}</span>
        <span class="obj-next">핀을 눌러 장소를 선택하세요</span>
      </div>
    </div>

    <!-- 장소 마커 -->
    <div
      v-for="loc in locationList"
      :key="loc.id"
      class="mission-marker"
      :style="{ left: loc.mapX + 'px', top: loc.mapY + 'px' }"
      :class="{ selectable: canSelect(loc.id), locked: !canSelect(loc.id) }"
      @click="selectLocation(loc)"
    >
      <div
        class="marker-dot"
        :style="{
          background: markerStyle(loc.id).dot,
          borderColor: markerStyle(loc.id).border,
          boxShadow: `0 0 18px ${markerStyle(loc.id).glow}`,
        }"
      >
        <span
          v-if="game.locations[loc.id]?.status === 'complete'"
          class="msr" style="font-size:24px; color:var(--teal-dark)"
        >check_circle</span>
      </div>
      <div class="marker-label" :style="{ background: markerStyle(loc.id).label }">
        {{ loc.name }}
      </div>
      <div class="marker-status" v-if="canSelect(loc.id)">
        {{ statusLabel(loc.id) }}
      </div>
    </div>

    <!-- 플레이어 아바타 -->
    <div class="player-avatar">
      <div class="avatar-inner">🐧</div>
    </div>

    <!-- 핀 범례 -->
    <div class="pin-legend">
      <div class="pin-item"><span class="pin-dot" style="background:#FF9F1C"></span><span>탐험 가능</span></div>
      <div class="pin-item"><span class="pin-dot" style="background:#08756F"></span><span>완료</span></div>
      <div class="pin-item"><span class="pin-dot" style="background:#8EA4AF"></span><span>잠김</span></div>
    </div>

    <!-- 가이드 말풍선 -->
    <div class="compact-guide" v-if="!selected">
      <div class="guide-char">{{ game.guide === 'jungang' ? '🏪' : '🐧' }}</div>
      <div class="guide-text">
        <span class="guide-name">{{ guideName }}의 탐험 제안</span>
        <span class="guide-line">{{ guideMsg }}</span>
      </div>
    </div>

    <!-- 하단 네비게이션 -->
    <div class="nav-wrap">
      <BottomNavigation />
    </div>

    <!-- 장소 바텀 시트 -->
    <Transition name="sheet">
      <div class="bottom-sheet" v-if="selected">
        <div class="sheet-handle"></div>

        <div class="location-card">
          <div class="loc-header">
            <div>
              <span class="loc-tag">{{ statusLabel(selected.id) }}</span>
              <h3 class="loc-title">{{ selected.name }}</h3>
              <p class="loc-subtitle">{{ selected.subtitle }}</p>
            </div>
            <div class="loc-status-icon" :class="game.locations[selected.id]?.status">
              <span class="msr" style="font-size:28px">
                {{ game.locations[selected.id]?.status === 'complete' ? 'check_circle' :
                   game.locations[selected.id]?.status === 'in_progress' ? 'pending' : 'explore' }}
              </span>
            </div>
          </div>
          <p class="loc-real-note">{{ selected.realNote }}</p>
        </div>

        <!-- 완료된 경우 -->
        <div v-if="game.locations[selected.id]?.status === 'complete'" class="complete-note">
          <span class="msr" style="font-size:20px; color:var(--teal)">check_circle</span>
          <span>탐험 완료! 시간 친구를 만났어요.</span>
          <button class="small-btn" @click="$router.push('/collection')">도감 보기</button>
        </div>

        <div v-else>
          <div class="mode-row">
            <div class="mode-chip" :class="{ active: game.demoMode }">
              <span class="msr" style="font-size:14px">science</span>
              시연 모드
            </div>
            <div class="mode-chip" :class="{ active: !game.demoMode }">
              <span class="msr" style="font-size:14px">location_on</span>
              GPS 모드
            </div>
          </div>

          <button class="btn-primary" style="width:100%" @click="goExplore">
            <span class="msr" style="font-size:22px; color:var(--navy)">near_me</span>
            {{ game.locations[selected.id]?.status === 'in_progress' ? '탐험 계속하기' : '탐험 시작' }}
          </button>
        </div>

        <p class="sheet-note">GPS·QR은 구현 예정 기능입니다. 시연 모드로 장소 도착을 시뮬레이션해요.</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.map-screen { background: #e0ead4; overflow: hidden; }

.map-bg {
  position: absolute; inset: 0;
  background:
    linear-gradient(#c8d9b8 1px, transparent 1px),
    linear-gradient(90deg, #c8d9b8 1px, transparent 1px),
    linear-gradient(#d5e4c5 2px, transparent 2px),
    linear-gradient(90deg, #d5e4c5 2px, transparent 2px),
    #e8f0df;
  background-size: 24px 24px, 24px 24px, 120px 120px, 120px 120px;
}
.map-tint { position: absolute; inset: 0; background: #0C6D7520; }

.demo-badge {
  position: absolute; left: 88px; top: 56px;
  display: flex; align-items: center; gap: 5px;
  background: #08233FDE; color: var(--white);
  border-radius: 14px; padding: 5px 14px;
  font-size: 11px; font-weight: 700;
}

.player-status {
  position: absolute; left: 16px; top: 98px;
  display: flex; align-items: center; gap: 10px;
  background: #FFFFFFF2; border-radius: 20px;
  padding: 8px 12px; box-shadow: 0 5px 14px #062B4033; height: 58px;
}
.level-badge {
  width: 40px; height: 40px; background: var(--navy);
  border: 3px solid var(--orange); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.level-text { font-size: 14px; font-weight: 900; color: var(--ink); }
.status-divider { width: 1px; height: 28px; background: #C9DBDE; }
.shard-text { font-size: 13px; font-weight: 800; color: var(--ink); }

.map-controls {
  position: absolute; right: 16px; top: 100px;
  display: flex; flex-direction: column; gap: 10px;
}
.map-ctrl-btn {
  width: 48px; height: 48px; background: #FFFFFFF2;
  border: none; border-radius: 16px;
  box-shadow: 0 4px 12px #062B4033;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}

.objective {
  position: absolute; left: 16px; top: 170px; width: 358px;
  background: #08233FF0; border-radius: 20px;
  box-shadow: 0 6px 16px #00152255;
  display: flex; gap: 12px; padding: 11px 14px; align-items: center;
}
.obj-step {
  width: 42px; height: 42px; background: var(--orange);
  border-radius: 50%; display: flex; align-items: center;
  justify-content: center; flex-shrink: 0;
}
.obj-texts { display: flex; flex-direction: column; gap: 2px; }
.obj-label { font-size: 10px; font-weight: 900; color: var(--orange); }
.obj-action { font-size: 14px; font-weight: 900; color: var(--white); word-break: keep-all; }
.obj-next { font-size: 10px; font-weight: 700; color: #BDD9DE; }

.mission-marker {
  position: absolute; width: 92px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.mission-marker.selectable { cursor: pointer; }
.mission-marker.locked { opacity: 0.6; cursor: not-allowed; }

.marker-dot {
  width: 58px; height: 58px; border: 2px solid;
  border-radius: 50%; transition: transform 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.mission-marker.selectable:active .marker-dot { transform: scale(0.9); }

.marker-label {
  color: var(--white); border-radius: 10px;
  padding: 5px 9px; font-size: 11px; font-weight: 800; white-space: nowrap;
}
.marker-status {
  font-size: 9px; font-weight: 700; color: var(--navy);
  background: #FFFFFFCC; border-radius: 6px; padding: 2px 6px;
}

.player-avatar {
  position: absolute; left: 158px; top: 370px;
  width: 76px; height: 76px; background: var(--white);
  border: 4px solid var(--teal); border-radius: 50%;
  box-shadow: 0 6px 18px #043F4955;
  display: flex; align-items: center; justify-content: center;
}
.avatar-inner { font-size: 42px; line-height: 1; margin-top: 2px; }

.pin-legend {
  position: absolute; left: 16px; top: 600px;
  display: flex; gap: 12px; background: #FFFFFFE8;
  border-radius: 15px; padding: 6px 14px; align-items: center;
}
.pin-item { display: flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 800; color: var(--ink); }
.pin-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

.compact-guide {
  position: absolute; left: 16px; top: 642px; width: 285px; height: 82px;
  background: #FFFFFFF2; border-radius: 20px;
  box-shadow: 0 5px 16px #062B4033;
  display: flex; gap: 10px; padding: 10px 12px; align-items: center;
}
.guide-char { font-size: 44px; line-height: 1; flex-shrink: 0; }
.guide-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.guide-name { font-size: 11px; font-weight: 800; color: var(--teal); }
.guide-line { font-size: 13px; font-weight: 700; color: var(--ink); line-height: 1.4; word-break: keep-all; }

.nav-wrap { position: absolute; left: 16px; top: 754px; }

/* 바텀 시트 */
.bottom-sheet {
  position: absolute; left: 16px; bottom: 10px; width: 358px;
  background: #E9FAF7F5; border-radius: 28px 28px 22px 22px;
  box-shadow: 0 -8px 28px #062B4040;
  padding: 8px 10px 12px; display: flex; flex-direction: column; gap: 10px; z-index: 10;
}
.sheet-handle {
  width: 42px; height: 5px; background: #A8C4C6;
  border-radius: 3px; margin: 0 auto 2px;
}

.location-card {
  background: var(--white); border-radius: 18px; padding: 14px;
}
.loc-header { display: flex; justify-content: space-between; align-items: flex-start; }
.loc-tag { font-size: 10px; font-weight: 800; color: var(--teal); }
.loc-title { font-size: 20px; font-weight: 900; color: var(--ink); margin: 2px 0; }
.loc-subtitle { font-size: 12px; font-weight: 700; color: var(--muted); }
.loc-status-icon { padding: 4px; }
.loc-status-icon.complete .msr { color: var(--teal-dark); }
.loc-status-icon.available .msr { color: var(--orange); }
.loc-status-icon.in_progress .msr { color: var(--teal); }
.loc-real-note { font-size: 10px; font-weight: 600; color: var(--muted); margin-top: 8px; line-height: 1.4; word-break: keep-all; }

.complete-note {
  display: flex; align-items: center; gap: 8px;
  background: var(--sky); border-radius: 14px; padding: 10px 12px;
  font-size: 13px; font-weight: 800; color: var(--ink);
}
.small-btn {
  margin-left: auto; background: var(--teal); color: white;
  border: none; border-radius: 10px; padding: 6px 12px;
  font-family: var(--font); font-size: 11px; font-weight: 800; cursor: pointer;
}

.mode-row { display: flex; gap: 8px; }
.mode-chip {
  display: flex; align-items: center; gap: 5px;
  flex: 1; border-radius: 12px; padding: 7px 10px;
  background: #E0ECEB; font-size: 11px; font-weight: 800; color: var(--muted);
}
.mode-chip.active { background: var(--sky); color: var(--teal-dark); }

.sheet-note { font-size: 10px; font-weight: 600; color: var(--muted); text-align: center; }

.sheet-enter-active, .sheet-leave-active { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s; }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); opacity: 0; }
</style>
