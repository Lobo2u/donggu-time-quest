// 코스 5정류장 입체 건물 GLB 생성기 (Blender 대체 · 의존성 없음).
// 실제 자료 조사를 반영한 저폴리 재현:
//  - 대전역: 1920년대 석조 역사(좌우대칭·중앙현관·시계·붉은지붕·기둥)
//  - 대동벽화마을: 한국전쟁 달동네(계단식 비탈 + 다닥다닥 집 + 벽화색 + 계단)
//  - 대동하늘공원: 상징 붉은 풍차(날개) + 데크·정자·사랑바위
//  - 우송대: 우송타워(고층) + 엔디컷관(컨테이너 적층)
//  - 대동천: 하천 + 다리 + 둔치 + 징검다리
// glTF 2.0 GLB 를 직접 작성. 머티리얼은 doubleSide 로 설정해 와인딩에 강건.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stoneWindows, glassGrid, muralWall } from './png.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// ── 지오메트리 헬퍼(평면 법선 자동 계산) ─────────────────────────────
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
function faceNormal(a, b, c) {
  const u = sub(b, a), v = sub(c, a)
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const L = Math.hypot(...n) || 1
  return [n[0] / L, n[1] / L, n[2] / L]
}
const TRI_UV = [[0, 0], [1, 0], [0.5, 1]]
const QUAD_UV = [[0, 1], [1, 1], [1, 0], [0, 0]]
function addTri(g, a, b, c, n = faceNormal(a, b, c), uv = TRI_UV) {
  const base = g.P.length / 3
  const v = [a, b, c]
  for (let i = 0; i < 3; i++) { g.P.push(...v[i]); g.N.push(...n); g.U.push(...uv[i]) }
  g.I.push(base, base + 1, base + 2)
}
function addQuad(g, a, b, c, d, n = faceNormal(a, b, c), uv = QUAD_UV) {
  const base = g.P.length / 3
  const v = [a, b, c, d]
  for (let i = 0; i < 4; i++) { g.P.push(...v[i]); g.N.push(...n); g.U.push(...uv[i]) }
  g.I.push(base, base + 1, base + 2, base, base + 2, base + 3)
}
const newGeom = () => ({ P: [], N: [], I: [], U: [] })

// 단위 큐브 6면(CCW 바깥)
const CUBE_FACES = [
  [[.5, -.5, .5], [.5, -.5, -.5], [.5, .5, -.5], [.5, .5, .5]],
  [[-.5, -.5, -.5], [-.5, -.5, .5], [-.5, .5, .5], [-.5, .5, -.5]],
  [[-.5, .5, .5], [.5, .5, .5], [.5, .5, -.5], [-.5, .5, -.5]],
  [[-.5, -.5, -.5], [.5, -.5, -.5], [.5, -.5, .5], [-.5, -.5, .5]],
  [[-.5, -.5, .5], [.5, -.5, .5], [.5, .5, .5], [-.5, .5, .5]],
  [[.5, -.5, -.5], [-.5, -.5, -.5], [-.5, .5, -.5], [.5, .5, -.5]],
]
function box(sx, sy, sz, cx = 0, cy = 0, cz = 0) {
  const g = newGeom()
  for (const f of CUBE_FACES) addQuad(g, ...f.map(p => [p[0] * sx + cx, p[1] * sy + cy, p[2] * sz + cz]))
  return g
}

// 박공지붕(용마루 x축, 바닥 y=0)
function gable(w, d, rh, cx = 0, cy = 0, cz = 0) {
  const g = newGeom(), hw = w / 2, hd = d / 2
  const o = p => [p[0] + cx, p[1] + cy, p[2] + cz]
  addTri(g, o([hw, 0, hd]), o([hw, 0, -hd]), o([hw, rh, 0]))
  addTri(g, o([-hw, 0, -hd]), o([-hw, 0, hd]), o([-hw, rh, 0]))
  addQuad(g, o([-hw, 0, hd]), o([hw, 0, hd]), o([hw, rh, 0]), o([-hw, rh, 0]))
  addQuad(g, o([hw, 0, -hd]), o([-hw, 0, -hd]), o([-hw, rh, 0]), o([hw, rh, 0]))
  addQuad(g, o([-hw, 0, -hd]), o([hw, 0, -hd]), o([hw, 0, hd]), o([-hw, 0, hd]))
  return g
}

