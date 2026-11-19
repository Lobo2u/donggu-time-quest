<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { game, replayReward, completeFreeExploreDemo } from '../store/gameStore.js'
import { FREE_EXPLORE, freeExploreCategory } from '../data/freeExplore.js'
import { LOCATIONS, MISSIONS, FIELD_QUESTS, BUDDIES } from '../data/gameData.js'

// 게임 타입별 컴포넌트
import MemoryGame     from '../games/MemoryGame.vue'
import OrderGame      from '../games/OrderGame.vue'
import PatternGame    from '../games/PatternGame.vue'
import TimelineGame   from '../games/TimelineGame.vue'
import FieldQuestGame from '../games/FieldQuestGame.vue'
import { react } from '../store/reactionStore.js'

const router = useRouter()
const route  = useRoute()
const locationId = route.params.locationId
const loc     = LOCATIONS[locationId]
const isFreeExplore = route.name === 'free-explore-mission'
const mission = !loc ? null : isFreeExplore
  ? MISSIONS[FREE_EXPLORE.missions[locationId]]
  : (FIELD_QUESTS[loc.missionId] ?? MISSIONS[loc.missionId])
const canPlay = !!loc && !!mission
  && (!isFreeExplore || (game.demoMode && !!freeExploreCategory(locationId)))
if (!canPlay) router.replace(isFreeExplore ? '/free-explore' : '/map')

const buddy = loc ? BUDDIES[loc.buddyId] : null

const gameComponents = {
  memory:   MemoryGame,
  order:    OrderGame,
  pattern:  PatternGame,
  timeline: TimelineGame,
  field:    FieldQuestGame,
}
const GameComponent = computed(() => gameComponents[mission?.type])

const isReplay = computed(() => route.query.replay === '1')
const won = ref(false)
const replayXp = ref(0)
let winTimer
onBeforeUnmount(() => clearTimeout(winTimer))

function onWin() {
  if (won.value || !canPlay || (isFreeExplore && !game.demoMode)) return
  won.value = true
  if (isFreeExplore) {
    completeFreeExploreDemo(locationId)
    winTimer = setTimeout(() => router.push('/free-explore'), 1200)
    return
  }
  react('win')
  if (isReplay.value) {
    const r = replayReward(loc.buddyId)
    replayXp.value = r.xp
    winTimer = setTimeout(() => router.push(`/buddy/${loc.buddyId}`), 2000)
  } else {
    winTimer = setTimeout(() => router.push(`/meet/${loc.buddyId}`), 1600)
  }
}
</script>

<template>
  <div class="screen minigame-screen" v-if="canPlay">
    <!-- 헤더 -->
    <div class="mg-header">
      <button class="back-btn" @click="$router.push(isFreeExplore ? '/free-explore' : `/location/${locationId}`)">
        <span class="msr" style="font-size:24px; color:var(--navy)">arrow_back</span>
      </button>
      <div class="header-texts">
        <span class="header-sub">{{ loc.name }} · {{ isFreeExplore ? '자유 탐험 · 시연' : isReplay ? '재도전 (유대 성장)' : '미션' }}</span>
        <span class="header-title">{{ mission.title }}</span>
      </div>
    </div>

    <!-- 미션 안내 -->
    <div class="mission-intro">
      <span v-if="isFreeExplore">시연 미션이에요. 실제 방문이나 현장 보상으로 기록되지 않아요. {{ mission.intro }}</span>
      <span v-else-if="isReplay">{{ buddy?.name }}와(과) 다시 도전해 유대를 쌓아요. (조각 중복 보상 없음)</span>
      <span v-else>{{ mission.intro }}</span>
    </div>

    <!-- 승리 오버레이 -->
    <Transition name="win-pop">
      <div class="win-overlay" v-if="won">
        <div class="win-box">
          <div class="win-stars">✨ ✨ ✨</div>
          <template v-if="isFreeExplore">
            <p class="win-title">시연 미션 완료!</p>
            <p class="win-sub">같은 장소는 한 번만 기록돼요.</p>
          </template>
          <template v-else-if="isReplay">
            <p class="win-title">유대 +{{ replayXp }} XP</p>
            <p class="win-sub">{{ buddy?.name }}와(과) 더 가까워졌어요!</p>
          </template>
          <template v-else>
            <p class="win-title">미션 완료!</p>
            <p class="win-sub">시간 친구가 나타나고 있어요…</p>
          </template>
        </div>
      </div>
    </Transition>

    <!-- 게임 컴포넌트 동적 렌더링 -->
    <component
      :is="GameComponent"
      :mission="mission"
      :buddy="buddy"
      @win="onWin"
    />

    <!-- 저장 후 나가기 -->
    <button class="exit-btn" @click="$router.push(isFreeExplore ? '/free-explore' : '/map')">
      <span class="msr" style="font-size:16px">save</span>
      저장 후 나가기
    </button>
  </div>
</template>

<style scoped>
.minigame-screen {
  background: var(--paper);
  display: flex; flex-direction: column; gap: 14px;
  padding: 0 16px 24px; overflow-y: auto;
}

.mg-header {
  display: flex; align-items: center; gap: 10px;
  padding-top: 52px; padding-bottom: 2px; flex-shrink: 0;
}
.back-btn { background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0; }
.header-texts { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.header-sub  { font-size: 11px; font-weight: 800; color: var(--teal); }
.header-title { font-size: 17px; font-weight: 900; color: var(--ink); }

.mission-intro {
  background: var(--navy); border-radius: 18px; padding: 14px 16px;
  font-size: 14px; font-weight: 700; color: var(--white);
  line-height: 1.5; word-break: keep-all; flex-shrink: 0;
}

.exit-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; height: 38px; background: var(--white);
  border: 1px solid var(--teal); border-radius: 12px;
  font-family: var(--font); font-size: 12px; font-weight: 800;
  color: var(--ink); cursor: pointer; flex-shrink: 0; margin-top: 4px;
}

.win-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: #08233FCC;
  display: flex; align-items: center; justify-content: center;
}
.win-box {
  background: var(--white); border-radius: 28px; padding: 32px 24px;
  text-align: center; display: flex; flex-direction: column; gap: 10px;
}
.win-stars { font-size: 28px; animation: pulse 0.6s ease-in-out infinite alternate; }
.win-title { font-size: 24px; font-weight: 900; color: var(--ink); }
.win-sub   { font-size: 14px; font-weight: 700; color: var(--muted); }

@keyframes pulse { from{transform:scale(1)} to{transform:scale(1.1)} }
.win-pop-enter-active { transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1); }
.win-pop-enter-from   { transform: scale(0.6); opacity: 0; }
</style>
