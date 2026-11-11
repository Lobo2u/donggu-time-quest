<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BottomNavigation from '../components/BottomNavigation.vue'
import { game, resetGame, resetProgress, courseProgress } from '../store/gameStore.js'
import { LOCATIONS, BUDDIES, COURSES } from '../data/gameData.js'
import TabBackButton from '../components/TabBackButton.vue'
import MascotSvg from '../components/MascotSvg.vue'
import { MASCOTS } from '../data/emotes.js'

const router = useRouter()

// 내 정보: 동반자 · 닉네임 · 레벨 (아래에 내 기록이 이어짐)
const guide = computed(() => game.guide ?? 'majung')
const guideRole = computed(() => guide.value === 'jungang' ? '단서 해독' : '길 안내')

const completedLocs = computed(() =>
  Object.values(LOCATIONS).filter(l => game.locations[l.id]?.status === 'complete')
)
const ownedBuddyList = computed(() =>
  Object.values(BUDDIES).filter(b => game.buddies[b.id]?.owned)
)
const completedCourses = computed(() =>
  Object.values(COURSES).filter(c => courseProgress(c.id).complete)
)
const badges = computed(() => game.badges ?? [])

// 초기화 버튼 두 개 — 지울 게 있을 때만 활성화 (없으면 회색)
// 시연 초기화: 탐험 진행(장소·조각·경험치·동료·쿠폰 등)만 지움, 동반자·시작 안내는 유지
const hasPlayProgress = computed(() =>
  game.player.xp > 0 || game.player.shards > 0 || game.player.level > 1
  || Object.values(game.locations).some(l => l.arrivedOnce || l.missionComplete || l.status === 'complete')
  || Object.values(game.buddies).some(b => b.owned)
  || Object.values(game.checkIns ?? {}).some(Boolean)
  || Object.keys(game.coupons ?? {}).length > 0
  || (game.badges?.length ?? 0) > 0
  || (game.seenStories ?? []).some(id => id !== 'intro')
)
// 처음부터 다시 시작: 동반자 선택까지 모두 지움
const hasAnything = computed(() => hasPlayProgress.value || !!game.guide || (game.seenStories?.length ?? 0) > 0)

function confirmDemoReset() {
  if (confirm('탐험 진행만 초기화할까요? 고른 동반자는 그대로 남아요.')) {
    resetProgress()
    router.replace('/map')
  }
}
function confirmFullReset() {
  if (confirm('모든 진행 상황을 처음부터 다시 시작할까요? 동반자 선택도 지워져요.')) {
    resetGame()
    router.replace('/map')
  }
}
</script>

