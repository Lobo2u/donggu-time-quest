<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import BottomNavigation from '../components/BottomNavigation.vue'
import { game, resetGame } from '../store/gameStore.js'
import { LOCATIONS } from '../data/gameData.js'

const router = useRouter()
const mapEl  = ref(null)
const selected = ref(null)

let leafletMap = null
let leafletMarkers = {}
let userMarker = null
let watchId = null
let restorationLayers = {}

const locationList = Object.values(LOCATIONS)

// ── 상태 헬퍼 ────────────────────────────────────────────────────────────────
function locStatus(id) { return game.locations[id]?.status ?? 'locked' }
function isAwoken(id)  { return game.checkIns?.[id] ?? false }
function canSelect(id) { return locStatus(id) !== 'locked' }

function statusLabel(id) {
  return { available: '탐험 가능', in_progress: '탐험 중', complete: '완료', locked: '잠김' }[locStatus(id)]
}

// ── 마커 HTML 생성 ────────────────────────────────────────────────────────────
function markerHtml(loc) {
  const s = locStatus(loc.id)
  const awoken = isAwoken(loc.id)
  const colors = {
    available:   { ring: '#FF9F1C', fill: '#FF9F1C22', shadow: '#FF9F1C88' },
    in_progress: { ring: '#0E9F9A', fill: '#0E9F9A22', shadow: '#0E9F9A88' },
    complete:    { ring: '#08756F', fill: '#08756F22', shadow: '#08756F66' },
    locked:      { ring: '#8EA4AF', fill: '#8EA4AF11', shadow: 'transparent' },
  }[s]

  return `
    <div class="lf-marker status-${s}${awoken ? ' awoken' : ''}">
      <div class="lf-dot" style="
        border-color:${colors.ring};
        background:${colors.fill};
        box-shadow: 0 0 14px ${colors.shadow};
      ">${awoken ? '⭐' : ''}</div>
      <div class="lf-label" style="background:${s === 'locked' ? '#8EA4AFE8' : '#08233FE8'}">
        ${loc.name}
      </div>
      ${s === 'complete' ? '<div class="lf-complete-ring"></div>' : ''}
    </div>
  `
}

