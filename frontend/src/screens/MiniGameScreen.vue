<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { game } from '../store/gameStore.js'
import { LOCATIONS, MISSIONS } from '../data/gameData.js'

const router = useRouter()
const route = useRoute()
const locationId = route.params.locationId
const loc = LOCATIONS[locationId]
const mission = MISSIONS[loc?.missionId]

if (!mission) router.replace('/map')

// ── 카드 덱 구성 ─────────────────────────────────────────────────────────────
const deck = ref([])
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
function buildDeck() {
  const cards = []
  mission.pairs.forEach(p => {
    cards.push({ ...p, uid: p.id + '-a', state: 'hidden' })
    cards.push({ ...p, uid: p.id + '-b', state: 'hidden' })
  })
  deck.value = shuffle(cards)
}
onMounted(buildDeck)

// ── 게임 상태 ─────────────────────────────────────────────────────────────────
const revealed = ref([])
const locked = ref(false)
const matchedPairs = ref([])
const attempts = ref(0)
const hintUsed = ref(false)
const hintCard = ref(null) // 능력 사용 시 잠깐 보이는 카드
const win = ref(false)

const sojoBuddyOwned = computed(() => game.buddies.sojo?.owned)
const allMatched = computed(() => matchedPairs.value.length === mission.pairs.length)

function flipCard(card) {
  if (locked.value || win.value) return
  if (card.state === 'matched' || card.state === 'hint') return
  if (revealed.value.find(c => c.uid === card.uid)) return
  if (revealed.value.length >= 2) return

  card.state = 'revealed'
  revealed.value = [...revealed.value, card]

  if (revealed.value.length === 2) {
    attempts.value++
    locked.value = true
    const [c1, c2] = revealed.value

    if (c1.id === c2.id) {
      // 매치!
      setTimeout(() => {
        c1.state = 'matched'
        c2.state = 'matched'
        matchedPairs.value = [...matchedPairs.value, c1.id]
        revealed.value = []
        locked.value = false
        if (allMatched.value) {
          win.value = true
          setTimeout(() => router.push(`/meet/${loc.buddyId}`), 1800)
        }
      }, 400)
    } else {
      // 불일치
      setTimeout(() => {
        c1.state = 'hidden'
        c2.state = 'hidden'
        revealed.value = []
        locked.value = false
      }, 900)
    }
  }
}

// 소조 능력: 카드 하나 잠깐 공개 (소조를 이미 소유한 경우 사용 가능)
function useBuddyAbility() {
  if (hintUsed.value || locked.value || win.value) return
  const hidden = deck.value.filter(c => c.state === 'hidden')
  if (!hidden.length) return
  hintUsed.value = true
  const target = hidden[Math.floor(Math.random() * hidden.length)]
  target.state = 'hint'
  hintCard.value = target
  setTimeout(() => {
    if (target.state === 'hint') {
      target.state = 'hidden'
      hintCard.value = null
    }
  }, 1800)
}

function cardClass(card) {
  if (card.state === 'matched') return 'matched'
  if (card.state === 'revealed' || card.state === 'hint') return 'revealed'
  return 'hidden'
}
</script>

