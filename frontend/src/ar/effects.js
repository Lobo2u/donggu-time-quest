import {
  AdditiveBlending, AnimationMixer, BufferAttribute, BufferGeometry, Color,
  CylinderGeometry, DataTexture, DoubleSide, Group, Line, LineBasicMaterial,
  Mesh, MeshBasicMaterial, PlaneGeometry, Points, PointsMaterial, Quaternion, Vector3,
} from 'three'
import { MOBILE_BUDGET } from './manifest.js'
import { sampleRoute, sampleTimeline } from './timeline.js'

function starTexture() {
  const size = 32
  const pixels = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (x + 0.5 - size / 2) / (size / 2)
    const dy = (y + 0.5 - size / 2) / (size / 2)
    const radius = Math.hypot(dx, dy)
    const cross = Math.exp(-Math.min(dx * dx, dy * dy) * 150) * Math.max(0, 1 - radius)
    const glow = Math.max(0, 1 - radius * 2) ** 3
    const index = (y * size + x) * 4
    pixels.set([255, 255, 255, Math.round(Math.min(1, cross + glow) * 255)], index)
  }
  const texture = new DataTexture(pixels, size, size)
  texture.needsUpdate = true
  return texture
}

function anchorGroup(anchor) {
  const group = new Group()
  group.name = `anchor-${anchor.id}`
  group.position.fromArray(anchor.position)
  group.quaternion.fromArray(anchor.quaternion)
  return group
}

