<script setup>
// AR 관리 콘솔 — 다른 개발자(백엔드 포함)가 쉽게 쓰도록.
// ① 현재 기기의 AR 지원 현황을 한눈에, ② 장소/모델을 자유롭게 추가·수정·삭제,
// ③ 바로 쓸 수 있는 코드·링크를 복사. (호스팅한 GLB/USDZ URL 을 붙여넣는 방식)
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { detectArCapabilities } from '../ar/platform.js'
import { arModels, getModel, saveModel, clearModel, LOCATION_NAMES } from '../store/arModelStore.js'

const router = useRouter()

// ── 지원 현황 ────────────────────────────────────────────────
const caps = ref({ secure: false, webxr: false, quickLook: false, camera: false, gyro: false })
onMounted(async () => {
  const c = await detectArCapabilities()
  caps.value = {
    secure: c.secure, webxr: c.webxr, quickLook: c.quickLook,
    camera: !!navigator.mediaDevices?.getUserMedia,
    gyro: typeof globalThis.DeviceOrientationEvent !== 'undefined',
  }
})
const capList = computed(() => [
  { key: 'secure', label: '보안 컨텍스트(HTTPS)', ok: caps.value.secure, note: 'AR·카메라의 필수 조건' },
  { key: 'webxr', label: '안드로이드 WebXR', ok: caps.value.webxr, note: '실공간에 세워 걸어서 둘러보기' },
  { key: 'quickLook', label: 'iOS USDZ Quick Look', ok: caps.value.quickLook, note: 'USDZ 로 실공간 배치' },
  { key: 'camera', label: '카메라(매직윈도우)', ok: caps.value.camera, note: '실시간 화면 위 겹쳐 보기' },
  { key: 'gyro', label: '자이로(기기 방향)', ok: caps.value.gyro, note: '기울여 둘러보기' },
])

// ── 등록 목록(자유 추가/수정/삭제) ───────────────────────────
const ids = computed(() => Object.keys(arModels))
const form = ref(blank())
const editingId = ref('')
const saved = ref('')
const err = ref('')

function blank() { return { id: '', glbUrl: '', usdzUrl: '', videoUrl: '', poster: '', scaleMeters: 1, yawDeg: 0 } }

function edit(id) {
  const m = getModel(id) || {}
  form.value = { id, glbUrl: m.glbUrl || '', usdzUrl: m.usdzUrl || '', videoUrl: m.videoUrl || '', poster: m.poster || '', scaleMeters: m.scaleMeters ?? 1, yawDeg: m.yawDeg ?? 0 }
  editingId.value = id; saved.value = ''; err.value = ''
}
function newEntry() { form.value = blank(); editingId.value = ''; saved.value = ''; err.value = '' }

function save() {
  err.value = ''; saved.value = ''
  const id = form.value.id.trim()
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(id)) { err.value = 'id 는 영문·숫자·_-만 사용하세요 (예: sojedom).'; return }
  if (!form.value.glbUrl && !form.value.usdzUrl) { err.value = 'GLB URL 또는 USDZ URL 중 하나는 필요해요.'; return }
  try {
    saveModel(id, {
      glbUrl: form.value.glbUrl.trim(), usdzUrl: form.value.usdzUrl.trim(),
      videoUrl: form.value.videoUrl.trim(), poster: form.value.poster.trim(),
      scaleMeters: Number(form.value.scaleMeters) || 1, yawDeg: Number(form.value.yawDeg) || 0,
    })
    editingId.value = id; saved.value = id
  } catch (e) { err.value = e.message || '저장 실패' }
}

async function remove(id) {
  await clearModel(id)
  if (editingId.value === id) newEntry()
}

function openViewer(id) { router.push(`/ar-view/${id}`) }

