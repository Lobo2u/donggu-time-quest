export const MOBILE_BUDGET = Object.freeze({
  triangles: 100_000,
  drawCalls: 100,
  particles: 256,
  textureSize: 2048,
  assetBytes: 30 * 1024 * 1024,
})

export const ANCHOR_KINDS = ['window', 'wall', 'column', 'entrance', 'roof', 'outline', 'protrusion', 'path']
export const EFFECTS = ['window-light', 'outline-flow', 'stars', 'character', 'wall-wash', 'roof-beam']
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/
export const vector = (value, length = 3) => Array.isArray(value)
  && value.length === length && value.every(Number.isFinite)
export const quaternion = value => vector(value, 4)
  && Math.abs(Math.hypot(...value) - 1) < 0.001
const text = value => typeof value === 'string' && value.trim().length > 0

// A blank intake form, deliberately containing no invented building geometry.
export function createManifestTemplate() {
  return {
    schemaVersion: 1,
    id: '', name: '', revision: '', status: 'draft',
    coordinateSystem: { units: 'meters', up: '+Y', front: '+Z' },
    sources: [],
    model: { glbUrl: '', occlusionGlbUrl: '', usdzUrl: '', posterUrl: '' },
    dimensionsMeters: [0, 0, 0],
    modelToFacade: { position: [0, 0, 0], quaternion: [0, 0, 0, 1], scale: 1 },
    anchors: [], controlPoints: [], characters: [], audioUrl: '',
    timeline: null,
  }
}

export function isAssetUrl(value, extension) {
  if (!text(value) || /[\\\u0000-\u001f]/.test(value)) return false
  try {
    const url = new URL(value, 'https://assets.invalid/project/')
    return ['https:', 'http:'].includes(url.protocol)
      && !url.username && !url.password
      && (!extension || url.pathname.toLowerCase().endsWith(extension))
  } catch { return false }
}

