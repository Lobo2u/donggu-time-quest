import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createServer } from 'vite'

test('시작 화면과 건물 AR 자료 등록 화면을 라우터 안에서 표시한다', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  })

  try {
    const { default: App } = await server.ssrLoadModule('/src/App.vue')
    const { default: Welcome } = await server.ssrLoadModule('/src/screens/WelcomeScreen.vue')
    const { default: BuildingAr } = await server.ssrLoadModule('/src/screens/BuildingArScreen.vue')
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: Welcome },
        { path: '/ar-building', component: BuildingAr },
      ],
    })
    await router.push('/')
    await router.isReady()
    const html = await renderToString(createSSRApp(App).use(router))

    assert.match(html, /TIME QUEST/)
    assert.match(html, /탐험 시작/)
    await router.push('/ar-building')
    const arHtml = await renderToString(createSSRApp(App).use(router))
    assert.match(arHtml, /건물을 무대로/)
    assert.match(arHtml, /실제 건물 자료가 필요합니다/)
    assert.match(arHtml, /건물 명세 JSON 불러오기/)
  } finally {
    await server.close()
  }
})
