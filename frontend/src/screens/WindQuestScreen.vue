<script setup>
// 「대동의 바람을 찾아서」 허브 — 오프닝 스토리, 0/3 진행, 3스톱, 조립 진입(3개 미만 잠금).
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import WindArt from '../components/WindArt.vue'
import { WIND_QUEST } from '../data/windQuest.js'
import { wind, startQuest, partsCount, allPartsCollected, isSolved, completeMode } from '../store/windQuestStore.js'
import { hasModel } from '../store/arModelStore.js'

const arStops = computed(() => q.stops.filter(s => s.arId && hasModel(s.arId)))

const router = useRouter()
const q = WIND_QUEST
const showOpening = ref(false)

onMounted(() => {
  if (!wind.started) showOpening.value = true
})
function beginQuest() { startQuest(); showOpening.value = false }

const count = computed(() => partsCount())
const ready = computed(() => allPartsCollected())

const parts = [q.parts.wing, q.parts.base, q.parts.center]
function partOwned(id) { return !!wind.parts[id] }

function openStop(id) { router.push(`/wind/${id}`) }
function openAssemble() { if (ready.value) router.push('/wind/assemble') }
</script>

<template>
  <main class="wq">
    <header class="wq-head">
      <button class="round" aria-label="지도로" @click="router.push('/map')"><span class="msr">arrow_back</span></button>
      <div class="titles"><strong>{{ q.title }}</strong><small>{{ q.subtitle }}</small></div>
      <span v-if="q.demo" class="demo">답사 테스트용</span>
    </header>

    <!-- 진행도 -->
    <section class="progress">
      <div class="pc-row">
        <span class="pc-label">풍차 부품</span>
        <span class="pc-count">{{ count }} / 3</span>
      </div>
      <div class="parts">
        <div v-for="p in parts" :key="p.id" class="part" :class="{ on: partOwned(p.id) }">
          <span class="p-emoji">{{ partOwned(p.id) ? p.emoji : '·' }}</span>
          <span class="p-label">{{ p.label }}</span>
        </div>
      </div>
    </section>

    <!-- 스톱 목록 -->
    <section class="stops">
      <button v-for="(s, i) in q.stops" :key="s.id" class="stop" :class="{ done: isSolved(s.id) }" @click="openStop(s.id)">
        <span class="s-no">{{ i + 1 }}</span>
        <div class="s-main">
          <strong>{{ s.name }}</strong>
          <small>{{ isSolved(s.id) ? `완료 · ${completeMode(s.id) === 'photo' ? '사진으로' : '현장 관찰'} · ${q.parts[s.reward].label} 획득` : `${q.parts[s.reward].label} 단서 찾기` }}</small>
        </div>
        <span class="msr s-ic">{{ isSolved(s.id) ? 'check_circle' : 'chevron_right' }}</span>
      </button>
    </section>

    <!-- 조립 -->
    <section class="assemble">
      <button class="asm-btn" :disabled="!ready" @click="openAssemble">
        <span class="msr">toys</span>{{ ready ? '나만의 풍차 조립하기' : `부품을 모두 모으면 조립 가능 (${count}/3)` }}
      </button>
      <p class="asm-note">대동천은 시작 이야기로만 연결돼요. 우송대·대전역 방문은 필수가 아니에요.</p>
    </section>

    <!-- AR 둘러보기 -->
    <section v-if="arStops.length" class="ar-tour">
      <div class="at-title"><span class="msr">view_in_ar</span> 입체 AR 로 둘러보기</div>
      <button v-for="s in arStops" :key="s.id" class="at-item" @click="router.push(`/ar-view/${s.arId}`)">
        <span>{{ s.name }}</span><span class="msr">chevron_right</span>
      </button>
      <p class="at-note">카메라 위에 과거 건물을 세워 봐요. (안드로이드 WebXR · iPhone USDZ · 그 외 미리보기)</p>
    </section>

    <!-- 오프닝 -->
    <Transition name="fade">
      <div v-if="showOpening" class="opening" @click.self="beginQuest">
        <div class="op-card">
          <div class="op-icon"><WindArt name="wind" /></div>
          <p v-for="(line, i) in q.opening.lines" :key="i" class="op-line">{{ line }}</p>
          <p class="op-note">{{ q.opening.note }}</p>
          <button class="op-btn" @click="beginQuest">시작하기</button>
        </div>
      </div>
    </Transition>
  </main>
</template>