// ── 지도 초기화 ───────────────────────────────────────────────────────────────
function initMap() {
  leafletMap = L.map(mapEl.value, {
    center: [36.335, 127.428],
    zoom: 14,
    zoomControl: false,
    attributionControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(leafletMap)

  // 지도 색감 오버레이 (게임 분위기)
  const tintPane = leafletMap.createPane('tintPane')
  tintPane.style.zIndex = 250
  tintPane.style.pointerEvents = 'none'
  tintPane.style.background = 'rgba(12, 109, 117, 0.12)'

  // 장소 마커 추가
  locationList.forEach(addMarker)

  // 지도 클릭 시 선택 해제
  leafletMap.on('click', () => { selected.value = null })
}

function addMarker(loc) {
  const icon = L.divIcon({
    html: markerHtml(loc),
    className: '',
    iconSize: [80, 76],
    iconAnchor: [40, 68],
  })

  const marker = L.marker([loc.lat, loc.lng], { icon })
    .addTo(leafletMap)
    .on('click', (e) => {
      L.DomEvent.stopPropagation(e)
      if (canSelect(loc.id)) selected.value = selected.value?.id === loc.id ? null : loc
    })

  leafletMarkers[loc.id] = marker
}

function updateMarker(loc) {
  const m = leafletMarkers[loc.id]
  if (!m) return
  m.setIcon(L.divIcon({
    html: markerHtml(loc),
    className: '',
    iconSize: [80, 76],
    iconAnchor: [40, 68],
  }))
}

// 완료 장소에 복원 효과 (반짝이는 원)
function addRestorationEffect(locId) {
  const loc = LOCATIONS[locId]
  if (restorationLayers[locId]) return
  const circle = L.circle([loc.lat, loc.lng], {
    radius: 120,
    color: '#0E9F9A',
    fillColor: '#0E9F9A',
    fillOpacity: 0.08,
    weight: 1.5,
    opacity: 0.4,
  }).addTo(leafletMap)
  restorationLayers[locId] = circle
}

// ── GPS 추적 ─────────────────────────────────────────────────────────────────
function startGPS() {
  if (!navigator.geolocation) return
  watchId = navigator.geolocation.watchPosition(
    ({ coords }) => updateUserPosition(coords.latitude, coords.longitude),
    () => {},
    { enableHighAccuracy: true, maximumAge: 5000 },
  )
}

function updateUserPosition(lat, lng) {
  if (!leafletMap) return
  const icon = L.divIcon({
    html: '<div class="lf-user-marker"><div class="lf-user-pulse"></div><div class="lf-user-dot"></div></div>',
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
  if (userMarker) {
    userMarker.setLatLng([lat, lng])
  } else {
    userMarker = L.marker([lat, lng], { icon }).addTo(leafletMap)
  }
}

// ── 목표 표시 ─────────────────────────────────────────────────────────────────
const objective = computed(() => {
  const inProg = locationList.find(l => locStatus(l.id) === 'in_progress')
  if (inProg) return `${inProg.name} 탐험 중 · 미션을 계속해요`
  const avail = locationList.find(l => locStatus(l.id) === 'available')
  if (avail) return `${avail.name}에서 첫 번째 기억을 찾아요`
  return '모든 장소 탐험 완료!'
})
const completedCount = computed(() => locationList.filter(l => locStatus(l.id) === 'complete').length)
const guideName = computed(() => game.guide === 'jungang' ? '중앙이' : '마중이')
const guideMsg  = computed(() => {
  const avail = locationList.find(l => ['available','in_progress'].includes(locStatus(l.id)))
  return avail ? `${avail.name} 핀을 눌러 탐험을 시작해요!` : '모든 기억을 복원했어요!'
})

function goExplore() {
  if (!selected.value) return
  router.push(`/location/${selected.value.id}`)
}

// ── 반응형 마커 업데이트 ──────────────────────────────────────────────────────
watch(
  () => locationList.map(l => `${locStatus(l.id)}-${isAwoken(l.id)}`).join(),
  () => {
    locationList.forEach(loc => {
      updateMarker(loc)
      if (locStatus(loc.id) === 'complete') addRestorationEffect(loc.id)
    })
  },
  { deep: true },
)

// ── 라이프사이클 ──────────────────────────────────────────────────────────────
onMounted(() => {
  initMap()
  startGPS()
  // 이미 완료된 장소 복원 효과
  locationList.forEach(loc => {
    if (locStatus(loc.id) === 'complete') addRestorationEffect(loc.id)
  })
})

onBeforeUnmount(() => {
  if (watchId != null) navigator.geolocation.clearWatch(watchId)
  if (leafletMap) { leafletMap.remove(); leafletMap = null }
})
</script>

<template>
  <div class="screen map-screen">
    <!-- Leaflet 지도 컨테이너 -->
    <div ref="mapEl" class="leaflet-map-container" @click.self="selected = null"></div>

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
      <button class="map-ctrl-btn" title="도감" @click="$router.push('/collection')">
        <span class="msr" style="font-size:22px; color:var(--navy)">auto_stories</span>
      </button>
      <button class="map-ctrl-btn" title="초기화" @click="resetGame(); $router.replace('/')">
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
        <span class="obj-next">지도 핀을 눌러 장소를 선택하세요</span>
      </div>
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
            <div class="loc-status-icon">
              <span class="msr" style="font-size:28px"
                :style="{ color: locStatus(selected.id) === 'complete' ? 'var(--teal-dark)' : 'var(--orange)' }">
                {{ locStatus(selected.id) === 'complete' ? 'check_circle' :
                   locStatus(selected.id) === 'in_progress' ? 'pending' : 'explore' }}
              </span>
            </div>
          </div>
          <p class="loc-real-note">{{ selected.realNote }}</p>
        </div>

        <!-- 완료 상태 -->
        <div v-if="locStatus(selected.id) === 'complete'" class="complete-note">
          <span class="msr" style="font-size:20px; color:var(--teal)">check_circle</span>
          <span>탐험 완료!</span>
          <button class="small-btn" @click="$router.push('/collection')">도감 보기</button>
          <button class="small-btn" v-if="!isAwoken(selected.id)"
            style="background:var(--orange); color:var(--navy)"
            @click="$router.push('/qrscan')">QR 각성</button>
        </div>

        <div v-else>
          <div class="mode-row">
            <div class="mode-chip active">
              <span class="msr" style="font-size:14px">science</span>
              시연 모드
            </div>
            <div class="mode-chip">
              <span class="msr" style="font-size:14px">location_on</span>
              GPS 모드
            </div>
          </div>
          <button class="btn-primary" style="width:100%" @click="goExplore">
            <span class="msr" style="font-size:22px; color:var(--navy)">near_me</span>
            {{ locStatus(selected.id) === 'in_progress' ? '탐험 계속하기' : '탐험 시작' }}
          </button>
        </div>

        <p class="sheet-note">GPS·QR은 구현 예정 기능입니다. 시연 모드로 장소 도착을 시뮬레이션해요.</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.map-screen { overflow: hidden; }

.leaflet-map-container {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.demo-badge {
  position: absolute; left: 88px; top: 56px; z-index: 10;
  display: flex; align-items: center; gap: 5px;
  background: #08233FDE; color: var(--white);
  border-radius: 14px; padding: 5px 14px;
  font-size: 11px; font-weight: 700;
}

.player-status {
  position: absolute; left: 16px; top: 98px; z-index: 10;
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
  position: absolute; right: 16px; top: 100px; z-index: 10;
  display: flex; flex-direction: column; gap: 10px;
}
.map-ctrl-btn {
  width: 48px; height: 48px; background: #FFFFFFF2;
  border: none; border-radius: 16px;
  box-shadow: 0 4px 12px #062B4033;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}

.objective {
  position: absolute; left: 16px; top: 170px; width: 358px; z-index: 10;
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

.pin-legend {
  position: absolute; left: 16px; top: 600px; z-index: 10;
  display: flex; gap: 12px; background: #FFFFFFE8;
  border-radius: 15px; padding: 6px 14px; align-items: center;
}
.pin-item { display: flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 800; color: var(--ink); }
.pin-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

.compact-guide {
  position: absolute; left: 16px; top: 642px; width: 285px; z-index: 10;
  background: #FFFFFFF2; border-radius: 20px;
  box-shadow: 0 5px 16px #062B4033;
  display: flex; gap: 10px; padding: 10px 12px; align-items: center;
}
.guide-char { font-size: 44px; line-height: 1; flex-shrink: 0; }
.guide-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.guide-name { font-size: 11px; font-weight: 800; color: var(--teal); }
.guide-line { font-size: 13px; font-weight: 700; color: var(--ink); line-height: 1.4; word-break: keep-all; }

.nav-wrap { position: absolute; left: 16px; top: 754px; z-index: 10; }

.bottom-sheet {
  position: absolute; left: 16px; bottom: 10px; width: 358px; z-index: 20;
  background: #E9FAF7F5; border-radius: 28px 28px 22px 22px;
  box-shadow: 0 -8px 28px #062B4040;
  padding: 8px 10px 12px; display: flex; flex-direction: column; gap: 10px;
}
.sheet-handle {
  width: 42px; height: 5px; background: #A8C4C6;
  border-radius: 3px; margin: 0 auto 2px;
}

.location-card { background: var(--white); border-radius: 18px; padding: 14px; }
.loc-header { display: flex; justify-content: space-between; align-items: flex-start; }
.loc-tag { font-size: 10px; font-weight: 800; color: var(--teal); }
.loc-title { font-size: 20px; font-weight: 900; color: var(--ink); margin: 2px 0; }
.loc-subtitle { font-size: 12px; font-weight: 700; color: var(--muted); }
.loc-real-note { font-size: 10px; font-weight: 600; color: var(--muted); margin-top: 8px; line-height: 1.4; word-break: keep-all; }

.complete-note {
  display: flex; align-items: center; gap: 8px;
  background: var(--sky); border-radius: 14px; padding: 10px 12px;
  font-size: 13px; font-weight: 800; color: var(--ink);
}
.small-btn {
  margin-left: auto; background: var(--teal); color: white;
  border: none; border-radius: 10px; padding: 6px 10px;
  font-family: var(--font); font-size: 11px; font-weight: 800; cursor: pointer;
}

.mode-row { display: flex; gap: 8px; margin-bottom: 4px; }
.mode-chip {
  display: flex; align-items: center; gap: 5px; flex: 1;
  border-radius: 12px; padding: 7px 10px;
  background: #E0ECEB; font-size: 11px; font-weight: 800; color: var(--muted);
}
.mode-chip.active { background: var(--sky); color: var(--teal-dark); }

.sheet-note { font-size: 10px; font-weight: 600; color: var(--muted); text-align: center; }

.sheet-enter-active, .sheet-leave-active { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s; }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); opacity: 0; }
</style>
