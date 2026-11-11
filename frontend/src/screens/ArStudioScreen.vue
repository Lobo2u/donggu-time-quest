<script setup>
// 관리자 전용 AR 저작 화면 — byeol-night '카메라 위 옛 모습 겹치기'를 관리자가 직접 만든다.
// 실제 카메라(getUserMedia) 위에 올린 과거 사진/영상을 겹쳐 위치·크기·투명도를 맞춰 장소별로 저장.
// 저장한 자료는 플레이어의 '카메라로 건물에 겹쳐 보기'(PastCameraOverlay)에서 바로 쓰인다.
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import CameraMock from '../components/CameraMock.vue'
import { useFit } from '../composables/useFit.js'
import { LOCATION_IDS, LOCATION_NAMES, getOverlay, saveOverlay, clearOverlay, arOverlays } from '../store/arOverlayStore.js'

const router = useRouter()
const variant = ref(LOCATION_IDS[0])
const videoEl = ref(null)
const cameraOn = ref(false)
const cameraError = ref('')
let stream = null

const src = ref('')        // 올린 자료 dataURL
const kind = ref('image')  // 'image' | 'video'
const opacity = ref(0.6)
const aligning = ref(true)
const saved = ref(false)
const error = ref('')
const fit = useFit(aligning)

const savedMark = computed(() => !!arOverlays[variant.value])

async function openCamera() {
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported')
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
    await nextTick()
    if (videoEl.value) { videoEl.value.srcObject = stream; cameraOn.value = true }
  } catch {
    cameraError.value = '카메라를 열 수 없어 장소 목업으로 표시합니다 (권한·기기 확인). 자료 올리기·저장은 그대로 됩니다.'
    cameraOn.value = false
  }
}
function stopCamera() {
  stream?.getTracks().forEach(t => t.stop()); stream = null; cameraOn.value = false
}

function loadForVariant(v) {
  const o = getOverlay(v)
  src.value = o?.src ?? ''
  kind.value = o?.kind ?? 'image'
  opacity.value = o?.opacity ?? 0.6
  fit.state.x = o?.x ?? 0; fit.state.y = o?.y ?? 0; fit.state.s = o?.s ?? 1
  saved.value = false; error.value = ''
}
watch(variant, loadForVariant, { immediate: true })

async function pickFile(e) {
  const file = e.target.files?.[0]; e.target.value = ''
  if (!file) return
  error.value = ''; saved.value = false
  const isVideo = file.type.startsWith('video/')
  const isImage = file.type.startsWith('image/')
  if (!isVideo && !isImage) { error.value = '사진 또는 영상 파일만 올릴 수 있어요.'; return }
  if (file.size > 4 * 1024 * 1024) { error.value = '4MB 이하 파일을 사용해 주세요 (브라우저 저장 용량 제한).'; return }
  try {
    src.value = await new Promise((res, rej) => {
      const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file)
    })
    kind.value = isVideo ? 'video' : 'image'
  } catch { error.value = '파일을 읽지 못했어요.' }
}

function save() {
  if (!src.value) { error.value = '먼저 겹칠 사진/영상을 올려 주세요.'; return }
  try {
    saveOverlay(variant.value, {
      src: src.value, kind: kind.value, opacity: opacity.value,
      x: fit.state.x, y: fit.state.y, s: fit.state.s,
    })
    saved.value = true; error.value = ''
  } catch (e) { error.value = e.message }
}

function remove() {
  clearOverlay(variant.value)
  loadForVariant(variant.value)
}

onMounted(openCamera)
onBeforeUnmount(stopCamera)
</script>

<template>
  <div class="ar-studio">
    <!-- 카메라 / 목업 배경 -->
    <video v-show="cameraOn" ref="videoEl" class="cam-feed" autoplay muted playsinline></video>
    <CameraMock v-if="!cameraOn" :variant="variant" />

    <!-- 겹친 과거 자료 -->
    <div v-if="src" class="overlay" :class="{ aligning }" :style="[fit.style.value, { opacity }]" v-on="fit.handlers">
      <video v-if="kind === 'video'" :src="src" class="overlay-media" autoplay muted loop playsinline></video>
      <img v-else :src="src" class="overlay-media" alt="겹칠 과거 자료 미리보기" />
    </div>

    <!-- 상단: 닫기 · 장소 선택 · 위치 맞추기 -->
    <div class="top">
      <button class="round" aria-label="지도로 돌아가기" @click="router.push('/map')">
        <span class="msr" style="font-size:22px; color:white">arrow_back</span>
      </button>
      <span class="brand">AR 저작 · 관리자</span>
      <button class="pill line" :class="{ on: aligning }" :disabled="!src" @click="aligning = !aligning">
        {{ aligning ? '맞추기 완료' : '위치 맞추기' }}
      </button>
    </div>

    <div class="loc-tabs">
      <button v-for="id in LOCATION_IDS" :key="id" class="loc-tab" :class="{ on: variant === id }" @click="variant = id">
        {{ LOCATION_NAMES[id] }}<span v-if="arOverlays[id]" class="dot" title="저장됨">●</span>
      </button>
    </div>

    <p class="hint">{{ src ? (aligning ? '한 손가락으로 옮기고 두 손가락으로 크기를 맞춰요' : '실제 건물에 겹쳐 보며 확인해요') : '아래에서 겹칠 과거 사진/영상을 올려 주세요' }}</p>
    <p v-if="cameraError" class="cam-note">{{ cameraError }}</p>

    <!-- 하단 제어판 -->
    <div class="panel">
      <div class="row">
        <label class="upload">
          <span class="msr" style="font-size:18px">upload</span>{{ src ? '다른 자료로 교체' : '과거 사진/영상 올리기' }}
          <input type="file" accept="image/*,video/*" @change="pickFile" />
        </label>
      </div>
      <label class="slider">
        <span>현재</span>
        <input type="range" min="0.15" max="1" step="0.05" v-model.number="opacity" :disabled="!src" aria-label="겹친 자료 진하기" />
        <span>과거</span>
      </label>
      <p v-if="error" class="err" role="alert">{{ error }}</p>
      <div class="row actions">
        <button class="ghost" :disabled="!savedMark" @click="remove">저장 삭제</button>
        <button class="save" :disabled="!src" @click="save">
          {{ saved ? '저장됨 ✓' : savedMark ? '덮어쓰기 저장' : `${LOCATION_NAMES[variant]}에 저장` }}
        </button>
      </div>
      <p class="foot">저장하면 플레이어의 ‘카메라로 건물에 겹쳐 보기’에 바로 반영됩니다. (브라우저 저장 · 데모)</p>
    </div>
  </div>
