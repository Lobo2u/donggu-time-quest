import { Group } from 'three'

// Export the measured building, without AR world transforms, depth-only
// materials, debug geometry, particles or a claim of a baked musical show.
export async function exportBuildingUSDZ(stage) {
  stage.assertUsable()
  if (stage.diagnostics.geometry.errors.length) throw new Error('건물 모델의 치수와 구조 노드 오류를 먼저 해결하세요.')
  const { USDZExporter } = await import('three/addons/exporters/USDZExporter.js')
  const root = new Group()
  root.name = `building-${stage.manifest.id}`
  root.scale.setScalar(stage.manifest.modelToFacade.scale)
  const visual = stage.visual.clone(true)
  visual.visible = true
  root.add(visual)
  root.updateMatrixWorld(true)
  return new USDZExporter().parseAsync(root, { includeAnchoringProperties: false,
    quickLookCompatible: true, maxTextureSize: 2048 })
}
