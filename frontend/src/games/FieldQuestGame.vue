<!-- 현장 탐사: 타깃 팻말을 카메라로 인식해 단서 수집 → 방탈출식 조합 -->
<script setup>
import { ref, computed, reactive, onBeforeUnmount } from 'vue'
import jsQR from 'jsqr'
import { abilityPower } from '../store/gameStore.js'
import { BUDDIES } from '../data/gameData.js'

const props = defineProps({ mission: Object })
const emit = defineEmits(['win'])

const buddy = computed(() => BUDDIES[props.mission.buddyId])

// 수집 상태
const collected = reactive({})  // targetId -> true
const collectedCount = computed(() => props.mission.targets.filter(t => collected[t.id]).length)
const allCollected = computed(() => collectedCount.value === props.mission.targets.length)

// ── 카메라 스캔 ───────────────────────────────────────────────────────────────
const camOpen = ref(false)
const camStatus = ref('idle') // idle | scanning | denied | error
const videoEl = ref(null)
const canvasEl = ref(null)
const scanToast = ref(null)
const showManual = ref(false)
const manualCode = ref('')
let stream = null, rafId = null

async function openCamera() {
  camOpen.value = true
  camStatus.value = 'scanning'
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    videoEl.value.srcObject = stream
    await videoEl.value.play()
    scanLoop()
  } catch (e) {
    camStatus.value = e.name === 'NotAllowedError' ? 'denied' : 'error'
  }
}

function scanLoop() {
  if (!camOpen.value || !videoEl.value || videoEl.value.readyState < 2) {
    rafId = requestAnimationFrame(scanLoop); return
  }
  const c = canvasEl.value, ctx = c.getContext('2d')
  c.width = videoEl.value.videoWidth; c.height = videoEl.value.videoHeight
  ctx.drawImage(videoEl.value, 0, 0)
  const img = ctx.getImageData(0, 0, c.width, c.height)
  const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
  if (code) { handleCode(code.data); }
  rafId = requestAnimationFrame(scanLoop)
}

let lastHandled = 0
function handleCode(raw) {
  const now = Date.now()
  if (now - lastHandled < 1200) return
  const target = props.mission.targets.find(t => t.code === raw)
  if (!target) { flashToast('이 미션의 타깃이 아니에요'); lastHandled = now; return }
  if (collected[target.id]) { flashToast(`이미 찾았어요: ${target.label}`); lastHandled = now; return }
  lastHandled = now
  collect(target)
}

function tryManual() {
  const v = manualCode.value.trim()
  const target = props.mission.targets.find(t => t.code === v)
  if (!target) { flashToast('코드를 확인해요'); return }
  if (collected[target.id]) { flashToast('이미 찾았어요'); return }
  collect(target)
  manualCode.value = ''
}

function collect(target) {
  collected[target.id] = true
  flashToast(`인식 완료! 단서: ${target.clue}`)
  if (allCollected.value) setTimeout(closeCamera, 900)
}

function flashToast(msg) { scanToast.value = msg; setTimeout(() => { if (scanToast.value === msg) scanToast.value = null }, 1500) }

function closeCamera() {
  camOpen.value = false
  if (rafId) cancelAnimationFrame(rafId)
  if (stream) stream.getTracks().forEach(t => t.stop())
  stream = null
}
onBeforeUnmount(closeCamera)

// ── 버디 능력: 단서 자동 관찰 (레벨/각성에 따라 N개) ──────────────────────────
const abilityUses = computed(() => abilityPower(props.mission.buddyId))
const abilityUsed = ref(false)
function useAbility() {
  if (abilityUsed.value || !abilityUses.value) return
  abilityUsed.value = true
  const remaining = props.mission.targets.filter(t => !collected[t.id])
  remaining.slice(0, abilityUses.value).forEach(t => {
    collected[t.id] = true
  })
  flashToast(`${buddy.value?.name}의 능력으로 단서를 관찰했어요`)
}

