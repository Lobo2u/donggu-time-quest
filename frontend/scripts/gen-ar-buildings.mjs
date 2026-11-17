// 코스 5정류장용 저폴리 입체 건물 GLB 생성기 (Blender 대체 · 의존성 없음).
// glTF 2.0 GLB 를 직접 써서 public/ar/course/<id>/building.glb 로 내보낸다.
// 박스·박공지붕(삼각프리즘)·피라미드 프리미티브를 색상별 머티리얼로 조합.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// ── 프리미티브(로컬 좌표, 바닥 y=0 기준은 호출부에서 offset) ──────────────
// 단위 큐브(-0.5..0.5) 6면, CCW 바깥 방향, 평면 법선용 24정점.
const CUBE = [
  { n: [1, 0, 0], v: [[.5, -.5, .5], [.5, -.5, -.5], [.5, .5, -.5], [.5, .5, .5]] },
  { n: [-1, 0, 0], v: [[-.5, -.5, -.5], [-.5, -.5, .5], [-.5, .5, .5], [-.5, .5, -.5]] },
  { n: [0, 1, 0], v: [[-.5, .5, .5], [.5, .5, .5], [.5, .5, -.5], [-.5, .5, -.5]] },
  { n: [0, -1, 0], v: [[-.5, -.5, -.5], [.5, -.5, -.5], [.5, -.5, .5], [-.5, -.5, .5]] },
  { n: [0, 0, 1], v: [[-.5, -.5, .5], [.5, -.5, .5], [.5, .5, .5], [-.5, .5, .5]] },
  { n: [0, 0, -1], v: [[.5, -.5, -.5], [-.5, -.5, -.5], [-.5, .5, -.5], [.5, .5, -.5]] },
]

function box(sx, sy, sz, cx = 0, cy = 0, cz = 0) {
  const P = [], N = [], I = []
  for (const f of CUBE) {
    const base = P.length / 3
    for (const [x, y, z] of f.v) { P.push(x * sx + cx, y * sy + cy, z * sz + cz); N.push(...f.n) }
    I.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }
  return { P, N, I }
}

// 박공지붕: 밑변 w(x)×d(z), 높이 rh, 용마루는 x축. 바닥 y=0.
function gable(w, d, rh, cx = 0, cy = 0, cz = 0) {
  const P = [], N = [], I = []
  const quad = (a, b, c, dd, n) => {
    const base = P.length / 3
    for (const p of [a, b, c, dd]) { P.push(p[0] + cx, p[1] + cy, p[2] + cz); N.push(...n) }
    I.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }
  const tri = (a, b, c, n) => {
    const base = P.length / 3
    for (const p of [a, b, c]) { P.push(p[0] + cx, p[1] + cy, p[2] + cz); N.push(...n) }
    I.push(base, base + 1, base + 2)
  }
  const hw = w / 2, hd = d / 2
  // 양 끝 삼각형
  tri([hw, 0, hd], [hw, 0, -hd], [hw, rh, 0], [1, 0, 0])
  tri([-hw, 0, -hd], [-hw, 0, hd], [-hw, rh, 0], [-1, 0, 0])
  // 두 경사면
  quad([-hw, 0, hd], [hw, 0, hd], [hw, rh, 0], [-hw, rh, 0], [0, 0.7, 0.7])
  quad([hw, 0, -hd], [-hw, 0, -hd], [-hw, rh, 0], [hw, rh, 0], [0, 0.7, -0.7])
  // 바닥
  quad([-hw, 0, -hd], [hw, 0, -hd], [hw, 0, hd], [-hw, 0, hd], [0, -1, 0])
  return { P, N, I }
}

