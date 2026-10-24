<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { game, abilityPower, isBuddyAwoken } from '../store/gameStore.js'
import { BUDDIES, LOCATIONS } from '../data/gameData.js'
import BuddySvg from '../components/BuddySvg.vue'

const router = useRouter()
const route = useRoute()
const buddyId = route.params.id
const buddy = BUDDIES[buddyId]
const save = game.buddies[buddyId]

if (!buddy || !save?.owned) router.replace('/collection')

const locationId = Object.values(LOCATIONS).find(l => l.buddyId === buddyId)?.id
const awoken = computed(() => isBuddyAwoken(buddyId))
const power = computed(() => abilityPower(buddyId))
// 다음 레벨/각성 강화 조건 안내
const nextBoost = computed(() => {
  if (save.level < 3) return `Lv.3 달성 시 능력 강화 (현재 Lv.${save.level})`
  if (!awoken.value) return '현장 QR 각성 시 능력 강화'
  return '최대 강화 상태예요!'
})

function replay() {
  if (locationId) router.push(`/minigame/${locationId}?replay=1`)
}
</script>

<template>
  <div class="screen buddy-screen" v-if="buddy && save">
    <!-- 헤더 -->
    <div class="buddy-header">
      <button class="back-btn" @click="$router.push('/collection')">
        <span class="msr" style="font-size:26px; color:var(--navy)">arrow_back</span>
      </button>
      <span class="header-title">동료 정보</span>
      <div style="width:26px"></div>
    </div>

    <!-- 버디 뷰 -->
    <div class="buddy-showcase">
      <div class="showcase-bg"></div>
      <BuddySvg :variant="buddy.variant" mood="happy" :size="160" />
      <div class="buddy-name-area">
        <h2 class="buddy-name">{{ buddy.name }}</h2>
        <p class="buddy-sub">{{ buddy.subtitle }}</p>
      </div>
    </div>

    <!-- 레벨/XP -->
    <div class="level-card">
      <div class="level-badge-large">
        <span>Lv.</span>
        <span class="level-num">{{ save.level }}</span>
      </div>
      <div class="xp-section">
        <div class="xp-header">
          <span class="xp-label">경험치</span>
          <span class="xp-val">{{ save.xp }} / 100</span>
        </div>
        <div class="xp-track">
          <div class="xp-fill" :style="{ width: save.xp + '%' }"></div>
        </div>
        <p class="xp-note">함께 더 많은 장소를 탐험하면 경험치가 쌓여요.</p>
      </div>
    </div>

    <!-- 성격 & 소개 -->
    <div class="info-card">
      <p class="info-label">성격</p>
      <p class="info-value">{{ buddy.personality }}</p>
      <p class="info-label" style="margin-top:10px">소개</p>
      <p class="info-value">{{ buddy.description }}</p>
    </div>

    <!-- 고유 능력 -->
    <div class="ability-card">
      <div class="ability-header">
        <span class="msr" style="font-size:20px; color:var(--orange)">auto_fix_high</span>
        <div>
          <p class="ability-name">{{ buddy.ability.name }}</p>
          <p class="ability-sub">고유 능력</p>
        </div>
        <div class="ability-ready">강도 {{ power }}</div>
      </div>
      <p class="ability-desc">{{ buddy.ability.description }}</p>
      <!-- 능력 강도 게이지 -->
      <div class="power-gauge">
        <div v-for="n in 3" :key="n" class="power-pip" :class="{ on: n <= power }"></div>
      </div>
      <div class="ability-use-note">
        <span class="msr" style="font-size:14px; color:var(--teal)">trending_up</span>
        <span>{{ nextBoost }}</span>
      </div>
    </div>

    <!-- 연결 장소 -->
    <div class="location-card" v-if="locationId">
      <span class="msr" style="font-size:18px; color:var(--teal)">location_on</span>
      <div>
        <p class="loc-name">{{ LOCATIONS[locationId].name }}</p>
        <p class="loc-note">{{ LOCATIONS[locationId].realNote }}</p>
      </div>
    </div>

    <!-- 액션 버튼 -->
    <div class="detail-actions">
      <button class="chat-cta" @click="$router.push(`/chat/${buddyId}`)">
        <span class="msr" style="font-size:20px; color:var(--navy)">chat</span>
        대화하기
      </button>
      <button class="replay-cta" @click="replay">
        <span class="msr" style="font-size:20px; color:var(--teal-dark)">replay</span>
        재도전 · 유대 성장
      </button>
    </div>

    <div style="height: 20px"></div>
  </div>