<style scoped>
.wq { position: fixed; inset: 0; z-index: 1600; background: #0e1a24; color: #e7eff6; overflow-y: auto; padding-bottom: 28px; font-family: var(--font); }
.wq-head { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; gap: 10px; padding: 14px 14px; background: #0e1a24; border-bottom: 1px solid #ffffff14; }
.round { width: 38px; height: 38px; border-radius: 50%; border: none; cursor: pointer; background: #0008; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
.titles { display: flex; flex-direction: column; min-width: 0; }
.titles strong { font-size: 15px; font-weight: 900; }
.titles small { font-size: 11px; color: #9fb6c6; }
.demo { margin-left: auto; background: #5a4a15; color: #ffe0a6; font-size: 10px; font-weight: 800; border-radius: 8px; padding: 4px 7px; flex-shrink: 0; }

.progress { margin: 14px; background: #0b2033; border: 1px solid #ffffff14; border-radius: 14px; padding: 14px; }
.pc-row { display: flex; justify-content: space-between; align-items: baseline; }
.pc-label { font-size: 13px; font-weight: 800; }
.pc-count { font-size: 15px; font-weight: 900; color: var(--orange); }
.parts { display: flex; gap: 8px; margin-top: 12px; }
.part { flex: 1; background: #0d2740; border-radius: 10px; padding: 12px 6px; text-align: center; opacity: 0.5; }
.part.on { opacity: 1; background: #16322a; border: 1px solid #2f6b4a; }
.p-emoji { display: block; font-size: 22px; line-height: 1.1; }
.p-label { font-size: 11px; font-weight: 700; color: #cfe0f0; }

.stops { margin: 0 14px; display: flex; flex-direction: column; gap: 8px; }
.stop { display: flex; align-items: center; gap: 12px; background: #0b2033; border: 1px solid #ffffff14; border-radius: 12px; padding: 13px; cursor: pointer; text-align: left; color: #e7eff6; }
.stop.done { border-color: #2f6b4a; background: #0c2420; }
.s-no { width: 26px; height: 26px; border-radius: 50%; background: var(--orange); color: var(--navy); font-weight: 900; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
.s-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.s-main strong { font-size: 14px; }
.s-main small { font-size: 11px; color: #9fb6c6; }
.s-ic { color: #9fb6c6; }
.stop.done .s-ic { color: #6fe08a; }

.assemble { margin: 16px 14px 0; }
.asm-btn { width: 100%; height: 52px; border: none; border-radius: 14px; background: var(--orange); color: var(--navy); font-family: var(--font); font-size: 15px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
.asm-btn:disabled { opacity: 0.5; cursor: default; background: #2a3b47; color: #9fb6c6; }
.asm-note { font-size: 11px; color: #8aa6ba; text-align: center; margin-top: 10px; line-height: 1.6; word-break: keep-all; }

.ar-tour { margin: 18px 14px 0; background: #0b2033; border: 1px solid #ffffff14; border-radius: 14px; padding: 14px; }
.at-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 900; color: #cfe6ff; margin-bottom: 10px; }
.at-item { width: 100%; display: flex; align-items: center; justify-content: space-between; background: #0d2740; border: 1px solid #2a4a63; color: #e7eff6; border-radius: 10px; padding: 12px 13px; margin-bottom: 8px; cursor: pointer; font-size: 14px; font-weight: 700; }
.at-item .msr { color: #7fb0d0; }
.at-note { font-size: 10px; color: #8aa6ba; line-height: 1.6; word-break: keep-all; }

.opening { position: fixed; inset: 0; z-index: 10; background: #060d14e6; display: flex; align-items: center; justify-content: center; padding: 24px; }
.op-card { background: #0b2033; border: 1px solid #ffffff1f; border-radius: 18px; padding: 22px; max-width: 360px; text-align: center; }
.op-icon { width: 76px; height: 76px; margin: 0 auto 14px; }
.op-line { font-size: 14px; line-height: 1.7; margin: 6px 0; font-weight: 600; word-break: keep-all; }
.op-note { font-size: 11px; color: #9fb6c6; line-height: 1.6; margin: 14px 0 0; word-break: keep-all; }
.op-btn { margin-top: 18px; width: 100%; height: 48px; border: none; border-radius: 14px; background: var(--orange); color: var(--navy); font-family: var(--font); font-size: 15px; font-weight: 900; cursor: pointer; }
.fade-enter-active, .fade-leave-active { transition: opacity .25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
