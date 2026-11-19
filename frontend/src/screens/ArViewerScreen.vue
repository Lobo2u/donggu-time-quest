<script setup>
// 입체(3D) 과거 건물 플레이어 — 장소별로 등록된 Blender GLB 를 실공간에 세운다.
// 기기 판별: 안드로이드 = WebXR immersive-ar, iOS = USDZ Quick Look, 그 외 = 턴테이블 프리뷰.
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArViewer } from '../composables/useArViewer.js'
import { detectArCapabilities, quickLookUrl } from '../ar/platform.js'
import { SCENE_STYLES } from '../ar/diorama.js'
import { getModel, getModelSceneStyle, resolveGlbUrl, LOCATION_NAMES } from '../store/arModelStore.js'

const route = useRoute()
const router = useRouter()
const locationId = route.params.locationId
const name = computed(() => LOCATION_NAMES[locationId] || locationId)

const viewport = ref(null)
const overlay = ref(null)
const caps = ref({ webxr: false, quickLook: false, secure: false })
const model = ref(null)
const starting = ref(false)
const sceneStyle = computed(() => getModelSceneStyle(locationId, model.value))
const previewOnly = computed(() => route.query.preview === '1')
const viewer = useArViewer()
const { state } = viewer
let revokeGlb = () => {}
let disposed = false

// 인라인 매직윈도우용 실시간 카메라(후면). WebXR 세션일 때는 XR 이 카메라를 쓰므로 꺼둔다.
const camEl = ref(null)
const camOn = ref(false)
const camError = ref('')
let stream = null

async function openCamera() {
  if (stream || disposed) return
  camError.value = ''
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported')
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
    await nextTick()
    if (!disposed && camEl.value) { camEl.value.srcObject = stream; camOn.value = true; viewer.setAutoRotate(false) }
    else stopCamera()
  } catch {
    camError.value = '카메라를 열 수 없어요 (권한·기기 확인). 모델은 프리뷰로 보여요.'
    camOn.value = false
  }
}
function stopCamera() {
  stream?.getTracks().forEach(t => t.stop()); stream = null; camOn.value = false
  viewer.setAutoRotate(true)
}
function toggleCamera() { camOn.value ? stopCamera() : openCamera() }

// 자이로(기기 방향) 매직윈도우
const gyroErr = ref('')
async function toggleGyro() {
  gyroErr.value = ''
  if (state.gyroActive) { viewer.disableGyro(); return }
  try {
    if (!camOn.value) await openCamera()
    await viewer.enableGyro()
  } catch (e) { gyroErr.value = e?.message || '자이로를 켜지 못했어요.' }
}

// 사진 촬영 — 카메라 배경 + 3D 모델을 한 장으로 합성해 내려받기
const shot = ref(false)
function capturePhoto() {
  const gl = viewer.getCanvas()
  if (!gl) return
  try {
    const w = gl.width, h = gl.height
    const out = document.createElement('canvas'); out.width = w; out.height = h
    const ctx = out.getContext('2d')
    const v = camEl.value
    if (camOn.value && v?.videoWidth) {
      const vr = v.videoWidth / v.videoHeight, cr = w / h
      let dw = w, dh = h, dx = 0, dy = 0
      if (vr > cr) { dh = h; dw = h * vr; dx = (w - dw) / 2 } else { dw = w; dh = w / vr; dy = (h - dh) / 2 }
      ctx.drawImage(v, dx, dy, dw, dh)
    } else { ctx.fillStyle = '#0a141c'; ctx.fillRect(0, 0, w, h) }
    ctx.drawImage(gl, 0, 0, w, h)
    const a = document.createElement('a')
    a.href = out.toDataURL('image/png')
    a.download = `timequest-${locationId}-${Date.now()}.png`
    a.click()
    shot.value = true; setTimeout(() => (shot.value = false), 1200)
  } catch { gyroErr.value = '사진 저장에 실패했어요 (외부 영상 CORS 제한일 수 있어요).' }
}

// WebXR 세션이 끝나면(인라인 복귀) 카메라를 다시 켠다.
watch(() => state.presenting, (now, prev) => { if (prev && !now) openCamera() })

const usdzHref = computed(() => {
  try { return model.value?.usdzUrl ? quickLookUrl(model.value.usdzUrl) : '' }
  catch { return '' }
})

