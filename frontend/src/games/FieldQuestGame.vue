<!-- 현장 탐사: 타깃 스캔 → 수수께끼 단서 → 추리해서 숫자 자물쇠 풀기 -->
<script setup>
import { ref, computed, reactive, onBeforeUnmount } from 'vue'
import jsQR from 'jsqr'
import { abilityPower } from '../store/gameStore.js'
import { BUDDIES, clueAnswer, lockCode } from '../data/gameData.js'

const props = defineProps({ mission: Object })
const emit = defineEmits(['win'])

const buddy = computed(() => BUDDIES[props.mission.buddyId])
const orderedTargets = computed(() => [...props.mission.targets].sort((a, b) => a.pos - b.pos))
const code = computed(() => lockCode(props.mission))

const collected = reactive({})
const collectedCount = computed(() => props.mission.targets.filter(t => collected[t.id]).length)
const allCollected = computed(() => collectedCount.value === props.mission.targets.length)

// ── 카메라 스캔 ───────────────────────────────────────────────────────────────
const camOpen = ref(false)
const camStatus = ref('idle')
const videoEl = ref(null)
const canvasEl = ref(null)
const scanToast = ref(null)
const revealClue = ref(null)   // 방금 연 단서 (팝업)
const showManual = ref(false)
const manualCode = ref('')
let stream = null, rafId = null, lastHandled = 0

async function openCamera() {
  camOpen.value = true; camStatus.value = 'scanning'
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    videoEl.value.srcObject = stream; await videoEl.value.play(); scanLoop()
  } catch (e) { camStatus.value = e.name === 'NotAllowedError' ? 'denied' : 'error' }
}
function scanLoop() {
  if (!camOpen.value || !videoEl.value || videoEl.value.readyState < 2) { rafId = requestAnimationFrame(scanLoop); return }
  const c = canvasEl.value, ctx = c.getContext('2d')
  c.width = videoEl.value.videoWidth; c.height = videoEl.value.videoHeight
  ctx.drawImage(videoEl.value, 0, 0)
  const img = ctx.getImageData(0, 0, c.width, c.height)
  const q = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
  if (q) handleCode(q.data)
  rafId = requestAnimationFrame(scanLoop)
}
function handleCode(raw) {
  const now = Date.now(); if (now - lastHandled < 1200) return
  const target = props.mission.targets.find(t => t.code === raw)
  if (!target) { flashToast('이 미션의 타깃이 아니에요'); lastHandled = now; return }
  if (collected[target.id]) { flashToast(`이미 찾았어요: ${target.label}`); lastHandled = now; return }
  lastHandled = now; collect(target)
}
function tryManual() {
  const v = manualCode.value.trim()
  const target = props.mission.targets.find(t => t.code === v)
  if (!target) { flashToast('코드를 확인해요'); return }
  if (collected[target.id]) { flashToast('이미 찾았어요'); return }
  collect(target); manualCode.value = ''
}
function collect(target) {
  collected[target.id] = true
  revealClue.value = target    // 단서(수수께끼) 팝업 표시
}
function closeClue() {
  revealClue.value = null
  if (allCollected.value) setTimeout(closeCamera, 300)
}
function flashToast(m) { scanToast.value = m; setTimeout(() => { if (scanToast.value === m) scanToast.value = null }, 1500) }
function closeCamera() {
  camOpen.value = false
  if (rafId) cancelAnimationFrame(rafId)
  if (stream) stream.getTracks().forEach(t => t.stop())
  stream = null
}
onBeforeUnmount(closeCamera)

// 능력: 자물쇠 한 자리 미리 채움
const abilityN = computed(() => abilityPower(props.mission.buddyId))
const abilityUsed = ref(false)

// ── 자물쇠 ────────────────────────────────────────────────────────────────────
const phase = ref('investigate') // investigate | lock
const digits = ref([])           // 입력된 숫자
const lockLen = computed(() => code.value.length)
const wrong = ref(false)
const solved = ref(false)

function startLock() { phase.value = 'lock'; digits.value = [] }
function pressNum(n) {
  if (solved.value || wrong.value) return
  if (digits.value.length >= lockLen.value) return
  digits.value.push(n)
  if (digits.value.length === lockLen.value) checkLock()
}
function backspace() { if (!wrong.value && !solved.value) digits.value.pop() }
function checkLock() {
  if (digits.value.join('') === code.value) {
    solved.value = true
    setTimeout(() => emit('win'), 1100)
  } else {
    wrong.value = true
    setTimeout(() => { wrong.value = false; digits.value = [] }, 900)
  }
}
function useAbility() {
  if (abilityUsed.value || !abilityN.value) return
  abilityUsed.value = true
  // 첫 N자리를 미리 채워줌
  digits.value = code.value.slice(0, Math.min(abilityN.value, lockLen.value)).split('').map(Number)
  flashToast(`${buddy.value?.name}의 능력으로 ${digits.value.length}자리를 밝혔어요`)
}
</script>

