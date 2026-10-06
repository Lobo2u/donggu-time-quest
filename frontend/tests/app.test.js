import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createServer } from 'vite'

test('초기 화면에 개발환경 확인 문구를 표시한다', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  })

  try {
    const { default: App } = await server.ssrLoadModule('/src/App.vue')
    const html = await renderToString(createSSRApp(App))

    assert.match(html, /<main\b/)
    assert.match(html, /<h1>동구 TIME QUEST 개발환경 정상 작동<\/h1>/)
  } finally {
    await server.close()
  }
})
