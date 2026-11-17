// 생성한 GLB 의 구조 무결성 점검(헤더·청크·accessor 범위·인덱스 범위).
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ids = ['woosong', 'daedongcheon', 'daedong-maeul', 'daedong-sky', 'daejeon-station']
const COMP = { 5126: 4, 5123: 2, 5125: 4 }
const NUM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }

let ok = true
for (const id of ids) {
  const buf = readFileSync(resolve(ROOT, 'public', 'ar', 'course', id, 'building.glb'))
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  const problems = []
  if (dv.getUint32(0, true) !== 0x46546c67) problems.push('magic')
  if (dv.getUint32(4, true) !== 2) problems.push('version')
  if (dv.getUint32(8, true) !== buf.length) problems.push('total length')
  // chunk 0 = JSON
  const jsonLen = dv.getUint32(12, true)
  if (dv.getUint32(16, true) !== 0x4e4f534a) problems.push('json chunk type')
  const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'))
  const binStart = 20 + jsonLen
  const binLen = dv.getUint32(binStart, true)
  if (dv.getUint32(binStart + 4, true) !== 0x004e4942) problems.push('bin chunk type')
  const bin = buf.slice(binStart + 8, binStart + 8 + binLen)
  // accessors
  json.accessors.forEach((a, i) => {
    const bv = json.bufferViews[a.bufferView]
    const need = a.count * COMP[a.componentType] * NUM[a.type]
    if ((bv.byteOffset || 0) + need > bin.length) problems.push(`acc${i} overflow`)
    if (bv.byteLength < need) problems.push(`acc${i} view too small`)
  })
  // index range vs vertex count per primitive
  for (const prim of json.meshes[0].primitives) {
    const posAcc = json.accessors[prim.attributes.POSITION]
    const idxAcc = json.accessors[prim.indices]
    const bv = json.bufferViews[idxAcc.bufferView]
    let maxIdx = 0
    for (let k = 0; k < idxAcc.count; k++) maxIdx = Math.max(maxIdx, bin.readUInt16LE((bv.byteOffset || 0) + k * 2))
    if (maxIdx >= posAcc.count) problems.push('index out of range')
  }
  const status = problems.length ? 'FAIL: ' + problems.join(', ') : `OK (${json.meshes[0].primitives.length} prims, ${json.materials.length} mats)`
  if (problems.length) ok = false
  console.log(`${id}: ${status}`)
}
process.exit(ok ? 0 : 1)
