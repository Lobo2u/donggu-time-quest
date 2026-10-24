<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { game } from '../store/gameStore.js'
import { BUDDIES, LOCATIONS } from '../data/gameData.js'
import BuddySvg from '../components/BuddySvg.vue'

const router = useRouter()
const route  = useRoute()
const buddyId = route.params.buddyId
const buddy   = BUDDIES[buddyId]
const save    = game.buddies[buddyId]
const loc     = Object.values(LOCATIONS).find(l => l.buddyId === buddyId)

if (!buddy || !save) router.replace('/map')

// 각성 연출 단계
const phase = ref('charge')  // charge | burst | reveal | done
const particles = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  angle: (i / 16) * 360,
  dist: 60 + Math.random() * 40,
  size: 4 + Math.random() * 6,
}))

onMounted(() => {
  setTimeout(() => { phase.value = 'burst' }, 1200)
  setTimeout(() => { phase.value = 'reveal' }, 2000)
  setTimeout(() => { phase.value = 'done' }, 3200)
})
</script>

<template>
  <div class="screen awaken-screen" v-if="buddy">
    <!-- 배경 -->
    <div class="awaken-bg" :class="phase"></div>

    <!-- 파티클 -->
    <div class="particles" v-if="phase === 'burst' || phase === 'reveal' || phase === 'done'">
      <div
        v-for="p in particles" :key="p.id"
        class="particle"
        :style="{
          '--angle': p.angle + 'deg',
          '--dist': p.dist + 'px',
          width: p.size + 'px',
          height: p.size + 'px',
        }"
      ></div>
    </div>

    <!-- 충전 단계 -->
    <div class="phase-charge" v-if="phase === 'charge'">
      <p class="charge-label">각성 에너지 충전 중…</p>
      <div class="charge-ring">
        <div class="charge-fill"></div>
      </div>
      <BuddySvg :variant="buddy.variant" mood="idle" :size="120" />
    </div>

    <!-- 폭발 + 공개 단계 -->
    <div class="phase-reveal" v-else>
      <!-- 왕관 -->
      <div class="crown" :class="{ visible: phase === 'reveal' || phase === 'done' }">
        <span class="msr" style="font-size:48px; color:#FFD700">stars</span>
      </div>

      <!-- 버디 (awoken) -->
      <div class="buddy-wrap" :class="phase">
        <div class="buddy-halo"></div>
        <BuddySvg :variant="buddy.variant" mood="excited" :size="160" :awoken="true" />
      </div>

      <!-- 텍스트 -->
      <Transition name="pop">
        <div class="reveal-texts" v-if="phase === 'reveal' || phase === 'done'">
          <p class="awaken-kicker">각성 완료!</p>
          <h2 class="awaken-name">{{ buddy.name }}</h2>
          <p class="awaken-sub">{{ buddy.awokenSubtitle }}</p>
        </div>
      </Transition>

      <!-- 능력 강화 표시 -->
      <Transition name="pop">
        <div class="ability-up" v-if="phase === 'done'">
          <span class="msr" style="font-size:20px; color:var(--orange)">auto_fix_high</span>
          <div>
            <p class="ability-up-title">{{ buddy.ability.name }} 강화!</p>
            <p class="ability-up-desc">{{ buddy.ability.awokenDescription }}</p>
          </div>
        </div>
      </Transition>

      <!-- 버튼 -->
      <Transition name="pop">
        <div class="awaken-actions" v-if="phase === 'done'">
          <button class="btn-share" @click="router.push(`/share/${buddyId}`)">
            <span class="msr" style="font-size:20px">share</span>
            방문 카드 만들기
          </button>
          <button class="btn-coupon" v-if="locationId" @click="router.push(`/coupon/${locationId}`)">
            <span class="msr" style="font-size:20px">local_offer</span>
            파트너 쿠폰
          </button>
          <button class="btn-map" @click="router.push('/map')">
            <span class="msr" style="font-size:20px">map</span>
            지도로
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.awaken-screen {
  background: var(--navy);
  overflow: hidden; display: flex; align-items: center; justify-content: center;
}

