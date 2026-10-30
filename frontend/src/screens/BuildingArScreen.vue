<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AmbientLight, Box3, Color, DirectionalLight, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createBuildingStage } from '../ar/buildingStage.js'
import { exportBuildingUSDZ } from '../ar/exportUSDZ.js'
import { createManifestTemplate, resolveAssetUrl, validateManifest } from '../ar/manifest.js'
import { detectArCapabilities, quickLookUrl } from '../ar/platform.js'
import { INITIAL_SCENES } from '../ar/timeline.js'

const router = useRouter()
const viewport = ref(null)
const manifest = ref(null)
const diagnostics = ref(null)
const errors = ref([])
const loading = ref(false)
const exporting = ref(false)
const inspectionMode = ref('solid')
const assetBase = ref('')
const localFiles = ref([])
const capabilities = ref({ webxr: false, quickLook: false, secure: false })
const rendererError = ref('')
const notice = ref('')
const renderCalls = ref(0)
let renderer, scene, camera, controls, observer, frameId, stage, abort, generation = 0
const objectUrls = new Map()
const scenes = computed(() => manifest.value?.timeline?.scenes ?? INITIAL_SCENES)
const modelErrors = computed(() => [...(diagnostics.value?.geometry.errors ?? []), ...(diagnostics.value?.budget.errors ?? [])])
const quickLookHref = computed(() => {
  try { return manifest.value?.model.usdzUrl ? quickLookUrl(resolveAssetUrl(manifest.value.model.usdzUrl, assetBase.value)) : '' }
  catch { return '' }
})
const posterHref = computed(() => {
  try { return manifest.value?.model.posterUrl ? resolveAssetUrl(manifest.value.model.posterUrl, assetBase.value) : `${import.meta.env.BASE_URL}pwa-icon.svg` }
  catch { return `${import.meta.env.BASE_URL}pwa-icon.svg` }
})
const status = computed(() => !manifest.value ? '실제 건물 자료 대기'
  : loading.value ? '모델을 불러오는 중' : !diagnostics.value ? '모델 로딩 필요'
    : modelErrors.value.length ? '모델 규격 수정 필요' : '현장 정합 검증 대기')

function download(name, data, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([type === 'application/json' ? JSON.stringify(data, null, 2) : data], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

async function importManifest(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    if (file.size > 1024 * 1024) throw new Error('건물 명세 JSON은 1MiB 이하여야 합니다.')
    const parsed = JSON.parse(await file.text())
    const validation = validateManifest(parsed)
    if (!validation.valid) { errors.value = validation.errors; return }
    manifest.value = parsed
    await loadModel()
  } catch (error) { errors.value = [error.message] }
  finally { event.target.value = '' }
}

async function importGlbs(event) {
  const files = [...(event.target.files ?? [])]
  if (!files.length) return
  abort?.abort()
  generation++
  stage?.dispose()
  stage = null
  diagnostics.value = null
  for (const file of files) {
    if (!file.name.toLowerCase().endsWith('.glb') || file.size > 30 * 1024 * 1024) {
      errors.value = ['각 GLB는 30MiB 이하여야 합니다.']
      event.target.value = ''
      return
    }
  }
  for (const file of files) {
    if (objectUrls.has(file.name)) URL.revokeObjectURL(objectUrls.get(file.name))
    objectUrls.set(file.name, URL.createObjectURL(file))
  }
  localFiles.value = [...objectUrls.keys()]
  event.target.value = ''
  if (manifest.value) await loadModel()
}

async function loadModel() {
  if (!manifest.value || !scene) return
  abort?.abort()
  const current = ++generation
  abort = new AbortController()
  loading.value = true
  errors.value = []
  notice.value = ''
  stage?.dispose()
  stage = null
  diagnostics.value = null
  try {
    const created = await createBuildingStage(manifest.value, {
      baseUrl: assetBase.value,
      signal: abort.signal,
      resolve: url => objectUrls.get(decodeURIComponent(new URL(url).pathname.split('/').at(-1))) ?? url,
    })
    if (current !== generation) { created.dispose(); return }
    stage = created
    stage.mountPreview(scene)
    stage.setInspectionMode(inspectionMode.value)
    diagnostics.value = stage.diagnostics
    const box = new Box3().setFromObject(stage.visual)
    const center = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3()).length()
    controls.target.copy(center)
    camera.position.copy(center).add(new Vector3(size * 0.7, size * 0.3, size * 1.1))
    camera.far = Math.max(500, size * 10)
    camera.updateProjectionMatrix()
    controls.update()
  } catch (error) {
    if (current === generation && error.name !== 'AbortError') errors.value = [error.message]
  } finally { if (current === generation) loading.value = false }
}

