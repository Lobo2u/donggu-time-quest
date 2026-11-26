import test from 'node:test'
import assert from 'node:assert/strict'
import { muralPreviewUrl } from '../src/data/tourExperiences.js'
import { readFileSync } from 'node:fs'
test('Pages uses the approved public mural without copying assets; AWS remains same-origin', () => {
 assert.equal(muralPreviewUrl('/'), '/daedong-wing-alley-preview.html')
 assert.equal(muralPreviewUrl('/donggu-time-quest/'), 'https://ar.lobodoc.com/daedong-wing-alley-preview.html')
 for (const file of ['MapPlacesPanel.vue', '../screens/TourExperienceScreen.vue']) {
  const source=readFileSync(new URL('../src/components/'+file, import.meta.url),'utf8')
  assert.match(source,/사이트별로 따로 저장/)
 }
})
test('integration preserves upstream wind quest and excludes removed free-explore pilot', () => {
 const source=readFileSync(new URL('../src/router/index.js', import.meta.url),'utf8')
 assert.match(source,/WindQuestScreen/)
 assert.match(source,/KeepsakeScreen/)
 assert.match(source,/HistoryCompareScreen/)
 assert.doesNotMatch(source,/FreeExploreScreen/)
})
