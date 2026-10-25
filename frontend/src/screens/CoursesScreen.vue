<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BottomNavigation from '../components/BottomNavigation.vue'
import { game, courseProgress, canClaimCourse, claimCourseReward, playerScore, leaderboard } from '../store/gameStore.js'
import { COURSES, LOCATIONS } from '../data/gameData.js'

const router = useRouter()
const courseList = Object.values(COURSES)

const rewardPopup = ref(null)

function progress(id) { return courseProgress(id) }
function statusKey(id) {
  const p = progress(id)
  if (p.complete) return 'done'
  if (p.done > 0) return 'progress'
  return 'start'
}
function statusLabel(id) {
  return { done: '완주', progress: '진행 중', start: '시작 전' }[statusKey(id)]
}
function claim(id) {
  const r = claimCourseReward(id)
  if (r) rewardPopup.value = r
}

const myRank = computed(() => leaderboard().find(e => e.isMe)?.rank ?? '-')
const myScore = computed(() => playerScore())
</script>

<template>
  <div class="screen courses-screen">
    <!-- 헤더 -->
    <div class="co-header">
      <p class="co-eyebrow">MISSION TOUR</p>
      <h1 class="co-title">미션투어 코스</h1>
      <p class="co-sub">동구를 테마별로 걷고, 스탬프를 모아 완주 인증을 받아요.</p>
    </div>

    <!-- 내 랭킹 요약 -->
    <button class="rank-summary" @click="router.push('/ranking')">
      <div class="rank-left">
        <span class="msr" style="font-size:22px; color:var(--orange)">leaderboard</span>
        <div>
          <p class="rank-label">내 순위</p>
          <p class="rank-value">{{ myRank }}위 · {{ myScore }}점</p>
        </div>
      </div>
      <span class="rank-go">랭킹 보기 <span class="msr" style="font-size:16px">chevron_right</span></span>
    </button>

    <!-- 코스 목록 -->
    <div class="course-list">
      <div v-for="c in courseList" :key="c.id" class="course-card">
        <!-- 상단 -->
        <div class="cc-top">
          <div class="cc-icon" :style="{ background: c.color + '22' }">
            <span class="msr" :style="{ fontSize: '26px', color: c.color }">{{ c.icon }}</span>
          </div>
          <div class="cc-head">
            <span class="cc-theme" :style="{ color: c.color }">{{ c.theme }}</span>
            <h3 class="cc-name">{{ c.name }}</h3>
          </div>
          <span class="cc-status" :class="statusKey(c.id)">{{ statusLabel(c.id) }}</span>
        </div>

        <p class="cc-desc">{{ c.desc }}</p>
        <div class="cc-meta">
          <span><span class="msr" style="font-size:14px">place</span> {{ c.stops.length }}곳</span>
          <span><span class="msr" style="font-size:14px">schedule</span> 약 {{ c.estimatedMin }}분</span>
          <span><span class="msr" style="font-size:14px">military_tech</span> {{ c.reward.badge }}</span>
        </div>

        <!-- 스탬프 북 -->
        <div class="stampbook">
          <div v-for="s in progress(c.id).stamps" :key="s.id" class="stamp" :class="{ earned: s.done }">
            <span v-if="s.done" class="msr" style="font-size:22px; color:var(--teal)">verified</span>
            <span v-else class="msr" style="font-size:20px; color:#C3D6D4">{{ LOCATIONS[s.id]?.buddyId ? 'radio_button_unchecked' : 'place' }}</span>
            <span class="stamp-name">{{ LOCATIONS[s.id]?.name }}</span>
          </div>
        </div>

        <!-- 진행 바 -->
        <div class="cc-progress">
          <div class="cc-track"><div class="cc-fill" :style="{ width: (progress(c.id).done / progress(c.id).total * 100) + '%', background: c.color }"></div></div>
          <span>{{ progress(c.id).done }} / {{ progress(c.id).total }} 스탬프</span>
        </div>

        <!-- 액션 -->
        <button v-if="canClaimCourse(c.id)" class="cc-btn claim" @click="claim(c.id)">
          <span class="msr" style="font-size:20px; color:var(--navy)">redeem</span>
          완주 보상 받기
        </button>
        <button v-else-if="progress(c.id).complete" class="cc-btn cert" @click="router.push(`/certificate/${c.id}`)">
          <span class="msr" style="font-size:20px; color:white">workspace_premium</span>
          완주 인증서 보기
        </button>
        <button v-else class="cc-btn go" @click="router.push('/map')">
          <span class="msr" style="font-size:20px; color:var(--navy)">near_me</span>
          {{ progress(c.id).done > 0 ? '이어서 탐험하기' : '코스 탐험 시작' }}
        </button>
      </div>
    </div>

    <div style="height: 90px"></div>

    <!-- 완주 보상 팝업 -->
    <Transition name="pop">
      <div v-if="rewardPopup" class="reward-pop" @click="rewardPopup = null">
        <div class="reward-card" @click.stop>
          <span class="msr" style="font-size:48px; color:var(--orange)">military_tech</span>
          <p class="rp-title">코스 완주!</p>
          <p class="rp-badge">{{ rewardPopup.badge }} 뱃지 획득</p>
          <p class="rp-reward">+{{ rewardPopup.shards }} 시간 조각</p>
          <button class="rp-btn" @click="rewardPopup = null">확인</button>
        </div>
      </div>
    </Transition>

    <div class="nav-wrap"><BottomNavigation /></div>
  </div>
