<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef } from 'vue'
import PhotoComparison from '../components/PhotoComparison.vue'
import { HISTORY_SPOTS, verifiedAsset } from '../data/historySpots.js'

const spot = HISTORY_SPOTS['soje-railway-16']
const past = verifiedAsset(spot, 'archive')
const restoration = verifiedAsset(spot, 'restoration')
const mode = ref('compare')
const confirmed = ref(false)
const localPast = ref('')
const current = ref('')
const video = ref(null)
const stream = shallowRef(null)
const pending = ref(false)
const error = ref('')
const split = ref(50)
const x = ref(0)
const y = ref(0)
const zoom = ref(100)
let cameraRequest = 0

const overlay = computed(() => mode.value === 'sign'
  ? (confirmed.value ? restoration?.src : '')
  : (localPast.value || past?.src))
const compareReady = computed(() => Boolean(overlay.value && (stream.value || current.value)))

function release(slot) {
  if (slot.value) URL.revokeObjectURL(slot.value)
  slot.value = ''
}
function stopCamera() {
  cameraRequest++
  pending.value = false
  confirmed.value = false
  stream.value?.getTracks().forEach(track => track.stop())
  if (video.value) video.value.srcObject = null
  stream.value = null
}
async function startCamera() {
  const request = ++cameraRequest
  pending.value = true
  error.value = ''
  let opened
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera unavailable')
    opened = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
    if (request !== cameraRequest) {
      opened.getTracks().forEach(track => track.stop())
      return
    }
    stream.value = opened
    await nextTick()
    if (request !== cameraRequest) return
    video.value.srcObject = opened
    await video.value.play()
    release(current)
  } catch {
    if (request !== cameraRequest) return
    stopCamera()
    error.value = '카메라를 열 수 없어요. 권한을 확인하거나 현재 사진을 선택해 주세요.'
  } finally {
    if (request === cameraRequest) pending.value = false
  }
}
function pick(event, slot) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type) || file.size > 20 * 1024 * 1024) {
    error.value = '20MB 이하의 JPG, PNG, WebP, GIF, AVIF 사진을 선택해 주세요.'
    return
  }
  if (slot === 'current') stopCamera()
  const target = slot === 'current' ? current : localPast
  release(target)
  target.value = URL.createObjectURL(file)
  error.value = ''
}
function photoError(slot) {
  if (slot === 'current') release(current)
  else if (localPast.value) release(localPast)
  error.value = '사진을 표시할 수 없어요. 다른 이미지 파일로 다시 시도해 주세요.'
}
function resetAlignment() {
  split.value = 50
  x.value = y.value = 0
  zoom.value = 100
}
function selectMode(next) {
  if (mode.value === next) return
  mode.value = next
  confirmed.value = false
  resetAlignment()
}
function clear() {
  stopCamera()
  release(current)
  release(localPast)
  confirmed.value = false
  error.value = ''
  resetAlignment()
}
onBeforeUnmount(clear)
</script>