onMounted(async () => {
  caps.value = await detectArCapabilities()
  if (disposed) return
  // 등록된 모델 우선. 없으면 테스트용 ?glb= 쿼리로 임의 GLB 를 바로 띄울 수 있다(파이프라인 검증용).
  model.value = getModel(locationId)
    || (route.query.glb || route.query.usdz
      ? { glbUrl: route.query.glb ? String(route.query.glb) : '', usdzUrl: route.query.usdz ? String(route.query.usdz) : '',
          scaleMeters: Number(route.query.s) || 1, yawDeg: Number(route.query.yaw) || 0 }
      : null)
  if (!model.value) return

  try { await viewer.init(viewport.value) }
  catch { state.error = '이 브라우저에서 3D 화면을 열 수 없어요.'; return }
  if (previewOnly.value) viewer.setAutoRotate(false)

  // GLB(인라인 프리뷰·WebXR)용. iOS 는 USDZ Quick Look 만 쓰므로 GLB 가 없어도 된다.
  let resolved
  try { resolved = await resolveGlbUrl(model.value) }
  catch { state.error = '로컬 GLB를 읽지 못했습니다.'; return }
  if (disposed) { resolved?.revoke(); return }
  if (resolved) {
    revokeGlb = resolved.revoke
    try {
      await viewer.loadModel(resolved.url, {
        baseUrl: new URL(import.meta.env.BASE_URL, location.href).href,
        scaleMeters: model.value.scaleMeters ?? 1,
        yawDeg: model.value.yawDeg ?? 0,
        videoUrl: model.value.videoUrl || '',
        sceneStyle: sceneStyle.value,
      })
    } catch { /* state.error 에 반영됨 */ }
  } else if (!model.value.usdzUrl) {
    state.error = '등록된 GLB 를 찾지 못했습니다.'
  }
  // 모델이 있으면 카메라를 깔아 실제 화면 위에 겹쳐 보이게 한다.
  if (!previewOnly.value && (model.value.glbUrl || model.value.blobKey)) openCamera()
})

onBeforeUnmount(() => {
  disposed = true
  stopCamera()
  viewer.dispose()
  revokeGlb()
})

async function startAR() {
  starting.value = true
  stopCamera() // 안드로이드 WebXR 은 세션이 카메라를 직접 사용하므로 DOM 카메라를 끈다.
  try { await viewer.enterAR(overlay.value) }
  catch (err) { state.error = err?.message || 'AR 을 시작하지 못했습니다.'; openCamera() }
  finally { starting.value = false }
}
</script>

