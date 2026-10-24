import { reactive, watch } from 'vue'

const SAVE_KEY = 'donggu-tq-v1'

const defaultState = () => ({
  initialized: false,
  guide: null,       // 'majung' | 'jungang'
  demoMode: true,
  player: { level: 1, xp: 0, shards: 0 },
  locations: {
    sojedom: { status: 'available', missionComplete: false, arrivedOnce: false },
    jungang: { status: 'locked',    missionComplete: false, arrivedOnce: false },
    heredi:  { status: 'locked',    missionComplete: false, arrivedOnce: false },
    indong:  { status: 'locked',    missionComplete: false, arrivedOnce: false },
  },
  buddies: {
    sojo:   { owned: false, level: 1, xp: 0 },
    jungja: { owned: false, level: 1, xp: 0 },
    heomi:  { owned: false, level: 1, xp: 0 },
    indo:   { owned: false, level: 1, xp: 0 },
  },
  // QR 체크인 (현장 방문 인증)
  checkIns: {
    sojedom: false,
    jungang: false,
    heredi:  false,
    indong:  false,
  },
  // persisted mid-mission state
  activeMission: null, // { locationId } | null
  lastReward: null,    // { buddyId, xpGained, shardsGained, leveledUp }
})

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const base = defaultState()
      return {
        ...base,
        ...parsed,
        player:    { ...base.player,    ...parsed.player },
        locations: { ...base.locations, ...parsed.locations },
        buddies:   { ...base.buddies,   ...parsed.buddies },
        checkIns:  { ...base.checkIns,  ...parsed.checkIns },
      }
    }
  } catch {}
  return defaultState()
}

export const game = reactive(loadSave())

// Auto-save on any change
watch(
  () => JSON.stringify(game),
  (v) => { try { localStorage.setItem(SAVE_KEY, v) } catch {} },
  { deep: true },
)

// ── Actions ─────────────────────────────────────────────────────────────────

export function initPlayer(guide) {
  game.guide = guide
  game.initialized = true
  game.locations.sojedom.status = 'available'
}

export function markArrived(locationId) {
  if (game.locations[locationId]) {
    game.locations[locationId].arrivedOnce = true
    if (game.locations[locationId].status === 'available') {
      game.locations[locationId].status = 'in_progress'
    }
    game.activeMission = { locationId }
  }
}

export function completeMission(locationId, buddyId) {
  const loc = game.locations[locationId]
  if (!loc || loc.missionComplete) return

  const prevLevel = game.player.level
  loc.missionComplete = true
  loc.status = 'complete'
  game.buddies[buddyId].owned = true
  game.activeMission = null

  // XP + shards
  const xpGained = 50
  const shardsGained = 1
  game.player.shards += shardsGained
  game.player.xp += xpGained
  let leveledUp = false
  if (game.player.xp >= 100) {
    game.player.level += 1
    game.player.xp -= 100
    leveledUp = true
  }

  // Unlock next location
  if (locationId === 'sojedom') game.locations.jungang.status = 'available'
  if (locationId === 'jungang') game.locations.heredi.status = 'available'
  if (locationId === 'heredi')  game.locations.indong.status = 'available'

  game.lastReward = { buddyId, xpGained, shardsGained, leveledUp }
}

export function checkInLocation(locationId) {
  if (game.checkIns[locationId] !== undefined) {
    game.checkIns[locationId] = true
    // 미션 미완료라면 자동으로 in_progress로 전환
    if (game.locations[locationId]?.status === 'available') {
      game.locations[locationId].status = 'in_progress'
    }
  }
}

export function addBuddyXp(buddyId, amount) {
  const b = game.buddies[buddyId]
  if (!b || !b.owned) return
  b.xp += amount
  if (b.xp >= 100) { b.level += 1; b.xp -= 100 }
}

export function resetGame() {
  const fresh = defaultState()
  Object.keys(fresh).forEach(k => { game[k] = fresh[k] })
  try { localStorage.removeItem(SAVE_KEY) } catch {}
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function locationStatus(id) {
  return game.locations[id]?.status ?? 'locked'
}

export function ownedBuddies() {
  return Object.values(game.buddies).filter(b => b.owned)
}

// Haversine distance in meters
export function distanceTo(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
