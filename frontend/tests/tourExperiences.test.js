import test from 'node:test'
import assert from 'node:assert/strict'
import { TOUR_PLACES } from '../src/data/tourPlaces.js'
import { TOUR_EXPERIENCES, chooseTourStep } from '../src/data/tourExperiences.js'

test('all visitor places have an experience; their position metadata is independent', () => {
  assert.deepEqual(Object.keys(TOUR_EXPERIENCES).sort(), TOUR_PLACES.map(p => p.id).sort())
  assert.equal(TOUR_EXPERIENCES['daedong-maeul'].external, '/daedong-wing-alley-preview.html')
  for (const activity of Object.values(TOUR_EXPERIENCES).filter(value => !value.external)) {
    assert.equal(activity.steps.length, 3)
    assert.equal(new Set(activity.steps.map(step => step[0])).size, 3)
    assert.ok(activity.introduction && activity.observation)
  }
})

test('only the current correct choice reveals a scene and progress stops at three', () => {
  const steps = TOUR_EXPERIENCES.woosong.steps
  assert.equal(chooseTourStep(steps, 0, 2), 0)
  assert.equal(chooseTourStep(steps, 0, 0), 1)
  assert.equal(chooseTourStep(steps, 1, 0), 1)
  assert.equal(chooseTourStep(steps, 1, 1), 2)
  assert.equal(chooseTourStep(steps, 2, 2), 3)
  assert.equal(chooseTourStep(steps, 3, 3), 3)
})