import {
  DoubleSide, EdgesGeometry, Group, LineBasicMaterial, LineSegments,
  MeshBasicMaterial, MeshNormalMaterial, Vector3,
} from 'three'
import { FacadeBinding, evaluateAlignment, modelToFacadeMatrix } from './alignment.js'
import { disposeResources, inspectBuildingGeometry, loadBuildingGlb, measureResources } from './assets.js'
import { BuildingEffects } from './effects.js'
import { MOBILE_BUDGET, validateManifest } from './manifest.js'
import { createInitialTimeline, PerformanceClock } from './timeline.js'

function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value) }
  return value
}

function staticMeshCopy(source, material) {
  const copy = source.clone(true)
  const discarded = []
  copy.traverse(node => {
    if (node.isMesh) {
      node.material = material
      node.renderOrder = -1000
      node.castShadow = false
      node.receiveShadow = false
    } else if (node.isLight || node.isCamera || node.isLine || node.isPoints) discarded.push(node)
  })
  discarded.forEach(node => node.removeFromParent())
  return copy
}

export async function createBuildingStage(manifestInput, {
  baseUrl = globalThis.location?.href,
  resolve, signal, audio = null,
  loadAsset = value => loadBuildingGlb(value, { baseUrl, resolve, signal }),
  particleLimit = MOBILE_BUDGET.particles,
  now,
} = {}) {
  const validation = validateManifest(manifestInput)
  if (!validation.valid) throw new Error(validation.errors.join('\n'))
  const manifest = freeze(structuredClone(manifestInput))
  const root = new Group()
  root.name = `building-performance-${manifest.id}`
  const content = new Group()
  content.name = 'building-local-coordinates'
  content.matrixAutoUpdate = false
  content.matrix.copy(modelToFacadeMatrix(manifest))
  const modelMatrix = content.matrix.clone()
  root.add(content)
  const assets = []
  let effects
  try {
    const building = await loadAsset(manifest.model.glbUrl)
    assets.push(building)
    const occlusionAsset = manifest.model.occlusionGlbUrl ? await loadAsset(manifest.model.occlusionGlbUrl) : null
    if (occlusionAsset) assets.push(occlusionAsset)
    const characterAssets = new Map()
    for (const character of manifest.characters) {
      const asset = await loadAsset(character.glbUrl)
      assets.push(asset)
      characterAssets.set(character.id, asset)
    }
    if (signal?.aborted) throw new DOMException('로딩을 취소했습니다.', 'AbortError')
    const geometry = inspectBuildingGeometry(manifest, building.scene, occlusionAsset?.scene)
    const visual = building.scene
    visual.traverse(node => { node.castShadow = false; node.receiveShadow = false })
    content.add(visual)
    const occlusion = staticMeshCopy(occlusionAsset?.scene ?? visual, new MeshBasicMaterial({
      colorWrite: false, depthWrite: true, depthTest: true, side: DoubleSide,
    }))
    occlusion.name = 'building-depth-only'
    content.add(occlusion)
    const occlusionPreview = staticMeshCopy(occlusionAsset?.scene ?? visual, new MeshNormalMaterial({ side: DoubleSide }))
    content.add(occlusionPreview)
    const wireframe = new Group()
    wireframe.name = 'alignment-wireframe'
    // Flattening a diagnostic copy preserves mesh hierarchy transforms in GLB-local coordinates.
    visual.updateWorldMatrix(true, true)
    visual.traverse(node => {
      if (!node.isMesh) return
      const edge = new LineSegments(new EdgesGeometry(node.geometry, 25),
        new LineBasicMaterial({ color: '#7ef3da', depthTest: true }))
      edge.matrixAutoUpdate = false
      edge.matrix.copy(content.matrixWorld).invert().multiply(node.matrixWorld)
      wireframe.add(edge)
    })
    content.add(wireframe)
    const timeline = manifest.timeline ?? createInitialTimeline(manifest)
    effects = new BuildingEffects(manifest, timeline, characterAssets, particleLimit)
    content.add(effects.root)
    const budget = measureResources([occlusion, effects.root])
    const assetBytes = assets.reduce((sum, asset) => sum + (asset.byteLength ?? 0), 0)
    if (assetBytes > MOBILE_BUDGET.assetBytes) budget.errors.push('건물·가림·캐릭터 GLB 합계가 30MiB를 초과합니다.')
    const clock = new PerformanceClock(timeline.duration, audio, now)
    const stage = new BuildingStage({ manifest, root, content, visual, occlusion, occlusionPreview,
      wireframe, effects, timeline, clock, assets, modelMatrix,
      diagnostics: { geometry, budget: { ...budget, assetBytes }, warnings: validation.warnings } })
    stage.setInspectionMode('solid')
    return stage
  } catch (error) {
    effects?.disposeMixers()
    disposeResources([root, effects?.root, ...assets.map(asset => asset.scene)])
    throw error
  }
}

