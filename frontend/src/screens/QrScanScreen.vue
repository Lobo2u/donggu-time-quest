<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import jsQR from 'jsqr'
import { game, checkInLocation } from '../store/gameStore.js'
import { LOCATIONS } from '../data/gameData.js'

const router = useRouter()
const route  = useRoute()
const fromLocationId = route.query.from

const videoEl   = ref(null)
const canvasEl  = ref(null)
const status    = ref('init')  // init | scanning | success | error | denied | wrong
const errorMsg  = ref('')
const scannedLocation = ref(null)
let stream = null
let rafId  = null

// 시연용 수동 코드 입력
const manualCode = ref('')
const showManual = ref(false)

async function startCamera() {
  try {
    status.value = 'scanning'
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: 640, height: 480 },
    })
    videoEl.value.srcObject = stream
    await videoEl.value.play()
    scanLoop()
  } catch (e) {
    status.value = e.name === 'NotAllowedError' ? 'denied' : 'error'
    errorMsg.value = e.message
  }
}

function scanLoop() {
  if (!videoEl.value || videoEl.value.readyState < 2) {
    rafId = requestAnimationFrame(scanLoop)
    return
  }
  const canvas = canvasEl.value
  const ctx    = canvas.getContext('2d')
  canvas.width  = videoEl.value.videoWidth
  canvas.height = videoEl.value.videoHeight
  ctx.drawImage(videoEl.value, 0, 0)
  const img  = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
  if (code) {
    handleCode(code.data)
    return
  }
  rafId = requestAnimationFrame(scanLoop)
}

function handleCode(raw) {
  stopCamera()
  const loc = Object.values(LOCATIONS).find(l => l.qrCode === raw)
  if (!loc) {
    status.value = 'wrong'
    errorMsg.value = '동구 TIME QUEST QR이 아니에요. 다시 시도해요.'
    return
  }
  scannedLocation.value = loc
  status.value = 'success'
  checkInLocation(loc.id)
  setTimeout(() => {
    router.push(`/awakening/${loc.buddyId}`)
  }, 1200)
}

function tryManual() {
  handleCode(manualCode.value.trim())
}

function retry() {
  status.value = 'init'
  errorMsg.value = ''
  startCamera()
}

function stopCamera() {
  if (rafId) cancelAnimationFrame(rafId)
  if (stream) stream.getTracks().forEach(t => t.stop())
}

onMounted(startCamera)
onBeforeUnmount(stopCamera)
</script>

<template>
  <div class="screen qr-screen">
    <!-- 헤더 -->
    <div class="qr-header">
      <button class="back-btn" @click="$router.back()">
        <span class="msr" style="font-size:26px; color:white">arrow_back</span>
      </button>
      <div>
        <p class="header-sub">현장 인증</p>
        <p class="header-title">QR 코드 스캔</p>
      </div>
    </div>

    <!-- 카메라 뷰파인더 -->
    <div class="viewfinder-wrap" v-if="status === 'scanning'">
      <video ref="videoEl" class="camera-video" autoplay muted playsinline />
      <canvas ref="canvasEl" style="display:none" />
      <div class="finder-frame">
        <div class="corner tl"></div><div class="corner tr"></div>
        <div class="corner bl"></div><div class="corner br"></div>
      </div>
      <div class="scan-line"></div>
      <p class="scan-hint">가게에 붙은 QR 코드를 화면 안에 맞춰요</p>
    </div>

    <!-- 초기 상태 -->
    <div class="status-card" v-else-if="status === 'init'">
      <span class="msr" style="font-size:56px; color:var(--teal)">qr_code_scanner</span>
      <p class="status-title">카메라를 열고 있어요</p>
    </div>

    <!-- 성공 -->
    <div class="status-card success" v-else-if="status === 'success'">
      <span class="msr" style="font-size:56px; color:var(--teal)">check_circle</span>
      <p class="status-title">{{ scannedLocation?.name }} 인증 완료!</p>
      <p class="status-sub">캐릭터 강화을 시작해요…</p>
    </div>

    <!-- 권한 거부 -->
    <div class="status-card error" v-else-if="status === 'denied'">
      <span class="msr" style="font-size:56px; color:var(--muted)">no_photography</span>
      <p class="status-title">카메라 권한이 필요해요</p>
      <p class="status-sub">브라우저 설정에서 카메라 권한을 허용하거나 아래 코드 직접 입력을 사용해요.</p>
    </div>

    <!-- 오류/잘못된 QR -->
    <div class="status-card error" v-else-if="status === 'wrong' || status === 'error'">
      <span class="msr" style="font-size:56px; color:#D64B5F">qr_code</span>
      <p class="status-title">인식이 안 됐어요</p>
      <p class="status-sub">{{ errorMsg }}</p>
      <button class="btn-primary" style="margin-top:16px" @click="retry">다시 스캔하기</button>
    </div>

    <!-- 시연용 수동 입력 -->
    <div class="manual-section">
      <button class="manual-toggle" @click="showManual = !showManual">
        <span class="msr" style="font-size:14px">keyboard</span>
        시연용 코드 직접 입력
      </button>
      <Transition name="slide">
        <div class="manual-input-wrap" v-if="showManual">
          <p class="manual-note">실제 장소의 QR 코드 값을 입력해요 (시연·테스트용)</p>
          <div class="qr-samples">
            <button
              v-for="loc in Object.values(LOCATIONS)"
              :key="loc.id"
              class="sample-chip"
              @click="manualCode = loc.qrCode; tryManual()"
            >{{ loc.name }}</button>
          </div>
          <div class="manual-row">
            <input v-model="manualCode" class="manual-input" placeholder="QR 코드 값 입력" @keyup.enter="tryManual" />
            <button class="manual-submit" @click="tryManual">확인</button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 위치별 QR 정보 (장소 운영자용) -->
    <div class="location-qr-list">
      <p class="list-label">이 장소에 QR 코드를 부착하세요</p>
      <div class="qr-items">
        <div v-for="loc in Object.values(LOCATIONS)" :key="loc.id" class="qr-item">
          <span class="msr" style="font-size:16px; color:var(--teal)">location_on</span>
          <div>
            <p class="qr-loc-name">{{ loc.name }}</p>
            <p class="qr-code-val">{{ loc.qrCode }}</p>
          </div>
          <div
            class="awoken-badge"
            v-if="game.checkIns?.[loc.id]"
          >✓</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qr-screen {
  background: #08233F;
  display: flex; flex-direction: column; gap: 0; overflow-y: auto;
}

