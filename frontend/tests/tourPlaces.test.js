import test from 'node:test'
import assert from 'node:assert/strict'
import { TOUR_PLACES, tourPinGroups, tourPinOffset } from '../src/data/tourPlaces.js'
import { LOCATIONS } from '../src/data/gameData.js'

test('five separately sourced visitor places cannot enter four-story progression', () => {
  assert.equal(Object.keys(LOCATIONS).length, 4)
  assert.equal(new Set(TOUR_PLACES.map(p => p.id)).size, 5)
  for (const place of TOUR_PLACES) {
    assert.equal(LOCATIONS[place.id], undefined)
    assert.ok(place.lat > 36.32 && place.lat < 36.35 && place.lng > 127.42 && place.lng < 127.46)
    assert.ok(place.anchor && place.source.startsWith('https://'))
    assert.equal('missionId' in place, false)
  }
})
test('pin clustering and nonoverlapping offsets keep original anchor unchanged', () => {
  const points = [{ x: 100, y: 240 }, { x: 100, y: 255 }, { x: 170, y: 255 }]
  assert.deepEqual(tourPinGroups(points, point => point).map(g => g.length), [2, 1])
  assert.deepEqual(tourPinGroups(points, point => ({ x: point.x * 4, y: point.y * 4 })).map(g => g.length), [1, 1, 1])
  const point = Object.freeze({ x: 100, y: 240 })
  assert.deepEqual(tourPinOffset(point, [{ x: 100, y: 240, rx: 29, ry: 29 }], { x: 390, y: 844 }), [0, -55])
  assert.deepEqual(point, { x: 100, y: 240 })
})