<template>
  <main class="ar-view" :data-scene="sceneStyle" :class="{ 'cam-on': camOn }">
    <!-- 실시간 카메라 배경(매직윈도우) -->
    <video v-show="camOn" ref="camEl" class="cam-bg" autoplay muted playsinline></video>

    <!-- 프리뷰/캔버스 뷰포트 (투명 배경 → 카메라 위에 모델이 겹침) -->
    <div ref="viewport" class="ar-viewport"></div>

    <!-- 상단: 뒤로 · 장소 -->
    <div class="av-head" v-show="!state.presenting">
      <button class="av-round" aria-label="뒤로" @click="router.back()">
        <span class="msr">arrow_back</span>
      </button>
      <div class="av-pill"><small>{{ sceneStyle === 'original' ? '동구 TIME QUEST' : '동구 TIME QUEST · ' + SCENE_STYLES[sceneStyle].label }}</small><strong>{{ name }}</strong></div>
      <button v-if="model" class="av-round cam-toggle" :class="{ on: camOn }" aria-label="카메라 켜고 끄기" @click="toggleCamera">
        <span class="msr">{{ camOn ? 'videocam' : 'videocam_off' }}</span>
      </button>
      <button v-if="model" class="av-round" :class="{ on: state.gyroActive }" aria-label="자이로 켜고 끄기" @click="toggleGyro">
        <span class="msr">3d_rotation</span>
      </button>
    </div>

    <!-- 모델 미등록 -->
    <div v-if="!model" class="av-center">
      <span class="msr big">view_in_ar</span>
      <h2>아직 이 장소의 3D 건물이 없어요</h2>
      <p>운영자 메뉴에서 건물 GLB 를 먼저 등록해 주세요.</p>
      <button class="av-btn" @click="router.push('/map')">지도로</button>
    </div>

    <!-- 로딩/오류 -->
    <p v-else-if="state.status" class="av-toast">{{ state.status }}…</p>
    <p v-else-if="state.error" class="av-toast err">{{ state.error }}</p>
    <p v-if="camError" class="av-toast err cam-err">{{ camError }}</p>

    <!-- 하단 액션 -->
    <div v-if="model" class="av-foot" v-show="!state.presenting">
      <p v-if="sceneStyle !== 'original'" class="av-scene-label">테마 연출 <span>실측 복원이 아닌 게임풍 표현이에요.</span></p>
      <p class="av-hint">
        {{ caps.webxr ? '‘AR 로 보기’ 를 누르고 바닥을 비추면 건물이 세워져요. 걸어서 옆·뒤를 둘러보세요.'
          : usdzHref ? 'iPhone 은 아래 버튼으로 실제 공간에 건물을 세워 둘러볼 수 있어요.'
          : '화면을 드래그해 골목을 둘러보세요.' }}
      </p>

      <!-- 안드로이드 WebXR -->
      <button v-if="caps.webxr" class="av-cta" :disabled="!state.loaded || starting" @click="startAR">
        <span class="msr">view_in_ar</span> AR 로 보기
      </button>

      <!-- iOS USDZ Quick Look -->
      <a v-else-if="caps.quickLook && usdzHref" class="av-cta" rel="ar" :href="usdzHref">
        <img v-if="model.poster" :src="model.poster" alt="" />
        <span class="msr">view_in_ar</span> 실제 공간에 세우기
      </a>

      <!-- 폴백: 프리뷰만 -->
      <p v-else class="av-note">
        {{ caps.quickLook ? 'iPhone 용 USDZ 가 아직 등록되지 않았어요.' : '실공간 AR 을 지원하지 않는 기기예요.' }}
        3D 미리보기는 그대로 이용할 수 있어요.
      </p>

      <p v-if="usdzHref && sceneStyle !== 'original'" class="av-note">iPhone Quick Look에는 등록한 원본 USDZ만 표시돼요.</p>
      <ul v-if="state.warnings.length"  class="av-warn">
        <li v-for="w in state.warnings" :key="w">{{ w }}</li>
      </ul>
    </div>

    <!-- 자이로 안내/오류 -->
    <p v-if="gyroErr" class="av-toast err gyro-err">{{ gyroErr }}</p>
    <p v-else-if="state.gyroActive" class="av-toast gyro-hint">폰을 움직여 과거 건물을 둘러보세요 · 셔터로 사진</p>

    <!-- 셔터(사진 촬영) -->
    <button v-if="model && state.loaded" class="shutter" :class="{ flash: shot }" v-show="!state.presenting" aria-label="사진 촬영" @click="capturePhoto">
      <span class="msr">photo_camera</span>
    </button>

    <!-- AR 세션용 DOM 오버레이 -->
    <div ref="overlay" class="av-overlay">
      <button class="av-round dark" aria-label="AR 종료" @click="viewer.exitAR()">
        <span class="msr">close</span>
      </button>
      <p class="av-ar-hint">{{ state.placed ? '한 손가락=회전 · 두 손가락=크기' : '바닥을 비추고 화면을 탭해 건물을 세워요' }}</p>
    </div>
  </main>
</template>

