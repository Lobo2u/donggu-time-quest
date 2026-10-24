<!-- 한의약거리: 빛의 패턴 기억 게임 -->
<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({ mission: Object })
const emit = defineEmits(['win'])

const { gridSize, targetCount, rounds, showTime } = props.mission
const totalCells = gridSize * gridSize

const phase = ref('memorize')   // memorize | recall | feedback
const currentRound = ref(1)
const correctPattern = ref([])
const playerPattern = ref([])
const showingPattern = ref(false)
const wrongCells = ref([])
const correctCells = ref([])
const roundsWon = ref(0)
const hintCell = ref(null)
const hintUsed = ref(false)
const attempts = ref(0)

function generatePattern() {
  const cells = Array.from({ length: totalCells }, (_, i) => i)
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]]
  }
  return cells.slice(0, targetCount)
}

async function startRound() {
  correctPattern.value = generatePattern()
  playerPattern.value = []
  wrongCells.value = []
  correctCells.value = []
  hintCell.value = null
  phase.value = 'memorize'
  showingPattern.value = true
  await delay(showTime)
  showingPattern.value = false
  phase.value = 'recall'
}

function cellActive(idx) {
  return showingPattern.value && correctPattern.value.includes(idx)
}
function cellSelected(idx) { return playerPattern.value.includes(idx) }
function cellWrong(idx)    { return wrongCells.value.includes(idx) }
function cellCorrect(idx)  { return correctCells.value.includes(idx) }
function cellHinted(idx)   { return hintCell.value === idx }

function tapCell(idx) {
  if (phase.value !== 'recall') return
  if (playerPattern.value.includes(idx)) return
  if (playerPattern.value.length >= targetCount) return

  playerPattern.value = [...playerPattern.value, idx]

  if (playerPattern.value.length === targetCount) {
    attempts.value++
    checkPattern()
  }
}

function checkPattern() {
  const correct = correctPattern.value.every(c => playerPattern.value.includes(c))
  if (correct) {
    correctCells.value = [...playerPattern.value]
    phase.value = 'feedback'
    roundsWon.value++
    setTimeout(() => {
      if (roundsWon.value >= rounds) {
        emit('win')
      } else {
        currentRound.value++
        startRound()
      }
    }, 900)
  } else {
    wrongCells.value = playerPattern.value.filter(c => !correctPattern.value.includes(c))
    phase.value = 'feedback'
    setTimeout(() => {
      wrongCells.value = []
      playerPattern.value = []
      phase.value = 'recall'
    }, 1000)
  }
}

function useHint() {
  if (hintUsed.value || phase.value !== 'recall') return
  hintUsed.value = true
  const notYetSelected = correctPattern.value.filter(c => !playerPattern.value.includes(c))
  if (!notYetSelected.length) return
  const pick = notYetSelected[Math.floor(Math.random() * notYetSelected.length)]
  hintCell.value = pick
  setTimeout(() => { hintCell.value = null }, 1600)
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }
onMounted(startRound)
</script>

