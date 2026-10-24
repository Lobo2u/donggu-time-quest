<!-- 인동시장: 타임라인 순서 복원 게임 -->
<script setup>
import { ref, computed } from 'vue'
import { abilityPower } from '../store/gameStore.js'

const props = defineProps({ mission: Object })
const emit = defineEmits(['win'])

// 인도 능력 강도 (앞에서 N개 사건 순서 공개)
const hintCount = computed(() => Math.max(1, abilityPower('indo')))

// 섞인 이벤트 카드
const shuffled = ref([...props.mission.events].sort(() => Math.random() - 0.5))

const playerOrder = ref([])   // 클릭 순으로 쌓인 id 배열
const phase = ref('choose')   // choose | result
const resultCorrect = ref([]) // 맞은 id 목록
const resultWrong   = ref([]) // 틀린 id 목록
const attempts = ref(0)
const hintUsed = ref(false)
const hintIds = ref([])  // [{ id, pos }]

const isChosen = id => playerOrder.value.includes(id)
const chosenNum = id => {
  const i = playerOrder.value.indexOf(id)
  return i >= 0 ? i + 1 : null
}

function choose(event) {
  if (phase.value !== 'choose') return
  if (isChosen(event.id)) return
  if (playerOrder.value.length >= props.mission.events.length) return

  playerOrder.value = [...playerOrder.value, event.id]

  if (playerOrder.value.length === props.mission.events.length) {
    attempts.value++
    checkResult()
  }
}

function checkResult() {
  const correct = props.mission.events.map(e => e.id) // 정답 순서 (order 기준 정렬)
    .sort((a,b) => props.mission.events.find(e=>e.id===a).order - props.mission.events.find(e=>e.id===b).order)
    .map(id => id)

  const allCorrect = playerOrder.value.every((id, i) => id === correct[i])
  resultCorrect.value = playerOrder.value.filter((id, i) => id === correct[i])
  resultWrong.value   = playerOrder.value.filter((id, i) => id !== correct[i])
  phase.value = 'result'

  if (allCorrect) {
    setTimeout(() => emit('win'), 1000)
  } else {
    setTimeout(resetRound, 1600)
  }
}

function resetRound() {
  playerOrder.value = []
  resultCorrect.value = []
  resultWrong.value = []
  hintIds.value = []
  shuffled.value = [...props.mission.events].sort(() => Math.random() - 0.5)
  phase.value = 'choose'
}

function useHint() {
  if (hintUsed.value || phase.value !== 'choose') return
  hintUsed.value = true
  const sorted = [...props.mission.events].sort((a, b) => a.order - b.order)
  hintIds.value = sorted.slice(0, hintCount.value).map((e, i) => ({ id: e.id, pos: i + 1 }))
  setTimeout(() => { hintIds.value = [] }, 2500)
}

const hintedId = id => hintIds.value.some(h => h.id === id)

const correctOrder = computed(() =>
  [...props.mission.events].sort((a,b) => a.order - b.order)
)
</script>

<template>
  <div class="timeline-game">
    <!-- 안내 -->
    <div class="tl-header">
      <div class="phase-chip" :class="phase">
        <span class="msr" style="font-size:16px">{{ phase === 'choose' ? 'touch_app' : 'fact_check' }}</span>
        {{ phase === 'choose' ? '시간 순서대로 클릭해요' : '결과 확인 중...' }}
      </div>
      <span class="attempt-text">{{ attempts }}회 시도</span>
    </div>

    <!-- 정답 힌트 표시 (hint used) -->
    <div class="hint-banner" v-if="hintIds.length">
      <span class="msr" style="font-size:16px; color:var(--orange)">star</span>
      <span>{{ hintIds.map(h => `${h.pos}. ${props.mission.events.find(e=>e.id===h.id)?.label}`).join(' → ') }}</span>
    </div>

    <!-- 선택 진행 -->
    <div class="progress-row">
      <div v-for="n in props.mission.events.length" :key="n" class="prog-dot" :class="{ filled: n <= playerOrder.length }"></div>
      <span>{{ playerOrder.length }} / {{ props.mission.events.length }}</span>
    </div>

    <!-- 이벤트 카드 목록 -->
    <div class="events-list">
      <div
        v-for="event in shuffled"
        :key="event.id"
        class="event-card"
        :class="{
          chosen:   isChosen(event.id) && phase === 'choose',
          correct:  resultCorrect.includes(event.id),
          wrong:    resultWrong.includes(event.id),
          hinted:   hintedId(event.id),
        }"
        @click="choose(event)"
      >
        <!-- 선택 번호 배지 -->
        <div class="choice-badge" v-if="isChosen(event.id)" :style="{ background: event.color }">
          {{ chosenNum(event.id) }}
        </div>

        <!-- 아이콘 -->
        <div class="event-icon" :style="{ background: event.color + '33', color: event.color }">
          <span class="msr" style="font-size:28px">{{ event.icon }}</span>
        </div>

        <!-- 라벨 -->
        <div class="event-info">
          <span class="event-label">{{ event.label }}</span>
          <span class="event-step" v-if="isChosen(event.id)">{{ chosenNum(event.id) }}번째 선택</span>
        </div>

        <!-- 결과 아이콘 -->
        <span v-if="resultCorrect.includes(event.id)" class="msr result-icon" style="color:var(--teal)">check_circle</span>
        <span v-else-if="resultWrong.includes(event.id)" class="msr result-icon" style="color:#D64B5F">cancel</span>
      </div>
    </div>

    <!-- 정답 순서 힌트 (result phase, 오답) -->
    <div class="answer-hint" v-if="phase === 'result' && resultWrong.length">
      <p class="hint-title">정답 순서</p>
      <div class="answer-row">
        <div v-for="(e, i) in correctOrder" :key="e.id" class="answer-chip" :style="{ borderColor: e.color }">
          <span class="answer-num" :style="{ background: e.color }">{{ i+1 }}</span>
          <span>{{ e.label }}</span>
        </div>
      </div>
    </div>

    <!-- 인도 능력 버튼 -->
    <button class="hint-btn" :disabled="hintUsed || phase !== 'choose'" @click="useHint">
      <span class="msr" style="font-size:16px">auto_fix_high</span>
      {{ hintUsed ? '힌트 사용됨' : `인도의 능력: 앞 ${hintCount}개 사건 힌트` }}
    </button>
  </div>
