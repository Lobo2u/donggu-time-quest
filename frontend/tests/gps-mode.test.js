import test from 'node:test'
import assert from 'node:assert/strict'
import { game } from '../src/store/gameStore.js'
import { geo, effectivePos, startWatch, stopWatch, clearDemoPos } from '../src/store/geoStore.js'

test('GPS and demo stay separate; denied and late fixes cannot restore stale coordinates', () => {
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator')
 const callbacks=[];const cleared=[]
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{geolocation:{
  watchPosition(ok,fail){callbacks.push({ok,fail});return callbacks.length},
  clearWatch(id){cleared.push(id)},
 }}})
 try {
  game.demoMode=false;geo.demoPos={lat:1,lng:2};geo.pos=null
  assert.equal(effectivePos(),null)
  startWatch();callbacks[0].ok({coords:{latitude:36,longitude:127,accuracy:7}})
  assert.deepEqual(effectivePos(),{lat:36,lng:127})
  game.demoMode=true;assert.deepEqual(effectivePos(),{lat:1,lng:2})
  game.demoMode=false;callbacks[0].fail({code:1})
  assert.equal(geo.error,'denied');assert.equal(effectivePos(),null)
  callbacks[0].ok({coords:{latitude:99,longitude:99}})
  assert.equal(geo.pos,null)
  startWatch({retry:true});callbacks[1].ok({coords:{latitude:36.1,longitude:127.1,accuracy:4}})
  assert.equal(geo.error,null);assert.equal(geo.pos.lat,36.1)
  stopWatch();callbacks[1].ok({coords:{latitude:99,longitude:99}})
  assert.equal(geo.pos,null);assert.ok(cleared.includes(1));assert.ok(cleared.includes(2))
 } finally {
  stopWatch();clearDemoPos();game.demoMode=false
  if(descriptor)Object.defineProperty(globalThis,'navigator',descriptor);else delete globalThis.navigator
 }
})
