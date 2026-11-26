<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { TOUR_KEEPSAKES, keepsakeStorage, readKeepsakes, windmillStage } from '../data/tourKeepsakes.js'

const collected = ref([])
const refresh = () => { collected.value = readKeepsakes(keepsakeStorage()) }
const acquired = computed(() => new Set(collected.value.map(item => item.id)))
const wind = computed(() => windmillStage(collected.value))
onMounted(() => { refresh(); window.addEventListener('storage', refresh); window.addEventListener('pageshow', refresh) })
onUnmounted(() => { window.removeEventListener('storage', refresh); window.removeEventListener('pageshow', refresh) })
function linkFor(item) { return '/place-experience/' + item.id }
</script>

<template>
  <main class="shelf">
    <RouterLink class="back" to="/map">‹ 지도 돌아가기</RouterLink>
    <h1>동구 기념품 수집장</h1>
    <p>장소마다 다른 체험을 완료하고, 그곳의 기념품을 모아요.</p>
    <section aria-labelledby="other-title">
      <h2 id="other-title">동구 기념품</h2>
      <ul>
        <li v-for="item in TOUR_KEEPSAKES.slice(0,3)" :key="item.id" :class="{ earned: acquired.has(item.id) }">
          <RouterLink :to="linkFor(item)"><span aria-hidden="true">{{ item.icon }}</span><span>{{ item.place }} <strong>{{ item.name }}</strong></span><small>{{ acquired.has(item.id) ? '획득' : '체험하기' }}</small></RouterLink>
        </li>
      </ul>
    </section>
    <section aria-labelledby="windmill-title" class="windmill">
      <h2 id="windmill-title">대동의 바람</h2>
      <p>{{ wind.complete ? '대동 풍차가 완성됐어요!' : '벽화마을의 날개와 하늘공원의 몸체가 모이면 풍차가 완성돼요.' }}</p>
      <svg viewBox="0 0 160 150" role="img" :aria-label="wind.complete ? '완성된 대동 풍차' : '조립 중인 대동 풍차'">
        <path d="M0 139 Q36 125 80 139 T160 137 V150 H0" fill="#c1ded8"/>
        <g :class="{ missing: !wind.body }">
          <path fill="#ffcb74" stroke="#412b34" stroke-width="3" d="M66 67h28l14 65H52Z"/>
          <path fill="#b15b6a" stroke="#412b34" stroke-width="3" d="m58 67 22-23 22 23Z"/>
          <path fill="#613948" d="M73 132v-20a7 7 0 0 1 14 0v20Z"/>
        </g>
        <g :class="{ missing: !wind.blades, spinning: wind.complete }">
          <path fill="#ef7563" d="M80 68 69 14 80 9 89 26Z"/>
          <path fill="#8450a5" d="M80 68 134 57 139 68 122 78Z"/>
          <path fill="#1a9487" d="M80 68 92 121 80 127 72 111Z"/>
          <path fill="#e3932c" d="M80 68 27 79 21 68 37 58Z"/>
          <circle cx="80" cy="68" r="6" fill="#3d3944"/>
        </g>
      </svg>
      <ul>
        <li v-for="item in TOUR_KEEPSAKES.slice(3)" :key="item.id" :class="{ earned: acquired.has(item.id) }">
          <RouterLink :to="linkFor(item)"><span aria-hidden="true">{{ item.icon }}</span><span>{{ item.place }} <strong>{{ item.name }}</strong></span><small>{{ acquired.has(item.id) ? '획득' : '체험하기' }}</small></RouterLink>
        </li>
      </ul>
    </section>
    <p class="note">기념품은 이 기기의 브라우저에만 저장돼요. 현장 인증이나 쿠폰과는 별개예요.</p>
  </main>
</template>

<style scoped>
.shelf { max-width:680px; width:100%; margin:auto; padding:18px 18px 32px; color:#183641; background:#f5faf7; }
.back { display:inline-flex; align-items:center; min-height:44px; color:#15554f; font-weight:800; }
h1 { font-size:clamp(25px,7vw,42px); margin:8px 0; }
h2 { font-size:19px; margin:18px 0 8px; }
p { line-height:1.5; margin:8px 0; }
ul { list-style:none; margin:0; padding:0; }
li a { display:grid; grid-template-columns:25px 1fr auto; gap:9px; align-items:center; color:#173b46; background:#e4eeee; text-decoration:none; padding:9px; min-height:50px; margin-bottom:5px; border-radius:10px; }
li.earned a { background:#cdeee0; }
strong { display:block; }
small,.note { color:#35575e; font-size:.82rem; }
.windmill svg { display:block; margin:0 auto 8px; width:min(52%,178px); }
.missing { opacity:.21; filter:grayscale(1); }
.spinning { transform-origin:80px 68px; animation:spins 6s linear infinite; }
@keyframes spins { to { transform:rotate(360deg); } }
@media (prefers-reduced-motion:reduce) { .spinning { animation:none; } }
</style>
