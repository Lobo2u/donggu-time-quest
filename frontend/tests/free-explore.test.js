import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FREE_EXPLORE, claimDemoBadge, freeExploreProgress, recordDemoCompletion, restoreFreeExplore } from '../src/data/freeExplore.js'
import { LOCATIONS, MISSIONS } from '../src/data/gameData.js'

test('pilot reuses existing distinct places and permission-free mini-games', () => {
  for (const id of Object.keys(FREE_EXPLORE.categories)) {
    assert.equal(LOCATIONS[id].id, id)
    assert.equal(MISSIONS[FREE_EXPLORE.missions[id]].locationId, id)
    assert.notEqual(MISSIONS[FREE_EXPLORE.missions[id]].type, 'field')
  }
})

test('complete the hidden locations before a popular location and earn a single demo badge', () => {
  const first = recordDemoCompletion(undefined, 'indong')
  assert.equal(recordDemoCompletion(first, 'indong'), null)
  const second = recordDemoCompletion(first, 'heredi')
  assert.deepEqual(freeExploreProgress(second).counts, { popular: 0, hidden: 2 })
  assert.equal(claimDemoBadge(second), null)
  const third = recordDemoCompletion(second, 'jungang')
  assert.deepEqual(freeExploreProgress(third).counts, { popular: 1, hidden: 2 })
  const claimed = claimDemoBadge(third)
  assert.equal(freeExploreProgress(claimed).claimed, true)
  assert.equal(claimDemoBadge(claimed), null)
  assert.equal(freeExploreProgress(JSON.parse(JSON.stringify(claimed))).claimed, true)
})

test('extra popular places cannot substitute for hidden places, and thresholds are configurable', () => {
  let state = restoreFreeExplore()
  for (const id of ['jungang', 'sojedom', 'indong']) state = recordDemoCompletion(state, id)
  assert.equal(freeExploreProgress(state).ready, false)
  assert.equal(freeExploreProgress(state, { ...FREE_EXPLORE, targets: { popular: 2, hidden: 1 } }).ready, true)
})

test('invalid, duplicate and legacy field-only records do not count', () => {
  assert.equal(recordDemoCompletion(undefined, '__proto__'), null)
  assert.deepEqual(restoreFreeExplore({ demoCompleted: ['indong', 7, 'fake', 'indong'], demoBadgeClaimed: 1 }), {
    demoCompleted: ['indong'], demoBadgeClaimed: false,
  })
  assert.equal(freeExploreProgress({ locations: { jungang: { missionComplete: true } }, checkIns: { indong: true } }).ready, false)
})

test('the Vue store persists demo progress without touching field, rank, XP or coupons', async () => {
  const legacy = { locations: { jungang: { missionComplete: true } }, checkIns: { indong: true }, player: { xp: 30 }, badges: ['legacy'], coupons: {} }
  const values = new Map([['donggu-tq-v1', JSON.stringify(legacy)]])
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, next) => values.set(key, next), removeItem: key => values.delete(key) }
  try {
    const { game, completeFreeExploreDemo, claimFreeExploreDemoBadge } = await import('../src/store/gameStore.js')
    const { nextTick } = await import('vue')
    game.demoMode = false
    assert.equal(completeFreeExploreDemo('indong'), false)
    assert.equal(claimFreeExploreDemoBadge(), false)
    game.demoMode = true
    for (const id of ['indong', 'heredi', 'sojedom']) assert.equal(completeFreeExploreDemo(id), true)
    assert.equal(claimFreeExploreDemoBadge(), true)
    assert.equal(claimFreeExploreDemoBadge(), false)
    await nextTick()
    const saved = JSON.parse(values.get('donggu-tq-v1'))
    assert.deepEqual(saved.freeExplore, { demoCompleted: ['indong', 'heredi', 'sojedom'], demoBadgeClaimed: true })
    assert.equal(saved.locations.jungang.missionComplete, true)
    assert.equal(saved.locations.indong.missionComplete, false)
    assert.equal(saved.checkIns.indong, true)
    assert.equal(saved.player.xp, 30)
    assert.equal(saved.player.shards, 0)
    assert.deepEqual(saved.badges, ['legacy'])
    assert.deepEqual(saved.coupons, {})
  } finally {
    delete globalThis.localStorage
  }
})