// ── 코드/링크 생성 ───────────────────────────────────────────
const appBase = computed(() => `${location.origin}${import.meta.env.BASE_URL}`)
const snippets = computed(() => {
  const id = form.value.id.trim() || 'LOCATION_ID'
  const g = form.value.glbUrl.trim(); const u = form.value.usdzUrl.trim(); const v = form.value.videoUrl.trim()
  const link = `${appBase.value}#/ar-view/${id}`
  const quick = `${link}?glb=${g || 'GLB_URL'}` + (u ? `&usdz=${u}` : '')
  return [
    { key: 'link', title: '플레이어 링크 (등록 후)', code: link },
    { key: 'quick', title: '등록 없이 바로 테스트 (URL 파라미터)', code: quick },
    { key: 'push', title: '앱 안에서 이동', code: `router.push('/ar-view/${id}')` },
    { key: 'register', title: '코드로 등록', code:
`import { saveModel } from '@/store/arModelStore.js'
saveModel('${id}', {
  glbUrl: '${g || 'https://cdn.example.com/building.glb'}',
  usdzUrl: '${u || ''}',   // iOS Quick Look (선택)
  videoUrl: '${v || ''}',  // 배경 영상 (선택)
  scaleMeters: ${Number(form.value.scaleMeters) || 1},
  yawDeg: ${Number(form.value.yawDeg) || 0},
})` },
    { key: 'iframe', title: '외부 페이지에 임베드', code:
`<iframe src="${link}"
  allow="camera; gyroscope; accelerometer; xr-spatial-tracking; fullscreen"
  style="border:0;width:100%;height:100%"></iframe>` },
  ]
})

const copied = ref('')
async function copy(key, text) {
  try { await navigator.clipboard.writeText(text); copied.value = key; setTimeout(() => (copied.value = ''), 1200) }
  catch { err.value = '복사 실패 — 직접 선택해 복사하세요.' }
}
</script>

<template>
  <main class="con">
    <header class="hd">
      <button class="back" @click="router.push('/map')">← 지도</button>
      <h1>AR 관리 콘솔</h1>
      <span class="sub">지원 현황 · 등록 · 코드</span>
    </header>

    <!-- 지원 현황 -->
    <section class="card">
      <h2>이 기기의 AR 지원</h2>
      <div class="caps">
        <div v-for="c in capList" :key="c.key" class="cap" :class="{ ok: c.ok }">
          <span class="msr">{{ c.ok ? 'check_circle' : 'cancel' }}</span>
          <div><strong>{{ c.label }}</strong><small>{{ c.note }}</small></div>
        </div>
      </div>
      <p class="muted">※ 지원 여부는 접속한 기기·브라우저 기준. 플레이어는 지원에 맞춰 자동 분기(WebXR→QuickLook→매직윈도우)합니다.</p>
    </section>

    <!-- 등록 목록 -->
    <section class="card">
      <div class="row-h">
        <h2>등록된 AR ({{ ids.length }})</h2>
        <button class="mini" @click="newEntry">+ 새로 추가</button>
      </div>
      <p v-if="!ids.length" class="muted">아직 없음. 아래에서 추가하세요.</p>
      <ul v-else class="list">
        <li v-for="id in ids" :key="id" :class="{ on: editingId === id }">
          <div class="li-main">
            <strong>{{ id }}</strong>
            <span v-if="LOCATION_NAMES[id]" class="tag">{{ LOCATION_NAMES[id] }}</span>
            <span v-if="arModels[id].placeholder" class="tag ph">샘플</span>
            <span class="kinds">
              <span v-if="arModels[id].glbUrl || arModels[id].blobKey" class="k">GLB</span>
              <span v-if="arModels[id].usdzUrl" class="k">USDZ</span>
              <span v-if="arModels[id].videoUrl" class="k">영상</span>
            </span>
          </div>
          <div class="li-act">
            <button class="mini" @click="openViewer(id)">열기</button>
            <button class="mini" @click="edit(id)">수정</button>
            <button class="mini danger" @click="remove(id)">삭제</button>
          </div>
        </li>
      </ul>
    </section>

    <!-- 추가/수정 폼 -->
    <section class="card">
      <h2>{{ editingId ? `수정: ${editingId}` : '새 AR 추가' }}</h2>
      <label class="f">장소 id<input v-model="form.id" :disabled="!!editingId" placeholder="sojedom" /></label>
      <label class="f">GLB URL<input v-model="form.glbUrl" type="url" placeholder="https://cdn.../building.glb" /></label>
      <label class="f">USDZ URL (iOS, 선택)<input v-model="form.usdzUrl" type="url" placeholder="https://cdn.../building.usdz" /></label>
      <label class="f">배경 영상 URL (선택)<input v-model="form.videoUrl" type="url" placeholder="https://cdn.../scene.mp4" /></label>
      <label class="f">포스터 URL (iOS 썸네일, 선택)<input v-model="form.poster" type="url" placeholder="https://cdn.../poster.jpg" /></label>
      <div class="g2">
        <label class="f">크기(배율)<input v-model.number="form.scaleMeters" type="number" min="0.05" step="0.1" /></label>
        <label class="f">회전(°)<input v-model.number="form.yawDeg" type="number" step="5" /></label>
      </div>
      <p v-if="err" class="err">{{ err }}</p>
      <div class="g2">
        <button class="save" @click="save">{{ saved ? '저장됨 ✓' : editingId ? '수정 저장' : '추가' }}</button>
        <button v-if="form.id" class="mini" @click="openViewer(form.id.trim())">미리 열기</button>
      </div>
    </section>

    <!-- 코드/링크 -->
    <section class="card">
      <h2>코드 · 링크 복사</h2>
      <div v-for="s in snippets" :key="s.key" class="snip">
        <div class="snip-h"><span>{{ s.title }}</span>
          <button class="mini" @click="copy(s.key, s.code)">{{ copied === s.key ? '복사됨 ✓' : '복사' }}</button>
        </div>
        <pre>{{ s.code }}</pre>
      </div>
    </section>
  </main>