</template>

<style scoped>
.timeline-game { display: flex; flex-direction: column; gap: 12px; }

.tl-header { display: flex; align-items: center; justify-content: space-between; }
.phase-chip {
  display: flex; align-items: center; gap: 6px;
  border-radius: 12px; padding: 7px 12px;
  font-size: 13px; font-weight: 800; color: white;
}
.phase-chip.choose { background: var(--navy); }
.phase-chip.result { background: var(--teal-dark); }
.attempt-text { font-size: 11px; font-weight: 700; color: var(--muted); }

.hint-banner {
  display: flex; align-items: center; gap: 8px;
  background: var(--orange-soft); border-radius: 12px; padding: 8px 12px;
  font-size: 12px; font-weight: 800; color: var(--ink);
  animation: pulse-in 0.3s ease;
}

.progress-row { display: flex; align-items: center; gap: 6px; }
.prog-dot { flex:1; height:7px; background:#DCEAE9; border-radius:4px; transition:background 0.2s; }
.prog-dot.filled { background: var(--teal); }
.progress-row span { font-size:11px; font-weight:800; color:var(--muted); white-space:nowrap; }

.events-list { display: flex; flex-direction: column; gap: 8px; }

.event-card {
  display: flex; align-items: center; gap: 12px;
  background: var(--white); border: 2px solid #E0ECEA;
  border-radius: 16px; padding: 12px 14px;
  cursor: pointer; transition: all 0.15s; position: relative;
}
.event-card:not(.chosen):not(.correct):not(.wrong):active { transform: scale(0.97); }
.event-card.chosen  { border-color: var(--teal); background: #E8F6F4; }
.event-card.correct { border-color: var(--teal); background: #DFF7F4; }
.event-card.wrong   { border-color: #D64B5F; background: #FFECEC; animation: shake 0.35s; }
.event-card.hinted  { border-color: var(--orange); background: #FFF8EC; }

.choice-badge {
  position: absolute; top: -6px; left: -6px;
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 900; color: white;
}
.event-icon {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.event-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.event-label { font-size: 15px; font-weight: 800; color: var(--ink); }
.event-step  { font-size: 11px; font-weight: 700; color: var(--teal); }
.result-icon { font-size: 22px; }

.answer-hint { background: #FFF8EC; border-radius: 16px; padding: 12px; }
.hint-title  { font-size: 11px; font-weight: 800; color: var(--muted); margin-bottom: 8px; }
.answer-row  { display: flex; gap: 6px; flex-wrap: wrap; }
.answer-chip {
  display: flex; align-items: center; gap: 5px;
  border: 1.5px solid; border-radius: 10px; padding: 4px 8px;
  font-size: 11px; font-weight: 800; color: var(--ink);
}
.answer-num {
  width: 18px; height: 18px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 900; color: white;
}

.hint-btn {
  display: flex; align-items: center; gap: 8px;
  background: var(--orange-soft); border: 2px solid var(--orange);
  border-radius: 14px; padding: 10px 14px;
  font-family: var(--font); font-size: 12px; font-weight: 800;
  color: var(--ink); cursor: pointer; width: 100%;
}
.hint-btn:disabled { opacity: 0.5; cursor: not-allowed; border-color: #CCC; background: #F5F5F5; }

@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
@keyframes pulse-in { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
</style>