// 원기둥/원뿔(rT=0 이면 원뿔). 바닥 y=0.
function cylinder(rT, rB, h, seg, cx = 0, cy = 0, cz = 0) {
  const g = newGeom()
  const ring = (r, y) => Array.from({ length: seg }, (_, i) => {
    const a = (i / seg) * Math.PI * 2; return [Math.cos(a) * r, y, Math.sin(a) * r]
  })
  const bot = ring(rB, 0), top = ring(rT, h)
  for (let i = 0; i < seg; i++) {
    const j = (i + 1) % seg
    if (rT > 1e-6) addQuad(g, bot[i], bot[j], top[j], top[i])
    else addTri(g, bot[i], bot[j], [0, h, 0])
  }
  if (rB > 1e-6) for (let i = 1; i < seg - 1; i++) addTri(g, bot[0], bot[i + 1], bot[i])
  if (rT > 1e-6) for (let i = 1; i < seg - 1; i++) addTri(g, top[0], top[i], top[i + 1])
  for (let k = 0; k < g.P.length; k += 3) { g.P[k] += cx; g.P[k + 1] += cy; g.P[k + 2] += cz }
  return g
}

// 변환(법선도 회전)
function rotateZ(g, a) {
  const c = Math.cos(a), s = Math.sin(a)
  for (const arr of [g.P, g.N]) for (let k = 0; k < arr.length; k += 3) {
    const x = arr[k], y = arr[k + 1]; arr[k] = x * c - y * s; arr[k + 1] = x * s + y * c
  }
  return g
}
function rotateY(g, a) {
  const c = Math.cos(a), s = Math.sin(a)
  for (const arr of [g.P, g.N]) for (let k = 0; k < arr.length; k += 3) {
    const x = arr[k], z = arr[k + 2]; arr[k] = x * c + z * s; arr[k + 2] = -x * s + z * c
  }
  return g
}
function rotateX(g, a) {
  const c = Math.cos(a), s = Math.sin(a)
  for (const arr of [g.P, g.N]) for (let k = 0; k < arr.length; k += 3) {
    const y = arr[k + 1], z = arr[k + 2]; arr[k + 1] = y * c - z * s; arr[k + 2] = y * s + z * c
  }
  return g
}
function translate(g, dx, dy, dz) {
  for (let k = 0; k < g.P.length; k += 3) { g.P[k] += dx; g.P[k + 1] += dy; g.P[k + 2] += dz }
  return g
}

