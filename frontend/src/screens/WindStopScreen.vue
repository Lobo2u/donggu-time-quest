<script setup>
// 스톱 단서 풀이 — crop-detective / field-observation / zone-select.
// 오답이면 힌트 후 재도전, 정답이면 공개 + 부품 지급. zone-select 는 사진모드(완료방식 구분) 지원.
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WindArt from '../components/WindArt.vue'
import { WIND_QUEST, getStop } from '../data/windQuest.js'
import { wind, isSolved, completeMode, solveStop } from '../store/windQuestStore.js'
import { hasModel } from '../store/arModelStore.js'

const canAr = computed(() => stop && stop.arId && hasModel(stop.arId))
function openAr() { router.push(`/ar-view/${stop.arId}`) }

const route = useRoute()
const router = useRouter()
const stop = getStop(route.params.stopId)
const part = computed(() => stop ? WIND_QUEST.parts[stop.reward] : null)

const already = ref(stop ? isSolved(stop.id) : false)
const solved = ref(already.value)
const wrong = ref(false)       // 직전 시도 오답 → 힌트 표시
const picked = ref(null)
const photoMode = ref(stop ? completeMode(stop.id) === 'photo' : false)

function pickChoice(c) {
  picked.value = c.id
  if (c.correct) { solved.value = true; wrong.value = false }
  else { wrong.value = true }
}
function pickZone(i) {
  picked.value = i
  if (i === stop.grid.answer) { solved.value = true; wrong.value = false }
  else { wrong.value = true }
}
function retry() { wrong.value = false; picked.value = null }

function collect() {
  solveStop(stop.id, { reward: stop.reward, mode: photoMode.value ? 'photo' : 'field' })
  router.push('/wind')
}
</script>

<template>
  <main class="ws" v-if="stop">
    <header class="ws-head">
      <button class="round" aria-label="뒤로" @click="router.push('/wind')"><span class="msr">arrow_back</span></button>
      <strong>{{ stop.name }}</strong>
      <span v-if="WIND_QUEST.demo" class="demo">답사 테스트용</span>
    </header>

    <!-- 완료(공개) 상태 -->
    <section v-if="solved" class="reveal">
      <div class="rv-art">
        <WindArt v-if="stop.type === 'crop-detective'" :name="stop.fullArt" />
        <WindArt v-else-if="stop.type === 'zone-select'" :name="stop.viewArt" />
        <WindArt v-else :name="stop.art" />
      </div>
      <h2>{{ stop.reveal.title }}</h2>
      <p class="rv-story">{{ stop.reveal.story }}</p>
      <div class="rv-reward"><span class="rw-emoji">{{ part.emoji }}</span> {{ part.label }} 획득!</div>
      <p v-if="stop.allowPhotoMode" class="rv-mode">완료 방식: {{ photoMode ? '사진으로 완료' : '현장 관찰 완료' }}</p>
      <button v-if="canAr" class="ar-btn" @click="openAr"><span class="msr">view_in_ar</span> 이 장소 입체로 보기 (AR)</button>
      <button class="go" @click="collect">{{ already ? '허브로 돌아가기' : `${part.label} 챙기고 계속` }}</button>
      <p class="note">{{ stop.reveal.story ? '' : '' }}실제 사진·좌표는 답사 후 데이터에서 교체돼요.</p>
    </section>

    <!-- 풀이 상태 -->
    <section v-else class="play">
      <p class="prompt">{{ stop.prompt }}</p>

      <!-- 사진 모드 토글(전망대 등) -->
      <div v-if="stop.allowPhotoMode" class="mode-toggle">
        <button :class="{ on: !photoMode }" @click="photoMode = false">현장 관찰</button>
        <button :class="{ on: photoMode }" @click="photoMode = true">사진으로</button>
        <span class="mt-hint">{{ photoMode ? '눈·안개로 안 보일 때 저장된 사진으로 플레이' : '현장에서 직접 보고 풀어요' }}</span>
      </div>

      <!-- crop-detective / field-observation : 보기 선택 -->
      <template v-if="stop.type !== 'zone-select'">
        <div class="q-art">
          <WindArt :name="stop.type === 'crop-detective' ? stop.cropArt : stop.art" />
        </div>
        <div class="choices">
          <button v-for="c in stop.choices" :key="c.id" class="choice" :class="{ bad: wrong && picked === c.id }" @click="pickChoice(c)">
            {{ c.label }}
          </button>
        </div>
      </template>

      <!-- zone-select : 구역 선택 -->
      <template v-else>
        <div class="view-wrap">
          <div class="view-art"><WindArt :name="stop.viewArt" /></div>
          <div class="grid" :style="{ gridTemplateColumns: `repeat(${stop.grid.cols}, 1fr)` }">
            <button v-for="i in stop.grid.cols * stop.grid.rows" :key="i"
              class="cell" :class="{ bad: wrong && picked === (i - 1) }" @click="pickZone(i - 1)"></button>
          </div>
        </div>
        <p class="zone-help">전망 사진의 구역을 눌러요</p>
      </template>

      <!-- 오답 힌트 -->
      <Transition name="fade">
        <div v-if="wrong" class="hint">
          <div v-if="stop.cropArt && stop.type === 'zone-select'" class="hint-crop"><WindArt :name="stop.cropArt" /></div>
          <p>{{ stop.hint }}</p>
          <button class="retry" @click="retry">다시 도전</button>
        </div>
      </Transition>
    </section>
  </main>

  <main v-else class="ws"><p style="padding:40px;color:#fff">잘못된 스톱이에요. <button @click="router.push('/wind')">허브로</button></p></main>
