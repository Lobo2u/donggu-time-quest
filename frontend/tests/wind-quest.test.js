import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createServer } from 'vite'

// 「대동의 바람을 찾아서」 — 진행 불변식 + 화면 렌더 검증.
async function withServer(fn) {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try { return await fn(server) } finally { await server.close() }
}

test('부품은 0/3에서 시작하고, 재해결해도 중복 지급되지 않으며, 3개를 모아야 조립이 열린다', async () => {
  await withServer(async (server) => {
    const s = await server.ssrLoadModule('/src/store/windQuestStore.js')
    s.resetQuest()
    assert.equal(s.partsCount(), 0)
    assert.equal(s.allPartsCollected(), false)

    // 벽화마을 해결 → 날개
    s.solveStop('maeul', { reward: 'wing', mode: 'field' })
    assert.equal(s.partsCount(), 1)
    assert.equal(s.isSolved('maeul'), true)
    assert.equal(s.completeMode('maeul'), 'field')

    // 같은 스톱 재해결 → 중복 지급 없음
    s.solveStop('maeul', { reward: 'wing', mode: 'field' })
    assert.equal(s.partsCount(), 1)

    // 아직 3개 미만이면 조립 잠금
    s.solveStop('sky-gate', { reward: 'base', mode: 'field' })
    assert.equal(s.allPartsCollected(), false)

    // 전망대를 사진으로 완료 → 완료 방식 구분 + 3/3
    s.solveStop('view', { reward: 'center', mode: 'photo' })
    assert.equal(s.completeMode('view'), 'photo')
    assert.equal(s.partsCount(), 3)
    assert.equal(s.allPartsCollected(), true)

    s.resetQuest()
    assert.equal(s.partsCount(), 0)
  })
})

test('데이터 파일의 스톱·보상 구성이 기획과 일치한다', async () => {
  await withServer(async (server) => {
    const { WIND_QUEST, WIND_PART_IDS } = await server.ssrLoadModule('/src/data/windQuest.js')
    assert.deepEqual(WIND_QUEST.stops.map(s => s.id), ['maeul', 'sky-gate', 'view'])
    assert.deepEqual(WIND_PART_IDS, ['wing', 'base', 'center'])
    assert.equal(WIND_QUEST.stops[2].type, 'zone-select')
    assert.equal(WIND_QUEST.stops[2].allowPhotoMode, true)
    assert.equal(WIND_QUEST.demo, true) // 답사 자료 전 데모
  })
})

test('허브·스톱·조립 화면이 라우터 안에서 렌더된다', async () => {
  await withServer(async (server) => {
    const Hub = (await server.ssrLoadModule('/src/screens/WindQuestScreen.vue')).default
    const Stop = (await server.ssrLoadModule('/src/screens/WindStopScreen.vue')).default
    const Asm = (await server.ssrLoadModule('/src/screens/WindAssembleScreen.vue')).default
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/wind', component: Hub },
        { path: '/wind/assemble', component: Asm },
        { path: '/wind/:stopId', component: Stop },
      ],
    })
    router.push('/wind/maeul')
    await router.isReady()
    const app = createSSRApp({ template: '<router-view />' })
    app.use(router)
    const html = await renderToString(app)
    assert.match(html, /벽화/)  // 스톱 이름 렌더
  })
})
