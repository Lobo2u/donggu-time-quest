<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import BottomNavigation from '../components/BottomNavigation.vue'
import BuddySvg from '../components/BuddySvg.vue'
import OnboardingTour from '../components/OnboardingTour.vue'
import { game, resetGame, canClaimDaily, claimDaily } from '../store/gameStore.js'
import {
  geo, effectivePos, distanceMeters, bearing, bearingLabel, fmtDistance,
  startWatch, stopWatch, isWithin, simulateWalkTo, teleportDemo,
  spawnWildNear, collectWild, WILD_COLLECT_RADIUS,
} from '../store/geoStore.js'
import { LOCATIONS, STORES } from '../data/gameData.js'

const router = useRouter()
const mapEl  = ref(null)
const selected = ref(null)
const selectedStore = ref(null)
const tick = ref(0) // 근접 재계산 트리거

let leafletMap = null
let leafletMarkers = {}
let wildMarkers = {}
let userMarker = null
let accuracyCircle = null
let restorationLayers = {}
let colorPane = null
let storeMarkers = {}

// ── 상권 핀 + 웨이팅 ──────────────────────────────────────────────────────────
const waitOffsets = {}
STORES.forEach(s => { waitOffsets[s.id] = Math.floor(Math.random() * 3) })
const myTickets = reactive({})
function storeWait(s) { return Math.max(0, s.waitBase + (waitOffsets[s.id] || 0)) }
function storeVisible(s) { return locStatus(s.locationId) !== 'locked' }
function requestWait(s) { myTickets[s.id] = storeWait(s) + 1 }
let rafId = null

const locationList = Object.values(LOCATIONS)

// ── 근접 계산 ─────────────────────────────────────────────────────────────────
function distTo(loc) {
  void tick.value
  const p = effectivePos()
  return p ? distanceMeters(p, { lat: loc.lat, lng: loc.lng }) : Infinity
}
function arrived(loc) {
  void tick.value
  return isWithin(loc, loc.arrivalRadius)
}
// 레이더: 미완료·선택가능 장소를 거리순 정렬
const radar = computed(() => {
  void tick.value
  const p = effectivePos()
  return locationList
    .filter(l => locStatus(l.id) !== 'complete')
    .map(l => ({
      loc: l,
      d: distTo(l),
      dir: p ? bearingLabel(bearing(p, { lat: l.lat, lng: l.lng })) : '',
      deg: p ? bearing(p, { lat: l.lat, lng: l.lng }) : 0,
      arrived: arrived(l),
      selectable: canSelect(l.id),
    }))
    // 탐험 가능한 스팟을 먼저, 그 안에서 가까운 순
    .sort((a, b) => (b.selectable - a.selectable) || (a.d - b.d))
})
const hasPos = computed(() => { void tick.value; return !!effectivePos() })

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
// 상태별 마커 스택 우선순위 (클릭 가능한 active 가 항상 위로)
function zOffset(id) {
  const s = locStatus(id)
  return { in_progress: 1000, available: 800, complete: 400, locked: 0 }[s] ?? 0
}

function initMap() {
  leafletMap = L.map(mapEl.value, {
    center: [36.335, 127.428],
    zoom: 15,
    zoomControl: true,
    attributionControl: true,
  })
  leafletMap.zoomControl.setPosition('bottomright')

  const TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const ATTR = '© <a href="https://openstreetmap.org">OpenStreetMap</a>'

  // 흑백(빛바랜) 베이스 레이어 (기억을 잃은 지도)
  const grayPane = leafletMap.createPane('grayPane')
  grayPane.style.zIndex = 190
  grayPane.style.filter = 'grayscale(1) sepia(0.38) brightness(0.9) contrast(1.08)'
  L.tileLayer(TILE, { attribution: ATTR, maxZoom: 19, pane: 'grayPane' }).addTo(leafletMap)

  // 컬러 레이어 (복원된 기억) - 완료 구역만 마스크로 드러냄
  colorPane = leafletMap.createPane('colorPane')
  colorPane.style.zIndex = 195
  colorPane.style.pointerEvents = 'none'
  L.tileLayer(TILE, { maxZoom: 19, pane: 'colorPane' }).addTo(leafletMap)

  // 장소 마커 + 상점 핀 추가
  locationList.forEach(addMarker)
  renderStores()

  // 지도 클릭 시 선택 해제
  leafletMap.on('click', () => { selected.value = null; selectedStore.value = null })
  // 지도 이동/확대 시 컬러 복원 마스크 갱신
  leafletMap.on('move zoom moveend zoomend', updateColorMask)

  focusObjective()
  updateColorMask()
}

