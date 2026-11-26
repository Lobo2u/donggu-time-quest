import test from 'node:test'
import assert from 'node:assert/strict'
import { HISTORY_SPOTS, verifiedAsset } from '../src/data/historySpots.js'

const synthetic = {
  reviewed: true, src: 'history/test-only.png', credit: 'Synthetic fixture',
  sourceUrl: 'https://example.test/source', rightsUrl: 'https://example.test/rights',
  capturedAt: 'Synthetic', viewpoint: 'Not a real location',
}
test('public Soje pilot keeps unapproved archive and restoration disabled', () => {
  const spot = HISTORY_SPOTS['soje-railway-16']
  assert.equal(verifiedAsset(spot, 'archive'), null)
  assert.equal(verifiedAsset(spot, 'restoration'), null)
})
test('reviewed asset registration requires provenance, reuse approval and capture viewpoint', () => {
  for (const field of Object.keys(synthetic)) {
    const asset = { ...synthetic }
    delete asset[field]
    assert.equal(verifiedAsset({ archive: asset }, 'archive'), null, field)
  }
  for (const src of ['https://example.test/photo.png', '../other.png', 'history/../other.png', 'javascript:bad.png']) {
    assert.equal(verifiedAsset({ restoration: { ...synthetic, src } }, 'restoration'), null)
  }
  assert.equal(verifiedAsset({ restoration: synthetic }, 'restoration').src, '/history/test-only.png')
  assert.equal(verifiedAsset({ archive: synthetic }, 'archive').credit, 'Synthetic fixture')
})
