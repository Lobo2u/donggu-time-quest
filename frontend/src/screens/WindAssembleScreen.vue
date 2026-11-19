<script setup>
// 피날레 — 날개 색·이름을 고르고 완성하면 2D 픽셀 풍차가 돌고, 엽서 PNG 를 저장.
// 부품 3개 미만이면 잠금. (사진으로 완료한 경로에서도 도달 가능)
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { WIND_QUEST } from '../data/windQuest.js'
import { allPartsCollected, setAssembled, wind } from '../store/windQuestStore.js'

const router = useRouter()
const fin = WIND_QUEST.finale
const ready = computed(() => allPartsCollected())

const colorId = ref(wind.assembled?.wingColor || fin.wingColors[0].id)
const name = ref(wind.assembled?.name || fin.defaultName)
const done = ref(!!wind.assembled)
const saved = ref(false)

const color = computed(() => fin.wingColors.find(c => c.id === colorId.value) || fin.wingColors[0])
// 날개 교차 음영(깊이감)
function darken(hex, f = 0.78) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f)
  return `rgb(${r},${g},${b})`
}
const wedge = computed(() => [color.value.hex, darken(color.value.hex), color.value.hex, darken(color.value.hex)])

function complete() {
  setAssembled({ wingColor: colorId.value, wingName: color.value.name, name: name.value.trim() || fin.defaultName })
  done.value = true
}

function savePostcard() {
  const W = 720, H = 960
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')
  // 배경(하늘)
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#bcd6e8'); g.addColorStop(1, '#eaf2e6')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  // 언덕
  ctx.fillStyle = '#7fb07a'; ctx.beginPath(); ctx.moveTo(0, H); ctx.quadraticCurveTo(W / 2, H - 260, W, H); ctx.closePath(); ctx.fill()
  ctx.fillStyle = '#6aa37a'; ctx.beginPath(); ctx.moveTo(0, H); ctx.quadraticCurveTo(W / 2, H - 180, W, H); ctx.closePath(); ctx.fill()
  // 제목
  ctx.fillStyle = '#0b2a45'; ctx.textAlign = 'center'
  ctx.font = '900 44px "Malgun Gothic", sans-serif'
  ctx.fillText('대동의 바람을 찾아서', W / 2, 92)
  // 풍차 기둥
  const cx = W / 2, cy = 430, r = 180
  ctx.fillStyle = '#8a6a4a'; ctx.fillRect(cx - 10, cy, 20, H - cy - 210)
  // 풍차 날개(핀휠)
  const cols = wedge.value
  for (let i = 0; i < 4; i++) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(i * Math.PI / 2)
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r); ctx.arc(0, 0, r, -Math.PI / 2, 0); ctx.closePath()
    ctx.fillStyle = cols[i]; ctx.fill()
    ctx.restore()
  }
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.12, 0, Math.PI * 2); ctx.fillStyle = '#08233F'; ctx.fill()
  // 풍차 이름 패널
  ctx.fillStyle = '#0b2a45ee'; const bw = 460, bh = 92, bx = cx - bw / 2, by = H - 190
  roundRect(ctx, bx, by, bw, bh, 18); ctx.fill()
  ctx.fillStyle = '#fff'; ctx.font = '900 40px "Malgun Gothic", sans-serif'
  ctx.fillText(name.value.trim() || fin.defaultName, cx, by + 50)
  ctx.font = '600 20px "Malgun Gothic", sans-serif'; ctx.fillStyle = '#bcd3e6'
  ctx.fillText(`${color.value.name} 날개 · 대동 · 동구ON`, cx, by + 78)
  // 날짜
  ctx.fillStyle = '#4a6070'; ctx.font = '600 18px "Malgun Gothic", sans-serif'
  ctx.fillText(new Date().toLocaleDateString('ko-KR'), cx, H - 40)

  const a = document.createElement('a')
  a.href = cv.toDataURL('image/png'); a.download = `대동의바람-${Date.now()}.png`; a.click()
  saved.value = true; setTimeout(() => (saved.value = false), 1500)
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}

onMounted(() => { if (!ready.value) { /* 잠금 화면 표시 */ } })
</script>