function inspect(mode) {
  inspectionMode.value = mode
  stage?.setInspectionMode(mode)
}

async function saveUsdz() {
  if (!stage) return
  exporting.value = true
  errors.value = []
  try {
    const data = await exportBuildingUSDZ(stage)
    download(`${stage.manifest.id}-${stage.manifest.revision}-building.usdz`, data, 'model/vnd.usdz+zip')
    notice.value = '건물 형상 USDZ를 저장했습니다. 공연 애니메이션은 포함하지 않습니다.'
  } catch (error) { errors.value = [error.message] }
  finally { exporting.value = false }
}

function saveScenario() {
  if (!stage) return
  download(`${stage.manifest.id}-performance.json`, { ...manifest.value, timeline: stage.timeline })
}

onMounted(async () => {
  assetBase.value = new URL(import.meta.env.BASE_URL, location.href).href
  capabilities.value = await detectArCapabilities()
  await nextTick()
  if (!viewport.value) return
  try {
    scene = new Scene()
    scene.background = new Color('#101e24')
    camera = new PerspectiveCamera(45, 1, 0.05, 500)
    camera.position.set(15, 8, 20)
    renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' })
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5))
    viewport.value.prepend(renderer.domElement)
    renderer.domElement.setAttribute('aria-label', '실제 건물 GLB 검사 화면')
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    scene.add(new AmbientLight('#ffffff', 2))
    const key = new DirectionalLight('#ffeac4', 3)
    key.position.set(10, 20, 15)
    scene.add(key)
    observer = new ResizeObserver(() => {
      const { clientWidth: width, clientHeight: height } = viewport.value
      renderer.setSize(width, height)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    })
    observer.observe(viewport.value)
    let lastStats = 0
    const render = time => {
      frameId = requestAnimationFrame(render)
      controls.update()
      renderer.render(scene, camera)
      if (time - lastStats > 600) { renderCalls.value = renderer.info.render.calls; lastStats = time }
    }
    frameId = requestAnimationFrame(render)
  } catch (error) { rendererError.value = `3D 검사 화면을 열지 못했습니다: ${error.message}` }
})

onBeforeUnmount(() => {
  generation++
  abort?.abort()
  cancelAnimationFrame(frameId)
  observer?.disconnect()
  stage?.dispose()
  controls?.dispose()
  renderer?.dispose()
  renderer?.domElement.remove()
  objectUrls.forEach(url => URL.revokeObjectURL(url))
})
</script>

