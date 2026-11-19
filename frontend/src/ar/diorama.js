import {
  BoxGeometry, BufferGeometry, Color, CylinderGeometry, DoubleSide, Float32BufferAttribute,
  Group, IcosahedronGeometry, InstancedMesh, Mesh, MeshStandardMaterial, Object3D, PlaneGeometry,
} from 'three'

export const SCENE_STYLES = Object.freeze({
  original: Object.freeze({ label: '원본 모델', description: '기존 건물과 조명을 그대로 표시합니다.' }),
  village: Object.freeze({ label: '햇살 골목', description: '황토 마당과 천막, 돌담이 있는 미니어처 마을.', sky: '#ead5a3', soil: '#9e774d', grass: '#657042', textile: '#f0dbb5', timber: '#624229', stone: '#9d9280', roof: '#ae7944', lamp: '#e6ab53' }),
  dusk: Object.freeze({ label: '노을 장터', description: '짙은 흙길과 주황 등불이 있는 저녁 골목.', sky: '#bd8874', soil: '#785746', grass: '#526348', textile: '#f1c798', timber: '#512e29', stone: '#8d837d', roof: '#916340', lamp: '#ffb455' }),
})
export function resolveSceneStyle(raw, builtIn = false) {
  return typeof raw === 'string' && Object.hasOwn(SCENE_STYLES, raw) ? raw : builtIn ? 'village' : 'original'
}

function randomSeries(seed = 12317) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
}