</template>

<style scoped>
.courses-screen { background: var(--paper); overflow-y: auto; }

.co-header { padding: 54px 20px 12px; }
.co-eyebrow { font-size: 11px; font-weight: 900; color: var(--teal); letter-spacing: 1.4px; }
.co-title { font-size: 26px; font-weight: 900; color: var(--ink); margin: 2px 0 4px; }
.co-sub { font-size: 13px; font-weight: 700; color: var(--muted); word-break: keep-all; }

.rank-summary {
  margin: 0 16px 14px; width: calc(100% - 32px);
  display: flex; align-items: center; justify-content: space-between;
  background: var(--navy); border: none; border-radius: 16px; padding: 12px 16px; cursor: pointer;
  font-family: var(--font);
}
.rank-left { display: flex; align-items: center; gap: 10px; }
.rank-label { font-size: 11px; font-weight: 700; color: #9FC1C8; text-align: left; }
.rank-value { font-size: 16px; font-weight: 900; color: white; text-align: left; }
.rank-go { display: flex; align-items: center; font-size: 12px; font-weight: 800; color: var(--orange); }

.course-list { padding: 0 16px; display: flex; flex-direction: column; gap: 14px; }
.course-card { background: var(--white); border-radius: 22px; padding: 16px; box-shadow: 0 4px 16px #08233F0F; display: flex; flex-direction: column; gap: 12px; }
.cc-top { display: flex; align-items: center; gap: 12px; }
.cc-icon { width: 46px; height: 46px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cc-head { flex: 1; }
.cc-theme { font-size: 11px; font-weight: 900; }
.cc-name { font-size: 18px; font-weight: 900; color: var(--ink); }
.cc-status { font-size: 11px; font-weight: 900; border-radius: 10px; padding: 4px 10px; }
.cc-status.done { background: var(--teal); color: white; }
.cc-status.progress { background: var(--orange-soft); color: #C66900; }
.cc-status.start { background: #EEF3F3; color: var(--muted); }
.cc-desc { font-size: 13px; font-weight: 700; color: var(--muted); line-height: 1.5; word-break: keep-all; }
.cc-meta { display: flex; gap: 12px; flex-wrap: wrap; font-size: 11px; font-weight: 800; color: var(--ink); }
.cc-meta span { display: flex; align-items: center; gap: 3px; }
.cc-meta .msr { color: var(--muted); }

.stampbook { display: flex; gap: 8px; flex-wrap: wrap; background: #F7FBFA; border-radius: 14px; padding: 12px; }
.stamp { flex: 1; min-width: 60px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stamp .stamp-name { font-size: 10px; font-weight: 800; color: var(--muted); }
.stamp.earned .stamp-name { color: var(--teal-dark); }

.cc-progress { display: flex; align-items: center; gap: 8px; }
.cc-track { flex: 1; height: 8px; background: #DCEAE9; border-radius: 4px; overflow: hidden; }
.cc-fill { height: 100%; border-radius: 4px; transition: width 0.4s; }
.cc-progress span { font-size: 11px; font-weight: 800; color: var(--muted); white-space: nowrap; }

.cc-btn { display: flex; align-items: center; justify-content: center; gap: 8px; height: 50px; border: none; border-radius: 15px; font-family: var(--font); font-size: 15px; font-weight: 800; cursor: pointer; }
.cc-btn.go { background: var(--orange); color: var(--navy); }
.cc-btn.claim { background: var(--orange); color: var(--navy); box-shadow: 0 4px 12px #FF9F1C55; }
.cc-btn.cert { background: var(--teal); color: white; }

.reward-pop { position: fixed; inset: 0; z-index: 200; background: #08233Fcc; display: flex; align-items: center; justify-content: center; padding: 24px; }
.reward-card { background: white; border-radius: 24px; padding: 28px; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; width: 280px; }
.rp-title { font-size: 22px; font-weight: 900; color: var(--ink); }
.rp-badge { font-size: 15px; font-weight: 800; color: var(--orange); }
.rp-reward { font-size: 14px; font-weight: 800; color: var(--teal-dark); }
.rp-btn { margin-top: 14px; width: 100%; background: var(--orange); color: var(--navy); border: none; border-radius: 14px; padding: 12px; font-family: var(--font); font-size: 15px; font-weight: 800; cursor: pointer; }
.pop-enter-active { transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1); }
.pop-enter-from { transform: scale(0.7); opacity: 0; }

.nav-wrap { position: fixed; left: 50%; transform: translateX(-50%); bottom: 10px; width: 358px; z-index: 20; }
</style>
