<script setup>
// 앱 안 가상 QR (byeol-night '포인트 도착 확인' 방식)
// 장소 반경 안에서만 떠 있고, 누르면 위치(GPS)와 QR 내용을 함께 확인해 도착 처리.
// 실물 QR 을 붙이지 않아도 되고, 반경 밖에서는 QR 자체가 안 보여 원격 인증을 막는다.
import { ref, onMounted, watch } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
  payload: { type: String, required: true },
  busy:    { type: Boolean, default: false },
})
const emit = defineEmits(['press'])

const canvas = ref(null)
function draw() {
  if (canvas.value) QRCode.toCanvas(canvas.value, props.payload, { margin: 1, width: 132 }).catch(() => {})
}
onMounted(draw)
watch(() => props.payload, draw)
</script>

<template>
  <button class="arrival-qr" :disabled="busy" aria-label="떠 있는 QR 눌러 도착 확인" @click="emit('press', payload)">
    <canvas ref="canvas" width="132" height="132"></canvas>
    <span>{{ busy ? '확인 중…' : '눌러서 도착 확인' }}</span>
  </button>
</template>

<style scoped>
.arrival-qr {
  align-self: center;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  background: var(--white); border: 3px solid var(--orange); border-radius: 20px;
  padding: 12px 16px 10px; cursor: pointer; box-shadow: var(--shadow);
  font-family: var(--font); font-size: 13px; font-weight: 900; color: var(--navy);
  animation: hover-float 2.4s ease-in-out infinite;
}
.arrival-qr:disabled { opacity: 0.7; cursor: wait; }
.arrival-qr canvas { width: 132px; height: 132px; }
@keyframes hover-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
</style>
