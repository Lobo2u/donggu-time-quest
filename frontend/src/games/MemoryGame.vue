<!-- 소제동: 카드 뒤집기 기억 맞추기 -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { game, abilityPower } from '../store/gameStore.js'

const props = defineProps({ mission: Object })
const emit  = defineEmits(['win'])

// 소조 능력 강도 (레벨/각성에 따라 공개 카드 수 1~3)
const revealCount = computed(() => Math.max(1, abilityPower('sojo')))

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const deck = ref([])
onMounted(() => {
  const cards = []
  props.mission.pairs.forEach(p => {
    cards.push({ ...p, uid: p.id + '-a', state: 'hidden' })
    cards.push({ ...p, uid: p.id + '-b', state: 'hidden' })
  })
  deck.value = shuffle(cards)
})

const revealed     = ref([])
const locked       = ref(false)
const matchedPairs = ref([])
const attempts     = ref(0)
const hintUsed     = ref(false)

const sojoBuddyOwned = computed(() => game.buddies.sojo?.owned)

function flipCard(card) {
  if (locked.value || card.state === 'matched') return
  if (revealed.value.find(c => c.uid === card.uid)) return
  if (revealed.value.length >= 2) return

  card.state = 'revealed'
  revealed.value = [...revealed.value, card]

  if (revealed.value.length === 2) {
    attempts.value++
    locked.value = true
    const [c1, c2] = revealed.value
    if (c1.id === c2.id) {
      setTimeout(() => {
        c1.state = 'matched'; c2.state = 'matched'
        matchedPairs.value = [...matchedPairs.value, c1.id]
        revealed.value = []; locked.value = false
        if (matchedPairs.value.length === props.mission.pairs.length) {
          emit('win')
        }
      }, 400)
    } else {
      setTimeout(() => {
        c1.state = 'hidden'; c2.state = 'hidden'
        revealed.value = []; locked.value = false
      }, 900)
    }
  }
}

function useBuddyAbility() {
  if (hintUsed.value || locked.value) return
  const hidden = deck.value.filter(c => c.state === 'hidden')
  if (!hidden.length) return
  hintUsed.value = true
  // 능력 강도만큼 카드 공개 (레벨/각성 시 더 많이)
  const shuffled = [...hidden].sort(() => Math.random() - 0.5)
  const targets = shuffled.slice(0, revealCount.value)
  targets.forEach(t => { t.state = 'hint' })
  setTimeout(() => { targets.forEach(t => { if (t.state === 'hint') t.state = 'hidden' }) }, 1800)
}

function cardClass(c) {
  if (c.state === 'matched') return 'matched'
  if (c.state === 'revealed' || c.state === 'hint') return 'revealed'
  return 'hidden'
}
</script>

<template>
  <div class="memory-game">
    <!-- 매치 카운터 -->
    <div class="match-row">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: (matchedPairs.length / mission.pairs.length * 100) + '%' }"></div>
      </div>
      <div class="match-badge">{{ matchedPairs.length }}/{{ mission.pairs.length }}</div>
      <span class="attempt-text">{{ attempts }}회</span>
    </div>

    <!-- 카드 그리드 3열 -->
    <div class="card-grid">
      <div
        v-for="card in deck" :key="card.uid"
        class="card" :class="cardClass(card)"
        @click="flipCard(card)"
      >
        <div class="card-inner">
          <div class="card-back">
            <span class="msr" style="font-size:26px; color:white; opacity:0.35">history_edu</span>
          </div>
          <div class="card-front" :style="{ background: card.color + '22', borderColor: card.color }">
            <span class="msr" style="font-size:36px" :style="{ color: card.color }">{{ card.icon }}</span>
            <span class="card-label">{{ card.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 소조 능력 버튼 -->
    <button v-if="sojoBuddyOwned" class="ability-btn" :disabled="hintUsed" @click="useBuddyAbility">
      <span class="msr" style="font-size:18px">auto_fix_high</span>
      <div>
        <p class="ab-name">소조의 능력 · 기억 현상</p>
        <p class="ab-desc">{{ hintUsed ? '이미 사용했어요' : `카드 ${revealCount}장을 잠깐 공개해요 (1회)` }}</p>
      </div>
    </button>

    <div class="hint-box" v-else>
      <span class="msr" style="font-size:15px; color:var(--muted)">lightbulb</span>
      <p>같은 이름의 기억 조각 두 장을 찾아요.</p>
    </div>
  </div>
</template>

<style scoped>
.memory-game { display: flex; flex-direction: column; gap: 14px; }

.match-row { display: flex; align-items: center; gap: 8px; }
.progress-track { flex:1; height:8px; background:#DCEAE9; border-radius:4px; overflow:hidden; }
.progress-fill  { height:100%; background:var(--teal); border-radius:4px; transition:width 0.4s; }
.match-badge { background:var(--orange); color:var(--navy); border-radius:10px; padding:4px 10px; font-size:14px; font-weight:900; }
.attempt-text { font-size:11px; font-weight:700; color:var(--muted); white-space:nowrap; }

.card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }

.card { aspect-ratio: 0.75; border-radius:16px; cursor:pointer; perspective:600px; }
.card:active { transform: scale(0.95); }
.card.matched { cursor:default; }

.card-inner {
  width:100%; height:100%; position:relative;
  transform-style:preserve-3d;
  transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
  border-radius:16px;
}
.card.revealed .card-inner,
.card.matched  .card-inner { transform: rotateY(180deg); }

.card-back, .card-front {
  position:absolute; inset:0; border-radius:16px;
  backface-visibility:hidden;
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;
}
.card-back {
  background: var(--navy); border: 2px solid #1A4A6E;
  background: repeating-linear-gradient(45deg, #0E2A4A, #0E2A4A 6px, #0A2040 6px, #0A2040 12px);
}
.card-front { transform:rotateY(180deg); border:2px solid; padding:8px; }
.card-label { font-size:11px; font-weight:800; color:var(--ink); text-align:center; word-break:keep-all; }

.card.matched .card-front { border-width:3px; }

.ability-btn {
  display:flex; align-items:center; gap:10px;
  background:var(--orange-soft); border:2px solid var(--orange);
  border-radius:16px; padding:12px 14px;
  font-family:var(--font); cursor:pointer; width:100%; text-align:left;
}
.ability-btn:disabled { opacity:0.5; cursor:not-allowed; border-color:#CCC; background:#F5F5F5; }
.ab-name { font-size:12px; font-weight:900; color:var(--ink); }
.ab-desc { font-size:11px; font-weight:600; color:var(--muted); }

.hint-box {
  display:flex; align-items:center; gap:8px;
  background:#F0F7F6; border-radius:14px; padding:10px 12px;
  font-size:12px; font-weight:700; color:var(--muted); line-height:1.4;
}
</style>