<template>
  <main class="screen history-page">
    <nav aria-label="탐방 메뉴"><RouterLink to="/map">‹ 지도</RouterLink></nav>
    <header>
      <p class="eyebrow">동구ON · 시간의 창</p>
      <h1>소제동, 그때와 지금</h1>
      <p>같은 자리에서 본 두 장면을 겹쳐 골목의 변화를 찾아보세요.</p>
    </header>
    <section class="history-card" aria-label="관사 탐방 지점">
      <h2>{{ spot.title }}</h2>
      <p>기록상 주소: {{ spot.recordedAddress }}. 현재 건물·간판 위치와 촬영 가능 여부는 현장에서 확인이 필요해요.</p>
      <a :href="spot.recordUrl" target="_blank" rel="noopener noreferrer">대전시 관사 기록 보기 ↗</a>
    </section>
    <div class="switch" role="group" aria-label="체험 선택">
      <button type="button" :aria-pressed="mode === 'compare'" @click="selectMode('compare')">과거·현재 비교</button>
      <button type="button" :aria-pressed="mode === 'sign'" @click="selectMode('sign')">관사 간판 맞추기</button>
    </div>
    <section class="history-card" aria-label="사진 비교 도구">
      <template v-if="mode === 'compare'">
        <p v-if="!past" class="notice">공식 과거 사진은 출처·이용 허락·촬영 지점을 확인 중이라 제공하지 않아요. 직접 가지고 있는 같은 장소의 과거 사진을 선택할 수 있어요.</p>
        <p v-else>과거 사진: {{ past.capturedAt }} · {{ past.credit }} <a :href="past.sourceUrl" target="_blank" rel="noopener noreferrer">출처 ↗</a> <a :href="past.rightsUrl" target="_blank" rel="noopener noreferrer">이용 조건 ↗</a></p>
        <p>{{ past?.viewpoint || spot.compareHint }}</p>
      </template>
      <template v-else>
        <p class="notice">수동 체험이에요. 간판을 자동으로 인식하거나 방문을 인증하지 않아요.</p>
        <p>안전한 곳에서 멈춘 뒤, 카메라의 점선 안에 간판을 맞춰 주세요. 간판이 없다면 촬영하거나 사유지에 들어가지 마세요.</p>
      </template>
      <PhotoComparison v-model="split" :ready="compareReady" :before-label="mode === 'sign' ? '복원 자료' : (localPast ? '내 비교 사진' : '과거')" after-label="현재">
        <video v-if="stream" ref="video" autoplay muted playsinline aria-label="현재 카메라 화면"></video>
        <img v-else-if="current" :src="current" alt="현재로 고른 사진" @error="photoError('current')">
        <div v-else class="placeholder">카메라를 켜거나 현재 사진을 선택하세요.</div>
        <div v-if="mode === 'sign' && !compareReady" class="aim" aria-hidden="true"></div>
        <template #before><img :src="overlay" :alt="mode === 'sign' ? '등록된 복원 이미지' : '비교할 옛 사진'" :style="{ transform: 'translate(' + x + '%, ' + y + '%) scale(' + zoom / 100 + ')' }" @error="photoError('past')"></template>
      </PhotoComparison>
      <div class="actions">
        <button v-if="!stream" type="button" :disabled="pending" @click="startCamera">{{ pending ? '카메라 여는 중…' : '현재 카메라 켜기' }}</button>
        <button v-else type="button" @click="stopCamera">카메라 끄기</button>
        <label>현재 사진 선택<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" aria-label="현재 사진 선택" @change="pick($event, 'current')"></label>
        <label v-if="mode === 'compare'">내 과거 사진 선택<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" aria-label="내 과거 사진 선택" @change="pick($event, 'past')"></label>
      </div>
      <p v-if="error" role="alert">{{ error }}</p>
      <template v-if="mode === 'sign'">
        <button type="button" :disabled="!stream && !current" @click="confirmed = true">간판을 맞췄어요 (수동 확인)</button>
        <p v-if="confirmed && !restoration" role="status">수동 확인했어요. 검증된 복원 자료가 아직 없어 복원 화면은 표시하지 않아요.</p>
        <p v-else-if="confirmed && restoration" role="status">복원 자료: {{ restoration.credit }} · {{ restoration.viewpoint }} <a :href="restoration.sourceUrl" target="_blank" rel="noopener noreferrer">출처 ↗</a> <a :href="restoration.rightsUrl" target="_blank" rel="noopener noreferrer">이용 조건 ↗</a></p>
      </template>
      <div v-if="compareReady" class="adjust">
        <details>
          <summary>사진 위치·크기 맞춤</summary>
          <label>과거 사진 좌우 <input v-model.number="x" type="range" min="-50" max="50"></label>
          <label>과거 사진 상하 <input v-model.number="y" type="range" min="-50" max="50"></label>
          <label>과거 사진 크기 <input v-model.number="zoom" type="range" min="50" max="200"></label>
          <button type="button" @click="resetAlignment">정합 초기화</button>
        </details>
      </div>
      <p class="privacy">카메라 화면과 선택한 사진은 이 화면에서만 사용하며 저장하거나 서버에 보내지 않아요.</p>
      <button v-if="stream || current || localPast || pending" type="button" @click="clear">비교 초기화 및 사진 지우기</button>
    </section>
  </main>
</template>

<style scoped>
.history-page { width:min(100%,44rem); margin:0 auto; padding:1rem 1rem 7rem; color:#473127; background:#fcf6eb; overflow-y:auto; }
nav a, .history-card a { color:#17665d; font-weight:750; }
header { margin:1.2rem 0; }
header h1 { margin:.1rem 0; font-size:clamp(1.65rem, 7vw, 2.55rem); }
.eyebrow { color:#92512e; font-weight:800; }
.history-card { background:white; border:1px solid #ead9c6; border-radius:1rem; padding:1rem; margin:.7rem 0; }
.history-card h2 { margin:0; font-size:1.1rem; }
.history-card p { margin:.5rem 0 .9rem; line-height:1.5; }
.notice { padding:.65rem; color:#784323; background:#fff5df; border-radius:.5rem; }
.switch,.actions { display:flex; gap:.5rem; flex-wrap:wrap; }
.actions { margin:.7rem 0; }
button,.actions label { display:inline-flex; align-items:center; justify-content:center; min-height:44px; border:1px solid #ceb59d; border-radius:.55rem; padding:.42rem .65rem; background:white; color:#473127; cursor:pointer; font-size:.92rem; }
button[aria-pressed=true] { background:#185f55; color:white; }
button:disabled { opacity:.53; cursor:default; }
.actions label { position:relative; border-style:dashed; }
.actions input { position:absolute; inset:0; width:100%; opacity:0; cursor:pointer; }
.actions label:focus-within { outline:2px solid #185f55; }
.preview { aspect-ratio:4 / 3; overflow:hidden; position:relative; background:#292725; color:white; border-radius:.6rem; }
.preview video,.preview img,.overlay { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.placeholder { display:grid; place-content:center; height:100%; padding:1rem; text-align:center; }
.aim { position:absolute; inset:34% 18%; border:2px dashed #fff4d6; border-radius:.35rem; }
.divider { position:absolute; top:0; bottom:0; width:2px; background:white; box-shadow:0 0 0 1px #332b26; pointer-events:none; }
.badge { position:absolute; top:.5rem; background:#30231ce6; padding:.2rem .4rem; border-radius:.3rem; font-size:.8rem; }
.past { left:.5rem; }.present { right:.5rem; }
.adjust { padding-top:.65rem; }
.adjust input { display:block; width:100%; min-height:35px; accent-color:#185f55; }
.adjust summary { min-height:38px; cursor:pointer; }
.privacy { font-size:.84rem; color:#60554b; }
</style>