<template>
  <div class="screen record-screen">
    <div class="rec-scroll">
      <!-- 헤더 -->
      <div class="rec-head">
        <TabBackButton />
        <p class="record-eyebrow">MY PAGE</p>
        <h1 class="record-title">내 정보</h1>
      </div>

      <!-- 프로필 -->
      <div class="profile-card">
        <div class="profile-guide">
          <MascotSvg :character="guide" mood="idle" :size="64" :animated="false" />
        </div>
        <div class="profile-texts">
          <!-- 이름: 로그인 등 실제 이름 연동 전까지 자리표시 -->
          <p class="profile-name">OOO</p>
          <p class="profile-meta">Lv.{{ game.player.level }} · 동반자 {{ MASCOTS[guide].name }} ({{ guideRole }})</p>
          <button class="profile-link" @click="router.push('/grade')">
            등급 혜택 보기
            <span class="msr" style="font-size:16px">chevron_right</span>
          </button>
        </div>
      </div>

      <!-- 내 기록 -->
      <p class="record-section-head">내 기록</p>

      <!-- 통계 -->
      <div class="stats-row">
        <div class="stat-item">
          <span class="msr stat-icon">explore</span>
          <span class="stat-value">{{ completedLocs.length }}</span>
          <span class="stat-label">탐험 완료</span>
        </div>
        <div class="stat-item">
          <span class="msr stat-icon">diamond</span>
          <span class="stat-value">{{ game.player.shards }}</span>
          <span class="stat-label">단서 조각</span>
        </div>
        <div class="stat-item">
          <span class="msr stat-icon">auto_stories</span>
          <span class="stat-value">{{ ownedBuddyList.length }}</span>
          <span class="stat-label">동료</span>
        </div>
        <div class="stat-item">
          <span class="msr stat-icon">military_tech</span>
          <span class="stat-value">{{ game.player.level }}</span>
          <span class="stat-label">레벨</span>
        </div>
      </div>

      <!-- XP 게이지 -->
      <div class="xp-bar-wrap">
        <div class="xp-bar-header">
          <span>Lv.{{ game.player.level }}</span>
          <span>{{ game.player.xp }} / 100 XP</span>
        </div>
        <div class="xp-track">
          <div class="xp-fill" :style="{ width: game.player.xp + '%' }"></div>
        </div>
      </div>

      <!-- 완주 코스 / 뱃지 -->
      <template v-if="completedCourses.length || badges.length">
        <p class="section-title">완주 · 뱃지</p>
        <div class="badge-row">
          <div v-for="c in completedCourses" :key="c.id" class="badge-chip course"
            @click="router.push(`/certificate/${c.id}`)">
            <span class="msr" style="font-size:16px; color:var(--orange)">workspace_premium</span>
            <span>{{ c.name }}</span>
          </div>
          <div v-for="b in badges" :key="b" class="badge-chip">
            <span class="msr" style="font-size:16px; color:var(--teal)">military_tech</span>
            <span>{{ b }}</span>
          </div>
        </div>
      </template>

      <!-- 탐험 기록 -->
      <template v-if="completedLocs.length">
        <p class="section-title">탐험 완료 장소</p>
        <div class="record-list">
          <div v-for="loc in completedLocs" :key="loc.id" class="record-item"
            @click="router.push(`/location/${loc.id}`)">
            <div class="rec-icon">
              <span class="msr" style="font-size:24px; color:var(--teal)">location_on</span>
            </div>
            <div class="rec-texts">
              <span class="rec-title">{{ loc.name }}</span>
              <span class="rec-sub">{{ loc.subtitle }}</span>
            </div>
            <div class="rec-status">
              <span class="msr" style="font-size:20px; color:var(--teal)">check_circle</span>
              <span>완료</span>
            </div>
            <span class="msr chevron" style="font-size:20px; color:var(--muted)">chevron_right</span>
          </div>
        </div>
      </template>

      <!-- 동료 기록 -->
      <template v-if="ownedBuddyList.length">
        <p class="section-title">만난 동료</p>
        <div class="buddy-row">
          <div v-for="b in ownedBuddyList" :key="b.id" class="buddy-chip"
            @click="router.push(`/buddy/${b.id}`)">
            <span class="msr" style="font-size:18px; color:var(--teal)">face</span>
            <div>
              <p class="chip-name">{{ b.name }}</p>
              <p class="chip-lv">Lv.{{ game.buddies[b.id]?.level }}</p>
            </div>
          </div>
        </div>
      </template>

      <!-- 아무것도 없을 때 -->
      <div class="empty-state" v-if="!completedLocs.length">
        <span class="msr" style="font-size:48px; color:#CBD4D4">explore</span>
        <p>아직 탐험한 장소가 없어요.</p>
        <button class="btn-primary" style="margin-top:12px" @click="router.push('/map')">
          지도로 이동
        </button>
      </div>

      <!-- 초기화: 지울 게 없으면 회색 비활성 -->
      <div class="reset-row">
        <button class="reset-btn" :disabled="!hasPlayProgress" @click="confirmDemoReset">
          <span class="msr" style="font-size:18px">refresh</span>
          시연 초기화
        </button>
        <button class="reset-btn full" :disabled="!hasAnything" @click="confirmFullReset">
          <span class="msr" style="font-size:18px">restart_alt</span>
          처음부터 다시 시작
        </button>
      </div>
    </div>

    <div class="nav-wrap"><BottomNavigation /></div>
  </div>
</template>

<style scoped>
.record-screen { background: var(--white); overflow: hidden; position: relative; }

/* 스크롤 영역: 하단 네비 공간 확보 */
.rec-scroll {
  position: absolute; inset: 0;
  overflow-y: auto;
  padding: 54px 16px 100px;
  display: flex; flex-direction: column; gap: 14px;
}

.rec-head { display: flex; flex-direction: column; gap: 2px; }
.record-eyebrow { font-size: 11px; font-weight: 900; color: var(--teal); letter-spacing: 1.4px; }
.record-title { font-size: 26px; font-weight: 900; color: var(--ink); }
.record-sub { font-size: 13px; font-weight: 600; color: var(--muted); word-break: keep-all; }