<template>
  <div class="pattern-game">
    <!-- 라운드/상태 표시 -->
    <div class="round-header">
      <div class="round-badges">
        <div
          v-for="n in rounds"
          :key="n"
          class="round-badge"
          :class="{ done: n <= roundsWon, active: n === currentRound }"
        >{{ n }}</div>
      </div>
      <div class="phase-label" :class="phase">
        {{ phase === 'memorize' ? '잘 봐요!' : phase === 'recall' ? '기억하고 눌러요' : '확인 중...' }}
      </div>
    </div>

    <!-- 격자 -->
    <div class="grid-wrap">
      <div class="grid" :style="{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }">
        <button
          v-for="idx in totalCells"
          :key="idx"
          class="cell"
          :class="{
            active:   cellActive(idx - 1),
            selected: cellSelected(idx - 1) && !cellWrong(idx - 1) && !cellCorrect(idx - 1),
            wrong:    cellWrong(idx - 1),
            correct:  cellCorrect(idx - 1),
            hinted:   cellHinted(idx - 1),
          }"
          @click="tapCell(idx - 1)"
          :disabled="phase !== 'recall'"
        >
          <span v-if="cellCorrect(idx - 1)" class="msr" style="font-size:18px; color:var(--teal)">check</span>
          <span v-else-if="cellWrong(idx - 1)" class="msr" style="font-size:18px; color:#D64B5F">close</span>
          <span v-else-if="cellHinted(idx - 1)" class="msr" style="font-size:18px; color:var(--orange)">star</span>
        </button>
      </div>
    </div>

    <!-- 진행 -->
    <div class="select-progress">
      <div class="select-track">
        <div class="select-fill" :style="{ width: (playerPattern.length / targetCount * 100) + '%' }"></div>
      </div>
      <span>{{ playerPattern.length }} / {{ targetCount }} 선택</span>
    </div>

    <!-- 힌트 버튼 -->
    <button class="hint-btn" :disabled="hintUsed || phase !== 'recall'" @click="useHint">
      <span class="msr" style="font-size:16px">auto_fix_high</span>
      {{ hintUsed ? '힌트 사용됨' : '헤미의 능력: 칸 하나 힌트' }}
    </button>

    <p class="attempt-count">시도 {{ attempts }}회 · {{ roundsWon }} / {{ rounds }} 라운드 완료</p>
  </div>
</template>

<style scoped>
.pattern-game { display: flex; flex-direction: column; gap: 14px; }

.round-header { display: flex; align-items: center; justify-content: space-between; }
.round-badges { display: flex; gap: 6px; }
.round-badge {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 900; background: #DCEAE9; color: var(--muted);
  transition: all 0.3s;
}
.round-badge.done   { background: var(--teal); color: white; }
.round-badge.active { background: var(--orange); color: white; }

.phase-label {
  font-size: 13px; font-weight: 800; padding: 6px 12px;
  border-radius: 12px; transition: all 0.3s;
}
.phase-label.memorize { background: var(--orange); color: white; }
.phase-label.recall   { background: var(--teal-dark); color: white; }
.phase-label.feedback { background: #DDF4F1; color: var(--teal-dark); }

.grid-wrap {
  background: var(--navy); border-radius: 22px; padding: 16px;
}
.grid {
  display: grid; gap: 10px;
}
.cell {
  aspect-ratio: 1; border-radius: 14px;
  background: #FFFFFF18; border: 2px solid #FFFFFF22;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.18s;
}
.cell:disabled { cursor: not-allowed; }
.cell.active   { background: #7CE1D9; border-color: #7CE1D9; box-shadow: 0 0 16px #7CE1D966; transform: scale(1.05); }
.cell.selected { background: #FFFFFF33; border-color: var(--teal); }
.cell.wrong    { background: #D64B5F44; border-color: #D64B5F; animation: shake 0.3s; }
.cell.correct  { background: #0E9F9A44; border-color: var(--teal); }
.cell.hinted   { background: #FF9F1C44; border-color: var(--orange); animation: pulse-cell 0.5s ease infinite alternate; }

@keyframes pulse-cell { from { transform: scale(1); } to { transform: scale(1.08); } }
@keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }

.select-progress { display: flex; align-items: center; gap: 8px; }
.select-track { flex: 1; height: 8px; background: #DCEAE9; border-radius: 4px; overflow: hidden; }
.select-fill { height: 100%; background: var(--teal); border-radius: 4px; transition: width 0.2s; }
.select-progress span { font-size: 12px; font-weight: 800; color: var(--muted); white-space: nowrap; }

.hint-btn {
  display: flex; align-items: center; gap: 8px;
  background: var(--orange-soft); border: 2px solid var(--orange);
  border-radius: 14px; padding: 10px 14px;
  font-family: var(--font); font-size: 12px; font-weight: 800;
  color: var(--ink); cursor: pointer; width: 100%;
}
.hint-btn:disabled { opacity: 0.5; cursor: not-allowed; border-color: #CCC; background: #F5F5F5; }

.attempt-count { font-size: 11px; font-weight: 700; color: var(--muted); text-align: center; }
</style>