// ── GLB 빌더 (텍스처 임베드 지원) ─────────────────────────────────────
function buildGlb(parts, texture) {
  const chunks = []; let offset = 0
  const bufferViews = [], accessors = [], materials = [], primitives = []
  const images = [], textures = [], samplers = []
  const matIndex = new Map()
  const align = () => { while (offset % 4) { chunks.push(Buffer.from([0])); offset++ } }
  const addView = (buf, target) => {
    align(); const bv = { buffer: 0, byteOffset: offset, byteLength: buf.length }
    if (target) bv.target = target
    bufferViews.push(bv); chunks.push(buf); offset += buf.length; return bufferViews.length - 1
  }
  // 텍스처(실제 사진 JPG/PNG 또는 절차적 PNG) 임베드
  let texIndex = -1
  if (texture) {
    const iv = addView(texture.data)
    images.push({ bufferView: iv, mimeType: texture.mime })
    samplers.push({ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 })
    textures.push({ source: 0, sampler: 0 })
    texIndex = 0
  }
  const material = (color, tex) => {
    const key = tex ? 'TEX' : color.join(',')
    if (matIndex.has(key)) return matIndex.get(key)
    const pbr = { metallicFactor: 0, roughnessFactor: 0.85 }
    if (tex) { pbr.baseColorFactor = [1, 1, 1, 1]; pbr.baseColorTexture = { index: texIndex } }
    else pbr.baseColorFactor = [...color, 1]
    materials.push({ pbrMetallicRoughness: pbr, doubleSided: true, name: key })
    matIndex.set(key, materials.length - 1); return materials.length - 1
  }
  for (const { P, N, I, U, color, tex } of parts) {
    const useTex = tex && texIndex >= 0
    const pos = Buffer.from(new Float32Array(P).buffer)
    const nor = Buffer.from(new Float32Array(N).buffer)
    const idx = Buffer.from(new Uint16Array(I).buffer)
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
    for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], P[i + k]); max[k] = Math.max(max[k], P[i + k]) }
    const vPos = addView(pos, 34962); accessors.push({ bufferView: vPos, componentType: 5126, count: P.length / 3, type: 'VEC3', min, max }); const aPos = accessors.length - 1
    const vNor = addView(nor, 34962); accessors.push({ bufferView: vNor, componentType: 5126, count: N.length / 3, type: 'VEC3' }); const aNor = accessors.length - 1
    const vIdx = addView(idx, 34963); accessors.push({ bufferView: vIdx, componentType: 5123, count: I.length, type: 'SCALAR' }); const aIdx = accessors.length - 1
    const attributes = { POSITION: aPos, NORMAL: aNor }
    if (useTex) {
      const uv = Buffer.from(new Float32Array(U).buffer)
      const vUv = addView(uv, 34962); accessors.push({ bufferView: vUv, componentType: 5126, count: U.length / 2, type: 'VEC2' }); attributes.TEXCOORD_0 = accessors.length - 1
    }
    primitives.push({ attributes, indices: aIdx, material: material(color, useTex) })
  }
  const bin = Buffer.concat(chunks)
  const json = {
    asset: { version: '2.0', generator: 'donggu-tq gen-ar-buildings' },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
    meshes: [{ primitives }], materials, accessors, bufferViews, buffers: [{ byteLength: bin.length }],
    ...(images.length ? { images, textures, samplers } : {}),
  }
  let jsonBuf = Buffer.from(JSON.stringify(json), 'utf8')
  while (jsonBuf.length % 4) jsonBuf = Buffer.concat([jsonBuf, Buffer.from(' ')])
  let binBuf = bin
  while (binBuf.length % 4) binBuf = Buffer.concat([binBuf, Buffer.from([0])])
  const header = Buffer.alloc(12)
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + binBuf.length, 8)
  const jh = Buffer.alloc(8); jh.writeUInt32LE(jsonBuf.length, 0); jh.writeUInt32LE(0x4e4f534a, 4)
  const bh = Buffer.alloc(8); bh.writeUInt32LE(binBuf.length, 0); bh.writeUInt32LE(0x004e4942, 4)
  return Buffer.concat([header, jh, jsonBuf, bh, binBuf])
}

const P = (geom, color, tex = false) => ({ ...geom, color, tex })

