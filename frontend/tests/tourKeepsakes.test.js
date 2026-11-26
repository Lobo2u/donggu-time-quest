import test from 'node:test'
import assert from 'node:assert/strict'
import { earnKeepsake, readKeepsakes, windmillStage } from '../src/data/tourKeepsakes.js'
const memory = () => {
  const map = new Map()
  return { getItem: key => map.get(key), setItem: (key, value) => map.set(key, value) }
}
test('local rewards are unique and unlisted locations never count', () => {
 const storage = memory()
 earnKeepsake(storage, 'daejeon-station')
 earnKeepsake(storage, 'daejeon-station')
 assert.equal(earnKeepsake(storage, 'unknown'), false)
 assert.deepEqual(readKeepsakes(storage).map(item => item.id), ['daejeon-station'])
 assert.deepEqual(windmillStage(readKeepsakes(storage)), {blades:false,body:false,complete:false})
})
test('only the two Daedong pieces assemble the windmill in either order', () => {
 for(const order of [['daedong-sky','daedong-maeul'],['daedong-maeul','daedong-sky']]) {
   const storage=memory()
   earnKeepsake(storage, order[0])
   assert.equal(windmillStage(readKeepsakes(storage)).complete, false)
   earnKeepsake(storage, order[1])
   assert.deepEqual(windmillStage(readKeepsakes(storage)), {blades:true,body:true,complete:true})
 }
})
test('blocked browser storage is reported without crashing', () => {
 assert.equal(earnKeepsake(null,'daedong-sky'), false)
 assert.deepEqual(readKeepsakes(null), [])
})