</template>

<style scoped>
.buddy-screen {
  background: var(--paper);
  overflow-y: auto;
  display: flex; flex-direction: column; gap: 12px; padding-bottom: 24px;
}

.buddy-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 52px 16px 12px; background: var(--white);
}
.back-btn { background: none; border: none; cursor: pointer; }
.header-title { font-size: 18px; font-weight: 900; color: var(--ink); }

.buddy-showcase {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 24px 16px 20px; position: relative;
  background: linear-gradient(180deg, #DFF7F4 0%, var(--paper) 100%);
}
.showcase-bg {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 40%, #7CE1D922, transparent 60%);
}
.buddy-name-area { text-align: center; z-index: 1; }
.buddy-name { font-size: 28px; font-weight: 900; color: var(--ink); }
.buddy-sub { font-size: 14px; font-weight: 700; color: var(--muted); }

.level-card {
  margin: 0 16px; background: var(--navy);
  border-radius: 22px; padding: 16px;
  display: flex; align-items: center; gap: 16px;
}
.level-badge-large {
  width: 70px; height: 70px; border-radius: 50%;
  background: linear-gradient(135deg, var(--teal), var(--teal-dark));
  border: 3px solid var(--orange);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  flex-shrink: 0; color: var(--white);
  font-size: 11px; font-weight: 800;
}
.level-num { font-size: 26px; font-weight: 900; line-height: 1; color: var(--orange); }
.xp-section { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.xp-header { display: flex; justify-content: space-between; }
.xp-label { font-size: 11px; font-weight: 800; color: #9FC1C8; }
.xp-val { font-size: 11px; font-weight: 800; color: var(--white); }
.xp-track { height: 8px; background: #FFFFFF22; border-radius: 4px; overflow: hidden; }
.xp-fill { height: 100%; background: var(--orange); border-radius: 4px; transition: width 0.6s ease; }
.xp-note { font-size: 10px; font-weight: 600; color: #9FC1C8; }

.info-card {
  margin: 0 16px; background: var(--white);
  border-radius: 22px; padding: 16px;
  display: flex; flex-direction: column; gap: 4px;
}
.info-label { font-size: 11px; font-weight: 800; color: var(--teal); }
.info-value { font-size: 14px; font-weight: 700; color: var(--ink); line-height: 1.5; word-break: keep-all; }

.ability-card {
  margin: 0 16px; background: var(--white);
  border: 2px solid var(--orange-soft);
  border-radius: 22px; padding: 16px;
  display: flex; flex-direction: column; gap: 10px;
}
.ability-header { display: flex; align-items: center; gap: 10px; }
.ability-name { font-size: 16px; font-weight: 900; color: var(--ink); }
.ability-sub { font-size: 11px; font-weight: 700; color: var(--muted); }
.ability-ready {
  margin-left: auto; background: var(--teal); color: var(--white);
  border-radius: 10px; padding: 4px 10px; font-size: 11px; font-weight: 900;
}
.ability-desc { font-size: 13px; font-weight: 700; color: var(--ink); }
.power-gauge { display: flex; gap: 6px; }
.power-pip { flex: 1; height: 8px; border-radius: 4px; background: #E8EDED; transition: background 0.3s; }
.power-pip.on { background: var(--orange); }
.ability-use-note {
  display: flex; align-items: flex-start; gap: 6px;
  background: var(--sky); border-radius: 12px; padding: 8px 10px;
  font-size: 11px; font-weight: 700; color: var(--ink); line-height: 1.4; word-break: keep-all;
}

.detail-actions { margin: 4px 16px 0; display: flex; gap: 8px; }
.chat-cta {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  height: 52px; background: var(--orange); border: none; border-radius: 16px;
  font-family: var(--font); font-size: 14px; font-weight: 800; color: var(--navy);
  cursor: pointer; box-shadow: 0 5px 12px #9C5B1E3D;
}
.replay-cta {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  height: 52px; background: var(--white); border: 1.5px solid var(--teal); border-radius: 16px;
  font-family: var(--font); font-size: 14px; font-weight: 800; color: var(--teal-dark); cursor: pointer;
}

.location-card {
  margin: 0 16px; background: #EEF6F5;
  border-radius: 18px; padding: 14px;
  display: flex; align-items: flex-start; gap: 10px;
}
.loc-name { font-size: 15px; font-weight: 900; color: var(--ink); }
.loc-note { font-size: 11px; font-weight: 600; color: var(--muted); margin-top: 3px; word-break: keep-all; line-height: 1.4; }
</style>