// ── 색상 팔레트 ───────────────────────────────────────────────────────
const C = {
  stone: [0.82, 0.78, 0.70], stoneDk: [0.72, 0.68, 0.60], redRoof: [0.55, 0.24, 0.20], redRoofDk: [0.45, 0.19, 0.16],
  dark: [0.15, 0.15, 0.18], glass: [0.32, 0.5, 0.58], glassLt: [0.55, 0.72, 0.78], crown: [0.8, 0.84, 0.88],
  ground: [0.58, 0.6, 0.58], soil: [0.52, 0.47, 0.42], grass: [0.42, 0.56, 0.31], deck: [0.80, 0.72, 0.56],
  water: [0.23, 0.5, 0.69], bank: [0.5, 0.55, 0.4], wood: [0.69, 0.55, 0.34], concrete: [0.6, 0.6, 0.62],
  windmill: [0.74, 0.3, 0.26], windmillDk: [0.5, 0.2, 0.18], blade: [0.93, 0.9, 0.82], rock: [0.6, 0.6, 0.63],
  pillar: [0.85, 0.82, 0.75],
  panel: [0.9, 0.91, 0.92], panelDk: [0.76, 0.78, 0.8], dglass: [0.22, 0.32, 0.4], signBlue: [0.12, 0.33, 0.62],
  steel: [0.28, 0.3, 0.34], roofGreen: [0.3, 0.55, 0.42], roofOrange: [0.82, 0.45, 0.25], roofBlue: [0.35, 0.6, 0.72],
  tower: [0.86, 0.87, 0.88],
}
// 벽화마을 알록달록 벽 색
const MURAL = [[0.88, 0.45, 0.42], [0.95, 0.78, 0.35], [0.45, 0.68, 0.55], [0.4, 0.6, 0.78], [0.78, 0.55, 0.75], [0.9, 0.6, 0.35], [0.55, 0.72, 0.4]]

// 파사드 박스: 정면(+Z)에만 사진 텍스처, 나머지 면은 단색(왜곡 방지).
// 본체(단색 박스) + 정면 사진 쿼드(살짝 앞으로) 두 파트를 돌려준다.
function facadeBox(sx, sy, sz, cx, cy, cz, bodyColor) {
  const body = box(sx, sy, sz, cx, cy, cz)
  const g = newGeom()
  const hx = sx / 2, hy = sy / 2, z = cz + sz / 2 + 0.02
  addQuad(g, [cx - hx, cy - hy, z], [cx + hx, cy - hy, z], [cx + hx, cy + hy, z], [cx - hx, cy + hy, z])
  return [P(body, bodyColor, false), P(g, [1, 1, 1], true)]
}

// 작은 집(벽 + 박공지붕). texWall=true 면 정면에만 벽화 텍스처.
function house(w, h, d, cx, cy, cz, wallColor, roofColor = C.redRoof, texWall = false) {
  const wall = texWall ? facadeBox(w, h, d, cx, cy + h / 2, cz, wallColor) : [P(box(w, h, d, cx, cy + h / 2, cz), wallColor)]
  return [...wall, P(gable(w + 0.2, d + 0.2, h * 0.5, cx, cy + h, cz), roofColor)]
}
// 풍차 날개 4개(허브 앞면)
function windmillBlades(hx, hy, hz) {
  const out = []
  for (let i = 0; i < 4; i++) {
    const blade = box(3.2, 0.45, 0.12, 1.7, 0, 0) // 허브에서 바깥으로 뻗음
    rotateZ(blade, (Math.PI / 4) + i * (Math.PI / 2))
    translate(blade, hx, hy, hz)
    out.push(P(blade, C.blade))
  }
  out.push(P(cylinder(0.3, 0.3, 0.4, 8, hx, hy - 0.2, hz - 0.15), C.windmillDk)) // 허브
  return out
}
// 기둥 콜로네이드
function columns(n, spacing, r, h, x0, y, z) {
  const out = []
  for (let i = 0; i < n; i++) out.push(P(cylinder(r, r, h, 8, x0 + i * spacing, y, z), C.pillar))
  return out
}
// 나무(줄기 + 원뿔 잎)
function tree(x, z, h = 2.4, s = 1) {
  return [
    P(cylinder(0.12 * s, 0.16 * s, h * 0.4, 6, x, 0, z), [0.42, 0.3, 0.2]),
    P(cylinder(0, 0.8 * s, h * 0.8, 8, x, h * 0.35, z), [0.26, 0.46, 0.28]),
    P(cylinder(0, 0.6 * s, h * 0.6, 8, x, h * 0.62, z), [0.3, 0.52, 0.32]),
  ]
}
// 가로 띠창(앞면) — 여러 층 어두운 창 띠
function winStrips(w, cx, cz, yBase, rows, step, color = [0.32, 0.42, 0.5]) {
  const out = []
  for (let i = 0; i < rows; i++) out.push(P(box(w, 0.5, 0.1, cx, yBase + i * step, cz), color))
  return out
}
// 코스모스 꽃밭(줄기 + 분홍/흰 꽃)
function cosmos(n = 16) {
  const out = [], cols = [[0.9, 0.5, 0.7], [0.96, 0.82, 0.88], [0.86, 0.4, 0.55]]
  for (let i = 0; i < n; i++) {
    const x = -7.5 + Math.random() * 15, z = 2.3 + Math.random() * 2.4
    out.push(P(box(0.08, 0.5, 0.08, x, 0.55, z), [0.3, 0.5, 0.3]))
    out.push(P(box(0.26, 0.12, 0.26, x, 0.85, z), cols[(Math.random() * 3) | 0]))
  }
  return out
}

