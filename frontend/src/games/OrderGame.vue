<!-- 중앙시장: 순서 기억 게임 -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { abilityPower } from '../store/gameStore.js'

const props = defineProps({ mission: Object })
const emit = defineEmits(['win'])

// 중앙이 능력 강도 (첫 N개 아이템 힌트)
const hintCount = computed(() => Math.max(1, abilityPower('jungja')))

const PHASES = { memorize: 'memorize', recall: 'recall', result: 'result' }
const phase = ref(PHASES.memorize)

// 미션에서 정의된 순서를 정답 시퀀스로 사용
const correctOrder = props.mission.items.map(i => i.id)

// 표시용: 랜덤 위치에 섞기
const displayItems = ref([...props.mission.items].sort(() => Math.random() - 0.5))

// 현재 하이라이트 중인 순서 인덱스 (-1 = 없음)
const highlightIdx = ref(-1)
const playerSequence = ref([])  // 플레이어가 클릭한 id 순서
const wrongFeedback = ref(false)
const hintUsed = ref(false)
const attempts = ref(0)

function getItemById(id) { return props.mission.items.find(i => i.id === id) }

// 순서대로 아이템 하이라이트 (memorize phase)
async function showSequence() {
  phase.value = PHASES.memorize
  highlightIdx.value = -1
  await delay(500)
  for (let i = 0; i < correctOrder.length; i++) {
    highlightIdx.value = i
    await delay(props.mission.showTime)
    highlightIdx.value = -1
    await delay(200)
  }
  await delay(300)
  phase.value = PHASES.recall
}

function isHighlighted(item) {
  return highlightIdx.value >= 0 && correctOrder[highlightIdx.value] === item.id
}

function highlightNumber(item) {
  const idx = correctOrder.indexOf(item.id)
  return highlightIdx.value === idx ? idx + 1 : null
}

function selectItem(item) {
  if (phase.value !== PHASES.recall) return
  if (playerSequence.value.length >= correctOrder.length) return

  playerSequence.value = [...playerSequence.value, item.id]

  if (playerSequence.value.length === correctOrder.length) {
    attempts.value++
    checkResult()
  }
}

function playerChoiceNum(item) {
  const idx = playerSequence.value.indexOf(item.id)
  return idx >= 0 ? idx + 1 : null
}

function isChosen(item) { return playerSequence.value.includes(item.id) }

function checkResult() {
  const correct = correctOrder.every((id, i) => playerSequence.value[i] === id)
  if (correct) {
    emit('win')
  } else {
    wrongFeedback.value = true
    setTimeout(() => {
      wrongFeedback.value = false
      playerSequence.value = []
      showSequence()
    }, 1400)
  }
}

// 힌트: 앞에서 N개 아이템 하이라이트 (능력 강도)
function useHint() {
  if (hintUsed.value || phase.value !== PHASES.recall) return
  hintUsed.value = true
  const ids = correctOrder.slice(0, hintCount.value)
  const items = ids.map(id => displayItems.value.find(i => i.id === id)).filter(Boolean)
  items.forEach(it => { it._hinted = true })
  setTimeout(() => { items.forEach(it => { it._hinted = false }) }, 1500)
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

onMounted(showSequence)
</script>

<template>
  <div class="order-game">
    <!-- 진행 상태 -->
    <div class="phase-banner" :class="phase">
      <span class="msr" style="font-size:18px">
        {{ phase === 'memorize' ? 'visibility' : 'touch_app' }}
      </span>
      <span>{{ phase === 'memorize' ? '순서를 기억해요!' : '같은 순서로 눌러요' }}</span>
    </div>

    <!-- 선택 진행도 -->
    <div class="sequence-progress" v-if="phase === 'recall'">
      <div
        v-for="n in correctOrder.length"
        :key="n"
        class="seq-dot"
        :class="{ filled: n <= playerSequence.length, wrong: wrongFeedback && n <= playerSequence.length }"
      ></div>
      <span class="seq-label">{{ playerSequence.length }} / {{ correctOrder.length }}</span>
    </div>

    <!-- 틀렸을 때 피드백 -->
    <Transition name="feedback">
      <div class="wrong-banner" v-if="wrongFeedback">
        <span class="msr" style="font-size:20px">cancel</span>
        순서가 달라요! 다시 보고 도전해요.
      </div>
    </Transition>

    <!-- 아이템 그리드 -->
    <div class="items-grid">
      <div
        v-for="item in displayItems"
        :key="item.id"
        class="item-card"
        :class="{
          highlighted: isHighlighted(item),
          chosen: isChosen(item) && phase === 'recall',
          wrong: wrongFeedback && isChosen(item),
          hinted: item._hinted,
        }"
        :style="{ borderColor: isHighlighted(item) || isChosen(item) ? item.color : '#E0ECEA' }"
        @click="selectItem(item)"
      >
        <!-- 하이라이트 순서 번호 (memorize) -->
        <div v-if="isHighlighted(item)" class="highlight-num" :style="{ background: item.color }">
          {{ highlightNumber(item) }}
        </div>
        <!-- 선택 번호 (recall) -->
        <div v-else-if="isChosen(item) && phase === 'recall'" class="chosen-num" :style="{ background: item.color }">
          {{ playerChoiceNum(item) }}
        </div>
        <!-- 힌트 표시 -->
        <div v-else-if="item._hinted" class="hint-indicator">{{ correctOrder.indexOf(item.id) + 1 }}번!</div>

        <span class="msr item-icon" :style="{ color: isHighlighted(item) ? item.color : '#7E8E8E', fontSize: '36px' }">
          {{ item.icon }}
        </span>
        <span class="item-label">{{ item.label }}</span>
      </div>
    </div>

    <!-- 힌트 버튼 -->
    <button class="hint-btn" :disabled="hintUsed || phase !== 'recall'" @click="useHint">
      <span class="msr" style="font-size:16px">auto_fix_high</span>
      {{ hintUsed ? '힌트 사용됨' : `중앙이의 능력: 앞 ${hintCount}개 물건 힌트` }}
    </button>

    <p class="attempt-count">시도 {{ attempts }}회</p>
  </div>
