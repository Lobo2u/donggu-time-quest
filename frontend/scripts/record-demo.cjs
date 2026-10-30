// 사용자 시연 영상 녹화 (약 1분)
// 실제 사람이 쓰는 것처럼 손가락(터치 표시)이 10~30cm/s 속도로 움직이며 탭·드래그한다.
//   1) npm run dev   (http://localhost:5173)
//   2) node scripts/record-demo.cjs <출력폴더>
//   3) mp4 로 변환:
//      ffmpeg -i <출력폴더>/video/*.webm -c:v libx264 -pix_fmt yuv420p -crf 22 demo.mp4
// 화면 속도 기준: CSS 96px = 1인치(2.54cm) → 1cm ≈ 37.8px
const { chromium } = require('playwright')
const fs = require('node:fs')

const OUT = process.argv[2] ?? 'demo'
const URL = 'http://localhost:5173'
const PX_PER_CM = 96 / 2.54
const SPEED_CM_S = [10, 30]
fs.mkdirSync(OUT, { recursive: true })

// 화면에 손가락 위치를 보여 주는 표시 (녹화에는 마우스 커서가 안 찍히므로)
const FINGER_SCRIPT = () => {
  const mk = () => {
    if (document.getElementById('demo-finger')) return
    const f = document.createElement('div')
    f.id = 'demo-finger'
    f.style.cssText = 'position:fixed;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;' +
      'background:rgba(255,255,255,.45);border:2px solid rgba(20,30,45,.55);box-shadow:0 2px 8px rgba(0,0,0,.35);' +
      'pointer-events:none;z-index:2147483647;transition:transform .12s ease, background .12s;transform:translate(210px,700px)'
    document.documentElement.appendChild(f)
    let x = 210, y = 700, down = false
    const place = () => { f.style.transform = `translate(${x}px,${y}px) scale(${down ? 0.78 : 1})` }
    addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; place() }, true)
    addEventListener('mousedown', e => {
      down = true; f.style.background = 'rgba(255,159,28,.6)'; place()
      const r = document.createElement('div')
      r.style.cssText = `position:fixed;left:${e.clientX - 24}px;top:${e.clientY - 24}px;width:48px;height:48px;border-radius:50%;` +
        'border:3px solid rgba(255,159,28,.85);pointer-events:none;z-index:2147483646;transition:transform .45s ease-out, opacity .45s'
      document.documentElement.appendChild(r)
      requestAnimationFrame(() => { r.style.transform = 'scale(1.8)'; r.style.opacity = '0' })
      setTimeout(() => r.remove(), 500)
    }, true)
    addEventListener('mouseup', () => { down = false; f.style.background = 'rgba(255,255,255,.45)'; place() }, true)
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mk); else mk()
}