<template>
  <div class="field-quest">
    <!-- ───── 탐사 단계 ───── -->
    <template v-if="phase === 'investigate'">
      <div class="fq-progress">
        <div class="fq-track"><div class="fq-fill" :style="{ width: (collectedCount / mission.targets.length * 100) + '%' }"></div></div>
        <span>{{ collectedCount }} / {{ mission.targets.length }} 단서</span>
      </div>

      <div class="targets">
        <div v-for="t in mission.targets" :key="t.id" class="target" :class="{ found: collected[t.id] }">
          <div class="t-icon" :class="{ found: collected[t.id] }">
            <span class="msr" style="font-size:24px">{{ collected[t.id] ? 'lightbulb' : t.icon }}</span>
          </div>
          <div class="t-info">
            <span class="t-label">{{ t.label }}</span>
            <span class="t-sub">{{ collected[t.id] ? t.riddle : t.findHint }}</span>
          </div>
          <span v-if="collected[t.id]" class="t-badge">단서</span>
        </div>
      </div>

      <button v-if="!allCollected" class="fq-camera-btn" @click="openCamera">
        <span class="msr" style="font-size:22px; color:var(--navy)">photo_camera</span>
        타깃 팻말 촬영하기
      </button>
      <button v-else class="fq-solve-btn" @click="startLock">
        <span class="msr" style="font-size:22px; color:var(--navy)">lock</span>
        기억의 자물쇠 풀기
      </button>

      <p class="fq-note">{{ mission.note }}</p>
    </template>

    <!-- ───── 자물쇠 단계 ───── -->
    <template v-else>
      <div class="lock-head">
        <span class="msr" style="font-size:20px; color:var(--orange)">lock</span>
        기억의 자물쇠
      </div>
      <p class="lock-hint">{{ mission.lockHint }}</p>

      <!-- 찾은 단서 요약 (추리 재료) -->
      <div class="clue-recall">
        <div v-for="t in orderedTargets" :key="t.id" class="recall-card">
          <span class="recall-pos">{{ t.pos }}</span>
          <span class="recall-riddle">{{ t.riddle }}</span>
        </div>
      </div>

      <!-- 자물쇠 디스플레이 -->
      <div class="lock-display" :class="{ wrong, solved }">
        <div v-for="i in lockLen" :key="i" class="lock-slot" :class="{ filled: digits[i-1] != null }">
          {{ digits[i - 1] != null ? digits[i - 1] : '•' }}
        </div>
      </div>
      <p v-if="wrong" class="lock-msg wrong">자물쇠가 열리지 않아요. 단서를 다시 봐요!</p>
      <p v-else-if="solved" class="lock-msg ok">철컹! 기억의 자물쇠가 열렸어요</p>

      <!-- 키패드 -->
      <div class="keypad" v-if="!solved">
        <button v-for="n in 9" :key="n" class="key" @click="pressNum(n)">{{ n }}</button>
        <button class="key back" @click="backspace"><span class="msr" style="font-size:20px">backspace</span></button>
        <button class="key" @click="pressNum(0)">0</button>
        <button class="key ability" :disabled="abilityUsed || !abilityN" @click="useAbility">
          <span class="msr" style="font-size:18px">auto_fix_high</span>
        </button>
      </div>

      <p class="fq-note" v-if="!solved">세 단서의 숫자를 순서대로 입력해요</p>
    </template>

    <!-- ───── 단서 공개 팝업 ───── -->
    <Transition name="pop">
      <div v-if="revealClue" class="clue-pop" @click="closeClue">
        <div class="clue-card" @click.stop>
          <p class="clue-kicker">단서 발견!</p>
          <div class="clue-icon"><span class="msr" style="font-size:36px; color:var(--orange)">lightbulb</span></div>
          <p class="clue-label">{{ revealClue.label }}</p>
          <p class="clue-riddle">{{ revealClue.riddle }}</p>
          <!-- 세는 단서: 아이콘 나열 -->
          <div v-if="revealClue.count" class="count-visual">
            <span v-for="n in revealClue.count" :key="n" class="msr count-item">{{ revealClue.countIcon }}</span>
          </div>
          <!-- 글자 수 단서: 글자 칩 -->
          <div v-else-if="revealClue.word" class="word-visual">
            <span v-for="(ch, i) in [...revealClue.word]" :key="i" class="word-chip">{{ ch }}</span>
          </div>
          <p class="clue-guide">직접 세어 숫자를 기억해요. 자물쇠를 풀 때 써요!</p>
          <button class="clue-btn" @click="closeClue">알겠어요</button>
        </div>
      </div>
    </Transition>

    <!-- ───── 카메라 모달 ───── -->
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
        <div class="cam-collected">
          <div v-for="t in mission.targets" :key="t.id" class="cam-chip" :class="{ on: collected[t.id] }">
            <span class="msr" style="font-size:14px">{{ collected[t.id] ? 'check' : t.icon }}</span>{{ t.label }}
          </div>
        </div>
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
        <Transition name="toast"><div v-if="scanToast" class="cam-toast">{{ scanToast }}</div></Transition>
      </div>
    </Transition>

    <Transition name="toast"><div v-if="scanToast && !camOpen" class="fq-toast">{{ scanToast }}</div></Transition>
  </div>