</template>

<style scoped>
.order-game { display: flex; flex-direction: column; gap: 14px; }

.phase-banner {
  display: flex; align-items: center; gap: 8px;
  border-radius: 14px; padding: 10px 14px;
  font-size: 14px; font-weight: 800; color: var(--white);
  transition: background 0.3s;
}
.phase-banner.memorize { background: var(--orange); }
.phase-banner.recall   { background: var(--teal-dark); }

.sequence-progress { display: flex; align-items: center; gap: 6px; }
.seq-dot {
  flex: 1; height: 8px; border-radius: 4px; background: #DCEAE9;
  transition: background 0.2s;
}
.seq-dot.filled { background: var(--teal); }
.seq-dot.wrong  { background: #D64B5F; }
.seq-label { font-size: 12px; font-weight: 800; color: var(--muted); white-space: nowrap; }

.wrong-banner {
  display: flex; align-items: center; gap: 8px;
  background: #D64B5F22; border: 1px solid #D64B5F;
  border-radius: 14px; padding: 10px 14px;
  font-size: 13px; font-weight: 800; color: #D64B5F;
}

.items-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}

.item-card {
  background: var(--white); border: 2px solid #E0ECEA;
  border-radius: 18px; padding: 16px 10px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  position: relative; cursor: pointer; transition: all 0.15s;
  min-height: 110px; justify-content: center;
}
.item-card.highlighted { background: #F0FFFE; transform: scale(1.04); }
.item-card.chosen { background: #E8F6F4; }
.item-card.wrong  { background: #FFECEC; border-color: #D64B5F; animation: shake 0.3s; }
.item-card.hinted { background: #FFF8EC; border-color: var(--orange); }
.item-card:active { transform: scale(0.96); }

.highlight-num, .chosen-num {
  position: absolute; top: 6px; right: 6px;
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 900; color: white;
}
.hint-indicator {
  position: absolute; top: 6px; right: 6px;
  background: var(--orange); color: white;
  border-radius: 10px; padding: 2px 6px; font-size: 11px; font-weight: 900;
}
.item-icon { line-height: 1; }
.item-label { font-size: 13px; font-weight: 800; color: var(--ink); }

.hint-btn {
  display: flex; align-items: center; gap: 8px;
  background: var(--orange-soft); border: 2px solid var(--orange);
  border-radius: 14px; padding: 10px 14px;
  font-family: var(--font); font-size: 12px; font-weight: 800;
  color: var(--ink); cursor: pointer; width: 100%;
}
.hint-btn:disabled { opacity: 0.5; cursor: not-allowed; border-color: #CCC; background: #F5F5F5; }

.attempt-count { font-size: 11px; font-weight: 700; color: var(--muted); text-align: center; }

@keyframes shake {
  0%,100% { transform: translateX(0); }
  25%      { transform: translateX(-5px); }
  75%      { transform: translateX(5px); }
}

.feedback-enter-active { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.feedback-enter-from   { opacity: 0; transform: translateY(-10px); }
.feedback-leave-active { transition: opacity 0.2s; }
.feedback-leave-to     { opacity: 0; }
</style>
