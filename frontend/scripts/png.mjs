// 의존성 없는 최소 PNG 인코더(8-bit RGBA) + 간단 래스터 헬퍼.
// node:zlib 로 IDAT 를 deflate. 텍스처 생성에 사용.
import { deflateSync } from 'node:zlib'

let TABLE = null
function crc32(buf) {
  if (!TABLE) {
    TABLE = new Uint32Array(256)
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; TABLE[n] = c >>> 0 }
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}

export function encodePNG(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) { raw[y * (stride + 1)] = 0; rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride) }
  const idat = deflateSync(raw, { level: 9 })
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// ── 래스터 캔버스 ────────────────────────────────────────────────────
export function canvas(w, h, bg = [0, 0, 0, 255]) {
  const buf = Buffer.alloc(w * h * 4)
  const px = (x, y, c) => {
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return
    const i = (y * w + x) * 4; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = c[3] ?? 255
  }
  const rect = (x, y, rw, rh, c) => { for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) px(xx, yy, c) }
  for (let i = 0; i < w * h; i++) { buf[i * 4] = bg[0]; buf[i * 4 + 1] = bg[1]; buf[i * 4 + 2] = bg[2]; buf[i * 4 + 3] = bg[3] ?? 255 }
  return { w, h, buf, px, rect, png: () => encodePNG(w, h, buf) }
}
const jit = (c, n) => [Math.max(0, Math.min(255, c[0] + ((Math.random() * 2 - 1) * n) | 0)),
  Math.max(0, Math.min(255, c[1] + ((Math.random() * 2 - 1) * n) | 0)),
  Math.max(0, Math.min(255, c[2] + ((Math.random() * 2 - 1) * n) | 0)), 255]

// 석조 벽 + 창문 격자 (대전역)
export function stoneWindows(w = 256, h = 256) {
  const cv = canvas(w, h, [206, 196, 176])
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (Math.random() < 0.25) cv.px(x, y, jit([206, 196, 176], 18))
  const cols = 5, rows = 4, mx = w * 0.09, my = h * 0.12
  const cw = (w - mx * 2) / cols, ch = (h - my * 2) / rows
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = mx + c * cw + cw * 0.18, y = my + r * ch + ch * 0.14
    cv.rect(x | 0, y | 0, (cw * 0.64) | 0, (ch * 0.66) | 0, [66, 78, 92])
    cv.rect(x | 0, (y + ch * 0.32) | 0, (cw * 0.64) | 0, 1, [120, 130, 140]) // 창틀 가로
    cv.rect((x + cw * 0.32) | 0, y | 0, 1, (ch * 0.66) | 0, [120, 130, 140]) // 세로
  }
  cv.rect(0, h - (h * 0.08) | 0, w, (h * 0.08) | 0, [150, 140, 122]) // 기단
  return cv.png()
}

// 유리 커튼월 (우송타워)
export function glassGrid(w = 256, h = 256) {
  const cv = canvas(w, h, [74, 120, 142])
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Math.random() < 0.06) cv.px(x, y, jit([92, 140, 160], 30))
  for (let x = 0; x < w; x += 18) cv.rect(x, 0, 2, h, [150, 178, 190])
  for (let y = 0; y < h; y += 22) cv.rect(0, y, w, 2, [150, 178, 190])
  // 일부 밝은 반사 칸
  for (let i = 0; i < 24; i++) { const gx = ((Math.random() * (w / 18)) | 0) * 18, gy = ((Math.random() * (h / 22)) | 0) * 22; cv.rect(gx + 2, gy + 2, 16, 20, [170, 200, 210]) }
  return cv.png()
}

// 벽화 벽 (대동벽화마을) — 밝은 바탕 + 색 블록 + 창/문
export function muralWall(w = 128, h = 128, base = [230, 210, 180]) {
  const cv = canvas(w, h, base)
  const cols = [[0xE2, 0x72, 0x6b], [0xF2, 0xC5, 0x59], [0x72, 0xae, 0x8c], [0x66, 0x99, 0xc7], [0xC7, 0x8c, 0xbf]]
  for (let i = 0; i < 5; i++) { const c = cols[(Math.random() * cols.length) | 0]; cv.rect((Math.random() * w) | 0, (Math.random() * h) | 0, 10 + (Math.random() * 28), 6 + (Math.random() * 18), [...c, 255]) }
  // 창문·문
  cv.rect((w * 0.2) | 0, (h * 0.32) | 0, (w * 0.22) | 0, (h * 0.24) | 0, [80, 90, 105])
  cv.rect((w * 0.58) | 0, (h * 0.5) | 0, (w * 0.18) | 0, (h * 0.42) | 0, [96, 66, 48]) // 문
  return cv.png()
}