.awaken-bg {
  position: absolute; inset: 0; transition: all 0.8s ease;
}
.awaken-bg.charge  { background: radial-gradient(ellipse at 50% 60%, #0E9F9A22, #08233F); }
.awaken-bg.burst   { background: radial-gradient(ellipse at 50% 50%, #7CE1D9AA 0%, #08233F 60%); }
.awaken-bg.reveal  { background: radial-gradient(ellipse at 50% 45%, #FF9F1C33 0%, #0E9F9A22 40%, #08233F 70%); }
.awaken-bg.done    { background: radial-gradient(ellipse at 50% 45%, #FF9F1C22 0%, #0E9F9A11 50%, #08233F 80%); }

.particles {
  position: absolute; top: 50%; left: 50%; pointer-events: none;
}
.particle {
  position: absolute;
  background: var(--orange);
  border-radius: 50%;
  transform: rotate(var(--angle)) translateX(var(--dist));
  animation: particle-fly 1s ease-out forwards;
}
@keyframes particle-fly {
  from { opacity: 1; transform: rotate(var(--angle)) translateX(0); }
  to   { opacity: 0; transform: rotate(var(--angle)) translateX(calc(var(--dist) * 2.5)); }
}

/* 충전 단계 */
.phase-charge {
  display: flex; flex-direction: column; align-items: center; gap: 24px;
  z-index: 1;
}
.charge-label { font-size: 16px; font-weight: 800; color: var(--teal); }
.charge-ring {
  width: 80px; height: 80px; border-radius: 50%;
  border: 4px solid #FFFFFF22; position: relative; overflow: hidden;
}
.charge-fill {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: var(--teal); animation: fill-up 1.1s ease forwards;
}
@keyframes fill-up { from { height: 0; } to { height: 100%; } }

/* 공개 단계 */
.phase-reveal {
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; padding: 80px 24px 32px; z-index: 1; width: 100%;
}

.crown {
  opacity: 0; transform: translateY(-20px) scale(0.5);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.crown.visible {
  opacity: 1; transform: translateY(0) scale(1);
}

.buddy-wrap {
  position: relative; transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.buddy-wrap.burst { transform: scale(0.6); opacity: 0.4; }
.buddy-wrap.reveal, .buddy-wrap.done { transform: scale(1); opacity: 1; }

.buddy-halo {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 200px; height: 200px; border-radius: 50%;
  background: radial-gradient(circle, #FF9F1C33 0%, transparent 70%);
  animation: halo-pulse 2s ease-in-out infinite alternate;
}
@keyframes halo-pulse {
  from { transform: translate(-50%, -50%) scale(0.9); }
  to   { transform: translate(-50%, -50%) scale(1.1); }
}

.reveal-texts { text-align: center; display: flex; flex-direction: column; gap: 6px; }
.awaken-kicker { font-size: 13px; font-weight: 900; color: var(--orange); letter-spacing: 1.4px; }
.awaken-name { font-size: 32px; font-weight: 900; color: var(--white); }
.awaken-sub  { font-size: 14px; font-weight: 700; color: #9FC1C8; }

.ability-up {
  display: flex; align-items: center; gap: 10px;
  background: #FFFFFF12; border: 1px solid var(--orange);
  border-radius: 18px; padding: 14px 16px; width: 100%;
}
.ability-up-title { font-size: 14px; font-weight: 900; color: var(--orange); }
.ability-up-desc  { font-size: 12px; font-weight: 700; color: #9FC1C8; word-break: keep-all; margin-top: 2px; }

.awaken-actions { display: flex; gap: 10px; width: 100%; }
.btn-share {
  flex: 2; display: flex; align-items: center; justify-content: center; gap: 8px;
  background: var(--orange); border: none; border-radius: 18px; height: 56px;
  font-family: var(--font); font-size: 16px; font-weight: 800; color: var(--navy); cursor: pointer;
}
.btn-coupon {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  background: #FFFFFF18; border: 1px solid var(--teal); border-radius: 18px; height: 56px;
  font-family: var(--font); font-size: 14px; font-weight: 800; color: var(--teal); cursor: pointer;
}
.btn-map {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  background: #FFFFFF18; border: 1px solid #FFFFFF33; border-radius: 18px; height: 56px;
  font-family: var(--font); font-size: 14px; font-weight: 800; color: var(--white); cursor: pointer;
}

.pop-enter-active { transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-enter-from   { opacity: 0; transform: scale(0.7) translateY(20px); }
</style>
