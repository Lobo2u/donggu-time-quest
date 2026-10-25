import { reactive } from 'vue'
import { game } from './gameStore.js'

// 위치/근접 상태 (포켓몬 GO 스타일 핵심)
// 실제 GPS 또는 시연용 가상 위치를 단일 소스로 제공.

export const geo = reactive({
  pos: null,          // 실제 GPS 위치 { lat, lng }
  accuracy: null,     // 정확도(m)
  watching: false,
  error: null,        // 'denied' | 'unavailable' | null
  demoPos: null,      // 시연용 가상 위치 { lat, lng }
  walkedMeters: 0,    // 누적 이동 거리
  walkRewardShards: 0, // 걷기로 받은 조각 누계
  wildSpots: [],      // 야생 시간조각 [{ id, lat, lng }]
})

const WILD_COLLECT_RADIUS = 25 // m
let wildSeq = 0

// 기준 위치 주변에 야생 시간조각 스폰 (반경 40~140m)
export function spawnWildNear(center, count = 3) {
  if (!center) return
  const spots = []
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = 40 + Math.random() * 100 // m
    // 대략적 위경도 오프셋 (1deg lat ≈ 111km)
    const dLat = (dist * Math.cos(angle)) / 111000
    const dLng = (dist * Math.sin(angle)) / (111000 * Math.cos(center.lat * Math.PI / 180))
    spots.push({ id: `wild-${++wildSeq}`, lat: center.lat + dLat, lng: center.lng + dLng })
  }
  geo.wildSpots = spots
}

export function nearestWildDistance() {
  const p = effectivePos()
  if (!p || !geo.wildSpots.length) return Infinity
  return Math.min(...geo.wildSpots.map(w => distanceMeters(p, w)))
}

// 야생 조각 줍기 (반경 안일 때만). 성공 시 보상 조각 수 반환
export function collectWild(id) {
  const p = effectivePos()
  const w = geo.wildSpots.find(s => s.id === id)
  if (!p || !w) return 0
  if (distanceMeters(p, w) > WILD_COLLECT_RADIUS) return 0
  geo.wildSpots = geo.wildSpots.filter(s => s.id !== id)
  game.player.shards += 1
  return 1
}

export { WILD_COLLECT_RADIUS }

let watchId = null
let lastWalkPos = null

// 유효 위치: 시연 위치 우선, 없으면 실제 GPS
export function effectivePos() {
  return geo.demoPos ?? geo.pos
}

export function distanceMeters(a, b) {
  if (!a || !b) return Infinity
  const R = 6371000
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

// 북쪽 기준 방위각 (0=북, 90=동, 180=남, 270=서)
export function bearing(from, to) {
  if (!from || !to) return 0
  const φ1 = from.lat * Math.PI / 180, φ2 = to.lat * Math.PI / 180
  const Δλ = (to.lng - from.lng) * Math.PI / 180
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

export function bearingLabel(deg) {
  const dirs = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']
  return dirs[Math.round(deg / 45) % 8]
}

// 거리 포맷
export function fmtDistance(m) {
  if (m === Infinity) return '위치 확인 중'
  if (m < 1000) return `${Math.round(m)}m`
  return `${(m / 1000).toFixed(1)}km`
}

// ── GPS 추적 ─────────────────────────────────────────────────────────────────
export function startWatch() {
  if (geo.watching || !navigator.geolocation) {
    if (!navigator.geolocation) geo.error = 'unavailable'
    return
  }
  geo.watching = true
  watchId = navigator.geolocation.watchPosition(
    ({ coords }) => {
      geo.error = null
      geo.accuracy = coords.accuracy
      const next = { lat: coords.latitude, lng: coords.longitude }
      // 걷기 거리 누적 (실제 GPS 이동 시)
      if (lastWalkPos) {
        const d = distanceMeters(lastWalkPos, next)
        if (d >= 2 && d < 100) accumulateWalk(d) // 노이즈/점프 필터
      }
      lastWalkPos = next
      geo.pos = next
    },
    (err) => { geo.error = err.code === 1 ? 'denied' : 'unavailable' },
    { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
  )
}

export function stopWatch() {
  if (watchId != null) navigator.geolocation.clearWatch(watchId)
  watchId = null
  geo.watching = false
  lastWalkPos = null
}

// 걷기 거리 → 100m마다 시간 조각 1개
export function accumulateWalk(meters) {
  geo.walkedMeters += meters
  const earned = Math.floor(geo.walkedMeters / 100)
  if (earned > geo.walkRewardShards) {
    const gain = earned - geo.walkRewardShards
    geo.walkRewardShards = earned
    game.player.shards += gain
    return gain
  }
  return 0
}

// ── 시연 모드 위치 제어 ───────────────────────────────────────────────────────
export function setDemoPos(lat, lng) { geo.demoPos = { lat, lng } }
export function clearDemoPos() { geo.demoPos = null }

// 시연: 특정 지점으로 '걸어가기' 애니메이션 (걷기 보상도 적립)
let walkTimer = null
export function simulateWalkTo(target, onArrive) {
  if (walkTimer) clearInterval(walkTimer)
  const start = effectivePos() ?? { lat: target.lat - 0.004, lng: target.lng - 0.004 }
  geo.demoPos = { ...start }
  const steps = 24
  let i = 0
  walkTimer = setInterval(() => {
    i++
    const t = i / steps
    const prev = { ...geo.demoPos }
    geo.demoPos = {
      lat: start.lat + (target.lat - start.lat) * t,
      lng: start.lng + (target.lng - start.lng) * t,
    }
    accumulateWalk(distanceMeters(prev, geo.demoPos))
    if (i >= steps) {
      clearInterval(walkTimer); walkTimer = null
      if (onArrive) onArrive()
    }
  }, 90)
}

// 시연: 즉시 해당 지점에 위치시키기
export function teleportDemo(target) {
  if (walkTimer) { clearInterval(walkTimer); walkTimer = null }
  geo.demoPos = { lat: target.lat, lng: target.lng }
}

// 스팟 도착 여부 (반경 안)
export function isWithin(spot, radiusM) {
  const p = effectivePos()
  if (!p) return false
  return distanceMeters(p, { lat: spot.lat, lng: spot.lng }) <= (radiusM ?? spot.arrivalRadius ?? 100)
}
