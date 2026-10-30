import { Matrix4, Quaternion, Vector3 } from 'three'
import { vector } from './manifest.js'

export const ALIGNMENT_LIMITS = Object.freeze({ rmsMeters: 0.1, maxMeters: 0.2, minViewSeparationMeters: 0.5 })

export function modelToFacadeMatrix(manifest) {
  const transform = manifest.modelToFacade
  return new Matrix4().compose(new Vector3(...transform.position),
    new Quaternion(...transform.quaternion), new Vector3().setScalar(transform.scale))
}

export function evaluateAlignment(manifest, capture) {
  const errors = []
  const fail = () => ({ passed: false, errors, rmsMeters: null, maxMeters: null, views: [] })
  if (!capture || typeof capture !== 'object') {
    errors.push('현장 정합 관측 기록이 필요합니다.')
    return fail()
  }
  if (capture.modelRevision !== manifest.revision) errors.push('관측한 모델 revision이 현재 모델과 다릅니다.')
  if (!capture.device || !['android', 'ios'].includes(capture.device.platform)
    || typeof capture.device.model !== 'string' || !capture.device.model.trim()
    || typeof capture.device.browser !== 'string' || !capture.device.browser.trim()) errors.push('기기 플랫폼·모델·브라우저를 기록하세요.')
  if (!Number.isFinite(Date.parse(capture.capturedAt))) errors.push('현장 관측 시각 capturedAt이 필요합니다.')
  const viewpoints = Array.isArray(capture.viewpoints) ? capture.viewpoints : []
  const samples = Array.isArray(capture.samples) ? capture.samples : []
  if (samples.length > 768) { errors.push('관측 기준점은 최대 768개입니다.'); return fail() }
  if (viewpoints.length < 3 || viewpoints.length > 12) errors.push('정면·왼쪽·오른쪽을 포함해 3~12개 관찰 위치가 필요합니다.')
  const views = new Map()
  for (const view of viewpoints) {
    if (!view || typeof view.id !== 'string' || !view.id.trim() || views.has(view.id) || !vector(view.cameraPosition)) {
      errors.push('관찰 위치 id·카메라 좌표·중복을 확인하세요.')
      continue
    }
    for (const other of views.values()) {
      const distance = Math.hypot(...view.cameraPosition.map((n, i) => n - other.cameraPosition[i]))
      if (distance < ALIGNMENT_LIMITS.minViewSeparationMeters) errors.push('서로 0.5m 이상 떨어진 관찰 위치에서 검증하세요.')
    }
    views.set(view.id, view)
  }
  const matrix = modelToFacadeMatrix(manifest)
  const expected = new Map(manifest.controlPoints.map(point => [point.id, new Vector3(...point.position).applyMatrix4(matrix)]))
  const measurements = new Map()
  const squared = []
  const byView = new Map([...views.keys()].map(id => [id, []]))
  for (const sample of samples) {
    if (!sample || !views.has(sample.viewpointId) || !expected.has(sample.pointId) || !vector(sample.position)) {
      errors.push('관측 기준점·관찰 위치·외벽 좌표를 확인하세요.')
      continue
    }
    const key = `${sample.viewpointId}/${sample.pointId}`
    if (measurements.has(key)) { errors.push('동일 관찰 위치의 기준점이 중복되었습니다.'); continue }
    const error = expected.get(sample.pointId).distanceTo(new Vector3(...sample.position))
    measurements.set(key, error)
    squared.push(error ** 2)
    byView.get(sample.viewpointId).push(error)
  }
  for (const viewId of views.keys()) for (const pointId of expected.keys()) {
    if (!measurements.has(`${viewId}/${pointId}`)) errors.push(`관측이 누락되었습니다: ${viewId}/${pointId}`)
  }
  if (!squared.length) { errors.push('유효한 기준점 관측이 없습니다.'); return fail() }
  const rmsMeters = Math.sqrt(squared.reduce((sum, n) => sum + n, 0) / squared.length)
  const maxMeters = Math.sqrt(Math.max(...squared))
  if (rmsMeters > ALIGNMENT_LIMITS.rmsMeters) errors.push('기준점 RMS 오차가 10cm를 초과합니다.')
  if (maxMeters > ALIGNMENT_LIMITS.maxMeters) errors.push('기준점 최대 오차가 20cm를 초과합니다.')
  return {
    passed: errors.length === 0, errors, rmsMeters, maxMeters,
    views: [...byView].map(([id, values]) => ({ id, samples: values.length,
      rmsMeters: values.length ? Math.sqrt(values.reduce((sum, n) => sum + n * n, 0) / values.length) : null,
      maxMeters: values.length ? Math.max(...values) : null })),
  }
}

// Attach ONLY our subtree. The existing host owns its camera, XR session,
// renderer, facade tracking and reference space throughout this module's life.
export class FacadeBinding {
  constructor(root, invalidate) {
    this.root = root
    this.invalidate = invalidate
    this.active = false
    this.tracked = false
    this.generation = 0
    this.cleanup = []
  }

  bind({ facadeRoot, sessionId, session, referenceSpace }) {
    if (!facadeRoot?.isObject3D || typeof sessionId !== 'string' || !sessionId.trim()) {
      throw new Error('기존 외벽 Object3D와 AR 세션 id가 필요합니다.')
    }
    if (this.active) throw new Error('이미 외벽에 연결되어 있습니다. 재정합하려면 먼저 연결을 해제하세요.')
    this.parent = facadeRoot
    this.sessionId = sessionId
    this.boundAt = Date.now()
    this.generation++
    this.root.matrixAutoUpdate = false
    this.root.matrix.identity()
    this.frozenMatrix = this.root.matrix.clone()
    facadeRoot.add(this.root)
    this.active = true
    this.tracked = false
    const listen = (target, type, callback) => {
      if (!target?.addEventListener) return
      target.addEventListener(type, callback)
      this.cleanup.push(() => target.removeEventListener(type, callback))
    }
    listen(referenceSpace, 'reset', () => this.unbind('AR 기준 좌표가 변경되어 재검증이 필요합니다.'))
    listen(session, 'end', () => this.unbind('AR 세션이 종료되었습니다.'))
    listen(session, 'visibilitychange', () => {
      if (session.visibilityState !== 'visible') this.setTracking(false)
    })
    this.invalidate('새 외벽 연결의 정합을 검증하세요.')
  }

  assertStable() {
    if (this.active && (this.root.parent !== this.parent || !this.root.matrix.equals(this.frozenMatrix)
      || this.root.matrixAutoUpdate)) {
      this.unbind('공연 루트의 좌표가 변경되었습니다. 정합을 다시 검증하세요.')
      return false
    }
    return this.active
  }

  setTracking(tracked) {
    this.tracked = this.active && tracked === true
    if (!this.tracked) this.invalidate('추적이 중단되었습니다. 위치 확인 후 공연을 다시 시작하세요.', false)
  }

  unbind(reason = '외벽 연결을 해제했습니다.') {
    this.cleanup.splice(0).forEach(cleanup => cleanup())
    this.root.removeFromParent()
    this.active = false
    this.tracked = false
    this.generation++
    this.invalidate(reason)
  }
}