// ── 5정류장 ───────────────────────────────────────────────────────────
const buildings = {
  // 우송대: 언덕 위 흰 고층 타워(계단형 상부·창 띠) + 정문 돌기둥·차단바 + 안내판(실사진) + 나무
  woosong: [
    P(box(15, 0.3, 11, 0, 0.15, 0), C.ground),
    P(box(10, 1.2, 5, -1, 0.6, -3.5), C.grass),           // 뒤쪽 언덕
    P(box(5, 13, 4.5, -1, 7.7, -3.5), C.tower),           // 타워 본체(언덕 위)
    P(box(3.4, 1.8, 3.2, -1, 15.1, -3.5), C.tower),       // 계단형 상부
    P(box(5.4, 0.6, 4.9, -1, 1.3, -3.5), C.panelDk),      // 하단 띠
    ...winStrips(4.4, -1, -1.19, 2.4, 7, 1.5, C.dglass),  // 전면 창 띠
    // 정문 돌기둥 2 + 상단 캡 + 차단바
    P(box(0.8, 3.4, 0.8, -4.2, 1.7, 3.4), C.panelDk),
    P(box(1.0, 0.4, 1.0, -4.2, 3.5, 3.4), C.panel),
    P(box(0.8, 3.4, 0.8, 2.2, 1.7, 3.4), C.panelDk),
    P(box(1.0, 0.4, 1.0, 2.2, 3.5, 3.4), C.panel),
    P(box(5.6, 0.18, 0.18, -1, 2.0, 3.4), C.roofOrange),
    // 서캠퍼스 안내판(실사진)
    ...facadeBox(5.2, 2.6, 0.3, 4.8, 1.3, 2.5, C.panel),
    ...tree(-5.8, 2.6, 2.8), ...tree(5.0, -2, 3.0), ...tree(-6.2, -1, 2.4),
  ],
  // 대전역: 현대 역사 — 좌측 흰 패널동(띠창) + 중앙 현관(실사진)+파란 간판 + 우측 경사 유리 콘코스 + 캐노피
  'daejeon-station': [
    P(box(20, 0.3, 8, 0, 0.15, 0), C.ground),
    // 좌측 흰 패널동
    P(box(7, 4, 5, -6.5, 2, -0.3), C.panel),
    ...winStrips(6.2, -6.5, 2.26, 1.4, 3, 1.1, C.dglass),
    P(box(7.2, 0.4, 5.2, -6.5, 4.1, -0.3), C.panelDk),
    // 중앙 현관동(실사진) + 파란 간판
    ...facadeBox(5.5, 4.8, 5, -1, 2.4, 0.2, C.panel),
    P(box(5.7, 0.9, 0.35, -1, 5.3, 2.75), C.signBlue),
    // 우측 경사 유리 콘코스
    P(box(7, 5, 5, 5, 2.5, -0.4), C.panelDk),
    P(translate(rotateX(box(7, 6.8, 0.5, 0, 0, 0), -0.26), 5, 3.2, 2.2), C.dglass), // 경사 유리
    // 전면 캐노피 + 입구 유리 + 파란 샤프트
    P(box(13, 0.4, 2.4, -1.2, 3.1, 3.3), C.panelDk),
    P(box(12, 2.4, 0.15, -1.2, 1.5, 3.2), C.dglass),
    P(box(1.5, 5.6, 1.5, -3.6, 2.8, 1.6), C.signBlue),
  ],
  // 대동벽화마을: 완만한 함석지붕(초록·주황·파랑) 집들이 비탈길 따라 + 멀리 쌍둥이 빌딩 + 전봇대 + 계단
  'daedong-maeul': [
    P(box(12, 1, 9, 0, 0.5, -1), C.soil),
    P(box(10, 1, 6.5, 0.3, 1.5, -2.2), [0.5, 0.46, 0.42]),
    P(box(8, 1, 4.5, 0.6, 2.5, -3.2), [0.48, 0.44, 0.4]),
    P(box(1.2, 11, 1.2, 5.5, 5.5, -5.5), C.panel),        // 쌍둥이 빌딩(스카이라인)
    P(box(1.2, 12, 1.2, 6.9, 6.0, -5.5), C.panel),
    ...house(1.8, 1.6, 1.8, -3.8, 1, 2.4, MURAL[0], C.roofGreen, true),
    ...house(1.8, 1.5, 1.8, -1.5, 1, 2.6, MURAL[1], C.roofOrange, true),
    ...house(1.8, 1.7, 1.8, 1.0, 1, 2.5, MURAL[2], C.roofBlue, true),
    ...house(1.8, 1.6, 1.8, 3.5, 1, 2.3, MURAL[3], C.roofGreen, true),
    ...house(1.6, 1.5, 1.6, -2.6, 2, 0.4, MURAL[4], C.roofOrange, true),
    ...house(1.6, 1.6, 1.6, 0.2, 2, 0.5, MURAL[5], C.roofBlue, true),
    ...house(1.6, 1.5, 1.6, 2.8, 2, 0.3, MURAL[6], C.roofGreen, true),
    ...house(1.5, 1.6, 1.5, -1.1, 3, -1.4, MURAL[2], C.roofOrange, true),
    ...house(1.5, 1.6, 1.5, 1.4, 3, -1.5, MURAL[0], C.roofBlue, true),
    P(cylinder(0.08, 0.1, 5, 6, 4.6, 1, 3.2), C.concrete), // 전봇대
    P(box(0.9, 0.3, 1.0, -0.2, 1.15, 3.6), C.concrete),
    P(box(0.9, 0.3, 1.0, -0.2, 1.75, 2.7), C.concrete),
    P(box(0.9, 0.3, 1.0, -0.2, 2.35, 1.8), C.concrete),
  ],
  // 대동하늘공원: 상징 붉은 풍차 + 데크 + 정자 + 사랑바위 + 나무·벚나무 + 배경(식장산 실사진)
  'daedong-sky': [
    P(box(13, 8, 0.3, 0, 4, -5.8), C.grass, true),
    P(box(11, 1.6, 11, 0, 0.8, 0), C.grass),
    P(box(6.5, 0.3, 6.5, 0, 1.6, 0), C.deck),
    P(cylinder(1.0, 1.35, 4.6, 12, 0.5, 1.6, -0.5), C.windmill),
    P(cylinder(0, 1.5, 1.7, 12, 0.5, 6.2, -0.5), C.windmillDk),
    ...windmillBlades(0.5, 5.4, 0.9),
    ...columns(2, 2.0, 0.12, 2.0, -3.8, 1.6, -1.0),
    ...columns(2, 2.0, 0.12, 2.0, -3.8, 1.6, 1.0),
    P(pyramidRoof(2.6, 2.6, 1.1, -2.8, 3.6, 0), C.redRoof),
    P(box(2.6, 0.2, 2.6, -2.8, 3.55, 0), C.wood),
    P(box(1.6, 1.1, 1.3, 3.4, 2.15, 2.6), C.rock),        // 사랑바위
    ...tree(-4.2, 3.2, 2.2),
    P(cylinder(0.14, 0.18, 1.1, 6, 3.8, 1.6, 3.0), [0.42, 0.3, 0.2]), // 벚나무 줄기
    P(cylinder(0, 1.1, 1.5, 8, 3.8, 2.5, 3.0), [0.88, 0.62, 0.74]),   // 벚나무 분홍
  ],
  // 대동천: 철교(어두운 거더) + 교각·난간·전차선 기둥 + 둔치 + 산책로 + 코스모스 꽃밭 + 배경(실사진)
  daedongcheon: [
    P(box(16, 7, 0.3, 0, 3.5, -4.8), C.water, true),
    P(box(16, 0.25, 5, 0, 0.12, 0), C.water),
    P(box(16, 0.6, 2.6, 0, 0.3, 3.4), C.bank),
    P(box(16, 0.6, 2.6, 0, 0.3, -3.4), C.bank),
    P(box(16, 0.8, 1.8, 0, 2.6, -0.3), C.steel),          // 거더
    P(box(16, 0.5, 0.12, 0, 3.15, -1.15), C.steel),       // 난간
    P(box(16, 0.5, 0.12, 0, 3.15, 0.55), C.steel),
    ...[-6, -2, 2, 6].map(x => P(box(0.9, 2.6, 1.8, x, 1.3, -0.3), C.concrete)), // 교각
    P(cylinder(0.08, 0.08, 1.6, 6, -4, 3.0, -1.15), C.steel), // 전차선 기둥
    P(cylinder(0.08, 0.08, 1.6, 6, 4, 3.0, -1.15), C.steel),
    P(box(16, 0.1, 1.2, 0, 0.45, 4.4), C.concrete),       // 산책로
    ...cosmos(18),
  ],
}