// 사각뿔(지붕/첨탑): 밑변 w×d, 높이 ph, 바닥 y=0.
function pyramid(w, d, ph, cx = 0, cy = 0, cz = 0) {
  const P = [], N = [], I = []
  const hw = w / 2, hd = d / 2, apex = [0, ph, 0]
  const tri = (a, b, c) => {
    const base = P.length / 3
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2]
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]
    const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const L = Math.hypot(...n) || 1
    for (const p of [a, b, c]) { P.push(p[0] + cx, p[1] + cy, p[2] + cz); N.push(n[0] / L, n[1] / L, n[2] / L) }
    I.push(base, base + 1, base + 2)
  }
  const c0 = [-hw, 0, hd], c1 = [hw, 0, hd], c2 = [hw, 0, -hd], c3 = [-hw, 0, -hd]
  tri(c0, c1, apex); tri(c1, c2, apex); tri(c2, c3, apex); tri(c3, c0, apex)
  return { P, N, I }
}

// ── GLB 빌더 ──────────────────────────────────────────────────────────
function buildGlb(parts) {
  const chunks = []
  let offset = 0
  const bufferViews = [], accessors = [], materials = [], primitives = []
  const matIndex = new Map()

  const align = () => { while (offset % 4) { chunks.push(Buffer.from([0])); offset++ } }
  const addView = (buf, target) => {
    align()
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, target })
    chunks.push(buf); offset += buf.length
    return bufferViews.length - 1
  }
  const material = (color) => {
    const key = color.join(',')
    if (matIndex.has(key)) return matIndex.get(key)
    materials.push({ pbrMetallicRoughness: { baseColorFactor: [...color, 1], metallicFactor: 0, roughnessFactor: 0.85 }, name: key })
    matIndex.set(key, materials.length - 1)
    return materials.length - 1
  }

  for (const { P, N, I, color } of parts) {
    const pos = Buffer.from(new Float32Array(P).buffer)
    const nor = Buffer.from(new Float32Array(N).buffer)
    const idx = Buffer.from(new Uint16Array(I).buffer)
    let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
    for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], P[i + k]); max[k] = Math.max(max[k], P[i + k])
    }
    const vPos = addView(pos, 34962)
    accessors.push({ bufferView: vPos, componentType: 5126, count: P.length / 3, type: 'VEC3', min, max })
    const aPos = accessors.length - 1
    const vNor = addView(nor, 34962)
    accessors.push({ bufferView: vNor, componentType: 5126, count: N.length / 3, type: 'VEC3' })
    const aNor = accessors.length - 1
    const vIdx = addView(idx, 34963)
    accessors.push({ bufferView: vIdx, componentType: 5123, count: I.length, type: 'SCALAR' })
    const aIdx = accessors.length - 1
    primitives.push({ attributes: { POSITION: aPos, NORMAL: aNor }, indices: aIdx, material: material(color) })
  }

  const bin = Buffer.concat(chunks)
  const json = {
    asset: { version: '2.0', generator: 'donggu-tq gen-ar-buildings' },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
    meshes: [{ primitives }], materials, accessors, bufferViews,
    buffers: [{ byteLength: bin.length }],
  }
  let jsonBuf = Buffer.from(JSON.stringify(json), 'utf8')
  while (jsonBuf.length % 4) jsonBuf = Buffer.concat([jsonBuf, Buffer.from(' ')])
  let binBuf = bin
  while (binBuf.length % 4) binBuf = Buffer.concat([binBuf, Buffer.from([0])])

  const header = Buffer.alloc(12)
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4)
  header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + binBuf.length, 8)
  const jsonHeader = Buffer.alloc(8)
  jsonHeader.writeUInt32LE(jsonBuf.length, 0); jsonHeader.writeUInt32LE(0x4e4f534a, 4) // JSON
  const binHeader = Buffer.alloc(8)
  binHeader.writeUInt32LE(binBuf.length, 0); binHeader.writeUInt32LE(0x004e4942, 4) // BIN
  return Buffer.concat([header, jsonHeader, jsonBuf, binHeader, binBuf])
}

const part = (geom, color) => ({ ...geom, color })