class BuildingStage {
  constructor(options) {
    Object.assign(this, options)
    this.report = null
    this.disposed = false
    this.preview = true
    this.message = '현장 외벽 연결과 정합 검증을 기다리고 있습니다.'
    this.binding = new FacadeBinding(this.root, (message, clear = true) => {
      this.message = message
      if (clear) this.report = null
      this.clock.pause()
      this.effects.root.visible = false
      if (!this.preview) this.root.visible = false
    })
    this.onVisibility = () => {
      if (globalThis.document?.visibilityState === 'hidden') this.setTracking(false)
    }
    globalThis.document?.addEventListener('visibilitychange', this.onVisibility)
  }

  assertUsable() {
    if (this.disposed) throw new Error('이미 종료된 건물 무대입니다.')
  }

  mountPreview(parent) {
    this.assertUsable()
    if (this.binding.active) throw new Error('현장 정합을 해제한 뒤 미리보기를 여세요.')
    this.preview = true
    parent.add(this.root)
    this.setInspectionMode('solid')
  }

  setInspectionMode(mode) {
    this.assertUsable()
    if (!['solid', 'wireframe', 'occlusion', 'hidden'].includes(mode)) throw new Error('알 수 없는 검사 모드입니다.')
    this.clock.pause()
    this.effects.root.visible = false
    this.visual.visible = mode === 'solid'
    this.wireframe.visible = mode === 'wireframe'
    this.occlusionPreview.visible = mode === 'occlusion'
    this.occlusion.visible = !this.preview
    this.root.visible = this.preview || this.binding.tracked
  }

  bindToFacade(options) {
    this.assertUsable()
    this.preview = false
    this.binding.bind(options)
    this.setInspectionMode('wireframe')
  }

  setTracking(tracked) {
    this.assertUsable()
    this.binding.setTracking(tracked)
    if (!this.preview) this.root.visible = this.binding.tracked
  }

  verifyAlignment(capture) {
    this.assertUsable()
    if (!this.binding.assertStable() || !this.binding.tracked) throw new Error('외벽을 연결하고 추적이 정상일 때 정합을 검증하세요.')
    if (capture?.sessionId !== this.binding.sessionId) throw new Error('다른 AR 세션에서 수집한 관측입니다.')
    const capturedAt = Date.parse(capture.capturedAt)
    if (capturedAt < this.binding.boundAt - 1000 || capturedAt > Date.now() + 5000) throw new Error('현재 외벽 연결 이후에 수집한 관측이 필요합니다.')
    this.pause()
    const result = evaluateAlignment(this.manifest, capture)
    this.report = freeze({ ...result, generation: this.binding.generation,
      modelRevision: this.manifest.revision, capture: structuredClone(capture) })
    this.message = result.passed ? '기준점 오차 검증을 통과했습니다.' : result.errors.join('\n')
    return this.report
  }

