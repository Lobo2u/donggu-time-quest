<script setup>
// 관리자 전용 '입체(3D) 과거 건물' 등록 화면.
// Blender 로 만든 건물 GLB 를 장소별로 올리고(로컬 파일=IndexedDB / 정적·http URL),
// iOS 용 USDZ·제미나이 영상 배경·크기·회전을 함께 저장한다.
// 저장한 자료는 플레이어의 '입체로 보기'(/ar-view/:locationId)에서 바로 쓰인다.
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useArViewer } from '../composables/useArViewer.js'
import {
  LOCATION_IDS, LOCATION_NAMES, arModels,
  getModel, saveModel, clearModel, putBlob, deleteBlob, resolveGlbUrl,
} from '../store/arModelStore.js'

const router = useRouter()
const variant = ref(LOCATION_IDS[0])
const preview = ref(null)
const viewer = useArViewer()
const { state } = viewer

const glbUrl = ref('')
const usdzUrl = ref('')
const videoUrl = ref('')
const poster = ref('')
const scaleMeters = ref(1)
const yawDeg = ref(0)
const fileName = ref('')
const error = ref('')
const saved = ref(false)
const busy = ref('')

let pendingFile = null       // 새로 고른 로컬 GLB(저장 전)
let previewRevoke = () => {}
const baseUrl = () => new URL(import.meta.env.BASE_URL, location.href).href

function loadForVariant(v) {
  const m = getModel(v)
  glbUrl.value = m?.glbUrl ?? ''
  usdzUrl.value = m?.usdzUrl ?? ''
  videoUrl.value = m?.videoUrl ?? ''
  poster.value = m?.poster ?? ''
  scaleMeters.value = m?.scaleMeters ?? 1
  yawDeg.value = m?.yawDeg ?? 0
  pendingFile = null
  fileName.value = m?.blobKey ? '(저장된 로컬 GLB)' : ''
  saved.value = false; error.value = ''
  refreshPreview()
}
watch(variant, loadForVariant)

async function refreshPreview() {
  previewRevoke(); previewRevoke = () => {}
  let url = ''
  if (pendingFile) { url = URL.createObjectURL(pendingFile); previewRevoke = () => URL.revokeObjectURL(url) }
  else if (glbUrl.value) url = glbUrl.value
  else {
    const resolved = await resolveGlbUrl(getModel(variant.value))
    if (resolved) { url = resolved.url; previewRevoke = resolved.revoke }
  }
  if (!url) { state.loaded = false; return }
  try {
    await viewer.loadModel(url, { baseUrl: baseUrl(), scaleMeters: scaleMeters.value, yawDeg: yawDeg.value, videoUrl: videoUrl.value })
  } catch { /* state.error 에 반영 */ }
}

function pickGlb(e) {
  const file = e.target.files?.[0]; e.target.value = ''
  if (!file) return
  error.value = ''; saved.value = false
  if (!file.name.toLowerCase().endsWith('.glb')) { error.value = 'GLB 파일(.glb)만 올릴 수 있어요.'; return }
  if (file.size > 30 * 1024 * 1024) { error.value = 'GLB 는 30MB 이하여야 해요.'; return }
  pendingFile = file
  fileName.value = file.name
  glbUrl.value = ''
  refreshPreview()
}

// scale·yaw·영상 바뀌면 프리뷰에 즉시 반영
watch([scaleMeters, yawDeg, videoUrl], refreshPreview)

async function save() {
  error.value = ''
  if (!pendingFile && !glbUrl.value && !usdzUrl.value) { error.value = 'GLB(파일/URL) 또는 USDZ 를 등록해 주세요.'; return }
  busy.value = '저장 중'
  try {
    const prev = getModel(variant.value)
    const data = {
      glbUrl: glbUrl.value, usdzUrl: usdzUrl.value, videoUrl: videoUrl.value,
      poster: poster.value, scaleMeters: Number(scaleMeters.value) || 1, yawDeg: Number(yawDeg.value) || 0,
      blobKey: prev?.blobKey ?? '',
    }
    if (pendingFile) {
      const key = `glb-${variant.value}-${Date.now()}`
      await putBlob(key, pendingFile)
      if (prev?.blobKey) await deleteBlob(prev.blobKey).catch(() => {})
      data.blobKey = key
      data.glbUrl = ''
      pendingFile = null
      fileName.value = '(저장된 로컬 GLB)'
    } else if (glbUrl.value && prev?.blobKey) {
      // URL 모드로 바뀌면 기존 로컬 Blob 정리
      await deleteBlob(prev.blobKey).catch(() => {})
      data.blobKey = ''
    }
    saveModel(variant.value, data)
    saved.value = true
  } catch (e) { error.value = e.message || '저장하지 못했어요.' }
  finally { busy.value = '' }
}

