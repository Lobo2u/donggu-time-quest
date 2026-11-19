<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { FREE_EXPLORE, freeExploreProgress } from '../data/freeExplore.js'
import { LOCATIONS } from '../data/gameData.js'
import { game, claimFreeExploreDemoBadge } from '../store/gameStore.js'

const router = useRouter()
const progress = computed(() => freeExploreProgress(game.freeExplore))
const groups = [
  { id: 'popular', label: '인기 명소' },
  { id: 'hidden', label: '숨은 명소' },
].map(group => ({
  ...group,
  places: Object.entries(FREE_EXPLORE.categories)
    .filter(([, category]) => category === group.id)
    .map(([id]) => LOCATIONS[id]),
}))
</script>

<template>
  <main class="screen explore-screen">
    <header>
      <button class="back" aria-label="지도로 돌아가기" @click="router.push('/map')">
        <span aria-hidden="true" class="msr">arrow_back</span>
      </button>
      <h1>동구 자유 탐험</h1>
      <span class="pill">시연</span>
    </header>

    <p class="hint">코스를 따라갈 필요 없이 원하는 장소의 미션부터 골라요. 같은 장소는 한 번만 기록해요.</p>
    <p class="hint">시연용 임시 분류예요. 실제 인기도, 현장 방문 인증이나 쿠폰 지급을 뜻하지 않아요.</p>
    <div v-if="!game.demoMode" class="notice">
      현장 모드에는 아직 자유 탐험 보상이 적용되지 않아요.
      <button type="button" class="start" @click="game.demoMode = true">시연 모드 시작</button>
    </div>

    <section v-for="group in groups" :key="group.id" :aria-labelledby="'group-' + group.id">
      <h2 :id="'group-' + group.id" aria-live="polite">
        {{ group.label }}
        <span class="pill">{{ Math.min(progress.counts[group.id], FREE_EXPLORE.targets[group.id]) }} / {{ FREE_EXPLORE.targets[group.id] }}</span>
      </h2>
      <ul>
        <li v-for="place in group.places" :key="place.id">
          <span><strong>{{ place.name }}</strong><small>{{ place.subtitle }}</small></span>
          <span v-if="progress.completed.includes(place.id)" class="done">시연 완료</span>
          <button v-else class="start" type="button" :disabled="!game.demoMode"
            :aria-label="place.name + ' 시연 미션 시작'"
            @click="router.push({ name: 'free-explore-mission', params: { locationId: place.id } })">
            미션 시작
          </button>
        </li>
      </ul>
    </section>

    <section aria-labelledby="reward-heading">
      <h2 id="reward-heading">시연 보상</h2>
      <p v-if="progress.claimed" role="status">🏅 {{ FREE_EXPLORE.badge }} 획득!</p>
      <button v-else type="button" class="btn-primary" :disabled="!game.demoMode || !progress.ready"
        @click="claimFreeExploreDemoBadge()">시연 배지 받기</button>
      <p v-if="!progress.ready && !progress.claimed" class="hint">두 종류의 목표를 모두 채우면 배지가 열려요.</p>
    </section>
  </main>
</template>

<style scoped>
.explore-screen { background: var(--paper); color: var(--ink); padding: 52px 16px 24px; overflow-y: auto; }
header, h2, li, .notice { display: flex; align-items: center; gap: 10px; }
header { margin-bottom: 12px; }
h1 { margin: 0; font-size: 22px; }
h2 { margin: 0 0 8px; font-size: 16px; }
section { margin: 17px 0 0; }
.back { display: grid; place-items: center; background: transparent; border: 0; padding: 6px; color: var(--navy); cursor: pointer; }
.hint { margin: 6px 0; font-size: 13px; line-height: 1.55; }
.pill { background: var(--sky); color: var(--teal-dark); padding: 3px 8px; border-radius: 8px; font-size: 12px; white-space: nowrap; }
ul { margin: 0; padding: 0; display: grid; gap: 7px; list-style: none; }
li { justify-content: space-between; background: var(--white); border-radius: 12px; padding: 9px 12px; }
strong, small { display: block; }
small { font-size: 12px; margin-top: 2px; }
.start { background: var(--sky); color: var(--navy); border: 1px solid var(--teal); border-radius: 8px; padding: 8px 10px; min-height: 36px; font: inherit; font-size: 12px; font-weight: 800; white-space: nowrap; cursor: pointer; }
button:disabled { opacity: .55; cursor: not-allowed; }
.notice { flex-wrap: wrap; padding: 10px; border: 1px solid var(--teal); border-radius: 10px; font-size: 13px; }
.done { color: var(--teal-dark); font-size: 12px; font-weight: 800; white-space: nowrap; }
</style>