export function validateManifest(manifest) {
  const errors = []
  const warnings = []
  const require = (condition, message) => { if (!condition) errors.push(message) }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return { valid: false, errors: ['건물 명세는 JSON 객체여야 합니다.'], warnings }
  }
  require(manifest.schemaVersion === 1, 'schemaVersion은 1이어야 합니다.')
  require(ID.test(manifest.id ?? ''), '건물 id에 영문·숫자·밑줄·하이픈을 입력하세요.')
  require(text(manifest.name) && text(manifest.revision), '건물 이름과 모델 revision이 필요합니다.')
  require(['draft', 'surveyed'].includes(manifest.status), 'status는 draft 또는 surveyed여야 합니다.')
  const coordinates = manifest.coordinateSystem
  require(coordinates?.units === 'meters' && coordinates?.up === '+Y' && coordinates?.front === '+Z',
    '건물 좌표계는 미터, 위쪽 +Y, 정면 +Z로 통일하세요.')
  require(vector(manifest.dimensionsMeters) && manifest.dimensionsMeters.every(n => n > 0),
    '실측한 dimensionsMeters [폭, 높이, 깊이]가 필요합니다.')
  require(isAssetUrl(manifest.model?.glbUrl, '.glb'), '건물 GLB 경로가 필요합니다.')
  for (const [key, extension] of [['occlusionGlbUrl', '.glb'], ['usdzUrl', '.usdz'], ['posterUrl', null]]) {
    const value = manifest.model?.[key]
    require(!value || isAssetUrl(value, extension), `model.${key} 경로를 확인하세요.`)
  }
  const transform = manifest.modelToFacade
  require(vector(transform?.position) && quaternion(transform?.quaternion)
    && Number.isFinite(transform?.scale) && transform.scale > 0,
  'modelToFacade의 위치, 정규화된 quaternion, 양수 균일 scale이 필요합니다.')
  require(Array.isArray(manifest.sources) && manifest.sources.length > 0,
    '실제 건물 사진·도면·실측·스캔 중 하나 이상의 출처가 필요합니다.')
  if (Array.isArray(manifest.sources)) for (const source of manifest.sources) {
    require(source && ['photo', 'drawing', 'survey', 'scan'].includes(source.kind)
      && text(source.uri) && text(source.description), '출처에 kind, uri, description을 입력하세요.')
  }
  if (manifest.status !== 'surveyed') warnings.push('실측 확인 전 모델입니다. 현장 공연이 잠겨 있습니다.')
  if (!manifest.model?.occlusionGlbUrl) warnings.push('가림 전용 GLB가 없어 건물 GLB의 복사본으로 깊이를 기록합니다.')

  const anchors = Array.isArray(manifest.anchors) ? manifest.anchors : []
  require(anchors.length > 0 && anchors.length <= 512, '구조별 앵커를 1~512개 정의하세요.')
  const anchorIds = new Set()
  for (const anchor of anchors) {
    if (!anchor || typeof anchor !== 'object') { errors.push('앵커 형식을 확인하세요.'); continue }
    require(ID.test(anchor.id ?? '') && !anchorIds.has(anchor.id), `앵커 id가 잘못되었거나 중복됩니다: ${anchor.id}`)
    anchorIds.add(anchor.id)
    require(ANCHOR_KINDS.includes(anchor.kind), `앵커 종류를 확인하세요: ${anchor.id}`)
    require(vector(anchor.position) && quaternion(anchor.quaternion), `앵커 로컬 위치·회전을 확인하세요: ${anchor.id}`)
    if (['window', 'wall'].includes(anchor.kind)) {
      require(vector(anchor.sizeMeters, 2) && anchor.sizeMeters.every(n => n > 0), `평면 앵커 크기가 필요합니다: ${anchor.id}`)
    }
    if (anchor.kind === 'outline') {
      require(Array.isArray(anchor.points) && anchor.points.length >= 2 && anchor.points.length <= 2048
        && anchor.points.every(p => vector(p)), `윤곽선 앵커의 로컬 points가 필요합니다: ${anchor.id}`)
    }
    require(!anchor.node || text(anchor.node), `앵커 node 이름을 확인하세요: ${anchor.id}`)
  }

  const points = Array.isArray(manifest.controlPoints) ? manifest.controlPoints : []
  require(points.length >= 4 && points.length <= 64, '정합 검증용 기준점을 4~64개 정의하세요.')
  const pointIds = new Set()
  for (const point of points) {
    require(point && ID.test(point.id ?? '') && !pointIds.has(point.id) && vector(point.position), '기준점 id·로컬 좌표·중복을 확인하세요.')
    if (point) pointIds.add(point.id)
  }
  if (points.length >= 4 && points.every(p => vector(p?.position)) && vector(manifest.dimensionsMeters)) {
    // Four samples of the same corner cannot validate a building facade.
    for (const axis of [0, 1]) {
      const values = points.map(p => p.position[axis])
      require(Math.max(...values) - Math.min(...values) >= manifest.dimensionsMeters[axis] * 0.5,
        '기준점은 건물 폭과 높이의 절반 이상을 덮도록 분산하세요.')
    }
  }

  const characters = Array.isArray(manifest.characters) ? manifest.characters : []
  require(Array.isArray(manifest.characters) && characters.length <= 8, 'characters는 최대 8개의 배열이어야 합니다.')
  const characterIds = new Set()
  for (const character of characters) {
    if (!character || typeof character !== 'object') { errors.push('캐릭터 형식을 확인하세요.'); continue }
    require(ID.test(character.id ?? '') && !characterIds.has(character.id), '캐릭터 id를 확인하세요.')
    characterIds.add(character.id)
    require(isAssetUrl(character.glbUrl, '.glb') && Number.isFinite(character.scale) && character.scale > 0,
      `캐릭터 GLB·scale을 확인하세요: ${character.id}`)
    require(text(character.clip), `공연 애니메이션 clip 이름이 필요합니다: ${character.id}`)
    require(Array.isArray(character.route) && character.route.length >= 2
      && character.route.every(id => anchorIds.has(id)), `실제 구조를 따르는 route 앵커가 필요합니다: ${character.id}`)
    const entry = anchors.find(a => a.id === character.route?.[0])
    require(entry && ['window', 'entrance'].includes(entry.kind), `캐릭터 route는 창문 또는 출입구에서 시작해야 합니다: ${character.id}`)
  }
  require(!manifest.audioUrl || isAssetUrl(manifest.audioUrl), '공연 오디오 경로를 확인하세요.')
  if (!manifest.audioUrl) warnings.push('음악이 없습니다. 현장 뮤지컬 공연은 오디오를 연결한 뒤 시작할 수 있습니다.')
  if (manifest.timeline) errors.push(...validateTimeline(manifest.timeline, anchors, characters))
  return { valid: errors.length === 0, errors, warnings }
}

