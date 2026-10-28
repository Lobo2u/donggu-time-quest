<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { game } from '../store/gameStore.js'
import { BUDDIES, LOCATIONS } from '../data/gameData.js'
import BuddySvg from '../components/BuddySvg.vue'

const router  = useRouter()
const route   = useRoute()
const buddyId = route.params.buddyId
const buddy   = BUDDIES[buddyId]
const loc     = Object.values(LOCATIONS).find(l => l.buddyId === buddyId)

if (!buddy) router.replace('/map')

const today = new Date()
const dateStr = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`

const shared = ref(false)

async function shareCard() {
  const text = `대전 동구 TIME QUEST\n나는 오늘 ${loc?.name}에서 ${buddy.name}을(를) 강화했어요! 🌟\n동구의 기억을 함께 되살리는 탐험을 시작해보세요.`
  if (navigator.share) {
    try {
      await navigator.share({ title: '동구 TIME QUEST - 강화 완료!', text })
      shared.value = true
    } catch {}
  } else {
    await navigator.clipboard.writeText(text)
    shared.value = true
  }
}
</script>

<template>
  <div class="screen share-screen" v-if="buddy">
    <!-- 안내 -->
    <div class="share-guide">
      <span class="msr" style="font-size:18px; color:var(--orange)">photo_camera</span>
      <span>이 화면을 캡처해서 공유해요!</span>
    </div>

    <!-- 공유 카드 (스크린샷 영역) -->
    <div class="share-card">
      <!-- 배경 패턴 -->
      <div class="card-bg"></div>

      <!-- 브랜딩 -->
      <div class="card-brand">
        <span class="brand-dot"></span>
        <span class="brand-text">대전 동구 TIME QUEST</span>
        <span class="brand-dot"></span>
      </div>

      <!-- 강화 배지 -->
      <div class="awaken-badge-large">
        <span class="msr" style="font-size:16px; color:var(--navy)">stars</span>
        현장 강화 완료
      </div>

      <!-- 버디 SVG -->
      <div class="card-buddy">
        <div class="card-glow"></div>
        <BuddySvg :variant="buddy.variant" mood="excited" :size="180" :awoken="true" />
      </div>

      <!-- 버디 이름 -->
      <div class="card-buddy-info">
        <h2 class="card-buddy-name">{{ buddy.name }}</h2>
        <p class="card-buddy-sub">{{ buddy.awokenSubtitle }}</p>
      </div>

      <!-- 장소 인증 -->
      <div class="card-location">
        <span class="msr" style="font-size:18px; color:var(--teal)">location_on</span>
        <div>
          <p class="card-loc-name">{{ loc?.name }}</p>
          <p class="card-loc-sub">{{ loc?.subtitle }}</p>
        </div>
        <div class="visit-stamp">방문<br>인증</div>
      </div>

      <!-- 실제 장소 메시지 -->
      <div class="card-real-msg">
        <p>{{ loc?.shareMessage }}</p>
      </div>

      <!-- 날짜 + 해시태그 -->
      <div class="card-footer">
        <span class="card-date">{{ dateStr }}</span>
        <span class="card-tags">#동구 #대전동구 #timequest</span>
      </div>
    </div>

    <!-- 공유 버튼들 -->
    <div class="share-actions">
      <button class="btn-primary share-btn" @click="shareCard">
        <span class="msr" style="font-size:20px; color:var(--navy)">share</span>
        {{ shared ? '공유됨 ✓' : '공유하기' }}
      </button>
      <button class="btn-continue" @click="router.push('/collection')">
        <span class="msr" style="font-size:18px">auto_stories</span>
        도감 보기
      </button>
      <button class="btn-continue" @click="router.push('/map')">
        <span class="msr" style="font-size:18px">map</span>
        다음 장소
      </button>
    </div>
  </div>
</template>

<style scoped>
.share-screen {
  background: #0A1828;
  display: flex; flex-direction: column; gap: 12px;
  padding: 52px 16px 24px; overflow-y: auto;
}

.share-guide {
  display: flex; align-items: center; gap: 8px; justify-content: center;
  font-size: 13px; font-weight: 800; color: #9FC1C8;
}

/* ── 공유 카드 ── */
.share-card {
  background: linear-gradient(160deg, #062B48 0%, #0B5858 50%, #0E7B79 100%);
  border-radius: 28px; padding: 24px 20px 20px;
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  position: relative; overflow: hidden;
  box-shadow: 0 12px 40px #FF9F1C22;
}

.card-bg {
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(ellipse at 20% 20%, #7CE1D922 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, #FF9F1C11 0%, transparent 50%);
}

.card-brand {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 900; color: #7CE1D9; letter-spacing: 1.2px;
}
.brand-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--teal); }

.awaken-badge-large {
  display: flex; align-items: center; gap: 6px;
  background: var(--orange); color: var(--navy);
  border-radius: 14px; padding: 6px 14px;
  font-size: 13px; font-weight: 900;
}

.card-buddy { position: relative; }
.card-glow {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 220px; height: 220px; border-radius: 50%;
  background: radial-gradient(circle, #FF9F1C22 0%, transparent 70%);
  animation: glow 2s ease-in-out infinite alternate;
}
@keyframes glow {
  from { transform: translate(-50%,-50%) scale(0.9); }
  to   { transform: translate(-50%,-50%) scale(1.1); }
}

.card-buddy-info { text-align: center; }
.card-buddy-name { font-size: 28px; font-weight: 900; color: var(--white); }
.card-buddy-sub  { font-size: 13px; font-weight: 700; color: #7CE1D9; margin-top: 3px; }

.card-location {
  width: 100%; display: flex; align-items: center; gap: 10px;
  background: #FFFFFF12; border-radius: 16px; padding: 12px 14px;
}
.card-loc-name { font-size: 16px; font-weight: 900; color: var(--white); }
.card-loc-sub  { font-size: 11px; font-weight: 700; color: #9FC1C8; }
.visit-stamp {
  margin-left: auto; background: var(--teal); color: white;
  border-radius: 50%; width: 44px; height: 44px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 900; text-align: center; line-height: 1.3;
  border: 2px solid #FFFFFF44;
}

.card-real-msg {
  width: 100%; background: #FFFFFF08; border-radius: 14px; padding: 10px 14px;
  font-size: 12px; font-weight: 700; color: #A8D8D4; line-height: 1.6; word-break: keep-all;
}

.card-footer {
  width: 100%; display: flex; justify-content: space-between; align-items: center;
  font-size: 10px; font-weight: 700;
}
.card-date { color: #9FC1C8; }
.card-tags { color: #7CE1D9; }

/* ── 공유 버튼 ── */
.share-actions { display: flex; flex-direction: column; gap: 8px; }
.share-btn { width: 100%; }
.btn-continue {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: #FFFFFF11; border: 1px solid #FFFFFF22; border-radius: 14px;
  height: 48px; font-family: var(--font); font-size: 14px; font-weight: 800;
  color: #9FC1C8; cursor: pointer;
}
</style>
