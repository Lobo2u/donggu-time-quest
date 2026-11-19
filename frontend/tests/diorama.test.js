import test from 'node:test'
import assert from 'node:assert/strict'
import { Box3, Vector3 } from 'three'
import { createDiorama, resolveSceneStyle } from '../src/ar/diorama.js'
import { measureResources } from '../src/ar/assets.js'

test('built-in places get a theme; old uploads and unknown inputs keep the original', () => {
  assert.equal(resolveSceneStyle(undefined, true), 'village')
  assert.equal(resolveSceneStyle(undefined), 'original')
  assert.equal(resolveSceneStyle('original', true), 'original')
  assert.equal(resolveSceneStyle('dusk', true), 'dusk')
  assert.equal(resolveSceneStyle('constructor'), 'original')
  assert.equal(createDiorama('original', { x: 8, z: 4 }), null)
  assert.equal(createDiorama('village', { x: NaN, z: 4 }), null)
})

test('shared ornamental stage follows the model footprint within mobile budget', () => {
  for (const key of ['village', 'dusk']) for (const [x, z] of [[1, 2], [11, 6]]) {
    const stage = createDiorama(key, { x, z })
    const box = new Box3().setFromObject(stage)
    assert.ok(box.min.y < 0 && box.max.y > 0)
    const size = box.getSize(new Vector3())
    assert.ok(size.x > x && size.z > z)
    const resources = measureResources([stage])
    assert.ok(resources.triangles < 6000)
    assert.ok(resources.drawCalls <= 6)
    assert.deepEqual(resources.errors, [])
  }
})

test('daytime and dusk use the same geometry with a distinct palette', () => {
  const size = { x: 12, z: 6 }
  const day = createDiorama('village', size)
  const night = createDiorama('dusk', size)
  assert.deepEqual(new Box3().setFromObject(day), new Box3().setFromObject(night))
  assert.notEqual(day.children[0].material.color.getHex(), night.children[0].material.color.getHex())
})