.profile-card {
  display: flex; align-items: center; gap: 14px;
  background: var(--navy); border-radius: 20px; padding: 14px 16px; box-shadow: var(--shadow);
}
.profile-guide {
  width: 72px; height: 72px; border-radius: 50%; background: #FFFFFF14; flex-shrink: 0;
  display: flex; align-items: flex-end; justify-content: center; overflow: hidden;
}
.profile-texts { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.profile-name { font-size: 18px; font-weight: 900; color: white; }
.profile-meta { font-size: 12px; font-weight: 700; color: #BFD3E6; }
.profile-link {
  align-self: flex-start; display: flex; align-items: center; gap: 2px; margin-top: 4px;
  background: none; border: none; padding: 0; cursor: pointer;
  font-family: var(--font); font-size: 12px; font-weight: 900; color: var(--orange);
}
.record-section-head { font-size: 17px; font-weight: 900; color: var(--ink); margin-top: 4px; }

.stats-row {
  background: var(--sky); border-radius: 20px;
  display: flex; justify-content: space-around; align-items: center; padding: 14px 8px;
}
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.stat-icon { font-size: 22px; color: var(--teal); }
.stat-value { font-size: 24px; font-weight: 900; color: var(--ink); line-height: 1; }
.stat-label { font-size: 10px; font-weight: 700; color: var(--muted); }

.xp-bar-wrap { display: flex; flex-direction: column; gap: 5px; }
.xp-bar-header { display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; color: var(--muted); }
.xp-track { height: 8px; background: #DCEAE9; border-radius: 4px; overflow: hidden; }
.xp-fill { height: 100%; background: var(--teal); border-radius: 4px; transition: width 0.6s; }

.section-title { font-size: 13px; font-weight: 900; color: var(--muted); margin-top: 2px; }

.badge-row { display: flex; gap: 8px; flex-wrap: wrap; }
.badge-chip {
  display: flex; align-items: center; gap: 6px;
  background: var(--sky); border-radius: 12px; padding: 8px 12px;
  font-size: 12px; font-weight: 800; color: var(--ink); word-break: keep-all;
}
.badge-chip.course { background: var(--orange-soft); cursor: pointer; }

.record-list { display: flex; flex-direction: column; gap: 8px; }
.record-item {
  display: flex; align-items: center; gap: 10px;
  background: var(--white); border: 1px solid #E2EEEC;
  border-radius: 16px; padding: 12px 14px; cursor: pointer;
}
.rec-icon { width: 44px; height: 44px; background: var(--sky); border-radius: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.rec-texts { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.rec-title { font-size: 15px; font-weight: 900; color: var(--ink); }
.rec-sub { font-size: 11px; font-weight: 600; color: var(--muted); word-break: keep-all; }
.rec-status { display: flex; flex-direction: column; align-items: center; font-size: 10px; font-weight: 800; color: var(--teal); gap: 1px; flex-shrink: 0; }
.chevron { flex-shrink: 0; }

.buddy-row { display: flex; gap: 8px; flex-wrap: wrap; }
.buddy-chip { display: flex; align-items: center; gap: 8px; background: var(--sky); border-radius: 14px; padding: 10px 12px; cursor: pointer; }
.chip-name { font-size: 13px; font-weight: 900; color: var(--ink); }
.chip-lv { font-size: 10px; font-weight: 700; color: var(--muted); }

.empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 32px; text-align: center; font-size: 14px; font-weight: 700; color: var(--muted);
}

.reset-row { display: flex; gap: 8px; margin-top: 8px; }
.reset-btn {
  flex: 1; height: 48px; min-width: 0;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  background: var(--white); border: 2px solid #D64B5F; border-radius: 14px;
  font-family: var(--font); font-size: 14px; font-weight: 900;
  color: #D64B5F; cursor: pointer;
}
.reset-btn.full { background: #D64B5F; color: white; }
.reset-btn:disabled, .reset-btn.full:disabled {
  background: #F0F0F0; border-color: #E0E0E0; color: #B5B5B5; cursor: not-allowed;
}

.nav-wrap { position: absolute; left: 16px; bottom: 10px; z-index: 20; }
</style>
