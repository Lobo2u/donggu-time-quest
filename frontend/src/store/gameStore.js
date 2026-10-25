import { reactive, watch } from 'vue'
import { track } from './statsStore.js'
import { COURSES } from '../data/gameData.js'

const SAVE_KEY = 'donggu-tq-v1'

const defaultState = () => ({
  initialized: false,
  guide: null,       // 'majung' | 'jungang'
  demoMode: true,
  player: { level: 1, xp: 0, shards: 0, nickname: '탐험가' },
  // 미션투어 코스: 완주 보상 수령 여부, 획득 뱃지
  courses: {},       // { [courseId]: { rewardClaimed: bool } }
  badges: [],        // 획득한 완주 뱃지 이름들
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
  // 일일 탐험 보너스
  dailyBonus: { lastClaim: 0, streak: 0 },
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
        player:     { ...base.player,     ...parsed.player },
        locations:  { ...base.locations,  ...parsed.locations },
        buddies:    { ...base.buddies,    ...parsed.buddies },
        checkIns:   { ...base.checkIns,   ...parsed.checkIns },
        dailyBonus: { ...base.dailyBonus, ...parsed.dailyBonus },
        courses:    { ...base.courses,    ...parsed.courses },
        badges:     parsed.badges ?? base.badges,
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
    const firstArrival = !game.locations[locationId].arrivedOnce
    game.locations[locationId].arrivedOnce = true
    if (game.locations[locationId].status === 'available') {
      game.locations[locationId].status = 'in_progress'
    }
    game.activeMission = { locationId }
    if (firstArrival) track('visit', locationId)
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

  // 새 동료 유대 경험치
  addBuddyXp(buddyId, 40)

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
  track('collect', locationId)
}

export function checkInLocation(locationId) {
  if (game.checkIns[locationId] !== undefined) {
    const firstCheckIn = !game.checkIns[locationId]
    game.checkIns[locationId] = true
    // 미션 미완료라면 자동으로 in_progress로 전환
    if (game.locations[locationId]?.status === 'available') {
      game.locations[locationId].status = 'in_progress'
    }
    if (firstCheckIn) track('awaken', locationId)
  }
}

export function addBuddyXp(buddyId, amount) {
  const b = game.buddies[buddyId]
  if (!b) return
  b.owned = true
  b.xp += amount
  while (b.xp >= 100) { b.level += 1; b.xp -= 100 }
}

// ── 일일 탐험 보너스 ──────────────────────────────────────────────────────────
function startOfDay(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime() }

export function canClaimDaily() {
  return startOfDay(game.dailyBonus?.lastClaim ?? 0) < startOfDay(Date.now())
}

export function claimDaily() {
  if (!canClaimDaily()) return null
  const prev = game.dailyBonus.lastClaim
  const yesterday = startOfDay(Date.now()) - 86400000
  const streak = startOfDay(prev) === yesterday ? (game.dailyBonus.streak + 1) : 1
  game.dailyBonus = { lastClaim: Date.now(), streak }
  const reward = 1 + Math.min(streak - 1, 4) // 연속 출석 1~5 조각
  game.player.shards += reward
  return { reward, streak }
}

// ── 버디 능력 강도 (레벨 + 각성) ──────────────────────────────────────────────
// 미션에서 실제로 적용되는 힌트/공개 개수를 반환 (1~3)
const BUDDY_LOCATION = { sojo: 'sojedom', jungja: 'jungang', heomi: 'heredi', indo: 'indong' }

export function isBuddyAwoken(buddyId) {
  return !!game.checkIns?.[BUDDY_LOCATION[buddyId]]
}

export function abilityPower(buddyId) {
  const b = game.buddies[buddyId]
  if (!b || !b.owned) return 0
  let power = 1
  if (b.level >= 3) power += 1        // 버디 레벨 3 이상
  if (isBuddyAwoken(buddyId)) power += 1  // 현장 각성
  return Math.min(power, 3)
}

// 미션 재도전 보상 (중복 조각 없음, 버디 유대 경험치만)
export function replayReward(buddyId) {
  addBuddyXp(buddyId, 25)
  return { xp: 25 }
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

// ── 미션투어 코스 ─────────────────────────────────────────────────────────────
export function courseProgress(courseId) {
  const c = COURSES[courseId]
  if (!c) return { done: 0, total: 0, complete: false, stamps: [] }
  const stamps = c.stops.map(id => ({ id, done: !!game.locations[id]?.missionComplete }))
  const done = stamps.filter(s => s.done).length
  return { done, total: c.stops.length, complete: done === c.stops.length, stamps }
}

export function canClaimCourse(courseId) {
  return courseProgress(courseId).complete && !game.courses[courseId]?.rewardClaimed
}

export function claimCourseReward(courseId) {
  if (!canClaimCourse(courseId)) return null
  const c = COURSES[courseId]
  game.courses[courseId] = { rewardClaimed: true }
  game.player.shards += c.reward.shards
  if (c.reward.badge && !game.badges.includes(c.reward.badge)) game.badges.push(c.reward.badge)
  return c.reward
}

// 리더보드 점수: 조각 + 완주 코스*50 + 동료*20 + 레벨*10
export function playerScore() {
  const completedCourses = Object.keys(COURSES).filter(id => courseProgress(id).complete).length
  const buddies = Object.values(game.buddies).filter(b => b.owned).length
  return game.player.shards * 3 + completedCourses * 50 + buddies * 20 + game.player.level * 10
}

// 데모 리더보드 (실제 서비스에서는 백엔드 집계)
const DEMO_LEADERS = [
  { name: '부산댁', score: 420 }, { name: '동구토박이', score: 380 },
  { name: '여행러버', score: 340 }, { name: '소제동단골', score: 290 },
  { name: '시장탐험가', score: 250 }, { name: '관광온김에', score: 210 },
  { name: '주말나들이', score: 170 }, { name: '첫방문러', score: 120 },
]

export function leaderboard() {
  const me = { name: game.player.nickname || '나', score: playerScore(), isMe: true }
  const all = [...DEMO_LEADERS.map(d => ({ ...d, isMe: false })), me]
  all.sort((a, b) => b.score - a.score)
  return all.map((e, i) => ({ ...e, rank: i + 1 }))
}

export function setNickname(name) {
  game.player.nickname = (name || '').trim().slice(0, 12) || '탐험가'
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