// ── 5정류장 저폴리 건물 ───────────────────────────────────────────────
const buildings = {
  // 우송대: 넓은 본관 + 유리 타워 + 입구
  woosong: [
    part(box(8, 6, 6, 0, 3, 0), [0.55, 0.59, 0.64]),
    part(box(3, 11, 3, -3.5, 5.5, -1), [0.24, 0.42, 0.48]),
    part(box(3, 3, 1, 0, 1.5, 3.2), [0.80, 0.82, 0.85]),
    part(box(8.2, 0.4, 6.2, 0, 6.2, 0), [0.30, 0.34, 0.38]),
  ],
  // 대동천: 하천 + 아치 느낌 다리(상판·교각·난간)
  daedongcheon: [
    part(box(12, 0.3, 6, 0, 0.15, 0), [0.23, 0.50, 0.69]),
    part(box(12, 0.5, 1.6, 0, 2.2, 0), [0.69, 0.55, 0.34]),
    part(box(0.9, 2.2, 1.6, -4, 1.1, 0), [0.60, 0.60, 0.62]),
    part(box(0.9, 2.2, 1.6, 4, 1.1, 0), [0.60, 0.60, 0.62]),
    part(box(12, 0.6, 0.15, 0, 2.9, 0.8), [0.78, 0.74, 0.66]),
    part(box(12, 0.6, 0.15, 0, 2.9, -0.8), [0.78, 0.74, 0.66]),
  ],
  // 대동벽화마을: 알록달록 박공집 네 채
  'daedong-maeul': [
    part(box(2.4, 2, 2.4, -2.5, 1, 1.5), [0.88, 0.69, 0.62]),
    part(gable(2.6, 2.6, 1.1, -2.5, 2, 1.5), [0.72, 0.36, 0.30]),
    part(box(2.4, 2.4, 2.4, 1, 1.2, 0), [0.78, 0.84, 0.63]),
    part(gable(2.6, 2.6, 1.1, 1, 2.4, 0), [0.45, 0.55, 0.35]),
    part(box(2.2, 1.8, 2.2, 3, 0.9, 2.2), [0.63, 0.77, 0.84]),
    part(gable(2.4, 2.4, 1, 3, 1.8, 2.2), [0.30, 0.47, 0.58]),
    part(box(10, 0.3, 7, 0, 0.15, 0.8), [0.52, 0.49, 0.45]),
  ],
  // 대동하늘공원: 언덕 + 전망 파빌리온(기둥+지붕)
  'daedong-sky': [
    part(box(9, 1.2, 9, 0, 0.6, 0), [0.42, 0.56, 0.31]),
    part(box(4.4, 0.3, 4.4, 0, 1.35, 0), [0.79, 0.71, 0.56]),
    part(box(0.3, 2.4, 0.3, -1.8, 2.55, -1.8), [0.85, 0.82, 0.75]),
    part(box(0.3, 2.4, 0.3, 1.8, 2.55, -1.8), [0.85, 0.82, 0.75]),
    part(box(0.3, 2.4, 0.3, -1.8, 2.55, 1.8), [0.85, 0.82, 0.75]),
    part(box(0.3, 2.4, 0.3, 1.8, 2.55, 1.8), [0.85, 0.82, 0.75]),
    part(pyramid(5, 5, 1.8, 0, 3.75, 0), [0.54, 0.35, 0.24]),
  ],
  // 대전역: 긴 역사 + 붉은 지붕 + 시계탑
  'daejeon-station': [
    part(box(11, 4, 4, 0, 2, 0), [0.84, 0.80, 0.74]),
    part(box(11.4, 0.7, 4.4, 0, 4.35, 0), [0.55, 0.24, 0.20]),
    part(box(2.2, 8, 2.2, -4, 4, 0.6), [0.76, 0.71, 0.63]),
    part(box(1.4, 1.4, 0.3, -4, 6.6, 1.75), [0.15, 0.15, 0.18]),
    part(pyramid(2.6, 2.6, 1.4, -4, 8, 0.6), [0.42, 0.20, 0.17]),
    part(box(9, 0.3, 2, 0, 3.4, 2.6), [0.70, 0.72, 0.74]),
  ],
}

for (const [id, parts] of Object.entries(buildings)) {
  const out = resolve(ROOT, 'public', 'ar', 'course', id, 'building.glb')
  mkdirSync(dirname(out), { recursive: true })
  const glb = buildGlb(parts)
  writeFileSync(out, glb)
  console.log(`✓ ${id}: ${(glb.length / 1024).toFixed(1)} KB (${parts.length} parts)`)
}
console.log('done')