async function remove() {
  await clearModel(variant.value)
  loadForVariant(variant.value)
}

// GLB → iOS 용 USDZ 생성 후 내려받기 (관리자가 정적 호스팅 후 USDZ URL 칸에 붙여넣는다)
async function makeUsdz() {
  error.value = ''
  busy.value = 'USDZ 생성 중'
  let revoke = () => {}
  try {
    let url = ''
    if (pendingFile) { url = URL.createObjectURL(pendingFile); revoke = () => URL.revokeObjectURL(url) }
    else if (glbUrl.value) url = new URL(glbUrl.value, baseUrl()).href
    else {
      const resolved = await resolveGlbUrl(getModel(variant.value))
      if (resolved) { url = resolved.url; revoke = resolved.revoke }
    }
    if (!url) throw new Error('먼저 GLB 를 등록해 주세요.')
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
    const { USDZExporter } = await import('three/addons/exporters/USDZExporter.js')
    const gltf = await new GLTFLoader().loadAsync(url)
    const data = await new USDZExporter().parseAsync(gltf.scene, { quickLookCompatible: true, maxTextureSize: 2048 })
    const blob = new Blob([data], { type: 'model/vnd.usdz+zip' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${variant.value}-building.usdz`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 30_000)
  } catch (e) { error.value = e.message || 'USDZ 를 만들지 못했어요.' }
  finally { revoke(); busy.value = '' }
}

onMounted(async () => { await nextTick(); await viewer.init(preview.value); loadForVariant(variant.value) })
onBeforeUnmount(() => { viewer.dispose(); previewRevoke() })
</script>

<template>
  <div class="ms">
    <!-- 상단 -->
    <div class="top">
      <button class="round" aria-label="지도로" @click="router.push('/map')">
        <span class="msr" style="font-size:22px;color:#fff">arrow_back</span>
      </button>
      <span class="brand">AR 입체 건물 등록 · 관리자</span>
    </div>

    <!-- 장소 탭 -->
    <div class="loc-tabs">
      <button v-for="id in LOCATION_IDS" :key="id" class="loc-tab" :class="{ on: variant === id }" @click="variant = id">
        {{ LOCATION_NAMES[id] }}<span v-if="arModels[id] && (arModels[id].glbUrl || arModels[id].blobKey)" class="dot">●</span>
      </button>
    </div>

    <!-- 3D 프리뷰(턴테이블) -->
    <div class="preview-wrap">
      <div ref="preview" class="preview"></div>
      <p class="pv-cap">{{ state.status ? state.status + '…' : state.loaded ? '드래그로 돌려보기 · 프리뷰' : 'GLB 를 올리면 여기서 돌려볼 수 있어요' }}</p>
      <ul v-if="state.warnings.length" class="warn"><li v-for="w in state.warnings" :key="w">{{ w }}</li></ul>
    </div>

    <!-- 폼 -->
    <div class="panel">
      <label class="upload">
        <span class="msr" style="font-size:18px">view_in_ar</span>{{ fileName || 'Blender 건물 GLB 올리기' }}
        <input type="file" accept=".glb,model/gltf-binary" @change="pickGlb" />
      </label>
      <input class="in" v-model.trim="glbUrl" type="url" placeholder="또는 GLB URL (예: /ar/sojedom/building.glb)" :disabled="!!fileName && fileName !== '(저장된 로컬 GLB)'" @change="refreshPreview" />

      <div class="grid2">
        <label class="fld">크기(배율)<input class="in" v-model.number="scaleMeters" type="number" min="0.05" step="0.1" /></label>
        <label class="fld">회전(°)<input class="in" v-model.number="yawDeg" type="number" step="5" /></label>
      </div>

      <input class="in" v-model.trim="videoUrl" type="url" placeholder="제미나이 배경 영상 URL (선택 · 모델 뒤 분위기)" />
      <input class="in" v-model.trim="usdzUrl" type="url" placeholder="iOS USDZ URL (선택 · 아래 버튼으로 생성 가능)" />
      <input class="in" v-model.trim="poster" type="url" placeholder="포스터 이미지 URL (선택 · iOS 썸네일)" />

      <button class="ghost wide" :disabled="!!busy" @click="makeUsdz">
        {{ busy === 'USDZ 생성 중' ? 'USDZ 생성 중…' : 'GLB → iOS USDZ 생성·내려받기' }}
      </button>

      <p v-if="error" class="err" role="alert">{{ error }}</p>

      <div class="actions">
        <button class="ghost" :disabled="!(arModels[variant] && (arModels[variant].glbUrl || arModels[variant].blobKey || arModels[variant].usdzUrl))" @click="remove">삭제</button>
        <button class="save" :disabled="!!busy" @click="save">{{ saved ? '저장됨 ✓' : busy === '저장 중' ? '저장 중…' : `${LOCATION_NAMES[variant]}에 저장` }}</button>
      </div>
      <p class="foot">저장하면 플레이어 ‘입체로 보기’(/ar-view)에서 바로 세워집니다. 로컬 GLB 는 이 브라우저(IndexedDB)에만 저장 · 데모.</p>
    </div>
  </div>
</template>

<style scoped>
.ms { position: fixed; inset: 0; z-index: 1700; background: #0e1a24; overflow-y: auto; color: #fff; padding-bottom: 24px; }
.top { position: sticky; top: 0; z-index: 3; display: flex; align-items: center; gap: 8px; padding: 14px 12px; background: #0e1a24; }
.round { width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer; background: #0008; display: flex; align-items: center; justify-content: center; }
.brand { background: #0B2A45E6; border-radius: 16px; padding: 8px 12px; font-size: 12px; font-weight: 900; }

.loc-tabs { display: flex; gap: 6px; padding: 0 12px; }
.loc-tab { flex: 1; border: none; cursor: pointer; border-radius: 12px; padding: 8px 4px; font-size: 11px; font-weight: 800; background: #0B2A4599; color: #CFE0F0; display: flex; align-items: center; justify-content: center; gap: 3px; }
.loc-tab.on { background: var(--orange); color: var(--navy); }
.loc-tab .dot { font-size: 8px; color: #6FE08A; }
.loc-tab.on .dot { color: var(--navy); }

.preview-wrap { margin: 12px; }
.preview { height: 260px; border-radius: 14px; overflow: hidden; background: radial-gradient(ellipse at 50% 35%, #16303f, #0a141c); }
.preview :deep(canvas) { display: block; width: 100%; height: 100%; }
.pv-cap { text-align: center; font-size: 11px; color: #bcd0e2; margin-top: 8px; word-break: keep-all; }
.warn { margin: 6px 0 0; padding-left: 18px; color: #ffe0a6; font-size: 10px; line-height: 1.6; }

.panel { margin: 0 12px; background: #0B2A45E6; border-radius: 18px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.upload { display: flex; align-items: center; justify-content: center; gap: 6px; height: 46px; cursor: pointer; background: #fff; color: var(--navy); border-radius: 12px; font-size: 13px; font-weight: 800; position: relative; }
.upload input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.in { height: 42px; border: 1px solid #ffffff2e; background: #0d2135; color: #fff; border-radius: 10px; padding: 0 12px; font-size: 12px; }
.in::placeholder { color: #80a0b8; }
.in:disabled { opacity: .45; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.fld { display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 700; color: #cfe0f0; }
.ghost { border: 1px solid #ffffff44; background: transparent; color: #cfe0f0; border-radius: 12px; font-size: 12px; font-weight: 800; cursor: pointer; height: 44px; padding: 0 14px; }
.ghost:disabled { opacity: .45; cursor: default; }
.ghost.wide { width: 100%; }
.err { font-size: 11px; font-weight: 700; color: #ffb4a2; text-align: center; word-break: keep-all; }
.actions { display: flex; gap: 8px; }
.save { flex: 1; height: 46px; border: none; border-radius: 14px; background: var(--orange); color: var(--navy); font-size: 15px; font-weight: 900; cursor: pointer; }
.save:disabled { opacity: .5; cursor: default; }
.foot { font-size: 10px; font-weight: 600; color: #bfd3e6; text-align: center; word-break: keep-all; }
</style>