</template>

<style scoped>
.field-quest { display: flex; flex-direction: column; gap: 14px; }

.fq-progress { display: flex; align-items: center; gap: 10px; }
.fq-track { flex: 1; height: 8px; background: #DCEAE9; border-radius: 4px; overflow: hidden; }
.fq-fill { height: 100%; background: var(--teal); border-radius: 4px; transition: width 0.4s; }
.fq-progress span { font-size: 12px; font-weight: 800; color: var(--muted); white-space: nowrap; }

.targets { display: flex; flex-direction: column; gap: 8px; }
.target { display: flex; align-items: center; gap: 12px; background: var(--white); border: 1.5px solid #E2EEEC; border-radius: 16px; padding: 12px 14px; }
.target.found { background: #FFF8EC; border-color: var(--orange); }
.t-icon { width: 44px; height: 44px; border-radius: 13px; background: #EEF6F5; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--muted); }
.t-icon.found { background: var(--orange); color: var(--navy); }
.t-icon .msr { color: inherit; }
.t-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.t-label { font-size: 14px; font-weight: 900; color: var(--ink); }
.t-sub { font-size: 11px; font-weight: 700; color: var(--muted); word-break: keep-all; line-height: 1.35; }
.t-badge { background: var(--orange-soft); color: #C66900; border-radius: 8px; padding: 3px 9px; font-size: 10px; font-weight: 900; flex-shrink: 0; }

.fq-camera-btn { display: flex; align-items: center; justify-content: center; gap: 8px; height: 54px; background: var(--orange); color: var(--navy); border: none; border-radius: 16px; font-family: var(--font); font-size: 16px; font-weight: 800; cursor: pointer; box-shadow: 0 5px 12px #9C5B1E3D; }
.fq-solve-btn { display: flex; align-items: center; justify-content: center; gap: 8px; height: 54px; background: var(--navy); color: var(--orange); border: none; border-radius: 16px; font-family: var(--font); font-size: 16px; font-weight: 800; cursor: pointer; }
.fq-solve-btn .msr { color: var(--orange); }
.fq-note { font-size: 10px; font-weight: 600; color: var(--muted); text-align: center; word-break: keep-all; line-height: 1.4; }

/* 자물쇠 */
.lock-head { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 900; color: var(--ink); }
.lock-hint { background: var(--sky); border-radius: 14px; padding: 12px 14px; font-size: 13px; font-weight: 700; color: var(--ink); line-height: 1.5; word-break: keep-all; }
.clue-recall { display: flex; flex-direction: column; gap: 6px; }
.recall-card { display: flex; align-items: center; gap: 10px; background: #FFF8EC; border-radius: 12px; padding: 9px 12px; }
.recall-pos { width: 22px; height: 22px; border-radius: 50%; background: var(--orange); color: var(--navy); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; flex-shrink: 0; }
.recall-riddle { font-size: 12px; font-weight: 800; color: var(--ink); word-break: keep-all; }

.lock-display { display: flex; gap: 10px; justify-content: center; margin: 6px 0; }
.lock-display.wrong { animation: shake 0.4s; }
.lock-slot { width: 52px; height: 62px; border-radius: 14px; background: var(--navy); color: white; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 900; }
.lock-slot.filled { background: var(--teal-dark); }
.lock-display.solved .lock-slot { background: var(--teal); }
.lock-msg { text-align: center; font-size: 13px; font-weight: 800; }
.lock-msg.wrong { color: #D64B5F; }
.lock-msg.ok { color: var(--teal-dark); }

.keypad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.key { height: 52px; border: none; border-radius: 14px; background: var(--white); border: 1.5px solid #E0ECEA; font-family: var(--font); font-size: 22px; font-weight: 900; color: var(--ink); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.key:active { background: var(--sky); }
.key.back { color: var(--muted); }
.key.ability { background: var(--orange-soft); border-color: var(--orange); color: var(--orange); }
.key.ability:disabled { opacity: 0.4; cursor: not-allowed; }

@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }

/* 단서 팝업 */
.clue-pop { position: fixed; inset: 0; z-index: 1600; background: #08233Fcc; display: flex; align-items: center; justify-content: center; padding: 24px; }
.clue-card { background: white; border-radius: 24px; padding: 24px; width: 300px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
.clue-kicker { font-size: 12px; font-weight: 900; color: var(--orange); letter-spacing: 1px; }
.clue-icon { width: 64px; height: 64px; border-radius: 50%; background: var(--orange-soft); display: flex; align-items: center; justify-content: center; }
.clue-label { font-size: 15px; font-weight: 900; color: var(--muted); }
.clue-riddle { font-size: 17px; font-weight: 900; color: var(--ink); line-height: 1.4; word-break: keep-all; }
.count-visual { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; padding: 8px 0; }
.count-item { font-size: 34px; color: var(--teal-dark); }
.word-visual { display: flex; gap: 6px; justify-content: center; padding: 8px 0; }
.word-chip { width: 40px; height: 40px; border-radius: 10px; background: var(--sky); color: var(--ink); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; }
.clue-guide { font-size: 11px; font-weight: 700; color: var(--muted); word-break: keep-all; }
.clue-btn { margin-top: 8px; width: 100%; background: var(--navy); color: white; border: none; border-radius: 14px; padding: 12px; font-family: var(--font); font-size: 15px; font-weight: 800; cursor: pointer; }

/* 카메라 모달 (이전과 동일) */
.cam-modal { position: fixed; inset: 0; z-index: 1500; background: #08233F; display: flex; flex-direction: column; padding: 52px 16px 16px; gap: 12px; }
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
.manual-toggle { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; background: #FFFFFF11; border: 1px solid #FFFFFF22; border-radius: 12px; padding: 10px; font-family: var(--font); font-size: 12px; font-weight: 700; color: #9FC1C8; cursor: pointer; }
.manual-body { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.manual-samples { display: flex; gap: 6px; flex-wrap: wrap; }
.sample { background: #FFFFFF18; border: 1px solid #FFFFFF22; border-radius: 10px; padding: 6px 10px; font-family: var(--font); font-size: 11px; font-weight: 800; color: var(--teal); cursor: pointer; }
.sample:disabled { opacity: 0.4; }
.manual-row { display: flex; gap: 8px; }
.manual-input { flex: 1; background: #FFFFFF11; border: 1px solid #FFFFFF33; border-radius: 10px; padding: 10px; font-family: var(--font); color: white; outline: none; }
.manual-submit { background: var(--teal); border: none; border-radius: 10px; padding: 10px 16px; font-family: var(--font); font-weight: 800; color: white; cursor: pointer; }
.cam-toast { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); background: var(--navy); border: 1px solid var(--teal); color: white; border-radius: 14px; padding: 12px 18px; font-size: 14px; font-weight: 800; z-index: 10; white-space: nowrap; box-shadow: 0 6px 20px #000; }
.fq-toast { position: fixed; left: 50%; top: 140px; transform: translateX(-50%); background: var(--navy); color: white; border-radius: 14px; padding: 10px 18px; font-size: 13px; font-weight: 800; z-index: 60; white-space: nowrap; box-shadow: 0 6px 20px #00000055; }

.pop-enter-active { transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1); }
.pop-enter-from { opacity: 0; transform: scale(0.7); }
.cam-enter-active, .cam-leave-active { transition: all 0.3s; }
.cam-enter-from, .cam-leave-to { opacity: 0; transform: translateY(20px); }
.toast-enter-active, .toast-leave-active { transition: all 0.25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: all 0.2s; }
.slide-enter-from, .slide-leave-to { opacity: 0; }
</style>
