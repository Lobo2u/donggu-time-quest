<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import QRCode from 'qrcode'
import { LOCATIONS } from '../data/gameData.js'

const router = useRouter()
const qrImages = ref({})

const locationList = Object.values(LOCATIONS)

onMounted(async () => {
  for (const loc of locationList) {
    try {
      qrImages.value[loc.id] = await QRCode.toDataURL(loc.qrCode, {
        width: 320, margin: 2,
        color: { dark: '#08233F', light: '#FFFFFF' },
      })
    } catch {}
  }
})

function printPage() { window.print() }
</script>

<template>
  <div class="screen qradmin-screen">
    <div class="qa-header no-print">
      <div>
        <p class="qa-eyebrow">OPERATOR · QR 발급</p>
        <h1 class="qa-title">장소 QR 코드</h1>
      </div>
      <button class="close-btn" @click="router.push('/map')">
        <span class="msr" style="font-size:24px; color:white">close</span>
      </button>
    </div>

    <div class="qa-body">
      <div class="qa-guide no-print">
        <span class="msr" style="font-size:16px; color:var(--teal)">info</span>
        <p>각 장소에 해당 QR을 인쇄해 부착하세요. 방문자가 스캔하면 버디 각성 + 쿠폰이 발급됩니다.</p>
      </div>

      <div class="qr-grid">
        <div v-for="loc in locationList" :key="loc.id" class="qr-card">
          <div class="qr-badge">동구 TIME QUEST</div>
          <h2 class="qr-loc">{{ loc.name }}</h2>
          <p class="qr-sub">{{ loc.subtitle }}</p>
          <img v-if="qrImages[loc.id]" :src="qrImages[loc.id]" class="qr-img" :alt="loc.name + ' QR'" />
          <div v-else class="qr-loading">생성 중…</div>
          <p class="qr-code-text">{{ loc.qrCode }}</p>
          <p class="qr-instruction">여기에서 QR을 스캔하고<br>시간 친구를 각성시켜요!</p>
        </div>
      </div>

      <button class="print-btn no-print" @click="printPage">
        <span class="msr" style="font-size:20px; color:var(--navy)">print</span>
        인쇄 / PDF 저장
      </button>
    </div>
  </div>
</template>

<style scoped>
.qradmin-screen { background: var(--paper); display: flex; flex-direction: column; overflow: hidden; }

.qa-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 52px 20px 16px; background: var(--navy); flex-shrink: 0;
}
.qa-eyebrow { font-size: 11px; font-weight: 900; color: var(--teal); letter-spacing: 1.4px; }
.qa-title { font-size: 24px; font-weight: 900; color: var(--white); margin-top: 2px; }
.close-btn { background: #FFFFFF18; border: none; border-radius: 12px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

.qa-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }

.qa-guide {
  display: flex; align-items: center; gap: 8px;
  background: var(--sky); border-radius: 14px; padding: 10px 14px;
  font-size: 12px; font-weight: 700; color: var(--ink); line-height: 1.4; word-break: keep-all;
}

.qr-grid { display: flex; flex-direction: column; gap: 14px; }

.qr-card {
  background: var(--white); border: 2px solid var(--navy); border-radius: 22px;
  padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 6px;
  box-shadow: 0 4px 14px #08233F0D;
}
.qr-badge {
  background: var(--navy); color: var(--orange); border-radius: 10px;
  padding: 4px 12px; font-size: 11px; font-weight: 900; letter-spacing: 0.5px;
}
.qr-loc { font-size: 24px; font-weight: 900; color: var(--ink); margin-top: 4px; }
.qr-sub { font-size: 12px; font-weight: 700; color: var(--muted); }
.qr-img { width: 220px; height: 220px; margin: 8px 0; }
.qr-loading { width: 220px; height: 220px; display: flex; align-items: center; justify-content: center; color: var(--muted); }
.qr-code-text { font-family: monospace; font-size: 12px; font-weight: 800; color: var(--navy); letter-spacing: 1px; }
.qr-instruction { font-size: 13px; font-weight: 800; color: var(--teal-dark); text-align: center; line-height: 1.5; margin-top: 4px; }

.print-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: var(--orange); color: var(--navy); border: none; border-radius: 14px;
  padding: 14px; font-family: var(--font); font-size: 15px; font-weight: 800; cursor: pointer;
}

@media print {
  .no-print { display: none !important; }
  .qradmin-screen { height: auto; overflow: visible; }
  .qa-body { padding: 0; }
  .qr-card { page-break-inside: avoid; margin-bottom: 20px; box-shadow: none; }
}
</style>