</template>

<style scoped>
.ar-studio { position: fixed; inset: 0; z-index: 1700; background: #1B2330; overflow: hidden; }
.cam-feed { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

.overlay { position: absolute; left: 50%; top: 40%; width: 300px; margin-left: -150px; margin-top: -105px;
  border-radius: 12px; overflow: hidden; touch-action: none; transform-origin: center; }
.overlay.aligning { outline: 2px dashed var(--orange); outline-offset: 4px; cursor: move; }
.overlay-media { display: block; width: 100%; height: auto; }

.top { position: absolute; left: 12px; right: 12px; top: 16px; z-index: 3; display: flex; align-items: center; gap: 8px; }
.round { width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer; background: #0008;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.brand { background: #0B2A45E6; color: white; border-radius: 16px; padding: 8px 12px; font-size: 12px; font-weight: 900; white-space: nowrap; }
.pill { font-size: 12px; font-weight: 900; border-radius: 16px; padding: 8px 12px; cursor: pointer; }
.pill.line { margin-left: auto; border: 2px solid var(--orange); background: #0008; color: white; flex-shrink: 0; }
.pill.line.on { background: var(--orange); color: var(--navy); }
.pill:disabled { opacity: .5; cursor: default; }

.loc-tabs { position: absolute; left: 12px; right: 12px; top: 64px; z-index: 3; display: flex; gap: 6px; }
.loc-tab { flex: 1; border: none; cursor: pointer; border-radius: 12px; padding: 7px 4px; font-size: 11px; font-weight: 800;
  background: #0B2A4599; color: #CFE0F0; display: flex; align-items: center; justify-content: center; gap: 3px; }
.loc-tab.on { background: var(--orange); color: var(--navy); }
.loc-tab .dot { font-size: 8px; color: #6FE08A; }
.loc-tab.on .dot { color: var(--navy); }

.hint { position: absolute; left: 0; right: 0; top: 104px; z-index: 3; text-align: center; color: white;
  font-size: 12px; font-weight: 800; text-shadow: 0 1px 4px #000a; padding: 0 16px; word-break: keep-all; }
.cam-note { position: absolute; left: 12px; right: 12px; top: 128px; z-index: 3; text-align: center;
  color: #FFD9A8; font-size: 10px; font-weight: 700; word-break: keep-all; }

.panel { position: absolute; left: 12px; right: 12px; bottom: 16px; z-index: 3; background: #0B2A45E6;
  border-radius: 20px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: var(--shadow); }
.row { display: flex; gap: 8px; }
.upload { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; height: 44px; cursor: pointer;
  background: var(--white); color: var(--navy); border-radius: 12px; font-size: 13px; font-weight: 800; }
.upload input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.slider { display: flex; align-items: center; gap: 10px; color: white; font-size: 12px; font-weight: 800; }
.slider input { flex: 1; accent-color: var(--orange); }
.slider input:disabled { opacity: .4; }
.err { font-size: 11px; font-weight: 700; color: #FFB4A2; text-align: center; word-break: keep-all; }
.actions { gap: 8px; }
.ghost { flex: 0 0 auto; height: 46px; padding: 0 14px; border: 1px solid #FFFFFF44; background: transparent; color: #CFE0F0;
  border-radius: 14px; font-size: 12px; font-weight: 800; cursor: pointer; }
.ghost:disabled { opacity: .4; cursor: default; }
.save { flex: 1; height: 46px; border: none; border-radius: 14px; background: var(--orange); color: var(--navy);
  font-size: 15px; font-weight: 900; cursor: pointer; }
.save:disabled { opacity: .5; cursor: default; }
.foot { font-size: 10px; font-weight: 600; color: #BFD3E6; text-align: center; word-break: keep-all; }
</style>
