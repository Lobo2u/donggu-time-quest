import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { readFileSync } from 'node:fs'

test('shared comparison renders an accessible slider and clips only the before layer', async () => {
 const server=await createServer({server:{middlewareMode:true},appType:'custom'})
 try {
  const C=(await server.ssrLoadModule('/src/components/PhotoComparison.vue')).default
  const html=await renderToString(createSSRApp(C,{ready:true,modelValue:35,beforeLabel:'2007',afterLabel:'2019'}))
  assert.match(html,/inset\(0 65% 0 0\)/);assert.match(html,/type="range"/);assert.match(html,/min="0"/);assert.match(html,/max="100"/);assert.match(html,/사진 비교 경계/)
  const idle=await renderToString(createSSRApp(C,{ready:false}))
  assert.doesNotMatch(idle,/type="range"/)
 } finally {await server.close()}
})
test('both archive and camera reuse comparison, with rights and separate camera entry preserved',()=>{
 const read=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8')
 for(const f of ['screens/CuratedHistoryScreen.vue','screens/HistoryCompareScreen.vue'])assert.match(read(f),/<PhotoComparison v-model="split"/)
 const c=read('screens/CuratedHistoryScreen.vue')
 assert.match(c,/photo.licenseName/);assert.match(c,/photo.source/);assert.match(c,/구도가 달라/);assert.doesNotMatch(c,/getUserMedia|type="file"/)
 assert.match(read('data/curatedPhotos.js'),/13962778896619451840/)
})

test('Git distribution excludes the AWS-only NC-ND photo', async()=>{
 const { CURATED_PHOTOS }=await import('../src/data/curatedPhotos.js')
 assert.equal(CURATED_PHOTOS.sojedom.photos,null)
 assert.equal(CURATED_PHOTOS['daejeon-station'].photos.length,2)
 for(const p of CURATED_PHOTOS['daejeon-station'].photos)assert.match(p.licenseName,/CC BY-SA/)
})