<template>
  <main class="building-workbench">
    <header class="workbench-header">
      <button class="back-link" @click="router.push('/map')">← 지도</button>
      <span class="workbench-brand">TIME QUEST <span>/ AR STAGE</span></span>
      <span class="status-pill">{{ status }}</span>
    </header>

    <div class="workbench-intro">
      <p class="eyebrow">실제 건물 기반 AR 뮤지컬</p>
      <h1>건물을 무대로</h1>
      <p>건물의 크기와 구조를 먼저 확인하고, 같은 좌표 위에 공연을 연결합니다.</p>
    </div>

    <div class="workbench-layout">
      <section class="preview-panel" aria-label="건물 모델 검사">
        <div class="preview-toolbar">
          <div><span class="live-dot"></span><strong>{{ manifest?.name || '건물 모델' }}</strong><small>{{ manifest?.revision || '자료를 등록해 주세요' }}</small></div>
          <div class="mode-tabs" aria-label="모델 표시 방식">
            <button v-for="mode in [{ id: 'solid', label: '외관' }, { id: 'wireframe', label: '윤곽' }, { id: 'occlusion', label: '가림 모델' }]"
              :key="mode.id" :aria-pressed="inspectionMode === mode.id" :disabled="!diagnostics" @click="inspect(mode.id)">{{ mode.label }}</button>
          </div>
        </div>
        <div ref="viewport" class="model-viewport">
          <div v-if="!diagnostics || rendererError" class="preview-empty">
            <span class="empty-mark" aria-hidden="true">＋</span>
            <h2>{{ loading ? '실제 건물 모델을 불러오고 있습니다' : '실제 건물 자료가 필요합니다' }}</h2>
            <p>{{ rendererError || '건물 명세와 GLB를 등록하면 외관·윤곽·가림 모델을 확인할 수 있습니다.' }}</p>
            <span class="empty-note">사진과 실측을 확인한 모델만 사용합니다.</span>
          </div>
          <div v-else class="viewport-caption"><span>3D 모델 검사 · 현장 AR 아님</span><span>드래그 회전 · 두 손가락 확대</span></div>
        </div>
        <div class="preview-footer">
          <span>좌표 <strong>미터 · +Y 위쪽 · +Z 정면</strong></span>
          <span v-if="diagnostics">{{ diagnostics.budget.triangles.toLocaleString() }} triangles · {{ renderCalls }} calls</span>
          <span v-else>정합 검증 후 공연 연결</span>
        </div>
      </section>

      <aside class="intake-panel">
        <span class="section-number">01 / BUILDING</span>
        <h2>실측 건물 등록</h2>
        <p class="panel-description">사진·도면·실측 출처, 구조별 앵커와 검증 기준점을 건물 명세에 기록해 주세요.</p>
        <label class="upload-button">건물 명세 JSON 불러오기<input type="file" accept=".json,application/json" @change="importManifest" /></label>
        <label class="upload-button secondary">로컬 GLB 선택<input type="file" accept=".glb" multiple @change="importGlbs" /></label>
        <small class="field-help">로컬 GLB는 명세 경로의 파일명과 같아야 합니다. 외부 파일이 없는 GLB를 사용하세요.</small>
        <ul v-if="localFiles.length" class="file-list"><li v-for="name in localFiles" :key="name">{{ name }}</li></ul>
        <button class="text-button" @click="download('building-manifest.template.json', createManifestTemplate())">빈 건물 명세 양식 저장 ↓</button>
        <label class="base-field">에셋 기준 주소<input v-model="assetBase" type="url" placeholder="https://…/ar/buildings/site/" /></label>
        <button v-if="manifest" class="text-button" :disabled="loading" @click="loadModel">이 주소로 모델 다시 불러오기 ↻</button>
        <div class="registration-state">
          <span class="state-dot" :class="{ loaded: diagnostics && !modelErrors.length }"></span>
          <div><strong>{{ diagnostics ? modelErrors.length ? '모델 규격을 확인해 주세요' : '모델 규격 검사 완료' : '모델 미등록' }}</strong><p>{{ diagnostics ? '현장 외벽 정합은 별도 검증이 필요합니다.' : '실제 건물을 임의 모형으로 대체하지 않습니다.' }}</p></div>
        </div>
        <button class="export-button" :disabled="!diagnostics || !!modelErrors.length || exporting || loading" @click="saveUsdz">{{ exporting ? 'USDZ 변환 중…' : '건물 형상 USDZ 저장' }}</button>
        <small class="field-help">iPhone용 건물 형상 변환입니다. 공연·가림 셰이더·기존 정합 좌표는 포함하지 않습니다.</small>
      </aside>
    </div>

    <div v-if="errors.length || modelErrors.length" class="error-panel" role="alert"><strong>확인이 필요합니다</strong><ul><li v-for="(error, i) in [...errors, ...modelErrors]" :key="i">{{ error }}</li></ul></div>
    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <ul v-if="diagnostics?.warnings.length" class="warning-list"><li v-for="warning in diagnostics.warnings" :key="warning">{{ warning }}</li></ul>

    <section class="timeline-panel" aria-label="공연 구성">
      <div class="section-heading"><div><span class="section-number">02 / PERFORMANCE</span><h2>건물 위의 네 장면</h2></div><button class="text-button" :disabled="!diagnostics || !!modelErrors.length" @click="saveScenario">연출 명세 저장 ↓</button></div>
      <p class="panel-description">실제 구조별 앵커를 사용하는 초기 연출안입니다. 모델과 현장 정합을 검증한 뒤 공연을 시작합니다.</p>
      <div class="scene-list"><article v-for="(part, i) in scenes" :key="i"><span class="scene-index">0{{ i + 1 }}</span><span class="scene-range">{{ part.start }}–{{ part.end }}초</span><h3>{{ part.name }}</h3><p>{{ ['창문 점등 · 윤곽선 빛 · 별빛 집결', '창문·출입구 등장 · 건물 구조 이동', '음악 동기화 · 벽면 색상 · 파티클', '건물 별빛 · 지붕 광선 · 최종 윤곽'][i] || '건물 앵커에 연결된 장면' }}</p></article></div>
      <div class="performance-lock"><span aria-hidden="true">○</span><div><strong>현장 공연 연결 대기</strong><p>기존 외벽 정합 코드 연결 → 세 관찰 위치에서 기준점 검증 → 음악과 공연 시작</p></div><button disabled>공연 시작</button></div>
    </section>

    <section class="platform-panel" aria-label="기기별 실행 경로">
      <div><span class="section-number">03 / ON DEVICE</span><h2>기기별 공연 경로</h2></div>
      <article><h3>Android · WebXR</h3><p>{{ capabilities.webxr ? '이 브라우저에서 AR 세션을 지원합니다.' : '이 브라우저에서 WebXR AR 지원이 확인되지 않았습니다.' }} 기존 외벽 좌표와 렌더링 루프에 연결해 실시간 공연을 제어합니다.</p></article>
      <article><h3>iPhone · Quick Look</h3><p>USDZ를 별도 AR 화면에서 배치합니다. 웹 공연 제어와 기존 정합 좌표는 전달되지 않습니다. 같은 실시간 공연은 기존 웹 추적 경로 또는 RealityKit 연동이 필요합니다.</p>
        <a v-if="capabilities.quickLook && quickLookHref && diagnostics && !modelErrors.length" rel="ar" :href="quickLookHref" class="quick-look-link"><img :src="posterHref" alt="건물 USDZ를 Quick Look에서 별도 배치" /><span>USDZ 별도 배치로 열기 ↗</span></a></article>
    </section>
  </main>