<template>
  <div class="screen minigame-screen">
    <!-- 헤더 -->
    <div class="mg-header">
      <button class="back-btn" @click="$router.push(`/location/${locationId}`)">
        <span class="msr" style="font-size:24px; color:var(--navy)">arrow_back</span>
      </button>
      <div class="header-texts">
        <span class="header-sub">{{ loc.name }} · 기억 맞추기</span>
        <span class="header-title">{{ mission.title }}</span>
      </div>
      <div class="match-count">{{ matchedPairs.length }}/{{ mission.pairs.length }}</div>
    </div>

    <!-- 미션 안내 -->
    <div class="mission-intro">
      <p>{{ mission.intro }}</p>
    </div>

    <!-- 승리 오버레이 -->
    <Transition name="win-pop">
      <div class="win-overlay" v-if="win">
        <div class="win-content">
          <div class="win-stars">✨ ✨ ✨</div>
          <p class="win-title">기억 복원 완료!</p>
          <p class="win-sub">시간 친구가 모습을 드러내고 있어요…</p>
        </div>
      </div>
    </Transition>

    <!-- 카드 그리드 (3열 2행) -->
    <div class="card-grid">
      <div
        v-for="card in deck"
        :key="card.uid"
        class="card"
        :class="cardClass(card)"
        @click="flipCard(card)"
        :aria-label="card.state !== 'hidden' ? card.label : '기억 조각'"
      >
        <div class="card-inner">
          <!-- 뒷면 -->
          <div class="card-back">
            <div class="card-back-pattern">
              <span class="msr" style="font-size:28px; color:white; opacity:0.4">history_edu</span>
            </div>
          </div>
          <!-- 앞면 -->
          <div class="card-front" :style="{ background: card.color + '22', borderColor: card.color }">
            <span class="msr card-icon" :style="{ color: card.color }">{{ card.icon }}</span>
            <span class="card-label">{{ card.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 진행 상태 -->
    <div class="progress-row">
      <div class="progress-track">
        <div
          class="progress-fill"
          :style="{ width: (matchedPairs.length / mission.pairs.length * 100) + '%' }"
        ></div>
      </div>
      <span class="attempts-text">시도 {{ attempts }}회</span>
    </div>

    <!-- 소조 능력 버튼 (소조를 이미 가지고 있을 때만) -->
    <div class="ability-area" v-if="sojoBuddyOwned">
      <button
        class="ability-btn"
        :disabled="hintUsed"
        @click="useBuddyAbility"
      >
        <span class="msr" style="font-size:18px">auto_fix_high</span>
        <div class="ability-texts">
          <span class="ability-name">소조의 능력 · 기억 현상</span>
          <span class="ability-desc">{{ hintUsed ? '이미 사용했어요' : '카드 하나를 잠깐 공개해요 (1회)' }}</span>
        </div>
      </button>
    </div>

    <!-- 힌트 (소조 없을 때 기본 힌트) -->
    <div class="hint-area" v-else>
      <span class="msr" style="font-size:16px; color:var(--muted)">lightbulb</span>
      <p>같은 이름의 기억 조각 두 장을 찾아요. 카드를 하나씩 눌러보세요.</p>
    </div>

    <!-- 중단 버튼 -->
    <button class="exit-btn" @click="$router.push('/map')">
      <span class="msr" style="font-size:16px">save</span>
      저장 후 나가기
    </button>
  </div>
</template>

<style scoped>
.minigame-screen {
  background: var(--paper);
  display: flex; flex-direction: column; gap: 14px;
  padding: 0 16px 20px; overflow-y: auto;
}

.mg-header {
  display: flex; align-items: center; gap: 10px;
  padding-top: 52px; padding-bottom: 4px;
}
.back-btn { background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0; }
.header-texts { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.header-sub { font-size: 11px; font-weight: 800; color: var(--teal); }
.header-title { font-size: 17px; font-weight: 900; color: var(--ink); }
.match-count {
  background: var(--orange); color: var(--navy);
  border-radius: 12px; padding: 6px 12px;
  font-size: 16px; font-weight: 900;
}

.mission-intro {
  background: var(--navy); border-radius: 18px; padding: 14px 16px;
  font-size: 14px; font-weight: 700; color: var(--white);
  line-height: 1.5; word-break: keep-all;
}

/* 카드 그리드 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.card {
  aspect-ratio: 0.75;
  border-radius: 16px; cursor: pointer;
  perspective: 600px;
  transition: transform 0.1s;
}
.card:active { transform: scale(0.95); }
.card.matched { cursor: default; }

.card-inner {
  width: 100%; height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 16px;
}

.card.revealed .card-inner,
.card.matched .card-inner {
  transform: rotateY(180deg);
}

.card-back, .card-front {
  position: absolute; inset: 0;
  border-radius: 16px;
  backface-visibility: hidden;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
}

.card-back {
  background: var(--navy);
  border: 2px solid #1A4A6E;
}
.card-back-pattern {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 100%;
  background: repeating-linear-gradient(
    45deg, #0E2A4A, #0E2A4A 6px, #0A2040 6px, #0A2040 12px
  );
  border-radius: 14px;
}

.card-front {
  transform: rotateY(180deg);
  border: 2px solid;
  padding: 10px;
}
.card-icon { font-size: 38px; }
.card-label { font-size: 11px; font-weight: 800; color: var(--ink); text-align: center; word-break: keep-all; }

.card.matched .card-front {
  border-width: 3px;
  box-shadow: 0 0 14px currentColor;
  filter: brightness(1.05);
}

/* 진행 상태 */
.progress-row { display: flex; align-items: center; gap: 10px; }
.progress-track {
  flex: 1; height: 8px; background: #DCEAE9; border-radius: 4px; overflow: hidden;
}
.progress-fill {
  height: 100%; background: var(--teal); border-radius: 4px;
  transition: width 0.4s ease;
}
.attempts-text { font-size: 11px; font-weight: 700; color: var(--muted); white-space: nowrap; }

/* 능력 버튼 */
.ability-area { }
.ability-btn {
  width: 100%; display: flex; align-items: center; gap: 10px;
  background: var(--orange-soft); border: 2px solid var(--orange);
  border-radius: 16px; padding: 12px 14px;
  font-family: var(--font); cursor: pointer;
  transition: opacity 0.2s;
}
.ability-btn:disabled {
  opacity: 0.5; cursor: not-allowed;
  border-color: #CCC; background: #F5F5F5;
}
.ability-texts { display: flex; flex-direction: column; gap: 2px; text-align: left; }
.ability-name { font-size: 12px; font-weight: 900; color: var(--ink); }
.ability-desc { font-size: 11px; font-weight: 600; color: var(--muted); }

/* 힌트 */
.hint-area {
  display: flex; align-items: center; gap: 8px;
  background: #F0F7F6; border-radius: 14px; padding: 10px 12px;
  font-size: 12px; font-weight: 700; color: var(--muted); line-height: 1.4;
}

.exit-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; height: 36px; background: var(--white);
  border: 1px solid var(--teal); border-radius: 12px;
  font-family: var(--font); font-size: 12px; font-weight: 800;
  color: var(--ink); cursor: pointer;
}

/* 승리 오버레이 */
.win-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: #08233FCC;
  display: flex; align-items: center; justify-content: center;
}
.win-content {
  background: var(--white); border-radius: 28px; padding: 32px 24px;
  text-align: center; display: flex; flex-direction: column; gap: 10px;
}
.win-stars { font-size: 28px; animation: pulse 0.6s ease-in-out infinite alternate; }
.win-title { font-size: 24px; font-weight: 900; color: var(--ink); }
.win-sub { font-size: 14px; font-weight: 700; color: var(--muted); }

@keyframes pulse { from { transform: scale(1); } to { transform: scale(1.1); } }

.win-pop-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.win-pop-enter-from { transform: scale(0.6); opacity: 0; }
</style>