</template>

<style scoped>
.con { position: fixed; inset: 0; z-index: 1700; background: #0e1a24; color: #e7eff6; overflow-y: auto; padding-bottom: 28px; font-size: 13px; }
.hd { position: sticky; top: 0; z-index: 2; display: flex; align-items: baseline; gap: 10px; padding: 14px 16px; background: #0e1a24; border-bottom: 1px solid #ffffff1a; }
.back { border: 0; background: none; color: #9fc0d8; font-weight: 700; cursor: pointer; }
.hd h1 { font-size: 16px; font-weight: 900; }
.hd .sub { font-size: 11px; color: #8aa6ba; }

.card { margin: 12px; background: #0b2033; border: 1px solid #ffffff14; border-radius: 14px; padding: 14px; }
.card h2 { font-size: 13px; font-weight: 900; margin-bottom: 10px; }
.row-h { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.muted { font-size: 11px; color: #8aa6ba; line-height: 1.6; margin-top: 8px; word-break: keep-all; }

.caps { display: grid; grid-template-columns: 1fr; gap: 8px; }
.cap { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 10px; background: #3a1c22; }
.cap.ok { background: #16321f; }
.cap .msr { color: #ff8f7a; font-size: 22px; }
.cap.ok .msr { color: #6fe08a; }
.cap strong { font-size: 12px; } .cap small { display: block; color: #9fb6c6; font-size: 10px; }

.list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
.list li { display: flex; align-items: center; justify-content: space-between; gap: 8px; background: #0d2740; border-radius: 10px; padding: 9px 11px; }
.list li.on { outline: 2px solid var(--orange); }
.li-main { display: flex; align-items: center; gap: 6px; min-width: 0; flex-wrap: wrap; }
.li-main strong { font-size: 13px; }
.tag { font-size: 10px; color: #cfe0f0; }
.tag.ph { background: #5a4a15; color: #ffe0a6; border-radius: 5px; padding: 2px 5px; }
.kinds .k { font-size: 9px; font-weight: 800; background: #15385a; color: #bfe0ff; border-radius: 5px; padding: 2px 5px; margin-left: 3px; }
.li-act { display: flex; gap: 5px; flex-shrink: 0; }

.mini { border: 1px solid #ffffff2e; background: transparent; color: #cfe0f0; border-radius: 8px; padding: 6px 9px; font-size: 11px; font-weight: 700; cursor: pointer; }
.mini.danger { border-color: #ff8f7a55; color: #ff9f8c; }

.f { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #bcd3e4; margin-bottom: 8px; }
.f input { height: 40px; border: 1px solid #ffffff24; background: #0d2135; color: #fff; border-radius: 9px; padding: 0 11px; font-size: 12px; }
.f input:disabled { opacity: .5; }
.g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.err { color: #ffb4a2; font-size: 11px; font-weight: 700; }
.save { height: 44px; border: 0; border-radius: 12px; background: var(--orange); color: var(--navy); font-size: 14px; font-weight: 900; cursor: pointer; }

.snip { margin-bottom: 10px; }
.snip-h { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; font-size: 11px; color: #bcd3e4; }
.snip pre { margin: 0; background: #06121d; border: 1px solid #ffffff14; border-radius: 9px; padding: 10px; font-size: 11px; line-height: 1.5; color: #cfe6d6; overflow-x: auto; white-space: pre; }
</style>