.qr-header {
  display: flex; align-items: center; gap: 12px;
  padding: 52px 16px 16px; background: #08233F;
}
.back-btn { background: none; border: none; cursor: pointer; padding: 0; }
.header-sub  { font-size: 11px; font-weight: 800; color: var(--teal); }
.header-title{ font-size: 20px; font-weight: 900; color: var(--white); }

.viewfinder-wrap {
  position: relative; margin: 0 24px;
  border-radius: 24px; overflow: hidden;
  aspect-ratio: 1; background: #000;
}
.camera-video { width: 100%; height: 100%; object-fit: cover; }

.finder-frame {
  position: absolute; inset: 0; pointer-events: none;
}
.corner {
  position: absolute; width: 28px; height: 28px;
  border-color: var(--teal); border-style: solid;
}
.tl { top: 16px;    left: 16px;   border-width: 3px 0 0 3px; border-radius: 6px 0 0 0; }
.tr { top: 16px;    right: 16px;  border-width: 3px 3px 0 0; border-radius: 0 6px 0 0; }
.bl { bottom: 16px; left: 16px;   border-width: 0 0 3px 3px; border-radius: 0 0 0 6px; }
.br { bottom: 16px; right: 16px;  border-width: 0 3px 3px 0; border-radius: 0 0 6px 0; }

.scan-line {
  position: absolute; left: 24px; right: 24px; height: 2px;
  background: var(--teal); box-shadow: 0 0 8px var(--teal);
  animation: scan 2s ease-in-out infinite;
}
@keyframes scan {
  0%   { top: 24px;  opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { top: calc(100% - 24px); opacity: 0; }
}

.scan-hint {
  position: absolute; bottom: 12px; left: 0; right: 0;
  text-align: center; font-size: 12px; font-weight: 700;
  color: #FFFFFFCC; text-shadow: 0 1px 4px #000;
}

.status-card {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 40px 24px; text-align: center;
}
.status-title { font-size: 20px; font-weight: 900; color: var(--white); }
.status-sub   { font-size: 13px; font-weight: 700; color: #9FC1C8; word-break: keep-all; }
.status-card.success .status-title { color: var(--teal); }

.manual-section {
  margin: 16px 16px 0; display: flex; flex-direction: column; gap: 8px;
}
.manual-toggle {
  display: flex; align-items: center; gap: 6px; justify-content: center;
  background: #FFFFFF11; border: 1px solid #FFFFFF22; border-radius: 12px;
  padding: 10px; font-family: var(--font); font-size: 12px; font-weight: 700;
  color: #9FC1C8; cursor: pointer; width: 100%;
}
.manual-note { font-size: 11px; font-weight: 600; color: #9FC1C8; }
.qr-samples { display: flex; gap: 6px; flex-wrap: wrap; }
.sample-chip {
  background: #FFFFFF18; border: 1px solid #FFFFFF22; border-radius: 10px;
  padding: 6px 12px; font-family: var(--font); font-size: 12px; font-weight: 800;
  color: var(--teal); cursor: pointer;
}
.manual-row { display: flex; gap: 8px; }
.manual-input {
  flex: 1; background: #FFFFFF11; border: 1px solid #FFFFFF33; border-radius: 10px;
  padding: 10px 12px; font-family: var(--font); font-size: 13px; color: white; outline: none;
}
.manual-input::placeholder { color: #9FC1C888; }
.manual-submit {
  background: var(--teal); border: none; border-radius: 10px;
  padding: 10px 16px; font-family: var(--font); font-size: 13px; font-weight: 800;
  color: white; cursor: pointer;
}

.location-qr-list {
  margin: 16px; background: #FFFFFF08; border-radius: 18px; padding: 14px;
}
.list-label { font-size: 11px; font-weight: 800; color: #9FC1C8; margin-bottom: 10px; }
.qr-items { display: flex; flex-direction: column; gap: 8px; }
.qr-item {
  display: flex; align-items: center; gap: 10px;
  background: #FFFFFF08; border-radius: 12px; padding: 10px 12px;
}
.qr-loc-name { font-size: 13px; font-weight: 800; color: var(--white); }
.qr-code-val { font-size: 10px; font-weight: 600; color: #9FC1C8; font-family: monospace; }
.awoken-badge {
  margin-left: auto; background: var(--teal); color: white;
  border-radius: 50%; width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 900;
}

.slide-enter-active { transition: all 0.3s ease; }
.slide-enter-from   { opacity: 0; transform: translateY(-8px); }
.slide-leave-active { transition: all 0.2s ease; }
.slide-leave-to     { opacity: 0; }
</style>