<style scoped>
.ar-view { position: fixed; inset: 0; z-index: 1700; background: radial-gradient(ellipse at 50% 30%, #16303f, #0a141c); overflow: hidden; }
.ar-view[data-scene="village"] { background: radial-gradient(ellipse at 50% 40%, #f4e4b6, #b69068 73%, #865b45); }
.ar-view[data-scene="dusk"] { background: radial-gradient(ellipse at 50% 40%, #f4b78a, #a06e70 68%, #4e394f); }
.ar-view.cam-on[data-scene] { background: #000; }
.cam-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
.ar-viewport { position: absolute; inset: 0; z-index: 1; }
.ar-viewport :deep(canvas) { display: block; width: 100%; height: 100%; }

.av-head { position: absolute; left: 12px; right: 12px; top: 16px; z-index: 2; display: flex; align-items: center; gap: 8px; }
.av-round { width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer; background: #0008; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.av-round .msr, .av-pill, .av-hint, .av-note { color: #fff; }
.av-round.dark { background: #000a; }
.cam-toggle { margin-left: auto; }
.av-round.on { background: var(--orange); }
.av-round.on .msr { color: var(--navy); }
.cam-err { top: 110px; }
.gyro-err { top: 110px; }
.gyro-hint { top: 110px; color: #fff; }

/* 셔터: 하단 중앙, 제어판 위 */
.shutter { position: absolute; left: 50%; bottom: 120px; transform: translateX(-50%); z-index: 5;
  width: 64px; height: 64px; border-radius: 50%; cursor: pointer;
  border: 4px solid #fff; background: #ffffff33; backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; }
.shutter .msr { color: #fff; font-size: 28px; }
.shutter.flash { animation: shutter-flash .4s ease; }
@keyframes shutter-flash { 0% { background: #fff; } 100% { background: #ffffff33; } }
.av-pill { min-width: 0; background: #0B2A45E6; border-radius: 16px; padding: 7px 12px; font-family: var(--font); }
.av-pill small, .av-pill strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.av-pill small { font-size: 9px; font-weight: 900; letter-spacing: .08em; }
.av-pill strong { font-size: 14px; }
.ar-view:not([data-scene="original"]) .av-pill, .ar-view:not([data-scene="original"]) .av-foot {
  color: #362317; background: #fff1d7f2; border: 1px solid #9d633e; box-shadow: 0 4px 0 #563a2a88, 0 12px 22px #26170f22;
}
.ar-view:not([data-scene="original"]) .av-round:not(.on):not(.dark) { background: #422c20d9; }
.ar-view:not([data-scene="original"]) .av-hint, .ar-view:not([data-scene="original"]) .av-note { color: #4d3729; }
.ar-view:not([data-scene="original"]) .av-warn { color: #7b352b; }
.ar-view:not([data-scene="original"]) .shutter { bottom: auto; top: max(76px, env(safe-area-inset-top)); left: auto; right: 13px; transform: none; width: 40px; height: 40px; border: 1px solid #fff1d7; background: #422c20d9; }
.ar-view:not([data-scene="original"]) .shutter .msr { font-size: 21px; }
.av-scene-label { margin: 0; font-size: 12px; font-weight: 900; }
.av-scene-label span { margin-left: 4px; font-size: 10px; font-weight: 600; }
@media (prefers-reduced-motion: reduce) { .shutter.flash { animation: none; } }

.av-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; text-align: center; padding: 24px; color: #cfe0ee; }
.av-center .msr.big { font-size: 56px; color: #6f90a8; }
.av-center h2 { font-size: 17px; color: #fff; }
.av-center p { font-size: 13px; color: #a9c0d2; }

.av-toast { position: absolute; top: 72px; left: 0; right: 0; text-align: center; z-index: 3; color: #fff; font-size: 12px; font-weight: 800; text-shadow: 0 1px 4px #000a; }
.av-toast.err { color: #ffd7cc; }

.av-foot { position: absolute; left: 12px; right: 12px; bottom: 16px; z-index: 2; background: #0B2A45E6; border-radius: 20px; padding: 14px; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 10px; }
.av-hint { font-size: 12px; font-weight: 700; line-height: 1.6; word-break: keep-all; }
.av-note { font-size: 11px; color: #bcd0e2; line-height: 1.6; word-break: keep-all; }
.av-cta, .av-btn { height: 48px; border: none; border-radius: 14px; cursor: pointer; background: var(--orange); color: var(--navy); font-family: var(--font); font-size: 15px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; }
.av-cta:disabled { opacity: .5; }
.av-cta img { width: 28px; height: 28px; object-fit: cover; border-radius: 6px; }
.av-btn { background: #163b57; color: #fff; padding: 0 20px; }
.av-warn { margin: 0; padding-left: 18px; color: #ffe0a6; font-size: 10px; line-height: 1.6; }

.av-overlay { position: absolute; inset: 0; z-index: 4; pointer-events: none; display: v-bind("state.presenting ? 'block' : 'none'"); }
.av-overlay .av-round { position: absolute; top: 16px; right: 16px; pointer-events: auto; }
.av-ar-hint { position: absolute; left: 0; right: 0; bottom: 28px; text-align: center; color: #fff; font-size: 13px; font-weight: 800; text-shadow: 0 1px 6px #000b; }
</style>
