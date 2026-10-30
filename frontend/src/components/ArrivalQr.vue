<script setup>
// 앱 안 가상 QR (byeol-night '포인트 도착 확인' 방식)
// 장소 반경 안에서만 보이고, 누르면 위치(GPS)와 QR 내용을 함께 확인해 도착 처리.
// 카메라 화면 위에서 건물 벽에 붙은 종이 포스터처럼 보이게 그린다 (원근 · 테이프 · 그림자).
import { ref, onMounted, watch } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
  payload: { type: String, required: true },
  place:   { type: String, default: '' },
  busy:    { type: Boolean, default: false },
})
const emit = defineEmits(['press'])

const canvas = ref(null)
function draw() {
  if (canvas.value) QRCode.toCanvas(canvas.value, props.payload, { margin: 1, width: 116, color: { dark: '#1B1F2A', light: '#F7F3E8' } }).catch(() => {})
}
onMounted(draw)
watch(() => props.payload, draw)
</script>

<template>
  <div class="wall-qr">
    <!-- 오래된 벽돌 벽 + 그 위에 붙은 포스터 -->
    <div class="wall">
    <button class="poster" :disabled="busy" aria-label="벽에 붙은 QR 눌러 도착 확인" @click="emit('press', payload)">
      <i class="tape left"></i><i class="tape right"></i>
      <span class="poster-top">동구 TIME QUEST</span>
      <canvas ref="canvas" width="116" height="116"></canvas>
      <span class="poster-place">{{ place }}</span>
      <span v-if="busy" class="poster-busy">확인 중…</span>
    </button>
    </div>
    <p class="wall-hint">벽의 QR을 눌러 도착 확인</p>
  </div>
</template>

<style scoped>
.wall-qr { display: flex; flex-direction: column; align-items: center; gap: 12px; perspective: 700px; }

.wall {
  position: relative;
  padding: 26px 34px 24px;
  border-radius: 4px;
  background-color: #C9BBA3;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='30'%3E%3Crect width='60' height='30' fill='%23CDBFA6'/%3E%3Crect x='1' y='1' width='58' height='13' rx='1.5' fill='%23A9573A'/%3E%3Crect x='-29' y='16' width='58' height='13' rx='1.5' fill='%239E4F33'/%3E%3Crect x='31' y='16' width='58' height='13' rx='1.5' fill='%23B0603F'/%3E%3C/svg%3E");
  background-size: 48px 24px;
  /* 벽 가장자리는 어둡게, 빛이 위에서 비추는 느낌 */
  box-shadow: inset 0 0 28px #00000088, inset 0 14px 20px #FFFFFF22, 0 10px 24px #00000066;
  transform: rotateY(-16deg) rotateX(5deg);
  transform-origin: center;
}

.poster {
  position: relative;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 12px 12px 8px;
  border: none; border-radius: 2px; cursor: pointer;
  background:
    radial-gradient(circle at 30% 20%, #FFFFFF66, transparent 60%),
    linear-gradient(160deg, #FAF6EC, #EDE6D3);
  /* 벽(.wall)이 기울어 있고, 포스터는 그 위에 살짝 삐뚤게 붙음 */
  transform: rotate(-2deg);
  box-shadow: 3px 4px 0 -1px #00000033, 6px 9px 12px #00000066;
  font-family: var(--font);
}
.poster:active { transform: rotate(-2deg) scale(0.97); }
.poster:disabled { cursor: wait; }
.poster canvas { width: 116px; height: 116px; display: block; }

.poster-top { font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #E8873A; }
.poster-place { font-size: 11px; font-weight: 900; color: #1B1F2A; }
.poster-busy {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: #F7F3E8E6; font-size: 13px; font-weight: 900; color: var(--navy);
}

/* 종이를 붙인 마스킹 테이프 */
.tape {
  position: absolute; top: -8px; width: 44px; height: 16px;
  background: #F2E3B5CC; box-shadow: 0 1px 2px #0002;
}
.tape.left  { left: -12px; transform: rotate(-38deg); }
.tape.right { right: -12px; transform: rotate(38deg); }

.wall-hint {
  font-size: 12px; font-weight: 900; color: white; text-shadow: 0 1px 4px #000c;
  animation: hint-blink 1.6s ease-in-out infinite;
}
@keyframes hint-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
</style>