<template>
  <main class="wa-s">
    <header class="h">
      <button class="round" aria-label="뒤로" @click="router.push('/wind')"><span class="msr">arrow_back</span></button>
      <strong>풍차 조립</strong>
    </header>

    <!-- 잠금 -->
    <section v-if="!ready" class="locked">
      <span class="msr lock">lock</span>
      <h2>아직 부품이 부족해요</h2>
      <p>풍차 부품 3개를 모두 모으면 조립할 수 있어요.</p>
      <button class="go" @click="router.push('/wind')">단서 찾으러 가기</button>
    </section>

    <!-- 조립 -->
    <section v-else class="build">
      <!-- 도는 풍차 미리보기 -->
      <div class="stage">
        <div class="pole"></div>
        <svg class="mill spin" viewBox="-110 -110 220 220" aria-label="풍차">
          <g>
            <path d="M0 0 L0 -100 A100 100 0 0 1 100 0 Z" :fill="wedge[0]" />
            <path d="M0 0 L100 0 A100 100 0 0 1 0 100 Z" :fill="wedge[1]" />
            <path d="M0 0 L0 100 A100 100 0 0 1 -100 0 Z" :fill="wedge[2]" />
            <path d="M0 0 L-100 0 A100 100 0 0 1 0 -100 Z" :fill="wedge[3]" />
            <circle r="13" fill="#08233F" />
          </g>
        </svg>
        <div class="name-plate">{{ name.trim() || fin.defaultName }}</div>
      </div>

      <!-- 날개 색 -->
      <div class="field">
        <label>날개 색</label>
        <div class="colors">
          <button v-for="c in fin.wingColors" :key="c.id" class="sw" :class="{ on: colorId === c.id }"
            :style="{ background: c.hex }" :aria-label="c.name" @click="colorId = c.id"></button>
        </div>
        <span class="cname">{{ color.name }}</span>
      </div>

      <!-- 이름 -->
      <div class="field">
        <label>풍차 이름</label>
        <input class="in" v-model="name" maxlength="16" :placeholder="fin.defaultName" />
      </div>

      <button v-if="!done" class="go" @click="complete">풍차 완성하기</button>
      <template v-else>
        <div class="done-msg"><span class="msr">celebration</span> 「{{ name.trim() || fin.defaultName }}」 완성!</div>
        <button class="go save" @click="savePostcard"><span class="msr">photo_camera</span>{{ saved ? '저장됨 ✓' : '픽셀 엽서 저장 (PNG)' }}</button>
        <button class="ghost" @click="router.push('/wind')">허브로</button>
      </template>
    </section>
  </main>
</template>

<style scoped>
.wa-s { position: fixed; inset: 0; z-index: 1600; background: #0e1a24; color: #e7eff6; overflow-y: auto; padding-bottom: 28px; font-family: var(--font); }
.h { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; gap: 10px; padding: 14px; background: #0e1a24; border-bottom: 1px solid #ffffff14; }
.h strong { font-size: 15px; font-weight: 900; }
.round { width: 38px; height: 38px; border-radius: 50%; border: none; cursor: pointer; background: #0008; display: flex; align-items: center; justify-content: center; color: #fff; }

.locked { text-align: center; padding: 60px 24px; }
.locked .lock { font-size: 54px; color: #6f90a8; }
.locked h2 { font-size: 18px; margin: 12px 0 6px; }
.locked p { font-size: 13px; color: #a9c0d2; }

.build { margin: 16px 14px; }
.stage { position: relative; height: 300px; display: flex; align-items: center; justify-content: center; background: linear-gradient(#bcd6e8, #eaf2e6); border-radius: 16px; overflow: hidden; }
.pole { position: absolute; bottom: 36px; width: 16px; height: 150px; background: #8a6a4a; border-radius: 3px; }
.mill { position: absolute; top: 40px; width: 190px; height: 190px; }
.spin { animation: spin 3.4s linear infinite; transform-origin: 50% 50%; }
@keyframes spin { to { transform: rotate(360deg); } }
.name-plate { position: absolute; bottom: 12px; background: #0b2a45ee; color: #fff; font-weight: 900; font-size: 14px; padding: 7px 16px; border-radius: 12px; }

.field { margin-top: 18px; }
.field label { display: block; font-size: 12px; font-weight: 800; color: #bcd3e4; margin-bottom: 8px; }
.colors { display: flex; gap: 10px; }
.sw { width: 44px; height: 44px; border-radius: 50%; border: 3px solid #ffffff33; cursor: pointer; }
.sw.on { border-color: #fff; transform: scale(1.1); }
.cname { display: inline-block; margin-top: 8px; font-size: 12px; color: #9fb6c6; }
.in { width: 100%; height: 48px; border: 1px solid #ffffff2e; background: #0d2135; color: #fff; border-radius: 12px; padding: 0 14px; font-size: 15px; font-family: var(--font); }

.go { width: 100%; height: 52px; border: none; border-radius: 14px; background: var(--orange); color: var(--navy); font-family: var(--font); font-size: 15px; font-weight: 900; cursor: pointer; margin-top: 20px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.go.save { background: #2f6b4a; color: #fff; }
.done-msg { text-align: center; font-size: 16px; font-weight: 900; color: var(--orange); margin-top: 20px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.ghost { width: 100%; height: 46px; border: 1px solid #ffffff2e; background: transparent; color: #cfe0f0; border-radius: 12px; font-weight: 800; cursor: pointer; margin-top: 10px; font-family: var(--font); }
</style>
