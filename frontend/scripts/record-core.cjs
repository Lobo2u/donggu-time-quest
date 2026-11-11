// 핵심 기능만 시연 녹화 (스토리·대화 없이)
// 핀 지도(웨이팅) → 현장 QR 도착 → AI 과거 복원 미션(사진 인증 · 과거↔현재 · QR 팻말 · 자물쇠)
// → 지도 컬러 복원 → 쿠폰 QR. 손가락은 10~30cm/s 로 움직인다.
//   1) npm run dev   (http://localhost:5173)
//   2) node scripts/record-core.cjs <출력폴더>
//   3) mp4 로 변환:
//      ffmpeg -i <출력폴더>/video/*.webm -c:v libx264 -pix_fmt yuv420p -crf 22 demo.mp4
// 화면 속도 기준: CSS 96px = 1인치(2.54cm) → 1cm ≈ 37.8px
const { chromium } = require('playwright')
const fs = require('node:fs')

const OUT = process.argv[2] ?? 'demo-core'
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
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('dtq-onboarded', '1')
      localStorage.setItem('dtq-install-dismissed', '1')
      if (!localStorage.getItem('donggu-tq-v1')) {
        localStorage.setItem('donggu-tq-v1', JSON.stringify({ initialized: true, guide: 'majung', demoMode: true,
          seenStories: ['intro', 'arrive-sojedom', 'first-win'] }))
      }
    } catch {}
  })
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

  // ── 핵심 기능 시나리오 ──
  await p.goto(URL + '/#/map')
  await wait(1800)
  at('① 검색 없는 핀 지도: 주변 매장 웨이팅')
  await step('store', async () => {
    await tap('.lf-store', { before: 500, after: 1600 })
    await moveTo(330, 260); await p.mouse.down(); await wait(80); await p.mouse.up()   // 지도 빈 곳 눌러 닫기
    await wait(700)
  })

  at('② 소제동으로 이동 → 도착')
  await step('go', async () => {
    await tap('.radar-item:has-text("소제동")', { after: 800 })
    if (await exists('.btn-walk')) {
      await tap('.btn-walk', { after: 300 })
      await p.waitForSelector('.bottom-sheet .btn-primary', { timeout: 20000 })
      await wait(500)
    }
    await tap('.bottom-sheet .btn-primary', { after: 1300 })
  })

  at('③ 현장 벽 QR 로 도착 확인')
  await step('qr', async () => {
    await tap('.poster', { before: 500, after: 900 })
    await tap('.ca-skip', { before: 400, after: 1200 })   // 스토리는 건너뜀
  })

  at('④ AI 과거 복원 미션')
  await step('mission', async () => {
    await tap('.fq-camera-btn', { before: 500, after: 700 })
    await tap('.shutter-btn', { after: 1300 })
    const st = await p.locator('.ba-stage').boundingBox()
    const y = st.y + st.height / 2
    await drag({ x: st.x + st.width * 0.5, y }, { x: st.x + st.width * 0.9, y })
    await wait(300)
    await drag({ x: st.x + st.width * 0.9, y }, { x: st.x + st.width * 0.12, y })
    await wait(500)
    await tap('.ba-btn', { after: 800 })
    await tap('.clue-btn', { before: 600, after: 700 })
    await tap('.mode-tab:has-text("QR")', { after: 500 })
    for (let i = 0; i < 2; i++) {
      await tap('.qr-target', { after: 1500 })
      await tap('.ba-btn', { before: 300, after: 600 })
      await tap('.clue-btn', { before: 400, after: 700 })
    }
    await tap('.fq-solve-btn', { after: 700 })
    for (const d of [3, 5, 2]) await tap(`.key:text-is("${d}")`, { before: 120, after: 300 })
    await wait(1200)
  })

  at('⑤ 기억 복원 완료 → 지도 컬러 복원')
  await step('restore', async () => {
    // 시간 친구 만남(교감 대화)은 건너뛰고 같은 완료 처리만 실행
    await p.waitForURL(/meet/, { timeout: 8000 })
    await p.evaluate(async () => { const m = await import('/src/store/gameStore.js'); m.completeMission('sojedom', 'sojo') })
    await p.evaluate(() => { location.hash = '#/complete' })
    await wait(2200)
    await tap('.cta-btn', { after: 2200 })
  })

  at('⑥ 제휴 매장 쿠폰 QR')
  await step('coupon', async () => {
    await p.evaluate(() => { location.hash = '#/coupon/sojedom' })
    await wait(1200)
    const b = await p.locator('.coupon-screen').boundingBox()
    await moveTo(b.x + b.width / 2, b.y + b.height * 0.6)
    for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, 40); await wait(35) }   // 아래로 스크롤해 QR·바코드
    await wait(2200)
  })

  at('끝')
  await wait(500)
  await ctx.close()
  await browser.close()
  console.log(`total ${((Date.now() - t0) / 1000).toFixed(1)}s`)
})()