// 완료한 장소 주변만 컬러로 드러나도록 colorPane 에 radial-gradient 마스크 적용
function updateColorMask() {
  if (!colorPane || !leafletMap) return
  const done = locationList.filter(l => locStatus(l.id) === 'complete')
  if (done.length === locationList.length && done.length > 0) {
    colorPane.style.webkitMaskImage = 'none'
    colorPane.style.maskImage = 'none'
    return
  }
  if (!done.length) {
    const none = 'radial-gradient(circle 0px at -100px -100px, #000, #000)'
    colorPane.style.webkitMaskImage = none
    colorPane.style.maskImage = none
    return
  }
  const R = 150 // 복원 반경(px)
  const grads = done.map(l => {
    const p = leafletMap.latLngToContainerPoint([l.lat, l.lng])
    return `radial-gradient(circle ${R}px at ${Math.round(p.x)}px ${Math.round(p.y)}px, #000 55%, transparent 100%)`
  }).join(', ')
  colorPane.style.webkitMaskImage = grads
  colorPane.style.maskImage = grads
}

// 활성 목표(진행중/탐험가능) 위치로 지도 중심 이동. 없으면 전체 보기
function focusObjective() {
  const active = locationList.find(l => ['in_progress', 'available'].includes(locStatus(l.id)))
  if (active) {
    leafletMap.setView([active.lat, active.lng], 16, { animate: false })
  } else {
    const pts = locationList.map(l => [l.lat, l.lng])
    leafletMap.fitBounds(pts, { padding: [60, 60], maxZoom: 16 })
  }
}

function addMarker(loc) {
  const icon = L.divIcon({
    html: markerHtml(loc),
    className: '',
    iconSize: [80, 76],
    iconAnchor: [40, 68],
  })

  const marker = L.marker([loc.lat, loc.lng], { icon, zIndexOffset: zOffset(loc.id) })
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
  m.setZIndexOffset(zOffset(loc.id))
}

