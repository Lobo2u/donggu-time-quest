// 지각 해시(perceptual hash) - 같은 구도 사진 인증용
// dHash(가로/세로 밝기 변화) 기반, 외부 라이브러리 없음.
// 조명·약간의 흔들림에 강하고, 구도가 비슷해야 매칭됨.

const SIZE = 9  // dHash: (SIZE)x(SIZE-1) 비교 → 가로 72bit + 세로 72bit = 144bit

let _canvas = null
function canvas() {
  if (!_canvas) _canvas = document.createElement('canvas')
  return _canvas
}

// video/image 요소 → 그레이스케일 축소 픽셀 배열
function grayPixels(sourceEl, w, h) {
  const c = canvas()
  c.width = w; c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })
  // 중앙 정사각형을 잘라서 축소 (구도 일관성)
  const sw = sourceEl.videoWidth || sourceEl.naturalWidth || sourceEl.width
  const sh = sourceEl.videoHeight || sourceEl.naturalHeight || sourceEl.height
  const side = Math.min(sw, sh)
  const sx = (sw - side) / 2, sy = (sh - side) / 2
  ctx.drawImage(sourceEl, sx, sy, side, side, 0, 0, w, h)
  const d = ctx.getImageData(0, 0, w, h).data
  const g = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]
  }
  return g
}

// dHash: 가로 방향 + 세로 방향 밝기 차이 → 비트 배열
export function computeHash(sourceEl) {
  const w = SIZE, h = SIZE
  const g = grayPixels(sourceEl, w, h)
  const bits = []
  // 가로: 각 행에서 인접 픽셀 비교 (h * (w-1))
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w - 1; x++) {
      bits.push(g[y * w + x] < g[y * w + x + 1] ? 1 : 0)
    }
  }
  // 세로: 각 열에서 인접 픽셀 비교 ((h-1) * w)
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h - 1; y++) {
      bits.push(g[y * w + x] < g[(y + 1) * w + x] ? 1 : 0)
    }
  }
  return bits  // 길이 = h*(w-1) + (h-1)*w = 9*8 + 8*9 = 144
}

export function hashToHex(bits) {
  let hex = ''
  for (let i = 0; i < bits.length; i += 4) {
    const nib = (bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | (bits[i + 3] || 0)
    hex += nib.toString(16)
  }
  return hex
}

export function hexToHash(hex) {
  const bits = []
  for (const ch of hex) {
    const n = parseInt(ch, 16)
    bits.push((n >> 3) & 1, (n >> 2) & 1, (n >> 1) & 1, n & 1)
  }
  return bits
}

// 해밍 거리 (다른 비트 수)
export function hamming(a, b) {
  let d = 0
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) d++
  return d
}

// 유사도 0~1 (1=동일)
export function similarity(a, b) {
  const n = Math.min(a.length, b.length) || 1
  return 1 - hamming(a, b) / n
}

// 매칭 임계값 (144bit 중). 같은 구도면 보통 0.9+, 다른 장면은 그 이하.
export const MATCH_THRESHOLD = 0.82