;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 420, height: 880 },
    permissions: ['geolocation'],
    recordVideo: { dir: OUT + '/video', size: { width: 420, height: 880 } },
  })
  await ctx.addInitScript(FINGER_SCRIPT)
  const p = await ctx.newPage()
  p.on('dialog', d => d.accept())

  const wait = ms => p.waitForTimeout(ms)
  const rand = (a, b) => a + Math.random() * (b - a)
  let cur = { x: 210, y: 700 }

  // 손가락 이동: 10~30cm/s 중 무작위 속도, 가속·감속 곡선
  async function moveTo(x, y) {
    const dist = Math.hypot(x - cur.x, y - cur.y)
    if (dist < 2) return
    const speed = rand(...SPEED_CM_S) * PX_PER_CM // px/s
    const steps = Math.max(3, Math.round((dist / speed) * 60))
    const from = { ...cur }
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
      await p.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e)
      await wait(1000 / 60)
    }
    cur = { x, y }
  }
  async function center(sel) {
    const el = p.locator(sel).first()
    await el.waitFor({ state: 'visible', timeout: 8000 })
    const b = await el.boundingBox()
    return { x: b.x + b.width / 2 + rand(-6, 6), y: b.y + b.height / 2 + rand(-4, 4) }
  }
  async function tap(sel, { before = 250, after = 600 } = {}) {
    const c = await center(sel)
    await moveTo(c.x, c.y)
    await wait(before)
    await p.mouse.down(); await wait(90); await p.mouse.up()
    await wait(after)
  }
  // 드래그: 같은 10~30cm/s 로 손가락을 누른 채 이동
  async function drag(from, to) {
    await moveTo(from.x, from.y)
    await wait(200)
    await p.mouse.down()
    await moveTo(to.x, to.y)
    await wait(150)
    await p.mouse.up()
  }
  const exists = async sel => !!(await p.$(sel))
  const step = async (name, fn) => { try { await fn() } catch (e) { console.log(`!! ${name}: ${e.message.split('\n')[0]}`) } }
  const t0 = Date.now()
  const at = label => console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s  ${label}`)

  // ── 시나리오 (약 1분) ──
  await p.goto(URL + '/')
  await wait(1500)
  at('첫 실행: 지도 + 안내 카드')
  await step('tour', async () => { await tap('.tour-next', { before: 600 }); await tap('.tour-skip', { before: 400, after: 900 }) })

  at('주변 스팟 소제동 선택')
  await step('select', async () => { await tap('.radar-item:has-text("소제동")', { after: 900 }) })
  await step('walk', async () => {
    if (await exists('.btn-walk')) {
      await tap('.btn-walk', { after: 300 })
      await p.waitForSelector('.bottom-sheet .btn-primary', { timeout: 20000 })
      await wait(600)
    }
    at('도착 → 탐험 시작')
    await tap('.bottom-sheet .btn-primary', { after: 1500 })
  })

  at('벽에 붙은 QR 누르기')
  await step('qr', async () => { await tap('.poster', { before: 700, after: 1000 }) })

  at('동반자 고르기')
  await step('pick', async () => {
    await tap('.gp-majung', { after: 500 })
    await tap('.gp-jungang', { after: 700 })
    await tap('.gp-go', { after: 1500 })
  })

  at('안내 대화')
  await step('intro', async () => {
    for (let i = 0; i < 3 && await exists('.story-layer'); i++) { await tap('.story-box', { before: 900, after: 300 }) ; await tap('.story-box', { before: 100, after: 300 }) }
    if (await exists('.story-skip')) await tap('.story-skip', { after: 1200 })
  })

  at('장소 스토리 읽기 + 끌어 올리기')
  await step('story', async () => {
    await wait(2500)
    const box = await p.locator('.ca-story-scroll').boundingBox()
    await drag({ x: box.x + box.width * 0.5, y: box.y + box.height * 0.75 }, { x: box.x + box.width * 0.5, y: box.y + box.height * 0.25 })
    await wait(1500)
    await tap('.ca-skip', { after: 1300 })
  })

  at('현장 미션: 카메라(목업)로 사진 인증')
  await step('mission', async () => {
    await tap('.fq-camera-btn', { before: 800, after: 800 })
    await tap('.shutter-btn', { after: 1300 })
    at('과거 ↔ 현재 비교 손잡이 끌기')
    const stage = await p.locator('.ba-stage').boundingBox()
    const y = stage.y + stage.height / 2
    await drag({ x: stage.x + stage.width * 0.5, y }, { x: stage.x + stage.width * 0.88, y })
    await wait(400)
    await drag({ x: stage.x + stage.width * 0.88, y }, { x: stage.x + stage.width * 0.15, y })
    await wait(700)
    await tap('.ba-btn', { after: 900 })
    await tap('.clue-btn', { before: 1200, after: 800 })
    at('QR 팻말 비추기')
    await tap('.mode-tab:has-text("QR")', { after: 600 })
    await tap('.qr-target', { after: 1500 })
    await tap('.ba-btn', { before: 500, after: 800 })
    await tap('.clue-btn', { before: 800, after: 800 })
    await tap('.qr-target', { after: 1500 })
    await tap('.ba-btn', { before: 400, after: 800 })
    await tap('.clue-btn', { before: 800, after: 1000 })
    at('자물쇠 풀기 3 · 5 · 2')
    await tap('.fq-solve-btn', { after: 900 })
    for (const d of [3, 5, 2]) await tap(`.key:text-is("${d}")`, { before: 150, after: 350 })
    await wait(2600)
  })

  at('끝')
  await wait(1500)
  await ctx.close()
  await browser.close()
  console.log(`total ${((Date.now() - t0) / 1000).toFixed(1)}s`)
})()
