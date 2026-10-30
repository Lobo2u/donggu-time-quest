import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Group } from 'three'
import { unzipSync, strFromU8 } from 'three/addons/libs/fflate.module.js'
import { createBuildingStage } from '../src/ar/buildingStage.js'
import { createManifestTemplate, validateManifest } from '../src/ar/manifest.js'
import { evaluateAlignment } from '../src/ar/alignment.js'
import { exportBuildingUSDZ } from '../src/ar/exportUSDZ.js'
import { PerformanceClock } from '../src/ar/timeline.js'
import { fixtureManifest, fixtureAsset, fixtureCapture, fakeAudio } from './fixtures/building.js'

async function readyStage() {
  const manifest = fixtureManifest()
  const audio = fakeAudio()
  const stage = await createBuildingStage(manifest, { loadAsset: async value => fixtureAsset(value), audio })
  const facade = new Group()
  const session = new EventTarget()
  const referenceSpace = new EventTarget()
  stage.bindToFacade({ facadeRoot: facade, sessionId: 'test-session', session, referenceSpace })
  stage.setTracking(true)
  stage.verifyAlignment(fixtureCapture(manifest))
  return { stage, manifest, audio, facade, session, referenceSpace }
}

test('빈 자료나 출처·실측이 없는 건물은 로드하지 않는다', async () => {
  const blank = createManifestTemplate()
  assert.equal(validateManifest(blank).valid, false)
  let loaded = false
  await assert.rejects(createBuildingStage(blank, { loadAsset: async () => { loaded = true } }))
  assert.equal(loaded, false)
  for (const mutate of [m => { m.sources = [] }, m => { m.dimensionsMeters[0] = 0 },
    m => { m.model.glbUrl = 'javascript:alert(1)' }]) {
    const manifest = fixtureManifest()
    mutate(manifest)
    assert.equal(validateManifest(manifest).valid, false)
  }
})

test('정합 검증은 세 관찰 위치의 기준점과 실제 거리 오차를 확인한다', () => {
  const manifest = fixtureManifest()
  const capture = fixtureCapture(manifest, 'test-session', [0.03, 0.04, 0])
  const report = evaluateAlignment(manifest, capture)
  assert.equal(report.passed, true)
  assert.ok(Math.abs(report.rmsMeters - 0.05) < 1e-9)
  capture.samples.pop()
  assert.equal(evaluateAlignment(manifest, capture).passed, false)
  const inaccurate = fixtureCapture(manifest, 'test-session', [0.3, 0, 0])
  assert.equal(evaluateAlignment(manifest, inaccurate).passed, false)
})

test('정합 전에는 공연을 막고 추적 상실 시 정지하며 복구 후 직접 재생한다', async () => {
  const manifest = fixtureManifest()
  const unbound = await createBuildingStage(manifest, { loadAsset: async value => fixtureAsset(value), audio: fakeAudio() })
  try { await assert.rejects(unbound.play(), /정합|외벽/) } finally { unbound.dispose() }
  const { stage, audio } = await readyStage()
  try {
    assert.equal(await stage.play(), true)
    audio.currentTime = 45
    stage.setTracking(false)
    assert.equal(stage.root.visible, false)
    assert.equal(audio.paused, true)
    stage.setTracking(true)
    assert.equal(stage.clock.state, 'paused')
    assert.equal(stage.effects.root.visible, false)
    await stage.play()
    assert.equal(stage.clock.time, 45)
  } finally { stage.dispose() }
})

test('AR 기준 초기화와 세션 종료는 공연만 해제하고 다른 장면을 보존한다', async () => {
  for (const event of ['reset', 'end']) {
    const { stage, facade, session, referenceSpace, audio } = await readyStage()
    const sibling = new Group()
    facade.add(sibling)
    try {
      await stage.play()
      ;(event === 'reset' ? referenceSpace : session).dispatchEvent(new Event(event))
      assert.equal(stage.root.parent, null)
      assert.equal(stage.report, null)
      assert.equal(audio.paused, true)
      assert.equal(sibling.parent, facade)
    } finally { stage.dispose() }
  }
})

test('지연된 오디오 재생 승인이 중지된 공연을 다시 시작하지 않는다', async () => {
  const audio = fakeAudio()
  let release
  audio.play = () => new Promise(resolve => { release = resolve })
  const clock = new PerformanceClock(120, audio)
  const pending = clock.play()
  clock.pause()
  release()
  await pending
  assert.equal(clock.state, 'paused')
  assert.equal(audio.paused, true)
})

test('USDZ는 건물 형상과 미터 좌표만 내보낸다', async () => {
  const { stage } = await readyStage()
  try {
    const bytes = await exportBuildingUSDZ(stage)
    const files = unzipSync(bytes)
    const usd = strFromU8(files['model.usda'])
    assert.match(usd, /metersPerUnit = 1/)
    assert.match(usd, /upAxis = "Y"/)
    assert.doesNotMatch(usd, /timeSamples/)
    assert.equal(Object.keys(files).filter(name => name.startsWith('geometries/')).length, 1)
    assert.equal(stage.report.passed, true)
  } finally { stage.dispose() }
})