// A deliberately stylized stage around the model, never a replacement for its geometry.
export function createDiorama(styleId, dimensions) {
  if (styleId === 'original' || !Object.hasOwn(SCENE_STYLES, styleId)) return null
  const palette = SCENE_STYLES[styleId]
  const { x, z } = dimensions
  if (![x, z].every(n => Number.isFinite(n) && n > 0)) return null
  const unit = Math.max(x, z)
  const bx = x / unit / 2, bz = z / unit / 2
  const w = x / unit + .41, depth = z / unit + .49
  const r = randomSeries()
  const stage = new Group()
  stage.name = 'Donggu illustrated village accessories'
  stage.scale.setScalar(unit)
  const material = color => new MeshStandardMaterial({ color, roughness: 1 })
  const box = new BoxGeometry()
  const sphere = new IcosahedronGeometry(1, 0)
  const stake = new CylinderGeometry(.8, 1, 1, 7)
  const group = new Map()
  const o = new Object3D()
  function add(shape, color, pos, scale, ry = 0, tint = 1) {
    const tag = shape.uuid
    if (!group.has(tag)) group.set(tag, { shape, parts: [] })
    group.get(tag).parts.push({ color, pos, scale, ry, tint })
  }
  function ground(color, y, sx, sy, sz, dz = 0) {
    add(box, color, [0, y, dz], [sx, sy, sz])
  }
  ground('#695440', -.047, w + .025, .061, depth + .02, .105)
  ground(palette.soil, -.012, w, .021, depth, .105)
  // Variegated earth and scattered grass as one low-cost instanced layer.
  for (let i = 0; i < 150; i++) {
    const px = (r() - .5) * (w - .035)
    const pz = (r() - .5) * (depth - .04) + .105
    if (Math.abs(px) < bx && Math.abs(pz) < bz) continue
    const grassy = Math.abs(px) > w * .36 && r() > .45
    const sz = .006 + r() * .015
    add(box, grassy ? palette.grass : palette.soil, [px, .001, pz],
      [sz * 1.8, .003 + (grassy ? sz * .7 : 0), sz], r() * 3, .72 + r() * .46)
  }
  for (let i = 0; i < 19; i++) {
    const px = (i / 18 - .5) * (w - .03)
    for (const pz of [.10 - depth / 2, .10 + depth / 2]) {
      if (pz > 0 && Math.abs(px) < .13) continue
      add(sphere, palette.stone, [px, .008, pz], [.028, .014 + r() * .017, .022], r() * 3, .72 + r() * .45)
    }
  }
  // Small curved canvas awning on two-dimensional market frontage.
  const ax = -bx - .058, az = bz + .12, width = .19, length = .17, high = .21
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
    const xx = ax + dx * width * .5, zz = az + dz * length * .5
    add(stake, palette.timber, [xx, high / 2, zz], [.008, high, .008], 0, .84 + r() * .22)
    add(sphere, palette.stone, [xx, .008, zz], [.016, .012, .015], r() * 3)
  }
  const cloth = new PlaneGeometry(width, length, 12, 8).rotateX(-Math.PI / 2)
  const clothVertices = cloth.getAttribute('position')
  for (let i = 0; i < clothVertices.count; i++) {
    const px = clothVertices.getX(i), pz = clothVertices.getZ(i)
    clothVertices.setY(i, -.028 * Math.cos(Math.PI * px / width) * (.65 + .35 * Math.cos(Math.PI * pz / length)))
  }
  cloth.computeVertexNormals()
  const canvas = new Mesh(cloth, new MeshStandardMaterial({ color: palette.textile, roughness: 1, side: DoubleSide }))
  canvas.position.set(ax, high, az); stage.add(canvas)
  for (let i = 0; i < 3; i++) {
    const xx = ax + (i - 1) * .057
    add(box, palette.timber, [xx, .032 + .006 * i, az + .009], [.049, .055 + .012 * i, .04], (i - 1) * .11)
  }

  // Layered straw lean-to and stone side path, as illustration rather than historical evidence.
  const hx = bx + .085, hz = bz + .105
  add(box, '#d5bc95', [hx, .061, hz], [.135, .114, .111])
  for (const dx of [-.065, .065]) for (const dz of [-.055, .055]) {
    add(stake, palette.timber, [hx + dx, .064, hz + dz], [.008, .123, .008])
  }
  const roof = new BufferGeometry()
  const roofPosition = [
    -.086, 0, -.077,  .086, 0, -.077,  .086, .05, 0,
    -.086, 0, -.077, .086, .05, 0, -.086, .05, 0,
    -.086,.05,0,.086,.05,0,.086,0,.077,
    -.086,.05,0,.086,0,.077,-.086,0,.077,
  ]
  roof.setAttribute('position',new Float32BufferAttribute(roofPosition,3)); roof.computeVertexNormals()
  const roofing = new Mesh(roof, new MeshStandardMaterial({ color: palette.roof, roughness: 1, side: DoubleSide }))
  roofing.position.set(hx, .116, hz); stage.add(roofing)
  for (let i = 0; i < 20; i++) {
    const xx = hx - .08 + i * .0084, tint = .78 + r() * .44
    for (const row of [0, 1, 2]) {
      const zz = (row + 1) * .024, yy = .171 - zz * .65
      add(box, palette.roof, [xx, yy, hz + zz], [.006, .005, .028], 0, tint)
      add(box, palette.roof, [xx, yy, hz - zz], [.006, .005, .028], 0, tint)
    }
  }
  add(box, palette.timber, [hx, .054, hz+.057], [.041, .088, .008])
  for (let i = 0; i < 6; i++) {
    add(sphere, palette.stone, [hx - .015 + r() * .03, .011, hz + .065 + i * .022], [.025, .009, .016], r() * 3, .8 + r() * .3)
  }
  for (const i of [-1, 1]) {
    const xx = i * (bx + .18), zz = bz + .19
    add(stake, palette.timber, [xx, .08, zz], [.006, .16, .006])
    add(box, palette.lamp, [xx, .165, zz], [.027, .04, .027])
    add(box, palette.timber, [xx, .188, zz], [.034, .009, .034])
  }
  for (let i = 0; i < 3; i++) {
    const xx = (i - 1) * .105, zz = bz + .18 + r() * .075
    add(stake, ['#d6b585','#9f6148','#879276'][i], [xx, .045, zz], [.019, .067, .019])
    add(sphere, '#d5a57b', [xx, .094, zz], [.016, .018, .015])
    add(sphere, '#423026', [xx, .107, zz], [.016, .009, .016])
  }
  const neutral = material('#ffffff')
  for (const { shape, parts } of group.values()) {
    const instances = new InstancedMesh(shape, neutral, parts.length)
    parts.forEach(({ color, pos, scale, ry, tint }, i) => {
      o.position.set(...pos); o.scale.set(...scale); o.rotation.y = ry; o.updateMatrix()
      instances.setMatrixAt(i, o.matrix)
      instances.setColorAt(i, new Color(color).multiplyScalar(tint))
    })
    instances.computeBoundingSphere()
    stage.add(instances)
  }
  return stage
}