export function validateTimeline(timeline, anchors, characters) {
  const errors = []
  const anchorMap = new Map(anchors.filter(Boolean).map(a => [a.id, a]))
  const characterIds = new Set(characters.filter(Boolean).map(c => c.id))
  if (!Number.isFinite(timeline.duration) || timeline.duration <= 0 || timeline.duration > 1800
    || !Array.isArray(timeline.cues) || timeline.cues.length > 512 || !Array.isArray(timeline.scenes)) {
    return ['타임라인은 1,800초 이하, cues 512개 이하, scenes 배열이 필요합니다.']
  }
  for (const scene of timeline.scenes) {
    if (!scene || !text(scene.name) || !Number.isFinite(scene.start) || !Number.isFinite(scene.end)
      || scene.start < 0 || scene.end <= scene.start || scene.end > timeline.duration) errors.push('장면 이름·시작·종료 시간을 확인하세요.')
  }
  const ids = new Set()
  const characterIntervals = new Map()
  for (const cue of timeline.cues) {
    if (!cue || !ID.test(cue.id ?? '') || ids.has(cue.id)) { errors.push('큐 id가 잘못되었거나 중복됩니다.'); continue }
    ids.add(cue.id)
    const anchor = anchorMap.get(cue.anchorId)
    if (!EFFECTS.includes(cue.effect) || !anchor || !Number.isFinite(cue.start) || !Number.isFinite(cue.end)
      || cue.start < 0 || cue.end <= cue.start || cue.end > timeline.duration) errors.push(`큐 종류·앵커·시간을 확인하세요: ${cue.id}`)
    if (!/^#[0-9a-fA-F]{6}$/.test(cue.color ?? '')) errors.push(`큐 color는 #RRGGBB여야 합니다: ${cue.id}`)
    if (!Number.isFinite(cue.intensity) || cue.intensity < 0 || cue.intensity > 1) errors.push(`큐 intensity는 0~1이어야 합니다: ${cue.id}`)
    if (cue.pulseHz !== undefined && (!Number.isFinite(cue.pulseHz) || cue.pulseHz < 0 || cue.pulseHz > 4)) errors.push(`pulseHz는 0~4여야 합니다: ${cue.id}`)
    const kinds = { 'window-light': ['window'], 'wall-wash': ['wall'], 'roof-beam': ['roof'], 'outline-flow': ['outline'] }
    if (kinds[cue.effect] && !kinds[cue.effect].includes(anchor?.kind)) errors.push(`효과와 건축 구조가 일치하지 않습니다: ${cue.id}`)
    if (cue.effect === 'stars' && (!Number.isInteger(cue.count) || cue.count < 1 || cue.count > MOBILE_BUDGET.particles
      || !['gather', 'spread'].includes(cue.motion))) errors.push(`별빛 count·motion을 확인하세요: ${cue.id}`)
    if (cue.effect === 'character') {
      if (!characterIds.has(cue.characterId)) errors.push(`캐릭터가 없습니다: ${cue.characterId}`)
      if (cue.routeMode !== undefined && !['forward', 'ping-pong'].includes(cue.routeMode)) errors.push(`캐릭터 routeMode를 확인하세요: ${cue.id}`)
      for (const key of ['cycleSeconds', 'emergeSeconds', 'clipOffsetSeconds']) {
        if (cue[key] !== undefined && (!Number.isFinite(cue[key]) || cue[key] < 0 || (key === 'cycleSeconds' && cue[key] === 0))) errors.push(`캐릭터 ${key}를 확인하세요: ${cue.id}`)
      }
      const intervals = characterIntervals.get(cue.characterId) ?? []
      if (intervals.some(other => cue.start < other.end && cue.end > other.start)) errors.push(`같은 캐릭터의 큐가 겹칩니다: ${cue.characterId}`)
      intervals.push(cue)
      characterIntervals.set(cue.characterId, intervals)
    }
  }
  return errors
}

export function resolveAssetUrl(value, baseUrl) {
  if (!isAssetUrl(value)) throw new Error('에셋 URL을 확인하세요.')
  return new URL(value, baseUrl).href
}
