// 텍스처 포함 GLB 를 three.js 로 파싱 검증(브라우저 전역 최소 shim).
globalThis.self = globalThis
globalThis.createImageBitmap = async () => ({ width: 256, height: 256, close() {} })
const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
const { readFileSync } = await import('node:fs')

const ids = ['woosong', 'daejeon-station', 'daedong-maeul', 'daedong-sky', 'daedongcheon']
let bad = false
for (const id of ids) {
  const b = readFileSync(`public/ar/course/${id}/building.glb`)
  const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
  await new Promise((res) => new GLTFLoader().parse(ab, '', (g) => {
    let m = 0, mapped = 0, uv = 0
    g.scene.traverse(o => { if (o.isMesh) { m++; if (o.material.map) mapped++; if (o.geometry.attributes.uv) uv++ } })
    console.log(`${id}: OK meshes=${m} textured=${mapped} withUV=${uv}`); res()
  }, (e) => { bad = true; console.error(`${id}: ERR ${e.message || e}`); res() }))
}
process.exit(bad ? 1 : 0)
