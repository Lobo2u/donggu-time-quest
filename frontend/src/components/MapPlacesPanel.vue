<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { TOUR_EXPERIENCES } from '../data/tourExperiences.js'
const props = defineProps({
  story: { type: Array, required: true },
  tours: { type: Array, required: true },
  active: { type: String, default: '' },
  subset: { type: Array, default: null },
})
const emit = defineEmits(['close', 'show-all', 'focus-place', 'focus-story'])
const title = ref(null)
const activePlace = computed(() => props.tours.find(place => place.id === props.active))
const activity = computed(() => TOUR_EXPERIENCES[props.active])
const shownTours = computed(() => props.subset ? props.tours.filter(place => props.subset.includes(place.id)) : props.tours)
function focusTitle() { nextTick(() => title.value?.focus()) }
onMounted(focusTitle)
watch(() => [props.active, props.subset], focusTitle)
</script>

<template>
  <section class="places-panel" aria-labelledby="map-places-title" @keydown.esc.stop="emit('close')">
    <header>
      <h2 id="map-places-title" ref="title" tabindex="-1">{{ activePlace?.name || (subset ? '가까이 있는 장소' : '전체 장소') }}</h2>
      <button type="button" class="close-places" aria-label="장소 목록 닫기" @click="emit('close')">×</button>
    </header>
    <RouterLink class="shelf-link" to="/keepsakes">동구 기념품 수집장 <span aria-hidden="true">›</span></RouterLink>
    <template v-if="activePlace">
      <p>{{ activePlace.anchor }}</p>
      <a v-if="activity?.external" class="play-preview" :href="activity.external">날개담장 미니게임 해보기 <span aria-hidden="true">›</span></a>
      <RouterLink v-else-if="activity" class="play-preview" :to="'/place-experience/' + activePlace.id">{{ activity.title }} <span aria-hidden="true">›</span></RouterLink>
      <p v-if="activity?.external?.startsWith('https://')" class="notice">벽화 체험은 동구ON 공개 사이트에서 열립니다. 수집품은 사이트별로 따로 저장되어 이 수집장에 합쳐지지 않습니다.</p>
      <p>카메라 없이 즐기는 체험이에요. 방문 인증이나 탐험 진행에는 반영되지 않아요.</p>
      <a :href="activePlace.source" target="_blank" rel="noopener noreferrer">공식 장소 안내 ↗</a>
      <a v-if="activePlace.coordinateSource" :href="activePlace.coordinateSource" target="_blank" rel="noopener noreferrer">지도 참고점 출처 ↗</a>
      <button type="button" class="row" @click="emit('show-all')">전체 장소 보기</button>
    </template>
    <template v-else>
      <template v-if="!subset">
        <h3>탐험 미션 · {{ story.length }}곳</h3>
        <button v-for="place in story" :key="place.id" type="button" class="row" @click="emit('focus-story',place.id)">
          <strong>{{ place.name }}</strong><span :class="{ complete: place.done }">{{ place.status }}</span>
        </button>
      </template>
      <h3>둘러볼 곳 · {{ shownTours.length }}곳</h3>
      <p>장소를 누르면 미니게임을 시작할 수 있어요.</p>
      <button v-for="place in shownTours" :key="place.id" type="button" class="row" @click="emit('focus-place',place.id)">
        <strong>{{ place.name }}</strong><span>{{ place.anchor }}</span>
      </button>
      <button v-if="subset" type="button" class="row" @click="emit('show-all')">전체 장소 보기</button>
    </template>
  </section>
</template>

<style scoped>
.places-panel { position:absolute; z-index:23; left:12px; right:12px; bottom:70px; max-height:475px; overflow:auto; padding:14px; border-radius:16px; color:var(--ink); background:var(--white); box-shadow:0 8px 32px #001a44a0; overscroll-behavior:contain; }
header { display:flex; align-items:center; justify-content:space-between; gap:10px; }
h2 { font-size:20px; margin:0; }
h3 { font-size:14px; margin:11px 0 3px; }
p { font-size:12px; line-height:1.5; margin:5px 0 8px; }
button { cursor:pointer; }
.close-places { background:#e5eef1; color:#123443; border:0; border-radius:10px; width:44px; height:44px; font-size:24px; }
.row,a { width:100%; min-height:44px; display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:4px; padding:7px 10px; border:0; border-radius:8px; font:inherit; font-size:13px; text-align:left; background:#f0f4f4; color:#123443; }
.row span { font-size:11px; text-align:right; color:#41555d; }
.row span.complete { color:#00675b; font-weight:800; }
a { color:#075b50; font-weight:750; }
a.play-preview { background:#076457; color:#fff; min-height:48px; font-weight:800; text-decoration:none; }
.shelf-link { color:#21526a; background:#e7efec; } a.play-preview:focus-visible { outline:3px solid #123443; outline-offset:2px; }
</style>
