// 마스코트 이모티콘 스프라이트 내보내기
//   npm run sprites
// 결과: public/sprites/
//   svg/{캐릭터}-{표정}.svg   개별 SVG
//   png/{캐릭터}-{표정}.png   개별 PNG (240×280, 투명 배경)
//   mascot-sheet.svg / .png    스프라이트 시트 (행 = 캐릭터, 열 = 기본 + 표정 6종)
//   mascot-sheet.json          시트 프레임 좌표 (게임 엔진용)
// PNG 는 Playwright(Chromium) 가 있을 때만 만든다.
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createServer } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'public', 'sprites')
const FRAME_W = 240
const FRAME_H = 280

const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })

try {
  const { default: MascotSvg } = await server.ssrLoadModule('/src/components/MascotSvg.vue')
  const { EMOTE_SETS, MASCOTS } = await server.ssrLoadModule('/src/data/emotes.js')

  const render = async (props) => {
    const html = await renderToString(createSSRApp({ render: () => h(MascotSvg, { ...props, animated: false }) }))
    return html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\sdata-v-[a-z0-9]+(="")?/g, '')
      .replace(/\sclass="mascot-svg[^"]*"/, '')
  }

  await rm(outDir, { recursive: true, force: true })
  await mkdir(path.join(outDir, 'svg'), { recursive: true })
  await mkdir(path.join(outDir, 'png'), { recursive: true })

  const frames = []
  const sheetParts = []
  const characters = Object.keys(MASCOTS)

  for (const [row, character] of characters.entries()) {
    const emotes = [{ id: 'idle', label: '기본' }, ...EMOTE_SETS[character]]
    for (const [col, emote] of emotes.entries()) {
      const name = `${character}-${emote.id}`
      const svg = await render({ character, mood: emote.id, size: FRAME_W })
      await writeFile(path.join(outDir, 'svg', `${name}.svg`), `<?xml version="1.0" encoding="UTF-8"?>\n${svg}\n`)

      const x = col * FRAME_W
      const y = row * FRAME_H
      frames.push({ name, character, emote: emote.id, label: emote.label, x, y, w: FRAME_W, h: FRAME_H })
      sheetParts.push(svg.replace('<svg', `<svg x="${x}" y="${y}"`))
    }
  }

  const sheetW = Math.max(...characters.map(c => EMOTE_SETS[c].length + 1)) * FRAME_W
  const sheetH = characters.length * FRAME_H
  const sheetSvg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${sheetH}" viewBox="0 0 ${sheetW} ${sheetH}">\n${sheetParts.join('\n')}\n</svg>\n`
  await writeFile(path.join(outDir, 'mascot-sheet.svg'), sheetSvg)
  await writeFile(path.join(outDir, 'mascot-sheet.json'), JSON.stringify({
    image: 'mascot-sheet.png',
    size: { w: sheetW, h: sheetH },
    frame: { w: FRAME_W, h: FRAME_H },
    frames,
  }, null, 2) + '\n')

  // PNG (선택)
  let chromium = null
  try { ({ chromium } = createRequire(import.meta.url)('playwright')) } catch {}
  if (chromium) {
    const browser = await chromium.launch()
    const page = await browser.newPage()
    const shoot = async (svg, w, h, file) => {
      await page.setViewportSize({ width: w, height: h })
      await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`)
      await page.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } })
    }
    for (const f of frames) {
      const svg = await render({ character: f.character, mood: f.emote, size: FRAME_W })
      await shoot(svg, FRAME_W, FRAME_H, path.join(outDir, 'png', `${f.name}.png`))
    }
    await shoot(sheetSvg.replace(/^<\?xml[^>]*>\n/, ''), sheetW, sheetH, path.join(outDir, 'mascot-sheet.png'))
    await browser.close()
  } else {
    console.warn('playwright 가 없어 PNG 는 건너뜁니다.')
  }

  console.log(`스프라이트 ${frames.length}개 → ${path.relative(root, outDir)}/`)
} finally {
  await server.close()
}
