<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PhotoComparison from '../components/PhotoComparison.vue'
import { CURATED_PHOTOS } from '../data/curatedPhotos.js'

const route = useRoute()
const base = import.meta.env.BASE_URL
const place = computed(() => Object.hasOwn(CURATED_PHOTOS, route.params.placeId) ? CURATED_PHOTOS[route.params.placeId] : null)
const error = ref(false)
const split = ref(50)
watch(place, () => { error.value = false; split.value = 50 })
</script>

<template>
  <main class="photo-archive">
    <RouterLink class="back" to="/map">‹ 지도 돌아가기</RouterLink>
    <template v-if="place">
      <p class="eyebrow">동구ON 사진 기록</p>
      <h1>{{ place.title }}</h1>
      <p>{{ place.summary }}</p>
      <template v-if="place.photos?.length === 2 && !error">
        <p>촬영 위치와 구도가 달라 건물의 위치·크기가 정확히 겹치지 않아요. 경계를 좌우로 움직여 두 기록을 비교하세요.</p>
        <PhotoComparison v-model="split" ready contain before-label="2007년" after-label="2019년">
          <img :src="base + place.photos[1].file" :alt="place.photos[1].alt" @error="error = true">
          <template #before><img :src="base + place.photos[0].file" :alt="place.photos[0].alt" @error="error = true"></template>
        </PhotoComparison>
        <div class="photo-credits" aria-label="사진 출처와 이용 조건">
          <p v-for="photo in place.photos" :key="photo.date"><strong>{{ photo.date }}</strong><br>{{ photo.credit }} · <a :href="photo.source" target="_blank" rel="noopener noreferrer">원본</a> · <a :href="photo.license" target="_blank" rel="noopener noreferrer">{{ photo.licenseName }}</a></p>
        </div>
      </template>
      <figure v-else-if="place.photos?.length === 1 && !error" class="single-record">
        <img :src="base + place.photos[0].file" :alt="place.photos[0].alt" @error="error = true">
        <figcaption><strong>{{ place.photos[0].date }}</strong><br>사진: {{ place.photos[0].credit }} · <a :href="place.photos[0].license" target="_blank" rel="noopener noreferrer">{{ place.photos[0].licenseName }}</a> · <a :href="place.photos[0].source" target="_blank" rel="noopener noreferrer">원문</a><p>복원 전 비교 사진은 아직 확보되지 않았어요. 이 사진은 단독 기록으로만 보여줘요.</p></figcaption>
      </figure>
            <div v-else-if="error" role="alert">
        <p>등록된 사진을 불러오지 못했어요.</p>
        <ul><li v-for="photo in place.photos" :key="photo.date"><a :href="photo.source" target="_blank" rel="noopener noreferrer">{{ photo.date }} 원본 ↗</a></li></ul>
      </div>
      <p v-else class="wait" role="status">운영팀이 사진의 촬영 장소와 사용 조건을 확인 중이에요. 방문자가 사진을 준비하거나 올릴 필요는 없어요.</p>
      <section v-if="place.refs?.length" aria-label="출처 자료">
        <h2>기록 자료</h2>
        <ul><li v-for="link in place.refs" :key="link.url"><a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.label }} ↗</a></li></ul>
      </section>
      <RouterLink v-if="place.title.includes('관사')" class="back extra" to="/history/soje-camera">현장에서 카메라로 보기 (선택)</RouterLink>
    </template>
    <h1 v-else>이 장소의 사진 기록을 찾을 수 없어요.</h1>
  </main>
</template>

<style scoped>
.photo-archive { max-width:920px; width:100%; margin:auto; padding:22px 16px 40px; color:#163744; background:#f7faf8; }
.eyebrow { margin-top:22px; color:#215968; font-weight:800; }
h1 { margin:4px 0 10px; font-size:clamp(26px, 7vw, 38px); }
h2 { font-size:18px; }
p { line-height:1.6; margin:8px 0; }
a { color:#075753; }
.back { min-height:44px; display:inline-flex; align-items:center; font-weight:800; }
.wait { border-left:4px solid #348176; padding:12px; background:#e5f0eb; }
.single-record img { display:block; width:100%; height:auto; aspect-ratio:auto; object-fit:contain; }
.photo-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
figure { margin:0; background:#edf5f2; border-radius:12px; overflow:hidden; }
img { display:block; width:100%; aspect-ratio:3/2; object-fit:contain; background:#172d38; }
figcaption { padding:8px; line-height:1.4; font-size:.85rem; overflow-wrap:anywhere; }
ul { padding-left:20px; line-height:1.7; }
.extra { margin-top:14px; }
</style>