// ── 상점 마커 ─────────────────────────────────────────────────────────────────
function storeMarkerHtml(s) {
  const w = storeWait(s)
  const waitHtml = w > 0
    ? `<div class="lf-store-wait">대기 ${w}</div>`
    : `<div class="lf-store-wait ok">바로</div>`
  return `<div class="lf-store${s.hot ? ' hot' : ''}">
    <div class="lf-store-dot"><span class="msr" style="font-size:20px">${s.icon}</span></div>
    ${waitHtml}
  </div>`
}
function renderStores() {
  if (!leafletMap) return
  STORES.forEach(s => {
    const vis = storeVisible(s)
    const icon = () => L.divIcon({ html: storeMarkerHtml(s), className: '', iconSize: [64, 54], iconAnchor: [32, 48] })
    if (vis && !storeMarkers[s.id]) {
      storeMarkers[s.id] = L.marker([s.lat, s.lng], { icon: icon(), zIndexOffset: 300 })
        .addTo(leafletMap)
        .on('click', (e) => { L.DomEvent.stopPropagation(e); selected.value = null; selectedStore.value = s })
    } else if (vis && storeMarkers[s.id]) {
      storeMarkers[s.id].setIcon(icon())
    } else if (!vis && storeMarkers[s.id]) {
      leafletMap.removeLayer(storeMarkers[s.id]); delete storeMarkers[s.id]
    }
  })
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

// ── 플레이어 아바타 + 야생 스폰 렌더 ─────────────────────────────────────────
const guideVariant = () => game.guide === 'jungang' ? 'jungang' : 'majung'

function renderPlayer() {
  const p = effectivePos()
  if (!leafletMap || !p) return
  if (!userMarker) {
    const icon = L.divIcon({
      html: `<div class="lf-user-marker">
               <div class="lf-user-pulse"></div>
               <div class="lf-user-avatar">${guideVariant() === 'jungang' ? '🏪' : '🐧'}</div>
             </div>`,
      className: '', iconSize: [46, 46], iconAnchor: [23, 23],
    })
    userMarker = L.marker([p.lat, p.lng], { icon, zIndexOffset: 2000 }).addTo(leafletMap)
    accuracyCircle = L.circle([p.lat, p.lng], {
      radius: geo.accuracy ?? 30, color: '#4A90D9', fillColor: '#4A90D9',
      fillOpacity: 0.08, weight: 1, opacity: 0.3,
    }).addTo(leafletMap)
  } else {
    userMarker.setLatLng([p.lat, p.lng])
    accuracyCircle?.setLatLng([p.lat, p.lng])
    if (geo.accuracy) accuracyCircle?.setRadius(Math.min(geo.accuracy, 120))
  }
}

function renderWild() {
  if (!leafletMap) return
  const p = effectivePos()
  // 제거된 스폰 정리
  Object.keys(wildMarkers).forEach(id => {
    if (!geo.wildSpots.find(w => w.id === id)) {
      leafletMap.removeLayer(wildMarkers[id]); delete wildMarkers[id]
    }
  })
  geo.wildSpots.forEach(w => {
    const near = p && distanceMeters(p, w) <= WILD_COLLECT_RADIUS
    const html = `<div class="lf-wild${near ? ' near' : ''}"><span class="lf-wild-gem">◆</span></div>`
    if (!wildMarkers[w.id]) {
      const icon = L.divIcon({ html, className: '', iconSize: [40, 40], iconAnchor: [20, 20] })
      wildMarkers[w.id] = L.marker([w.lat, w.lng], { icon, zIndexOffset: 500 })
        .addTo(leafletMap)
        .on('click', (e) => { L.DomEvent.stopPropagation(e); tryCollectWild(w.id) })
    } else {
      wildMarkers[w.id].setIcon(L.divIcon({ html, className: '', iconSize: [40, 40], iconAnchor: [20, 20] }))
    }
  })
}

const wildToast = ref(null)
function tryCollectWild(id) {
  const got = collectWild(id)
  if (got) {
    wildToast.value = `야생 시간 조각 +${got}`
    setTimeout(() => { wildToast.value = null }, 1600)
    // 다 주웠으면 주변에 새로 스폰
    if (!geo.wildSpots.length) setTimeout(() => spawnWildNear(effectivePos(), 3), 800)
  } else {
    wildToast.value = '너무 멀어요! 가까이 가서 주워요'
    setTimeout(() => { wildToast.value = null }, 1600)
  }
}

// 근접 상태 주기적 갱신 (거리 라벨/도착 판정 재계산)
function loop() {
  tick.value++
  renderPlayer()
  renderWild()
  rafId = setTimeout(loop, 500)
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
const restorePct = computed(() => Math.round(completedCount.value / locationList.length * 100))
const guideName = computed(() => game.guide === 'jungang' ? '중앙이' : '마중이')
const guideMsg  = computed(() => {
  const avail = locationList.find(l => ['available','in_progress'].includes(locStatus(l.id)))
  return avail ? `${avail.name} 핀을 눌러 탐험을 시작해요!` : '모든 기억을 복원했어요!'
})

// 스팟 상호작용: 도착(반경 내)했을 때만 미션/보상 가능
function goExplore() {
  if (!selected.value) return
  if (!arrived(selected.value)) return   // 도착 전이면 불가
  router.push(`/location/${selected.value.id}`)
}

// 시연: 선택한 스팟으로 걸어가기 (도착 시뮬레이션)
const walking = ref(false)
function walkToSelected() {
  if (!selected.value) return
  walking.value = true
  simulateWalkTo(
    { lat: selected.value.lat, lng: selected.value.lng },
    () => { walking.value = false; teleportDemo(selected.value); tick.value++ },
  )
}

// 일일 보너스
const showDaily = ref(canClaimDaily())
const dailyResult = ref(null)
function claimDailyBonus() {
  const r = claimDaily()
  if (r) { dailyResult.value = r; showDaily.value = false }
}

// 메뉴 + 내 위치
const menuOpen = ref(false)
function recenter() {
  const p = effectivePos()
  if (p && leafletMap) leafletMap.flyTo([p.lat, p.lng], 16, { duration: 0.6 })
}
function go(path) { menuOpen.value = false; router.push(path) }
function doReset() { menuOpen.value = false; resetGame(); router.replace('/') }

// ── 반응형 마커 업데이트 ──────────────────────────────────────────────────────
watch(
  () => locationList.map(l => `${locStatus(l.id)}-${isAwoken(l.id)}`).join(),
  () => {
    locationList.forEach(loc => {
      updateMarker(loc)
      if (locStatus(loc.id) === 'complete') addRestorationEffect(loc.id)
    })
    updateColorMask()
    renderStores()
  },
  { deep: true },
)

// 레이더 항목 선택 → 지도 이동 + 바텀시트
function pickFromRadar(entry) {
  if (!entry.selectable) return
  selected.value = entry.loc
  leafletMap?.panTo([entry.loc.lat, entry.loc.lng])
}

// ── 라이프사이클 ──────────────────────────────────────────────────────────────
onMounted(() => {
  initMap()
  startWatch()
  // 시연: GPS가 없으면 현재 목표 근처를 가상 위치로 설정
  setTimeout(() => {
    if (!effectivePos() && game.demoMode) {
      const obj = locationList.find(l => ['available', 'in_progress'].includes(locStatus(l.id))) ?? locationList[0]
      teleportDemo({ lat: obj.lat - 0.0025, lng: obj.lng - 0.0025 }) // 조금 떨어진 곳에서 시작
    }
    spawnWildNear(effectivePos(), 3)
  }, 1200)
  locationList.forEach(loc => {
    if (locStatus(loc.id) === 'complete') addRestorationEffect(loc.id)
  })
  loop()
})

onBeforeUnmount(() => {
  if (rafId) clearTimeout(rafId)
  stopWatch()
  if (leafletMap) { leafletMap.remove(); leafletMap = null }
})
</script>

<template>
  <div class="screen map-screen">
    <!-- 온보딩 튜토리얼 (최초 1회) -->
    <OnboardingTour />

    <!-- Leaflet 지도 컨테이너 -->
    <div ref="mapEl" class="leaflet-map-container" @click.self="selected = null"></div>

    <!-- 상단 HUD: 상태(좌) + 컨트롤(우) -->
    <div class="hud-top">
      <div class="player-status">
        <div class="level-badge">
          <span style="font-size:13px; font-weight:900; color:var(--orange)">{{ game.player.level }}</span>
        </div>
        <span class="level-text">Lv.{{ game.player.level }}</span>
        <div class="status-divider"></div>
        <span class="msr" style="font-size:18px; color:var(--orange)">diamond</span>
        <span class="shard-text">{{ game.player.shards }}</span>
        <span v-if="game.demoMode" class="demo-tag">시연</span>
      </div>

      <div class="hud-ctrls">
        <button v-if="showDaily" class="hud-btn daily-ctrl" title="오늘의 보너스" @click="claimDailyBonus">
          <span class="msr" style="font-size:20px; color:var(--orange)">redeem</span>
        </button>
        <button class="hud-btn" title="내 위치" @click="recenter">
          <span class="msr" style="font-size:20px; color:var(--navy)">my_location</span>
        </button>
        <button class="hud-btn" title="메뉴" @click="menuOpen = !menuOpen">
          <span class="msr" style="font-size:20px; color:var(--navy)">{{ menuOpen ? 'close' : 'menu' }}</span>
        </button>
      </div>
    </div>

    <!-- 메뉴 팝오버 -->
    <Transition name="menu">
      <div class="menu-pop" v-if="menuOpen">
        <button class="menu-item" @click="go('/collection')"><span class="msr">auto_stories</span> 도감</button>
        <button class="menu-item" @click="go('/courses')"><span class="msr">route</span> 코스</button>
        <div class="menu-sep">운영자</div>
        <button class="menu-item" @click="go('/dashboard')"><span class="msr">insights</span> 운영 현황</button>
        <button class="menu-item" @click="go('/qr-admin')"><span class="msr">qr_code_2</span> QR 발급</button>
        <button class="menu-item" @click="go('/field-markers')"><span class="msr">qr_code_2</span> 타깃 팻말</button>
        <button class="menu-item" @click="go('/photo-targets')"><span class="msr">photo_camera</span> 사진 인증 등록</button>
        <button class="menu-item danger" @click="doReset"><span class="msr">refresh</span> 처음부터</button>
      </div>
    </Transition>
    <div class="menu-scrim" v-if="menuOpen" @click="menuOpen = false"></div>

    <!-- 현재 목표 -->
    <div class="objective">
      <div class="obj-step">
        <span class="msr" style="font-size:18px; color:var(--navy)">flag</span>
      </div>
      <div class="obj-texts">
        <span class="obj-label">기억 복원 {{ restorePct }}% · {{ completedCount }} / {{ locationList.length }}곳</span>
        <span class="obj-action">{{ objective }}</span>
        <span class="obj-next">지도 핀을 눌러 장소를 선택하세요</span>
      </div>
    </div>

    <!-- 일일 보너스 수령 결과 -->
    <Transition name="pop">
      <div v-if="dailyResult" class="daily-result" @click="dailyResult = null">
        <div class="daily-result-card">
          <span class="msr" style="font-size:44px; color:var(--orange)">diamond</span>
          <p class="dr-title">+{{ dailyResult.reward }} 시간 조각</p>
          <p class="dr-streak">{{ dailyResult.streak }}일 연속 탐험 중! 🔥</p>
          <p class="dr-hint">연속 출석할수록 보너스가 커져요 (최대 +5)</p>
          <button class="dr-btn" @click.stop="dailyResult = null">확인</button>
        </div>
      </div>
    </Transition>

    <!-- 주변 레이더 -->
    <div class="radar-panel" v-if="!selected">
      <div class="radar-head">
        <span class="msr" style="font-size:16px; color:var(--teal)">radar</span>
        <span class="radar-title">주변 스팟</span>
        <span class="radar-walk" v-if="geo.walkedMeters > 0">
          🚶 {{ Math.round(geo.walkedMeters) }}m · 조각 {{ geo.walkRewardShards }}
        </span>
      </div>
      <div class="radar-list">
        <button
          v-for="r in radar.slice(0, 3)" :key="r.loc.id"
          class="radar-item" :class="{ arrived: r.arrived, locked: !r.selectable }"
          @click="pickFromRadar(r)"
        >
          <span class="radar-dir" :style="{ transform: `rotate(${r.deg}deg)` }">
            <span class="msr" style="font-size:18px">navigation</span>
          </span>
          <div class="radar-info">
            <span class="radar-name">{{ r.loc.name }}</span>
            <span class="radar-meta">
              {{ r.selectable ? (r.arrived ? '도착 · 미션 가능' : `${r.dir}쪽 ${fmtDistance(r.d)}`) : '잠김' }}
            </span>
          </div>
          <span v-if="r.arrived && r.selectable" class="radar-badge">GO</span>
          <span v-else-if="r.selectable" class="radar-dist">{{ fmtDistance(r.d) }}</span>
        </button>
      </div>
    </div>

    <!-- 야생 조각 토스트 -->
    <Transition name="toast">
      <div v-if="wildToast" class="wild-toast">
        <span class="msr" style="font-size:18px; color:var(--orange)">diamond</span>
        {{ wildToast }}
      </div>
    </Transition>

    <!-- 하단 네비게이션 -->
    <div class="nav-wrap">
      <BottomNavigation />
    </div>

    <!-- 상점 바텀 시트 (실시간 웨이팅) -->
    <Transition name="sheet">
      <div class="bottom-sheet store-sheet" v-if="selectedStore">
        <div class="sheet-handle"></div>
        <div class="store-card">
          <div class="store-top">
            <div class="store-ico"><span class="msr" style="font-size:26px; color:var(--teal-dark)">{{ selectedStore.icon }}</span></div>
            <div class="store-head">
              <div class="store-tags">
                <span class="store-cat">{{ selectedStore.category }}</span>
                <span v-if="selectedStore.hot" class="store-hot">🔥 인기</span>
                <span v-else class="store-local">골목 상권</span>
              </div>
              <h3 class="store-name">{{ selectedStore.name }}</h3>
            </div>
          </div>
          <div class="store-offer">
            <span class="msr" style="font-size:16px; color:var(--orange)">local_offer</span>
            {{ selectedStore.offer }}
          </div>
          <!-- 실시간 웨이팅 -->
          <div class="wait-box" :class="{ now: storeWait(selectedStore) === 0 }">
            <div class="wait-live"><span class="live-dot"></span> 실시간</div>
            <template v-if="storeWait(selectedStore) > 0">
              <span class="wait-num">대기 {{ storeWait(selectedStore) }}팀</span>
              <span class="wait-min">약 {{ storeWait(selectedStore) * 8 }}분</span>
            </template>
            <span v-else class="wait-num">바로 입장 가능</span>
          </div>
        </div>

        <!-- 대기 신청 / 내 순번 -->
        <div v-if="myTickets[selectedStore.id]" class="my-ticket">
          <span class="msr" style="font-size:22px; color:var(--teal)">confirmation_number</span>
          <div>
            <p class="ticket-label">내 대기 순번</p>
            <p class="ticket-num">{{ myTickets[selectedStore.id] }}번 · 앞에 {{ myTickets[selectedStore.id] - 1 }}팀</p>
          </div>
        </div>
        <button v-else class="btn-primary" style="width:100%" @click="requestWait(selectedStore)">
          <span class="msr" style="font-size:20px; color:var(--navy)">add_task</span>
          대기 신청하기
        </button>

        <p class="sheet-note">검색 없이 지도 핀으로 바로 대기 신청 · 데모용 가상 매장입니다</p>
      </div>
    </Transition>

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
          <!-- 도착 상태 표시 -->
          <div class="arrival-status" :class="{ here: arrived(selected) }">
            <span class="msr" style="font-size:20px" :style="{ color: arrived(selected) ? 'var(--teal)' : 'var(--orange)' }">
              {{ arrived(selected) ? 'where_to_vote' : 'directions_walk' }}
            </span>
            <span v-if="arrived(selected)">도착! 이 장소의 미션을 시작할 수 있어요</span>
            <span v-else>아직 <b>{{ fmtDistance(distTo(selected)) }}</b> 남았어요 · 가까이 가면 열려요</span>
          </div>

          <!-- 도착함 → 미션 시작 -->
          <button v-if="arrived(selected)" class="btn-primary" style="width:100%" @click="goExplore">
            <span class="msr" style="font-size:22px; color:var(--navy)">near_me</span>
            {{ locStatus(selected.id) === 'in_progress' ? '미션 계속하기' : '미션 시작' }}
          </button>

          <!-- 도착 전 → 시연 걸어가기 -->
          <button v-else class="btn-walk" :disabled="walking" @click="walkToSelected">
            <span class="msr" style="font-size:20px">{{ walking ? 'directions_walk' : 'play_circle' }}</span>
            {{ walking ? '걸어가는 중…' : '여기로 걸어가기 (시연)' }}
          </button>
        </div>

        <p class="sheet-note">
          {{ arrived(selected)
            ? '스팟에 도착했을 때만 미션·보상이 열려요.'
            : '실제로는 GPS로 이 위치에 도착하면 열려요. 발표에선 시연 걸어가기로 체험해요.' }}
        </p>
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

/* 상단 HUD */
.hud-top {
  position: absolute; left: 12px; right: 12px; top: 50px; z-index: 11;
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
}
.player-status {
  display: flex; align-items: center; gap: 8px;
  background: #FFFFFFF5; border-radius: 22px;
  padding: 6px 12px 6px 6px; box-shadow: 0 4px 14px #062B4033; height: 44px;
}
.level-badge {
  width: 32px; height: 32px; background: var(--navy);
  border: 2.5px solid var(--orange); border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.level-text { font-size: 13px; font-weight: 900; color: var(--ink); }
.status-divider { width: 1px; height: 20px; background: #C9DBDE; }
.shard-text { font-size: 13px; font-weight: 800; color: var(--ink); }
.demo-tag { background: var(--sky); color: var(--teal-dark); border-radius: 8px; padding: 2px 7px; font-size: 10px; font-weight: 900; margin-left: 2px; }

.hud-ctrls { display: flex; gap: 8px; }
.hud-btn {
  width: 44px; height: 44px; background: #FFFFFFF5;
  border: none; border-radius: 14px; box-shadow: 0 4px 12px #062B4033;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}

/* 메뉴 팝오버 */
.menu-scrim { position: absolute; inset: 0; z-index: 14; }
.menu-pop {
  position: absolute; right: 12px; top: 102px; z-index: 15;
  background: var(--white); border-radius: 16px; padding: 6px;
  box-shadow: 0 10px 30px #062B4044; display: flex; flex-direction: column; min-width: 160px;
}
.menu-item {
  display: flex; align-items: center; gap: 10px; width: 100%;
  background: none; border: none; border-radius: 10px; padding: 11px 12px;
  font-family: var(--font); font-size: 14px; font-weight: 800; color: var(--ink); cursor: pointer; text-align: left;
}
.menu-item .msr { font-size: 19px; color: var(--teal-dark); }
.menu-item:active { background: var(--sky); }
.menu-item.danger { color: #D64B5F; }
.menu-item.danger .msr { color: #D64B5F; }
.menu-sep { font-size: 10px; font-weight: 800; color: var(--muted); padding: 8px 12px 4px; }

.objective {
  position: absolute; left: 12px; right: 12px; top: 104px; z-index: 10;
  background: #08233FF0; border-radius: 18px;
  box-shadow: 0 6px 16px #00152255;
  display: flex; gap: 12px; padding: 10px 14px; align-items: center;
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
.guide-char { flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 50px; }
.guide-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.guide-name { font-size: 11px; font-weight: 800; color: var(--teal); }
.guide-line { font-size: 13px; font-weight: 700; color: var(--ink); line-height: 1.4; word-break: keep-all; }

.nav-wrap { position: absolute; left: 16px; top: 754px; z-index: 10; }

/* 일일 보너스 버튼 (지도 컨트롤) */
.daily-ctrl { border: 2px solid var(--orange); animation: gift-shake 1.5s ease-in-out infinite; }
@keyframes gift-shake {
  0%, 60%, 100% { transform: rotate(0); }
  70% { transform: rotate(-10deg); } 80% { transform: rotate(10deg); } 90% { transform: rotate(-6deg); }
}

/* 주변 레이더 */
.radar-panel {
  position: absolute; left: 16px; top: 582px; width: 358px; z-index: 10;
  background: #FFFFFFF5; border-radius: 20px; padding: 10px 12px;
  box-shadow: 0 5px 18px #062B4033;
}
.radar-head { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.radar-title { font-size: 12px; font-weight: 900; color: var(--ink); }
.radar-walk { margin-left: auto; font-size: 10px; font-weight: 800; color: var(--teal-dark); }
.radar-list { display: flex; flex-direction: column; gap: 6px; }
.radar-item {
  display: flex; align-items: center; gap: 10px; width: 100%;
  background: #F2F8F7; border: 1.5px solid transparent; border-radius: 13px;
  padding: 8px 10px; cursor: pointer; font-family: var(--font);
}
.radar-item.arrived { background: #DFF7F4; border-color: var(--teal); }
.radar-item.locked { opacity: 0.5; cursor: not-allowed; }
.radar-dir {
  width: 30px; height: 30px; border-radius: 50%; background: var(--navy);
  display: flex; align-items: center; justify-content: center; color: var(--orange); flex-shrink: 0;
  transition: transform 0.3s;
}
.radar-dir .msr { color: var(--orange); }
.radar-info { flex: 1; display: flex; flex-direction: column; gap: 1px; text-align: left; }
.radar-name { font-size: 13px; font-weight: 900; color: var(--ink); }
.radar-meta { font-size: 10px; font-weight: 700; color: var(--muted); }
.radar-badge {
  background: var(--orange); color: var(--navy); border-radius: 8px;
  padding: 3px 10px; font-size: 12px; font-weight: 900;
}
.radar-dist { font-size: 12px; font-weight: 900; color: var(--teal-dark); }

/* 야생 토스트 */
.wild-toast {
  position: absolute; left: 50%; top: 150px; transform: translateX(-50%); z-index: 30;
  background: var(--navy); color: white; border-radius: 14px; padding: 10px 16px;
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 800; white-space: nowrap; box-shadow: 0 6px 20px #00000055;
}
.toast-enter-active, .toast-leave-active { transition: all 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, -10px); }

/* 도착 상태 */
.arrival-status {
  display: flex; align-items: center; gap: 8px;
  background: #FFF3E0; border-radius: 12px; padding: 10px 12px;
  font-size: 12px; font-weight: 800; color: var(--ink); margin-bottom: 4px; word-break: keep-all;
}
.arrival-status.here { background: #DFF7F4; }
.arrival-status b { color: var(--orange); }

.btn-walk {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  height: 52px; background: var(--navy); color: white; border: none; border-radius: 16px;
  font-family: var(--font); font-size: 15px; font-weight: 800; cursor: pointer;
}
.btn-walk:disabled { opacity: 0.7; }

.daily-result {
  position: absolute; inset: 0; z-index: 50; background: #08233Fcc;
  display: flex; align-items: center; justify-content: center;
}
.daily-result-card {
  background: white; border-radius: 24px; padding: 28px 24px; width: 280px;
  display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center;
}
.dr-title { font-size: 24px; font-weight: 900; color: var(--ink); }
.dr-streak { font-size: 15px; font-weight: 800; color: var(--orange); }
.dr-hint { font-size: 11px; font-weight: 600; color: var(--muted); margin-top: 4px; word-break: keep-all; }
.dr-btn {
  margin-top: 14px; width: 100%; background: var(--orange); color: var(--navy);
  border: none; border-radius: 14px; padding: 12px; font-family: var(--font);
  font-size: 15px; font-weight: 800; cursor: pointer;
}
.pop-enter-active { transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1); }
.pop-enter-from { transform: scale(0.7); opacity: 0; }

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

/* 상점 시트 */
.store-card { background: var(--white); border-radius: 18px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.store-top { display: flex; align-items: center; gap: 12px; }
.store-ico { width: 48px; height: 48px; border-radius: 14px; background: var(--sky); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.store-head { flex: 1; min-width: 0; }
.store-tags { display: flex; gap: 6px; align-items: center; }
.store-cat { font-size: 11px; font-weight: 800; color: var(--muted); }
.store-hot { font-size: 10px; font-weight: 900; color: #D64B5F; background: #FFE8EA; border-radius: 6px; padding: 1px 6px; }
.store-local { font-size: 10px; font-weight: 900; color: var(--teal-dark); background: var(--sky); border-radius: 6px; padding: 1px 6px; }
.store-name { font-size: 18px; font-weight: 900; color: var(--ink); }
.store-offer { display: flex; align-items: center; gap: 6px; background: var(--orange-soft); border-radius: 12px; padding: 8px 12px; font-size: 13px; font-weight: 800; color: var(--ink); }
.wait-box { display: flex; align-items: center; gap: 10px; background: #FFF0F0; border-radius: 12px; padding: 10px 12px; }
.wait-box.now { background: #DFF7F4; }
.wait-live { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 900; color: #D64B5F; }
.wait-box.now .wait-live { color: var(--teal-dark); }
.live-dot { width: 7px; height: 7px; border-radius: 50%; background: #D64B5F; animation: live-pulse 1.2s infinite; }
.wait-box.now .live-dot { background: var(--teal); }
@keyframes live-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
.wait-num { font-size: 15px; font-weight: 900; color: var(--ink); }
.wait-min { font-size: 12px; font-weight: 700; color: var(--muted); margin-left: auto; }
.my-ticket { display: flex; align-items: center; gap: 10px; background: var(--sky); border-radius: 14px; padding: 12px; }
.ticket-label { font-size: 11px; font-weight: 700; color: var(--muted); }
.ticket-num { font-size: 16px; font-weight: 900; color: var(--teal-dark); }
</style>
