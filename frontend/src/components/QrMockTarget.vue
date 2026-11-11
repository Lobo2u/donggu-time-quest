<script setup>
// 카메라(목업) 화면 속 실제 QR — 현장 팻말 또는 매장 카운터 스탠드에 붙은 QR 을 그려 주고,
// 누르면 스캔 연출(스캔 선 → 초록 인식 테두리) 뒤 'scan' 을 보낸다.
import { ref, watch, onMounted } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
  code:  { type: String, required: true },          // QR 내용
  label: { type: String, default: '' },             // 팻말·매장 이름
  kind:  { type: String, default: 'sign' },         // sign(현장 팻말) | store(매장 스탠드)
  icon:  { type: String, default: 'signpost' },
  done:  { type: Boolean, default: false },         // 이미 인식한 QR
})
const emit = defineEmits(['scan'])

const canvas = ref(null)
const phase = ref('idle') // idle | scanning | found

function draw() {
  if (canvas.value) QRCode.toCanvas(canvas.value, props.code, { margin: 1, width: 128, color: { dark: '#111111', light: '#FFFFFF' } }).catch(() => {})
}
onMounted(draw)
watch(() => props.code, () => { phase.value = 'idle'; draw() })

function scan() {
  if (phase.value !== 'idle' || props.done) return
  phase.value = 'scanning'
  setTimeout(() => { phase.value = 'found' }, 850)
  setTimeout(() => { emit('scan', props.code); phase.value = 'idle' }, 1250)
}
defineExpose({ scan })
</script>

<template>
  <button class="qr-target" :class="[kind, phase, { done }]" :aria-label="`${label} QR 인식하기`" @click="scan">
    <!-- 현장 팻말: 나무 기둥 + 안내판 + QR 스티커 -->
    <template v-if="kind === 'sign'">
      <span class="plate">
        <span class="plate-head"><span class="msr" style="font-size:14px">{{ icon }}</span>{{ label }}</span>
        <span class="qr-sticker">
          <canvas ref="canvas" width="128" height="128"></canvas>
          <span class="sticker-cap">동구 TIME QUEST</span>
        </span>
      </span>
      <span class="post"></span>
    </template>
    <!-- 매장 스탠드: 아크릴 카운터 QR 스탠드 -->
    <template v-else>
      <span class="stand">
        <span class="stand-top">{{ label }} 현장 인증</span>
        <span class="qr-sticker">
          <canvas ref="canvas" width="128" height="128"></canvas>
        </span>
        <span class="stand-cap">QR을 비춰 주세요</span>
      </span>
      <span class="stand-base"></span>
    </template>

    <!-- 스캔 연출 -->
    <span v-if="phase === 'scanning'" class="scan-line"></span>
    <span v-if="phase !== 'idle'" class="lock" :class="phase"></span>
    <span v-if="done" class="done-badge"><span class="msr" style="font-size:16px">check</span> 인식 완료</span>
  </button>
</template>

<style scoped>
.qr-target {
  position: relative; display: flex; flex-direction: column; align-items: center;
  background: none; border: none; padding: 0; cursor: pointer; font-family: var(--font);
  transform: perspective(600px) rotateY(-10deg) rotateX(3deg);
  filter: drop-shadow(0 10px 14px #0007);
  animation: settle 0.35s ease-out;
}
.qr-target.done { cursor: default; }
.qr-target.done .qr-sticker canvas { opacity: 0.45; }

/* 현장 팻말 */
.plate {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 8px 10px 10px; border-radius: 6px;
  background: linear-gradient(160deg, #8A5A36, #6B4426);
  border: 3px solid #4E3019;
}
.plate-head {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 900; color: #FFF4DF; letter-spacing: 0.3px; white-space: nowrap;
}
.post { width: 16px; height: 46px; background: linear-gradient(90deg, #5A3A20, #7A5030, #5A3A20); }

/* 매장 스탠드 */
.stand {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 10px 12px; border-radius: 12px 12px 4px 4px;
  background: linear-gradient(180deg, #FFFFFFF2, #EEF2F5F2);
  border: 2px solid #C9D3DD; box-shadow: inset 0 0 0 4px #FFFFFF;
}
.stand-top { font-size: 11px; font-weight: 900; color: var(--navy); white-space: nowrap; }
.stand-cap { font-size: 10px; font-weight: 800; color: #E8873A; }
.stand-base { width: 120px; height: 12px; border-radius: 0 0 8px 8px; background: linear-gradient(180deg, #B9C3CC, #8E99A4); }

.qr-sticker {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: white; padding: 6px; border-radius: 4px;
}
.qr-sticker canvas { width: 104px; height: 104px; display: block; }
.sticker-cap { font-size: 7px; font-weight: 900; letter-spacing: 0.6px; color: #E8873A; }

/* 스캔 연출 */
.scan-line {
  position: absolute; left: -6px; right: -6px; height: 3px; top: 0;
  background: #4DF07A; box-shadow: 0 0 12px #4DF07A;
  animation: scan 0.85s ease-in-out;
}
.lock {
  position: absolute; inset: -8px; border-radius: 10px;
  border: 3px solid #FFFFFF99; pointer-events: none;
}
.lock.found { border-color: #4DF07A; box-shadow: 0 0 0 4px #4DF07A44; animation: pop 0.3s ease-out; }
.done-badge {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -80%);
  display: flex; align-items: center; gap: 2px; white-space: nowrap;
  background: #2E7D32; color: white; border-radius: 10px; padding: 4px 10px;
  font-size: 12px; font-weight: 900;
}

@keyframes scan { from { top: 0; } to { top: calc(100% - 3px); } }
@keyframes pop { from { transform: scale(1.06); } to { transform: none; } }
@keyframes settle { from { opacity: 0; transform: perspective(600px) rotateY(-10deg) rotateX(3deg) translateY(10px); } }
</style>
