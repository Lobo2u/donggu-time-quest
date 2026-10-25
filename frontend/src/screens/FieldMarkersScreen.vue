<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import QRCode from 'qrcode'
import { LOCATIONS, FIELD_QUESTS } from '../data/gameData.js'

const router = useRouter()
const qr = ref({})

// 모든 현장 타깃을 장소별로 묶기
const groups = Object.values(FIELD_QUESTS).map(q => ({
  quest: q,
  location: LOCATIONS[q.locationId],
}))

onMounted(async () => {
  for (const g of groups) {
    for (const t of g.quest.targets) {
      try {
        qr.value[t.code] = await QRCode.toDataURL(t.code, {
          width: 300, margin: 1,
          color: { dark: '#3A2A1A', light: '#F5EEDC' },
        })
      } catch {}
    }
  }
})

function printPage() { window.print() }
</script>

<template>
  <div class="screen fm-screen">
    <div class="fm-header no-print">
      <div>
        <p class="fm-eyebrow">OPERATOR · 현장 타깃 발급</p>
        <h1 class="fm-title">유물 팻말 인쇄</h1>
      </div>
      <button class="close-btn" @click="router.push('/map')">
        <span class="msr" style="font-size:24px; color:white">close</span>
      </button>
    </div>

    <div class="fm-body">
      <div class="fm-guide no-print">
        <span class="msr" style="font-size:16px; color:var(--teal)">info</span>
        <p>각 타깃 팻말을 인쇄해 현장의 해당 위치에 부착하세요. 방문자가 현장 탐사에서 카메라로 스캔하면 단서가 열립니다. 발표장에선 인쇄물을 들고 스캔해 시연할 수 있어요.</p>
      </div>

      <div v-for="g in groups" :key="g.quest.id" class="loc-group">
        <h2 class="loc-name no-print">{{ g.location.name }} · 타깃 {{ g.quest.targets.length }}개</h2>
        <div class="plaques">
          <div v-for="t in g.quest.targets" :key="t.code" class="plaque">
            <div class="plaque-top">
              <span class="plaque-brand">동구 TIME QUEST</span>
              <span class="plaque-loc">{{ g.location.name }}</span>
            </div>
            <div class="plaque-icon">
              <span class="msr" style="font-size:40px; color:#8A6D4B">{{ t.icon }}</span>
            </div>
            <h3 class="plaque-label">{{ t.label }}</h3>
            <p class="plaque-hint">{{ t.findHint }}</p>
            <img v-if="qr[t.code]" :src="qr[t.code]" class="plaque-qr" :alt="t.label" />
            <div v-else class="plaque-qr-loading">생성 중…</div>
            <p class="plaque-code">{{ t.code }}</p>
            <p class="plaque-foot">현장 탐사에서 이 팻말을 스캔하세요</p>
          </div>
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
.fm-screen { background: var(--paper); display: flex; flex-direction: column; overflow: hidden; }
.fm-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 52px 20px 16px; background: var(--navy); flex-shrink: 0;
}
.fm-eyebrow { font-size: 11px; font-weight: 900; color: var(--teal); letter-spacing: 1.2px; }
.fm-title { font-size: 24px; font-weight: 900; color: white; margin-top: 2px; }
.close-btn { background: #FFFFFF18; border: none; border-radius: 12px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

.fm-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 16px; }
.fm-guide {
  display: flex; align-items: center; gap: 8px;
  background: var(--sky); border-radius: 14px; padding: 10px 14px;
  font-size: 12px; font-weight: 700; color: var(--ink); line-height: 1.4; word-break: keep-all;
}
.loc-group { display: flex; flex-direction: column; gap: 10px; }
.loc-name { font-size: 15px; font-weight: 900; color: var(--ink); }
.plaques { display: flex; flex-direction: column; gap: 14px; }

/* 유물 팻말 스타일 */
.plaque {
  background: linear-gradient(160deg, #F5EEDC, #E8DCC0);
  border: 3px solid #8A6D4B; border-radius: 16px; padding: 18px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  box-shadow: 0 4px 14px #8A6D4B33;
}
.plaque-top { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.plaque-brand { font-size: 11px; font-weight: 900; color: #8A6D4B; letter-spacing: 1px; }
.plaque-loc { font-size: 12px; font-weight: 800; color: #6B5436; }
.plaque-icon {
  width: 64px; height: 64px; border-radius: 50%; background: #FFFFFF88;
  border: 2px solid #C4A676; display: flex; align-items: center; justify-content: center;
}
.plaque-label { font-size: 20px; font-weight: 900; color: #3A2A1A; }
.plaque-hint { font-size: 12px; font-weight: 700; color: #6B5436; text-align: center; word-break: keep-all; }
.plaque-qr { width: 180px; height: 180px; margin: 4px 0; border-radius: 8px; }
.plaque-qr-loading { width: 180px; height: 180px; display: flex; align-items: center; justify-content: center; color: #8A6D4B; }
.plaque-code { font-family: monospace; font-size: 12px; font-weight: 800; color: #6B5436; letter-spacing: 0.5px; }
.plaque-foot { font-size: 11px; font-weight: 800; color: #8A6D4B; }

.print-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: var(--orange); color: var(--navy); border: none; border-radius: 14px;
  padding: 14px; font-family: var(--font); font-size: 15px; font-weight: 800; cursor: pointer;
}

@media print {
  .no-print { display: none !important; }
  .fm-screen { height: auto; overflow: visible; }
  .fm-body { padding: 0; }
  .plaque { page-break-inside: avoid; margin-bottom: 16px; box-shadow: none; }
}
</style>