  getReadiness() {
    const errors = [...this.diagnostics.geometry.errors, ...this.diagnostics.budget.errors]
    if (this.disposed) errors.push('이미 종료된 건물 무대입니다.')
    if (this.manifest.status !== 'surveyed') errors.push('실측 확인을 마친 surveyed 모델이 필요합니다.')
    if (!this.binding.assertStable()) errors.push('기존 외벽 정합 좌표에 연결해야 합니다.')
    if (!this.binding.tracked) errors.push('외벽 위치 추적이 필요합니다.')
    if (!this.content.matrix.equals(this.modelMatrix) || this.content.matrixAutoUpdate) errors.push('건물 보정 좌표가 변경되었습니다.')
    if (!this.report?.passed || this.report.generation !== this.binding.generation) errors.push('현재 연결에서 기준점 정합 검증을 통과해야 합니다.')
    if (!this.manifest.audioUrl || !this.clock.audio) errors.push('뮤지컬 음악을 연결해야 합니다.')
    else if (this.clock.audio.error || this.clock.audio.readyState < 1
      || !Number.isFinite(this.clock.audio.duration) || this.clock.audio.duration < this.timeline.duration) {
      errors.push('공연 길이 이상의 음악이 로딩되어야 합니다.')
    }
    return { ready: errors.length === 0, errors }
  }

  async play() {
    this.assertUsable()
    const readiness = this.getReadiness()
    if (!readiness.ready) throw new Error(readiness.errors.join('\n'))
    await this.clock.play()
    // Permission prompts / audio startup can outlive tracking or a reference reset.
    if (!this.getReadiness().ready || this.clock.state !== 'playing') {
      this.clock.pause()
      return false
    }
    this.visual.visible = false
    this.wireframe.visible = false
    this.occlusionPreview.visible = false
    this.occlusion.visible = true
    this.effects.root.visible = true
    this.root.visible = true
    this.message = '공연 중'
    return true
  }

  pause() {
    this.assertUsable()
    this.clock.pause()
  }

  stop() {
    this.assertUsable()
    this.clock.stop()
    this.effects.root.visible = false
  }

  seek(seconds) {
    this.assertUsable()
    this.clock.seek(seconds)
    this.effects.sample(this.clock.time)
  }

  // Call from the EXISTING render loop. No extra RAF loop or XR session is created.
  update() {
    this.assertUsable()
    if (!this.binding.assertStable() || !this.binding.tracked) return null
    if (!this.content.matrix.equals(this.modelMatrix) || this.content.matrixAutoUpdate) {
      this.binding.unbind('건물 보정 좌표가 변경되었습니다. 재정합이 필요합니다.')
      return null
    }
    if (this.clock.state !== 'playing') return null
    const frame = this.effects.sample(this.clock.time)
    if (frame.time >= this.timeline.duration || this.clock.audio?.ended) {
      this.pause()
      this.effects.root.visible = false
      this.message = '공연이 끝났습니다.'
    }
    return frame
  }

  projectControlPoints(camera, width, height) {
    this.assertUsable()
    this.content.updateWorldMatrix(true, false)
    return this.manifest.controlPoints.map(point => {
      const screen = new Vector3(...point.position).applyMatrix4(this.content.matrixWorld).project(camera)
      return { id: point.id, x: (screen.x + 1) * width / 2, y: (1 - screen.y) * height / 2,
        visible: Math.abs(screen.x) <= 1 && Math.abs(screen.y) <= 1 && screen.z >= -1 && screen.z <= 1 }
    })
  }

  dispose() {
    if (this.disposed) return
    this.clock.stop()
    this.binding.unbind()
    globalThis.document?.removeEventListener('visibilitychange', this.onVisibility)
    this.effects.disposeMixers()
    disposeResources([this.root, ...this.assets.map(asset => asset.scene)])
    this.disposed = true
  }
}