export class BuildingEffects {
  constructor(manifest, timeline, characterAssets, particleLimit = MOBILE_BUDGET.particles) {
    this.root = new Group()
    this.root.name = 'building-effects'
    this.timeline = timeline
    this.anchors = new Map(manifest.anchors.map(a => [a.id, a]))
    this.nodes = new Map()
    this.characters = new Map()
    this.particleLimit = Math.max(0, Math.min(MOBILE_BUDGET.particles, Math.floor(particleLimit)))
    this.tempVector = new Vector3()
    this.tempRotation = new Quaternion()
    this.tempColor = new Color()

    for (const cue of timeline.cues) {
      if (['stars', 'character'].includes(cue.effect)) continue
      const key = `${cue.effect}/${cue.anchorId}`
      if (this.nodes.has(key)) continue
      const anchor = this.anchors.get(cue.anchorId)
      const group = anchorGroup(anchor)
      let object
      const material = new MeshBasicMaterial({ color: cue.color, transparent: true,
        depthTest: true, depthWrite: false, side: DoubleSide, blending: AdditiveBlending,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })
      if (cue.effect === 'outline-flow') {
        material.dispose()
        const geometry = new BufferGeometry().setFromPoints(anchor.points.map(p => new Vector3(...p)))
        object = new Line(geometry, new LineBasicMaterial({ color: cue.color, transparent: true,
          depthTest: true, depthWrite: false, blending: AdditiveBlending }))
      } else if (cue.effect === 'roof-beam') {
        object = new Mesh(new CylinderGeometry(0.08, 0.7, 8, 8, 1, true), material)
        object.position.y = 4
      } else {
        object = new Mesh(new PlaneGeometry(...anchor.sizeMeters), material)
        object.position.z = 0.025 // Avoid z fighting while retaining depth-based occlusion.
      }
      object.renderOrder = 10
      group.add(object)
      group.visible = false
      this.root.add(group)
      this.nodes.set(key, { group, object })
    }

    for (const config of manifest.characters) {
      const asset = characterAssets.get(config.id)
      const clip = asset.animations.find(animation => animation.name === config.clip)
      if (!clip) throw new Error(`캐릭터 애니메이션이 없습니다: ${config.id}/${config.clip}`)
      const group = new Group()
      group.name = `character-${config.id}`
      group.add(asset.scene)
      group.scale.setScalar(config.scale)
      group.visible = false
      this.root.add(group)
      const mixer = new AnimationMixer(asset.scene)
      mixer.clipAction(clip).play()
      this.characters.set(config.id, { group, mixer, config,
        route: config.route.map(id => [...this.anchors.get(id).position]) })
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(this.particleLimit * 3), 3))
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(this.particleLimit * 3), 3))
    geometry.setDrawRange(0, 0)
    this.stars = new Points(geometry, new PointsMaterial({ size: 0.15, map: starTexture(),
      vertexColors: true, transparent: true, blending: AdditiveBlending,
      depthTest: true, depthWrite: false, opacity: 0.9 }))
    this.stars.name = 'shared-star-pool'
    this.stars.frustumCulled = false
    this.stars.renderOrder = 11
    this.root.add(this.stars)
  }

  sample(seconds) {
    const frame = sampleTimeline(this.timeline, seconds)
    for (const { group } of this.nodes.values()) group.visible = false
    for (const { group } of this.characters.values()) group.visible = false
    const starCues = []
    for (const cue of frame.cues) {
      if (cue.effect === 'stars') { starCues.push(cue); continue }
      if (cue.effect === 'character') {
        const character = this.characters.get(cue.characterId)
        const cycle = cue.cycleSeconds ?? 24
        const wave = (1 - Math.cos(cue.elapsed / cycle * Math.PI * 2)) / 2
        const progress = cue.routeMode === 'ping-pong' ? (cue.startAtEnd ? 1 - wave : wave) : cue.progress
        const position = sampleRoute(character.route, progress)
        const next = sampleRoute(character.route, Math.min(1, progress + 0.01))
        character.group.position.fromArray(position)
        const anchor = this.anchors.get(character.config.route[0])
        const emergence = cue.emergeSeconds ? Math.min(1, cue.elapsed / cue.emergeSeconds) : 1
        this.tempVector.set(0, 0, -0.6 * (1 - emergence))
          .applyQuaternion(this.tempRotation.fromArray(anchor.quaternion))
        character.group.position.add(this.tempVector)
        const dx = next[0] - position[0], dz = next[2] - position[2]
        character.group.quaternion.fromArray(anchor.quaternion)
        if (Math.hypot(dx, dz) > 0.001) character.group.rotation.y = Math.atan2(dx, dz)
        character.group.visible = true
        character.mixer.setTime(cue.elapsed + (cue.clipOffsetSeconds ?? 0))
        continue
      }
      const { group, object } = this.nodes.get(`${cue.effect}/${cue.anchorId}`)
      group.visible = true
      object.material.color.set(cue.color)
      object.material.opacity = cue.strength * (cue.effect === 'roof-beam' ? 0.22 : 0.65)
      if (cue.effect === 'outline-flow') {
        const count = object.geometry.attributes.position.count
        object.geometry.setDrawRange(0, Math.max(2, Math.ceil(count * Math.min(1, cue.progress * 2))))
      }
      if (cue.effect === 'roof-beam') {
        const growth = Math.min(1, cue.elapsed / 3)
        object.scale.y = growth
        object.position.y = 4 * growth
      }
    }
    this.sampleStars(starCues)
    return frame
  }

  sampleStars(cues) {
    const positions = this.stars.geometry.attributes.position
    const colors = this.stars.geometry.attributes.color
    let written = 0
    // Share a single fixed-size pool across every roof and concurrent cue.
    // Round-robin allocation prevents the first roof from consuming the pool.
    for (let i = 0; i < this.particleLimit && cues.some(cue => i < cue.count); i++) {
      for (let index = 0; index < cues.length && written < this.particleLimit; index++) {
        const cue = cues[index]
        if (i >= cue.count) continue
        const anchor = this.anchors.get(cue.anchorId)
        const angle = i * 2.39996 + index * 0.71
        const variation = ((i * 17 + 13) % 53) / 53
        const spread = cue.motion === 'gather' ? 1 - cue.progress : cue.progress
        const radius = (1 + variation * 6) * spread
        this.tempVector.set(Math.cos(angle) * radius, 0.5 + spread * (2 + variation * 7), Math.sin(angle) * radius)
          .applyQuaternion(this.tempRotation.fromArray(anchor.quaternion))
        // Anchor translation is applied after rotation, in building-local meters.
        this.tempVector.x += anchor.position[0]
        this.tempVector.y += anchor.position[1]
        this.tempVector.z += anchor.position[2]
        positions.setXYZ(written, this.tempVector.x, this.tempVector.y, this.tempVector.z)
        this.tempColor.set(cue.color).multiplyScalar(cue.strength * (0.5 + variation * 0.5))
        colors.setXYZ(written, this.tempColor.r, this.tempColor.g, this.tempColor.b)
        written++
      }
    }
    positions.needsUpdate = true
    colors.needsUpdate = true
    this.stars.geometry.setDrawRange(0, written)
    this.stars.visible = written > 0
  }

  disposeMixers() {
    for (const character of this.characters.values()) {
      character.mixer.stopAllAction()
      character.mixer.uncacheRoot(character.mixer.getRoot())
    }
  }
}
