<script setup>
import { computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { game } from '../store/gameStore.js'
import { BUDDIES, LOCATIONS } from '../data/gameData.js'
import BuddySvg from '../components/BuddySvg.vue'

const router = useRouter()
const reward = game.lastReward
const buddy = reward ? BUDDIES[reward.buddyId] : null
const locName = buddy ? Object.values(LOCATIONS).find(l => l.buddyId === reward?.buddyId)?.name : '알 수 없음'

const nextAvailable = computed(() =>
  Object.values(LOCATIONS).find(l => game.locations[l.id]?.status === 'available')
)

// 이 화면을 떠날 때 보상 데이터 초기화 (중복 표시 방지)
onBeforeUnmount(() => { game.lastReward = null })
</script>

<template>
  <div class="screen complete-screen">
    <!-- 배경 장식 -->
    <div v-for="i in 6" :key="i" class="spark" :class="`spark-${i}`"></div>

    <p class="kicker">MEMORY RESTORED</p>
    <h1 class="main-title">기억 한 장면이<br>돌아왔어요!</h1>

    <!-- 시간 조각 육각형 -->
    <div class="shard-wrap">
      <div class="shard-hex"></div>
    </div>

    <!-- 획득 친구 -->
    <div v-if="buddy" class="buddy-area">
      <BuddySvg mood="excited" :size="130" />
    </div>

    <!-- 보상 카드 -->
    <div class="reward-card" v-if="reward">
      <h3 class="reward-place">지도에 '{{ locName }}' 이름이 다시 나타났다</h3>
      <div class="reward-rows">
        <div class="reward-item">
          <span class="msr" style="font-size:22px; color:var(--orange)">auto_stories</span>
          <div class="reward-texts">
            <span class="reward-label">새로운 동료</span>
            <span class="reward-value">{{ buddy?.name ?? '???' }}</span>
          </div>
        </div>
        <div class="reward-item">
          <span class="msr" style="font-size:22px; color:var(--orange)">diamond</span>
          <div class="reward-texts">
            <span class="reward-label">시간 조각</span>
            <span class="reward-value">+{{ reward.shardsGained }}</span>
          </div>
        </div>
        <div class="reward-item">
          <span class="msr" style="font-size:22px; color:var(--orange)">bolt</span>
          <div class="reward-texts">
            <span class="reward-label">경험치</span>
            <span class="reward-value">+{{ reward.xpGained }} XP {{ reward.leveledUp ? '· 레벨 업!' : '' }}</span>
          </div>
        </div>
      </div>

      <!-- 레벨업 배너 -->
      <div v-if="reward.leveledUp" class="levelup-banner">
        <span class="msr" style="font-size:20px; color:var(--orange)">military_tech</span>
        Lv.{{ game.player.level }} 달성! 탐험가로 성장했어요
      </div>
    </div>

    <!-- 다음 목적지 -->
    <div v-if="nextAvailable" class="next-mission">
      <span class="msr" style="font-size:26px; color:var(--teal-dark)">route</span>
      <p>다음 탐험지: {{ nextAvailable.name }}이 열렸어요!</p>
    </div>

    <!-- 버튼 -->
    <button class="btn-primary cta-btn" @click="$router.push('/map')">
      <span class="msr" style="font-size:22px; color:var(--navy)">explore</span>
      지도로 돌아가기
    </button>
    <button class="btn-secondary cta-btn cta-btn-2" @click="$router.push('/collection')">
      <span class="msr" style="font-size:22px">auto_stories</span>
      도감에서 확인하기
    </button>

    <p class="replay-note">이 장소는 이미 완료됐어요. 재진입 시 보상이 다시 지급되지 않아요.</p>
  </div>
</template>

<style scoped>
.complete-screen {
  background: linear-gradient(180deg, #062B48 0%, #087D79 58%, #E7FFF9 100%);
  overflow: hidden;
}

.spark {
  position: absolute; border-radius: 2px; transform: rotate(45deg);
  animation: sparkle 2s ease-in-out infinite alternate;
}
.spark-1 { left: 28px;  top: 90px;  width: 10px; height: 10px; background: var(--orange); }
.spark-2 { left: 330px; top: 130px; width: 8px;  height: 8px;  background: white; animation-delay: 0.3s; }
.spark-3 { left: 70px;  top: 250px; width: 7px;  height: 7px;  background: #7CE1D9; animation-delay: 0.6s; }
.spark-4 { left: 296px; top: 280px; width: 12px; height: 12px; background: var(--orange); animation-delay: 0.9s; }
.spark-5 { left: 42px;  top: 414px; width: 8px;  height: 8px;  background: white; animation-delay: 0.2s; }
.spark-6 { left: 340px; top: 434px; width: 7px;  height: 7px;  background: #7CE1D9; animation-delay: 0.7s; }
@keyframes sparkle {
  from { opacity: 0.3; transform: rotate(45deg) scale(0.8); }
  to   { opacity: 1;   transform: rotate(45deg) scale(1.2); }
}

.kicker {
  position: absolute; left: 0; right: 0; top: 58px;
  text-align: center; font-size: 12px; font-weight: 900;
  color: var(--orange); letter-spacing: 1.4px;
}

.main-title {
  position: absolute; left: 32px; top: 82px;
  font-size: 28px; font-weight: 900; color: var(--white); line-height: 1.2;
}

.shard-wrap {
  position: absolute; left: 50%; top: 148px;
  transform: translateX(-50%);
  width: 130px; height: 130px;
  background: #FFFFFF18; border: 2px solid #FFFFFF55;
  border-radius: 65px; box-shadow: 0 0 34px #FF9F1C77;
  display: flex; align-items: center; justify-content: center;
}
.shard-hex {
  width: 66px; height: 82px;
  background: linear-gradient(155deg, #FFE19A 0%, #FF9F1C 60%, #E66D00 100%);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  animation: float-hex 2s ease-in-out infinite alternate;
}
@keyframes float-hex {
  from { transform: scale(0.95); }
  to   { transform: scale(1.05); }
}

.buddy-area {
  position: absolute; left: 50%; top: 288px;
  transform: translateX(-50%);
}

.reward-card {
  position: absolute; left: 24px; top: 474px; width: 342px;
  background: #FFFFFFF2; border-radius: 24px; padding: 18px;
  display: flex; flex-direction: column; gap: 12px;
}
.reward-place { font-size: 16px; font-weight: 900; color: var(--ink); word-break: keep-all; }
.reward-rows { display: flex; flex-direction: column; gap: 8px; }
.reward-item { display: flex; align-items: center; gap: 10px; }
.reward-texts { display: flex; flex-direction: column; gap: 1px; }
.reward-label { font-size: 10px; font-weight: 700; color: var(--muted); }
.reward-value { font-size: 15px; font-weight: 900; color: var(--ink); }

.levelup-banner {
  display: flex; align-items: center; gap: 8px;
  background: var(--orange-soft); border-radius: 12px; padding: 10px 12px;
  font-size: 13px; font-weight: 800; color: var(--ink);
}

.next-mission {
  position: absolute; left: 24px; top: 660px; width: 342px;
  background: #DDF4F1; border-radius: 18px;
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  font-size: 13px; font-weight: 800; color: var(--ink); word-break: keep-all;
}

.cta-btn { position: absolute; left: 24px; top: 724px; }
.cta-btn-2 { position: absolute; left: 24px; top: 788px; background: white; color: var(--teal-dark); }

.replay-note {
  position: absolute; left: 24px; right: 24px; bottom: 8px;
  font-size: 10px; font-weight: 600; color: var(--teal-dark); text-align: center;
}
</style>