// ── 조합(방탈출) 단계 ─────────────────────────────────────────────────────────
const phase = ref('investigate') // investigate | solve
const shuffledClues = ref([])
const playerSeq = ref([])
const wrong = ref(false)

function startSolve() {
  phase.value = 'solve'
  shuffledClues.value = [...props.mission.targets].sort(() => Math.random() - 0.5)
}
function tapClue(target) {
  if (playerSeq.value.includes(target.id)) return
  playerSeq.value.push(target.id)
  if (playerSeq.value.length === props.mission.solveOrder.length) checkSolve()
}
function checkSolve() {
  const ok = props.mission.solveOrder.every((id, i) => playerSeq.value[i] === id)
  if (ok) { setTimeout(() => emit('win'), 600) }
  else {
    wrong.value = true
    setTimeout(() => { wrong.value = false; playerSeq.value = [] }, 1200)
  }
}
function seqNum(id) { const i = playerSeq.value.indexOf(id); return i >= 0 ? i + 1 : null }
function targetById(id) { return props.mission.targets.find(t => t.id === id) }
</script>

<template>
  <div class="field-quest">
    <!-- ───────── 탐사 단계 ───────── -->
    <template v-if="phase === 'investigate'">
      <!-- 진행 -->
      <div class="fq-progress">
        <div class="fq-track"><div class="fq-fill" :style="{ width: (collectedCount / mission.targets.length * 100) + '%' }"></div></div>
        <span>{{ collectedCount }} / {{ mission.targets.length }} 단서</span>
      </div>

      <!-- 타깃 체크리스트 -->
      <div class="targets">
        <div v-for="t in mission.targets" :key="t.id" class="target" :class="{ found: collected[t.id] }">
          <div class="t-icon" :class="{ found: collected[t.id] }">
            <span class="msr" style="font-size:24px">{{ collected[t.id] ? 'check_circle' : t.icon }}</span>
          </div>
          <div class="t-info">
            <span class="t-label">{{ t.label }}</span>
            <span class="t-sub">{{ collected[t.id] ? `단서 획득: ${t.clue}` : t.findHint }}</span>
          </div>
          <span v-if="collected[t.id]" class="msr t-clue-icon" style="font-size:20px; color:var(--orange)">{{ t.symbol }}</span>
        </div>
      </div>

      <!-- 카메라 탐사 버튼 -->
      <button v-if="!allCollected" class="fq-camera-btn" @click="openCamera">
        <span class="msr" style="font-size:22px; color:var(--navy)">photo_camera</span>
        타깃 팻말 촬영하기
      </button>

      <!-- 버디 능력 -->
      <button v-if="!allCollected && abilityUses" class="fq-ability" :disabled="abilityUsed" @click="useAbility">
        <span class="msr" style="font-size:16px">auto_fix_high</span>
        {{ abilityUsed ? '능력 사용됨' : `${buddy?.name}의 능력: 단서 ${abilityUses}개 자동 관찰` }}
      </button>

      <!-- 조합 단계로 -->
      <button v-if="allCollected" class="fq-solve-btn" @click="startSolve">
        <span class="msr" style="font-size:22px; color:var(--navy)">extension</span>
        모은 단서 잇기
      </button>

      <p class="fq-note">{{ mission.note }}</p>
    </template>

    <!-- ───────── 조합(방탈출) 단계 ───────── -->
    <template v-else>
      <div class="solve-head">
        <span class="msr" style="font-size:18px; color:var(--teal-dark)">lock_open</span>
        단서를 올바른 순서로 이어요
      </div>
      <p class="solve-hint">{{ mission.solveHint }}</p>

      <!-- 순서 슬롯 -->
      <div class="slots">
        <div v-for="(id, i) in mission.solveOrder" :key="i" class="slot" :class="{ filled: playerSeq[i] }">
          <template v-if="playerSeq[i]">
            <span class="msr" style="font-size:22px; color:var(--teal-dark)">{{ targetById(playerSeq[i]).symbol }}</span>
          </template>
          <span v-else class="slot-num">{{ i + 1 }}</span>
        </div>
      </div>

      <!-- 단서 칩 -->
      <div class="clue-chips" :class="{ wrong }">
        <button
          v-for="t in shuffledClues" :key="t.id"
          class="clue-chip" :class="{ used: playerSeq.includes(t.id) }"
          :disabled="playerSeq.includes(t.id)"
          @click="tapClue(t)"
        >
          <span class="msr" style="font-size:24px; color:var(--orange)">{{ t.symbol }}</span>
          <span class="chip-clue">{{ t.clue }}</span>
          <span v-if="seqNum(t.id)" class="chip-num">{{ seqNum(t.id) }}</span>
        </button>
      </div>

      <p v-if="wrong" class="solve-wrong">순서가 달라요! 다시 이어봐요</p>
      <button class="solve-reset" @click="playerSeq = []" v-if="playerSeq.length && !wrong">다시 놓기</button>
    </template>

    <!-- ───────── 카메라 모달 ───────── -->
    <Transition name="cam">
      <div v-if="camOpen" class="cam-modal">
        <div class="cam-head">
          <span class="cam-title">타깃 팻말 촬영</span>
          <button class="cam-close" @click="closeCamera"><span class="msr" style="font-size:24px; color:white">close</span></button>
        </div>

        <div class="cam-view" v-if="camStatus === 'scanning'">
          <video ref="videoEl" autoplay muted playsinline></video>
          <canvas ref="canvasEl" style="display:none"></canvas>
          <div class="cam-frame"><div class="c tl"></div><div class="c tr"></div><div class="c bl"></div><div class="c br"></div></div>
          <p class="cam-hint">현장의 타깃 팻말(QR)을 화면 안에 맞춰요</p>
        </div>

        <div class="cam-msg" v-else-if="camStatus === 'denied'">
          <span class="msr" style="font-size:48px; color:#9FC1C8">no_photography</span>
          <p>카메라 권한이 필요해요</p>
          <p class="cam-sub">아래 시연용 코드 입력으로 체험할 수 있어요</p>
        </div>
        <div class="cam-msg" v-else>
          <span class="msr" style="font-size:48px; color:#9FC1C8">photo_camera</span>
          <p>카메라를 여는 중…</p>
        </div>

        <!-- 수집 현황 -->
        <div class="cam-collected">
          <div v-for="t in mission.targets" :key="t.id" class="cam-chip" :class="{ on: collected[t.id] }">
            <span class="msr" style="font-size:14px">{{ collected[t.id] ? 'check' : t.icon }}</span>
            {{ t.label }}
          </div>
        </div>

        <!-- 시연용 코드 입력 -->
        <div class="cam-manual">
          <button class="manual-toggle" @click="showManual = !showManual">
            <span class="msr" style="font-size:14px">keyboard</span> 시연용 코드 직접 입력
          </button>
          <Transition name="slide">
            <div v-if="showManual" class="manual-body">
              <div class="manual-samples">
                <button v-for="t in mission.targets" :key="t.id" class="sample" :disabled="collected[t.id]"
                  @click="manualCode = t.code; tryManual()">{{ t.label }}</button>
              </div>
              <div class="manual-row">
                <input v-model="manualCode" class="manual-input" placeholder="DTQF-..." @keyup.enter="tryManual" />
                <button class="manual-submit" @click="tryManual">확인</button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- 스캔 토스트 -->
        <Transition name="toast">
          <div v-if="scanToast" class="cam-toast">{{ scanToast }}</div>
        </Transition>

        <button v-if="allCollected" class="cam-done" @click="closeCamera">
          <span class="msr" style="font-size:20px; color:var(--navy)">check_circle</span>
          단서를 모두 모았어요!
        </button>
      </div>
    </Transition>

    <!-- 탐사 중 토스트 (모달 밖) -->
    <Transition name="toast">
      <div v-if="scanToast && !camOpen" class="fq-toast">{{ scanToast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.field-quest { display: flex; flex-direction: column; gap: 14px; }

.fq-progress { display: flex; align-items: center; gap: 10px; }
.fq-track { flex: 1; height: 8px; background: #DCEAE9; border-radius: 4px; overflow: hidden; }
.fq-fill { height: 100%; background: var(--teal); border-radius: 4px; transition: width 0.4s; }
.fq-progress span { font-size: 12px; font-weight: 800; color: var(--muted); white-space: nowrap; }

.targets { display: flex; flex-direction: column; gap: 8px; }
.target {
  display: flex; align-items: center; gap: 12px;
  background: var(--white); border: 1.5px solid #E2EEEC; border-radius: 16px; padding: 12px 14px;
}
.target.found { background: #DFF7F4; border-color: var(--teal); }
.t-icon {
  width: 44px; height: 44px; border-radius: 13px; background: #EEF6F5;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--muted);
}
.t-icon.found { background: var(--teal); color: white; }
.t-icon .msr { color: inherit; }
.t-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.t-label { font-size: 14px; font-weight: 900; color: var(--ink); }
.t-sub { font-size: 11px; font-weight: 700; color: var(--muted); word-break: keep-all; line-height: 1.3; }

.fq-camera-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  height: 54px; background: var(--orange); color: var(--navy); border: none; border-radius: 16px;
  font-family: var(--font); font-size: 16px; font-weight: 800; cursor: pointer; box-shadow: 0 5px 12px #9C5B1E3D;
}
.fq-ability {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: var(--orange-soft); border: 2px solid var(--orange); border-radius: 14px; padding: 10px;
  font-family: var(--font); font-size: 12px; font-weight: 800; color: var(--ink); cursor: pointer;
}
.fq-ability:disabled { opacity: 0.5; cursor: not-allowed; border-color: #CCC; background: #F5F5F5; }
.fq-solve-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  height: 54px; background: var(--teal); color: var(--navy); border: none; border-radius: 16px;
  font-family: var(--font); font-size: 16px; font-weight: 800; cursor: pointer;
}
.fq-note { font-size: 10px; font-weight: 600; color: var(--muted); text-align: center; word-break: keep-all; line-height: 1.4; }

/* 조합 */
.solve-head { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 900; color: var(--ink); }
.solve-hint {
  background: var(--sky); border-radius: 14px; padding: 12px 14px;
  font-size: 13px; font-weight: 700; color: var(--ink); line-height: 1.5; word-break: keep-all;
}
.slots { display: flex; gap: 10px; justify-content: center; }
.slot {
  width: 64px; height: 64px; border-radius: 16px; border: 2px dashed #C3D6D4;
  display: flex; align-items: center; justify-content: center; background: #F2F8F7;
}
.slot.filled { border-style: solid; border-color: var(--teal); background: #DFF7F4; }
.slot-num { font-size: 20px; font-weight: 900; color: #B8C8C6; }
.clue-chips { display: flex; flex-direction: column; gap: 8px; }
.clue-chips.wrong { animation: shake 0.4s; }
.clue-chip {
  display: flex; align-items: center; gap: 12px;
  background: var(--white); border: 2px solid #E0ECEA; border-radius: 16px; padding: 12px 14px;
  font-family: var(--font); cursor: pointer; position: relative;
}
.clue-chip.used { opacity: 0.4; }
.chip-clue { font-size: 14px; font-weight: 800; color: var(--ink); }
.chip-num {
  margin-left: auto; width: 24px; height: 24px; border-radius: 50%;
  background: var(--teal); color: white; display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 900;
}
.solve-wrong { text-align: center; font-size: 13px; font-weight: 800; color: #D64B5F; }
.solve-reset {
  background: none; border: 1px solid #D4DEDE; border-radius: 12px; padding: 8px;
  font-family: var(--font); font-size: 12px; font-weight: 800; color: var(--muted); cursor: pointer;
}
@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }

/* 카메라 모달 */
.cam-modal {
  position: fixed; inset: 0; z-index: 1500; background: #08233F;
  display: flex; flex-direction: column; padding: 52px 16px 16px; gap: 12px;
}
.cam-head { display: flex; align-items: center; justify-content: space-between; }
.cam-title { font-size: 18px; font-weight: 900; color: white; }
.cam-close { background: #FFFFFF18; border: none; border-radius: 10px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.cam-view { position: relative; border-radius: 20px; overflow: hidden; aspect-ratio: 1; background: #000; }
.cam-view video { width: 100%; height: 100%; object-fit: cover; }
.cam-frame { position: absolute; inset: 0; pointer-events: none; }
.cam-frame .c { position: absolute; width: 28px; height: 28px; border: 3px solid var(--orange); }
.cam-frame .tl { top: 16px; left: 16px; border-right: 0; border-bottom: 0; border-radius: 6px 0 0 0; }
.cam-frame .tr { top: 16px; right: 16px; border-left: 0; border-bottom: 0; border-radius: 0 6px 0 0; }
.cam-frame .bl { bottom: 16px; left: 16px; border-right: 0; border-top: 0; border-radius: 0 0 0 6px; }
.cam-frame .br { bottom: 16px; right: 16px; border-left: 0; border-top: 0; border-radius: 0 0 6px 0; }
.cam-hint { position: absolute; bottom: 12px; left: 0; right: 0; text-align: center; font-size: 12px; font-weight: 700; color: #FFFFFFCC; text-shadow: 0 1px 4px #000; }
.cam-msg { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; background: #FFFFFF0A; border-radius: 20px; text-align: center; color: white; font-weight: 700; }
.cam-sub { font-size: 12px; color: #9FC1C8; }
.cam-collected { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.cam-chip { display: flex; align-items: center; gap: 4px; background: #FFFFFF14; border-radius: 10px; padding: 5px 10px; font-size: 11px; font-weight: 800; color: #9FC1C8; }
.cam-chip.on { background: var(--teal); color: white; }
.cam-chip .msr { color: inherit; }
.cam-manual { }
.manual-toggle { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; background: #FFFFFF11; border: 1px solid #FFFFFF22; border-radius: 12px; padding: 10px; font-family: var(--font); font-size: 12px; font-weight: 700; color: #9FC1C8; cursor: pointer; }
.manual-body { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.manual-samples { display: flex; gap: 6px; flex-wrap: wrap; }
.sample { background: #FFFFFF18; border: 1px solid #FFFFFF22; border-radius: 10px; padding: 6px 10px; font-family: var(--font); font-size: 11px; font-weight: 800; color: var(--teal); cursor: pointer; }
.sample:disabled { opacity: 0.4; }
.manual-row { display: flex; gap: 8px; }
.manual-input { flex: 1; background: #FFFFFF11; border: 1px solid #FFFFFF33; border-radius: 10px; padding: 10px; font-family: var(--font); color: white; outline: none; }
.manual-submit { background: var(--teal); border: none; border-radius: 10px; padding: 10px 16px; font-family: var(--font); font-weight: 800; color: white; cursor: pointer; }
.cam-toast { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); background: var(--navy); border: 1px solid var(--teal); color: white; border-radius: 14px; padding: 12px 18px; font-size: 14px; font-weight: 800; z-index: 10; white-space: nowrap; box-shadow: 0 6px 20px #000; }
.cam-done { display: flex; align-items: center; justify-content: center; gap: 8px; height: 52px; background: var(--orange); color: var(--navy); border: none; border-radius: 16px; font-family: var(--font); font-size: 15px; font-weight: 900; cursor: pointer; }

.fq-toast { position: fixed; left: 50%; top: 140px; transform: translateX(-50%); background: var(--navy); color: white; border-radius: 14px; padding: 10px 18px; font-size: 13px; font-weight: 800; z-index: 60; white-space: nowrap; box-shadow: 0 6px 20px #00000055; }

.cam-enter-active, .cam-leave-active { transition: all 0.3s; }
.cam-enter-from, .cam-leave-to { opacity: 0; transform: translateY(20px); }
.toast-enter-active, .toast-leave-active { transition: all 0.25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: all 0.2s; }
.slide-enter-from, .slide-leave-to { opacity: 0; }
</style>