</template>

<style scoped>
.ws { position: fixed; inset: 0; z-index: 1600; background: #0e1a24; color: #e7eff6; overflow-y: auto; padding-bottom: 28px; font-family: var(--font); }
.ws-head { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; gap: 10px; padding: 14px; background: #0e1a24; border-bottom: 1px solid #ffffff14; }
.ws-head strong { font-size: 15px; font-weight: 900; }
.round { width: 38px; height: 38px; border-radius: 50%; border: none; cursor: pointer; background: #0008; display: flex; align-items: center; justify-content: center; color: #fff; }
.demo { margin-left: auto; background: #5a4a15; color: #ffe0a6; font-size: 10px; font-weight: 800; border-radius: 8px; padding: 4px 7px; }

.play, .reveal { margin: 16px 14px; }
.prompt { font-size: 15px; font-weight: 800; line-height: 1.6; word-break: keep-all; }

.mode-toggle { display: flex; align-items: center; gap: 6px; margin: 12px 0; flex-wrap: wrap; }
.mode-toggle button { border: 1px solid #ffffff2e; background: transparent; color: #cfe0f0; border-radius: 999px; padding: 6px 12px; font-size: 12px; font-weight: 800; cursor: pointer; }
.mode-toggle button.on { background: var(--orange); color: var(--navy); border-color: var(--orange); }
.mt-hint { font-size: 10px; color: #8aa6ba; flex-basis: 100%; }

.q-art { margin: 14px auto; width: 180px; height: 180px; border-radius: 14px; overflow: hidden; border: 1px solid #ffffff1f; background: #0b2033; }
.choices { display: flex; flex-direction: column; gap: 8px; }
.choice { border: 1px solid #ffffff2e; background: #0b2033; color: #e7eff6; border-radius: 12px; padding: 14px; font-size: 14px; font-weight: 700; cursor: pointer; text-align: left; }
.choice:hover { border-color: var(--orange); }
.choice.bad { border-color: #e06b5a; background: #3a1c1c; animation: shake .3s; }
@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }

.view-wrap { position: relative; margin: 14px 0; border-radius: 14px; overflow: hidden; border: 1px solid #ffffff1f; aspect-ratio: 1 / 1; }
.view-art { position: absolute; inset: 0; }
.grid { position: absolute; inset: 0; display: grid; gap: 2px; }
.cell { border: 1px dashed #ffffff40; background: #ffffff08; cursor: pointer; }
.cell:hover { background: #ffffff22; }
.cell.bad { background: #e06b5a55; border-color: #e06b5a; }
.zone-help { text-align: center; font-size: 11px; color: #9fb6c6; }

.hint { margin-top: 14px; background: #2a2410; border: 1px solid #5a4a15; border-radius: 12px; padding: 14px; text-align: center; }
.hint-crop { width: 90px; height: 130px; margin: 0 auto 10px; border-radius: 8px; overflow: hidden; }
.hint p { font-size: 12px; color: #ffe0a6; line-height: 1.6; word-break: keep-all; }
.retry { margin-top: 10px; border: none; border-radius: 10px; background: var(--orange); color: var(--navy); padding: 10px 18px; font-weight: 900; cursor: pointer; }

.rv-art { width: 100%; max-width: 340px; margin: 6px auto 14px; aspect-ratio: 16/9; border-radius: 14px; overflow: hidden; border: 1px solid #ffffff1f; background: #0b2033; }
.reveal h2 { font-size: 18px; text-align: center; }
.rv-story { font-size: 13px; color: #c7d8e6; line-height: 1.7; margin: 10px 0; word-break: keep-all; }
.rv-reward { text-align: center; font-size: 16px; font-weight: 900; color: var(--orange); margin: 12px 0; }
.rw-emoji { font-size: 22px; }
.rv-mode { text-align: center; font-size: 12px; color: #9fb6c6; }
.ar-btn { width: 100%; height: 48px; border: 2px solid #4f97c4; background: #0d2740; color: #cfe6ff; border-radius: 14px; font-family: var(--font); font-size: 14px; font-weight: 800; cursor: pointer; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.go { width: 100%; height: 50px; border: none; border-radius: 14px; background: var(--orange); color: var(--navy); font-family: var(--font); font-size: 15px; font-weight: 900; cursor: pointer; margin-top: 8px; }
.note { font-size: 10px; color: #7e97a8; text-align: center; margin-top: 12px; }
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
