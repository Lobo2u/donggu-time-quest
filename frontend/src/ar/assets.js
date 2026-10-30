import { Box3, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MOBILE_BUDGET, resolveAssetUrl } from './manifest.js'

export async function loadBuildingGlb(value, { baseUrl, resolve = url => url, signal } = {}) {
  const sourceUrl = resolveAssetUrl(value, baseUrl)
  const url = resolve(sourceUrl)
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`GLB를 가져오지 못했습니다 (${response.status}): ${value}`)
  if (Number(response.headers.get('content-length')) > MOBILE_BUDGET.assetBytes) throw new Error('GLB 파일이 30MiB를 초과합니다.')
  const buffer = await response.arrayBuffer()
  if (buffer.byteLength > MOBILE_BUDGET.assetBytes) throw new Error('GLB 파일이 30MiB를 초과합니다.')
  const header = buffer.byteLength >= 12 ? new DataView(buffer) : null
  if (!header || header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2
    || header.getUint32(8, true) !== buffer.byteLength) throw new Error(`유효한 glTF 2.0 GLB가 아닙니다: ${value}`)
  // Embedded textures/buffers keep a local GLB independent of neighboring files.
  const gltf = await new GLTFLoader().parseAsync(buffer, new URL('.', sourceUrl).href)
  if (signal?.aborted) { disposeResources([gltf.scene]); throw new DOMException('로딩을 취소했습니다.', 'AbortError') }
  return { ...gltf, byteLength: buffer.byteLength }
}

export function inspectBuildingGeometry(manifest, building, occlusion) {
  const errors = []
  const dimensions = new Box3().setFromObject(building).getSize(new Vector3())
  for (let axis = 0; axis < 3; axis++) {
    const expected = manifest.dimensionsMeters[axis]
    const actual = dimensions.getComponent(axis) * manifest.modelToFacade.scale
    if (Math.abs(actual - expected) > Math.max(0.05, expected * 0.01)) {
      errors.push(`GLB ${['폭', '높이', '깊이'][axis]} ${actual.toFixed(3)}m가 실측 ${expected}m와 다릅니다.`)
    }
  }
  const names = new Map()
  building.traverse(node => {
    if (node.name) names.set(node.name, (names.get(node.name) ?? 0) + 1)
    if (node.isSkinnedMesh || node.morphTargetInfluences?.length) errors.push('건물은 변형되지 않는 정적 메시여야 합니다.')
  })
  for (const anchor of manifest.anchors) {
    if (anchor.node && names.get(anchor.node) !== 1) errors.push(`구조 노드가 없거나 중복되었습니다: ${anchor.id}/${anchor.node}`)
    if (!anchor.node && !['outline', 'path'].includes(anchor.kind)) errors.push(`건축 구조의 GLB node 이름이 필요합니다: ${anchor.id}`)
  }
  if (occlusion) {
    const visibleBounds = new Box3().setFromObject(building)
    const occlusionBounds = new Box3().setFromObject(occlusion)
    if (visibleBounds.min.distanceTo(occlusionBounds.min) > 0.1
      || visibleBounds.max.distanceTo(occlusionBounds.max) > 0.1) errors.push('가림 모델과 건물 모델의 원점·외곽 크기가 일치하지 않습니다.')
    occlusion.traverse(node => {
      if (node.isSkinnedMesh || node.morphTargetInfluences?.length) errors.push('가림 모델은 정적 메시여야 합니다.')
    })
  }
  return { dimensions: dimensions.toArray(), errors }
}

export function measureResources(roots) {
  let triangles = 0, drawCalls = 0, maxTextureSize = 0
  const textures = new Set()
  for (const root of roots) root.traverse(node => {
    if (!node.isMesh && !node.isLine && !node.isPoints) return
    drawCalls += Array.isArray(node.material) ? Math.max(1, node.geometry.groups.length) : 1
    if (node.isMesh) triangles += ((node.geometry.index?.count ?? node.geometry.attributes.position?.count ?? 0) / 3) * (node.isInstancedMesh ? node.count : 1)
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      if (!material) continue
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value)
    }
  })
  for (const texture of textures) {
    const image = texture.image
    maxTextureSize = Math.max(maxTextureSize, image?.width ?? 0, image?.height ?? 0)
  }
  const errors = []
  if (triangles > MOBILE_BUDGET.triangles) errors.push(`삼각형 예산을 초과했습니다: ${Math.ceil(triangles)} / ${MOBILE_BUDGET.triangles}`)
  if (drawCalls > MOBILE_BUDGET.drawCalls) errors.push(`드로 콜 상한을 초과했습니다: ${drawCalls} / ${MOBILE_BUDGET.drawCalls}`)
  if (maxTextureSize > MOBILE_BUDGET.textureSize) errors.push(`텍스처가 ${MOBILE_BUDGET.textureSize}px를 초과합니다.`)
  return { triangles: Math.ceil(triangles), drawCalls, maxTextureSize, errors }
}

export function disposeResources(roots) {
  const geometries = new Set(), materials = new Set(), textures = new Set()
  for (const root of roots) root?.traverse(node => {
    if (node.geometry) geometries.add(node.geometry)
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      if (!material) continue
      materials.add(material)
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value)
    }
    node.skeleton?.dispose()
  })
  geometries.forEach(geometry => geometry.dispose())
  materials.forEach(material => material.dispose())
  textures.forEach(texture => { texture.dispose(); texture.image?.close?.() })
}