</template>

<style scoped>
.building-workbench { width: min(1180px, 100%); min-height: calc(100dvh - 32px); background: #f7f8f2; color: #233330; padding: 0 32px 36px; border-radius: 20px; font-size: 14px; }
.workbench-header { min-height: 76px; border-bottom: 1px solid #dfe5d9; display: flex; align-items: center; gap: 22px; flex-wrap: wrap; padding: 15px 0; }
.workbench-brand { font-size: 13px; font-weight: 900; letter-spacing: 1px; }.workbench-brand span { color: #737f75; font-weight: 600; }
button, input { font: inherit; }button, .upload-button { cursor: pointer; }button:disabled { cursor: default; opacity: .45; }button:focus-visible, input:focus-visible, a:focus-visible, .upload-button:focus-within { outline: 3px solid #638d2c; outline-offset: 3px; }
.back-link { border: 0; background: none; color: #53634c; font-weight: 700; }.status-pill { margin-left: auto; background: #eaf0d9; border: 1px solid #d1dcba; padding: 7px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; color: #52672c; }
.workbench-intro { padding: 30px 0 26px; }.eyebrow, .section-number { color: #6a7d4d; letter-spacing: 1.3px; font-weight: 800; font-size: 10px; }.workbench-intro h1 { font-size: 36px; letter-spacing: -1.5px; margin: 7px 0 8px; }.workbench-intro > p:last-child { color: #6b756f; font-size: 13px; line-height: 1.7; word-break: keep-all; }
.workbench-layout { display: grid; grid-template-columns: minmax(0, 1fr) 310px; gap: 20px; }.preview-panel { overflow: hidden; border-radius: 16px; border: 1px solid #263a3d; background: #101e24; min-width: 0; }.preview-toolbar { min-height: 62px; display: flex; gap: 10px; justify-content: space-between; align-items: center; flex-wrap: wrap; padding: 15px 17px; background: #17282d; color: #edf3ed; }.preview-toolbar > div:first-child { display: flex; align-items: center; gap: 8px; }.preview-toolbar strong { font-size: 12px; }.preview-toolbar small { font-size: 10px; color: #9aafa8; }.live-dot { width: 5px; height: 5px; border-radius: 50%; background: #c4dc81; }.mode-tabs { display: flex; gap: 3px; }.mode-tabs button { border: 0; border-radius: 6px; padding: 6px 9px; background: transparent; color: #adc0b8; font-size: 10px; }.mode-tabs button[aria-pressed=true] { background: #35474a; color: white; }
.model-viewport { position: relative; height: 390px; overflow: hidden; }.model-viewport :deep(canvas) { display: block; width: 100%; height: 100%; touch-action: none; }.preview-empty { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28px; text-align: center; pointer-events: none; background: radial-gradient(ellipse at center, #24383677, transparent 65%); }.empty-mark { color: #95ada0; font-size: 32px; font-weight: 400; border: 1px dashed #546b62; border-radius: 12px; width: 60px; height: 60px; display: grid; place-items: center; margin-bottom: 22px; }.preview-empty h2 { color: #edf4ec; font-size: 17px; letter-spacing: -.5px; }.preview-empty p { color: #9eb0a6; font-size: 12px; max-width: 290px; line-height: 1.9; margin-top: 10px; word-break: keep-all; }.empty-note { font-size: 10px; color: #829487; margin-top: 24px; }.viewport-caption { position: absolute; bottom: 15px; left: 18px; right: 18px; display: flex; justify-content: space-between; color: #d2dfd6; font-size: 10px; pointer-events: none; gap: 10px; }.preview-footer { background: #17282d; color: #91a49b; display: flex; justify-content: space-between; padding: 13px 17px; font-size: 9px; gap: 10px; }.preview-footer strong { color: #bdcbc2; margin-left: 5px; font-weight: 500; }
.intake-panel { background: #fff; border: 1px solid #e0e5d9; border-radius: 16px; padding: 23px 21px; }h2 { font-size: 19px; letter-spacing: -.5px; margin-top: 6px; }.panel-description { font-size: 11px; color: #768074; line-height: 1.8; margin: 10px 0 18px; word-break: keep-all; }.upload-button { display: block; text-align: center; color: white; background: #526d28; padding: 12px 10px; border-radius: 9px; font-size: 12px; font-weight: 700; margin-top: 8px; }.upload-button.secondary { color: #496043; background: #f0f4e9; border: 1px solid #dce5d0; }.upload-button input { position: absolute; width: 1px; height: 1px; opacity: 0; }.field-help { display: block; font-size: 10px; line-height: 1.8; color: #7e877e; margin-top: 9px; word-break: keep-all; }.text-button { color: #526b3d; background: none; border: 0; font-weight: 700; font-size: 11px; padding: 10px 0; }.base-field { display: block; margin-top: 8px; color: #687762; font-size: 10px; }.base-field input { display: block; width: 100%; border: 1px solid #dde4d8; border-radius: 6px; padding: 8px; margin-top: 6px; font-size: 10px; }.file-list { list-style: none; font-size: 10px; color: #536e40; padding-top: 8px; overflow-wrap: anywhere; }.registration-state { display: flex; gap: 9px; align-items: flex-start; margin: 14px 0; padding: 13px 0; border-top: 1px solid #ebeee6; border-bottom: 1px solid #ebeee6; }.state-dot { height: 6px; width: 6px; background: #c5cdbd; border-radius: 50%; margin-top: 5px; }.state-dot.loaded { background: #5e8e24; }.registration-state strong { font-size: 11px; }.registration-state p { color: #8a9286; font-size: 10px; margin-top: 5px; line-height: 1.5; }.export-button { width: 100%; background: #fff; border: 1px solid #d9e1d0; border-radius: 8px; padding: 10px; color: #415436; font-size: 11px; font-weight: 700; }
.error-panel { margin-top: 18px; padding: 16px 20px; color: #863e30; background: #fff1ea; border-radius: 12px; font-size: 12px; line-height: 1.8; }.error-panel ul, .warning-list { padding-left: 18px; }.error-panel li { white-space: pre-line; overflow-wrap: anywhere; }.warning-list { margin: 14px 0; color: #867044; font-size: 11px; line-height: 1.8; }.notice { font-size: 12px; color: #4e702c; padding-top: 16px; }
.timeline-panel { margin-top: 24px; padding: 24px; background: #fff; border: 1px solid #e0e5d9; border-radius: 16px; }.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }.scene-list { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); border: 1px solid #e1e7db; border-radius: 12px; overflow: hidden; }.scene-list article { position: relative; padding: 18px; background: #fafbf6; border-right: 1px solid #e1e7db; }.scene-list article:last-child { border-right: 0; }.scene-index { font-size: 22px; font-weight: 600; color: #a7b492; }.scene-range { float: right; color: #87917e; font-size: 9px; padding-top: 8px; }.scene-list h3 { font-size: 12px; margin: 12px 0 7px; }.scene-list p { font-size: 10px; line-height: 1.8; color: #7e8875; word-break: keep-all; }.performance-lock { display: flex; align-items: center; gap: 12px; margin-top: 18px; background: #f1f4eb; border-radius: 10px; padding: 14px 17px; }.performance-lock > span { font-size: 24px; color: #869677; }.performance-lock strong { font-size: 11px; }.performance-lock p { font-size: 10px; color: #7f8b73; line-height: 1.7; margin-top: 3px; }.performance-lock button { margin-left: auto; border: 1px solid #ced7c5; background: white; color: #6d7c62; border-radius: 8px; padding: 9px 15px; font-size: 11px; white-space: nowrap; }
.platform-panel { display: grid; grid-template-columns: 180px 1fr 1fr; gap: 24px; padding: 25px 2px 0; }.platform-panel h2 { font-size: 17px; }.platform-panel h3 { font-size: 12px; margin-bottom: 8px; }.platform-panel p { font-size: 10px; color: #7e8877; line-height: 1.9; word-break: keep-all; }.quick-look-link { display: flex; align-items: center; gap: 8px; margin-top: 12px; color: #4c6935; font-size: 11px; }.quick-look-link img { width: 30px; height: 30px; object-fit: cover; border-radius: 5px; }
@media(max-width: 860px) { .building-workbench { padding: 0 18px 25px; border-radius: 0; }.workbench-layout { grid-template-columns: minmax(0,1fr); }.intake-panel { padding: 21px; }.model-viewport { height: 340px; }.platform-panel { grid-template-columns: 1fr 1fr; gap: 18px; }.platform-panel > div { grid-column: 1/-1; }.status-pill { font-size: 9px; }.scene-list { grid-template-columns: repeat(2,minmax(0,1fr)); }.scene-list article { border-bottom: 1px solid #e1e7db; }.scene-list article:nth-child(2) { border-right: 0; }.scene-list article:nth-child(n+3) { border-bottom: 0; }.workbench-brand { font-size: 10px; letter-spacing: .4px; }.workbench-header { gap: 12px; }.workbench-intro h1 { font-size: 30px; }.timeline-panel { padding: 20px 16px; } }
@media(max-width: 430px) { .preview-toolbar { padding: 12px; }.preview-toolbar small { display: none; }.preview-footer { font-size: 8px; padding: 12px; }.viewport-caption { font-size: 8px; }.status-pill { margin-left: 0; }.workbench-header { justify-content: space-between; }.scene-list article { padding: 14px; }.performance-lock { padding: 12px; flex-wrap: wrap; }.performance-lock p { font-size: 9px; }.platform-panel { grid-template-columns: 1fr; }.model-viewport { height: 300px; } }
</style>