// 사각뿔 지붕(피라미드)
function pyramidRoof(w, d, ph, cx, cy, cz) {
  const g = newGeom(), hw = w / 2, hd = d / 2, apex = [cx, cy + ph, cz]
  const c0 = [cx - hw, cy, cz + hd], c1 = [cx + hw, cy, cz + hd], c2 = [cx + hw, cy, cz - hd], c3 = [cx - hw, cy, cz - hd]
  addTri(g, c0, c1, apex); addTri(g, c1, c2, apex); addTri(g, c2, c3, apex); addTri(g, c3, c0, apex)
  return g
}

// 건물별 기본 텍스처(절차적). 실제 사진이 있으면 그걸 우선 사용.
const TEX = { 'daejeon-station': stoneWindows, woosong: glassGrid, 'daedong-maeul': muralWall }

for (const [id, parts] of Object.entries(buildings)) {
  const dir = resolve(ROOT, 'public', 'ar', 'course', id)
  mkdirSync(dir, { recursive: true })
  // 실제 사진 우선: facade.jpg/png 가 있으면 그 사진을, 없으면 절차적 텍스처
  const jpg = resolve(dir, 'facade.jpg'), png = resolve(dir, 'facade.png')
  let texture = null, src = ''
  if (existsSync(jpg)) { texture = { data: readFileSync(jpg), mime: 'image/jpeg' }; src = ' [실사진 facade.jpg]' }
  else if (existsSync(png)) { texture = { data: readFileSync(png), mime: 'image/png' }; src = ' [실사진 facade.png]' }
  else if (TEX[id]) { texture = { data: TEX[id](), mime: 'image/png' }; src = ' [생성 텍스처]' }
  const glb = buildGlb(parts, texture)
  writeFileSync(resolve(dir, 'building.glb'), glb)
  console.log(`✓ ${id}: ${(glb.length / 1024).toFixed(1)} KB (${parts.length} parts)${src}`)
}
console.log('done')
