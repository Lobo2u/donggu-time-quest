<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { TOUR_PLACES } from '../data/tourPlaces.js'
import { TOUR_EXPERIENCES, chooseTourStep } from '../data/tourExperiences.js'

import { TOUR_KEEPSAKES, earnKeepsake, keepsakeStorage } from '../data/tourKeepsakes.js'

const route = useRoute()
const saved = ref(false)
const reward = computed(() => TOUR_KEEPSAKES.find(item => item.id === route.params.placeId))
const place = computed(() => TOUR_PLACES.find(item => item.id === route.params.placeId))
const activity = computed(() => place.value && TOUR_EXPERIENCES[place.value.id])
const progress = ref(0)
const feedback = ref('')
const pickOrder = computed(() => ({ woosong: [1, 2, 0], daedongcheon: [1, 0, 2], "daedong-sky": [2, 1, 0] }[place.value?.id] || [2, 0, 1]))
watch(() => route.params.placeId, reset)
function reset() { progress.value = 0; feedback.value = ''; saved.value = false }
function choose(index) {
  const steps = activity.value.steps
  const previous = progress.value
  const next = chooseTourStep(steps, previous, index)
  progress.value = next
  if (next === steps.length && previous !== next) saved.value = earnKeepsake(keepsakeStorage(), place.value.id)
  feedback.value = next === previous ? '아직 이 장면이 아니에요. 위 힌트를 다시 살펴보세요.'
    : next === steps.length ? '장면을 모두 밝혔어요!' : steps[index][0] + ' 장면이 밝아졌어요.'
}
</script>

<template>
  <main class="tour-experience" :style="{ '--accent': activity?.bg || '#174974' }">
    <RouterLink class="back" to="/map">‹ 지도 돌아가기</RouterLink>
    <template v-if="activity">
      <p class="place">{{ place.name }} · 장소 체험</p>
      <h1>{{ activity.title }}</h1>
      <a v-if="activity.external" class="restart" :href="activity.external">날개담장 미니게임 해보기</a>
      <p v-if="activity?.external?.startsWith('https://')" class="notice">벽화 체험은 동구ON 공개 사이트에서 열립니다. 수집품은 사이트별로 따로 저장되어 이 수집장에 합쳐지지 않습니다.</p>
      <template v-if="!activity.external">
        <p>{{ activity.introduction }}</p>
        <div class="scene" :class="{ finished: progress === activity.steps.length }" aria-hidden="true">
          <span v-for="([label, icon], index) in activity.steps" :key="label" :class="{ lit: index < progress }">{{ icon }}</span>
        </div>
        <p>{{ progress }} / {{ activity.steps.length }} 장면 밝힘</p>
        <template v-if="progress < activity.steps.length">
          <p class="clue"><strong>힌트</strong> {{ activity.steps[progress][2] }}</p>
          <div class="choices">
            <button v-for="index in pickOrder" :key="index" type="button" :disabled="index < progress"
              @click="choose(index)">{{ activity.steps[index][1] }} {{ activity.steps[index][0] }}</button>
          </div>
        </template>
        <p role="status">{{ feedback }}</p>
        <div v-if="progress === activity.steps.length" class="observation">
          <p>{{ activity.observation }}</p>
          <p v-if="saved"><strong>{{ reward.icon }} {{ reward.name }} 획득</strong></p>
          <p v-else>이 브라우저에는 기념품을 저장하지 못했어요.</p>
          <RouterLink class="back" to="/keepsakes">수집장 보기 ›</RouterLink>
        </div>
        <button v-if="progress === activity.steps.length" class="restart" type="button" @click="reset">다시 하기</button>
      </template>
      <p class="notice">카메라 없이 할 수 있어요. 현장 방문 인증이나 기존 탐험 진행에는 반영되지 않아요.</p>
    </template>
    <h1 v-else>이 장소의 체험을 찾을 수 없어요.</h1>
  </main>
</template>

<style scoped>
.tour-experience { width:100%; max-width:720px; min-height:100%; overflow:auto; margin:auto; padding:20px 18px 36px; background:#f4faf8; color:#132b3b; }
.back { color:#123c58; display:inline-flex; align-items:center; min-height:44px; font-weight:800; }
.place { color:#21526a; font-weight:800; margin:20px 0 0; }
h1 { font-size:clamp(28px, 7vw, 42px); margin:4px 0 14px; }
p { line-height:1.55; margin:12px 0; }
.scene { display:flex; justify-content:center; gap:7%; align-items:center; padding:20px 10px; min-height:140px; border-radius:20px; background:#29343b; transition:background .25s; }
.scene.finished { background:var(--accent); }
.scene span { font-size:clamp(38px, 12vw, 68px); filter:grayscale(1) brightness(.72); opacity:.72; transition:filter .25s, opacity .25s; }
.scene span.lit { filter:none; opacity:1; }
.clue,.observation { padding:12px; border-radius:12px; background:#dfeeed; }
.clue strong { display:block; color:#21526a; }
.choices { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:6px; }
.choices button,.restart { min-height:48px; padding:8px 5px; border:1px solid #a6c5c5; border-radius:10px; background:#fff; color:#123443; font:inherit; font-weight:750; cursor:pointer; }
.choices button:disabled { opacity:.56; cursor:default; }
.restart { display:inline-flex; align-items:center; padding-inline:14px; background:#076457; color:#fff; text-decoration:none; }
.notice { font-size:.85rem; color:#415b68; }
@media (prefers-reduced-motion:reduce) { .scene,.scene span { transition:none; } }
</style>
