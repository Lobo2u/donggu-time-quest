<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { LOCATIONS, PARTNER_STORES, BUDDIES } from '../data/gameData.js'

const router = useRouter()
const route  = useRoute()
const locationId = route.params.locationId
const loc    = LOCATIONS[locationId]
const store  = PARTNER_STORES[locationId]
const buddy  = loc ? BUDDIES[loc.buddyId] : null

if (!loc || !store) router.replace('/map')

// 쿠폰 코드 생성 (장소 + 날짜 기반)
const today = new Date()
const dateStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`
const rand = Math.floor(Math.random() * 900 + 100)
const couponCode = `DRTQ-${locationId.toUpperCase().slice(0,3)}-${dateStr}-${rand}`

const validUntil = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')} 자정`

const shared = computed(() => false)

async function share() {
  const text = `동구 TIME QUEST 파트너 쿠폰\n${store.name} — ${store.offer}\n코드: ${couponCode}\n유효: ${validUntil}`
  if (navigator.share) {
    try { await navigator.share({ title: '동구 TIME QUEST 쿠폰', text }) } catch {}
  } else {
    await navigator.clipboard.writeText(text).catch(() => {})
  }
}
</script>

<template>
  <div class="screen coupon-screen" v-if="store">
    <!-- 헤더 -->
    <div class="coupon-header">
      <button class="back-btn" @click="$router.back()">
        <span class="msr" style="font-size:26px; color:var(--navy)">arrow_back</span>
      </button>
      <div>
        <p class="header-sub">현장 방문 혜택</p>
        <p class="header-title">파트너 쿠폰</p>
      </div>
    </div>

    <!-- 데모 안내 -->
    <div class="demo-warn">
      <span class="msr" style="font-size:16px; color:var(--orange)">info</span>
      <p>이 쿠폰은 게임 데모용 가상 정보입니다. 실제 파트너십 연결 전입니다.</p>
    </div>

    <!-- 쿠폰 카드 -->
    <div class="coupon-card">
      <!-- 톱니 장식 -->
      <div class="card-notch top"></div>

      <div class="card-inner">
        <!-- 브랜딩 -->
        <div class="card-brand">
          <span class="msr" style="font-size:16px; color:var(--teal)">diamond</span>
          <span>동구 TIME QUEST × 파트너</span>
        </div>

        <!-- 각성 배지 -->
        <div class="awoken-proof">
          <span class="msr" style="font-size:14px; color:var(--navy)">verified</span>
          {{ loc.name }} 현장 방문 인증 완료 · {{ buddy?.name }} 각성
        </div>

        <!-- 상점 정보 -->
        <div class="store-info">
          <div class="store-category">{{ store.category }}</div>
          <h2 class="store-name">{{ store.name }}</h2>
          <p class="store-desc">{{ store.desc }}</p>
          <p class="store-hours">
            <span class="msr" style="font-size:14px; color:var(--muted)">schedule</span>
            {{ store.hours }}
          </p>
          <p class="store-address">
            <span class="msr" style="font-size:14px; color:var(--muted)">location_on</span>
            {{ store.address }}
          </p>
        </div>

        <!-- 혜택 강조 -->
        <div class="offer-highlight">
          <p class="offer-label">혜택</p>
          <p class="offer-text">{{ store.offer }}</p>
        </div>

        <!-- 점선 구분 -->
        <div class="dashed-line">
          <div class="dashed"></div>
        </div>

        <!-- 쿠폰 코드 -->
        <div class="code-section">
          <p class="code-label">쿠폰 코드</p>
          <p class="code-value">{{ couponCode }}</p>
          <p class="code-valid">유효 기간: {{ validUntil }}까지</p>
        </div>

        <!-- 사용 방법 -->
        <div class="usage-note">
          <span class="msr" style="font-size:16px; color:var(--teal-dark)">storefront</span>
          <p>상점 방문 시 이 화면을 직원에게 보여주세요</p>
        </div>
      </div>

      <div class="card-notch bottom"></div>
    </div>

    <!-- 파트너십 가치 제안 (해커톤 심사위원용) -->
    <div class="partnership-pitch">
      <p class="pitch-title">🤝 파트너십 모델</p>
      <p class="pitch-desc">게임 플레이어의 현장 방문 → 파트너 상점 방문 유도 → 지역 경제 활성화. 방문 데이터 기반 파트너십 확장이 가능합니다.</p>
    </div>

    <!-- 버튼 -->
    <div class="coupon-actions">
      <button class="btn-primary" @click="share">
        <span class="msr" style="font-size:20px; color:var(--navy)">share</span>
        쿠폰 공유하기
      </button>
      <button class="btn-go-map" @click="router.push('/map')">
        <span class="msr" style="font-size:18px">map</span>
        지도로 돌아가기
      </button>
    </div>
  </div>
</template>

<style scoped>
.coupon-screen {
  background: var(--paper);
  display: flex; flex-direction: column; gap: 14px;
  padding: 0 0 24px; overflow-y: auto;
}

.coupon-header {
  display: flex; align-items: center; gap: 12px;
  padding: 52px 16px 12px; background: var(--white);
  box-shadow: 0 2px 8px #08233F0A;
}
.back-btn { background: none; border: none; cursor: pointer; }
.header-sub  { font-size: 11px; font-weight: 800; color: var(--teal); }
.header-title { font-size: 20px; font-weight: 900; color: var(--ink); }

.demo-warn {
  display: flex; align-items: center; gap: 8px;
  background: #FFF8EC; border: 1px solid #FFD98C;
  border-radius: 14px; margin: 0 16px; padding: 10px 14px;
  font-size: 11px; font-weight: 700; color: var(--ink); line-height: 1.4; word-break: keep-all;
}

/* ── 쿠폰 카드 ── */
.coupon-card {
  margin: 0 16px;
  background: var(--white);
  border-radius: 20px;
  box-shadow: 0 8px 28px #08233F1A;
  overflow: hidden;
  position: relative;
}

.card-notch {
  height: 0;
  background: var(--paper);
  position: relative;
}
.card-notch.top::before, .card-notch.top::after,
.card-notch.bottom::before, .card-notch.bottom::after {
  content: '';
  position: absolute;
  width: 20px; height: 20px;
  background: var(--paper);
  border-radius: 50%;
  top: -10px;
}
.card-notch.bottom::before, .card-notch.bottom::after { top: -10px; }
.card-notch.top::before  { left: -10px; }
.card-notch.top::after   { right: -10px; }
.card-notch.bottom::before { left: -10px; }
.card-notch.bottom::after  { right: -10px; }

.card-inner { padding: 20px; display: flex; flex-direction: column; gap: 14px; }

.card-brand {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 800; color: var(--teal); letter-spacing: 0.8px;
}

.awoken-proof {
  display: flex; align-items: center; gap: 6px;
  background: var(--sky); border-radius: 10px; padding: 8px 12px;
  font-size: 12px; font-weight: 800; color: var(--navy);
}

.store-info { display: flex; flex-direction: column; gap: 6px; }
.store-category {
  display: inline-block; background: var(--navy); color: var(--orange);
  border-radius: 8px; padding: 3px 10px; font-size: 11px; font-weight: 900;
  align-self: flex-start;
}
.store-name { font-size: 22px; font-weight: 900; color: var(--ink); }
.store-desc { font-size: 13px; font-weight: 700; color: var(--muted); line-height: 1.4; }
.store-hours, .store-address {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 700; color: var(--muted);
}

.offer-highlight {
  background: linear-gradient(135deg, var(--orange-soft), #FFF);
  border: 2px solid var(--orange); border-radius: 16px; padding: 14px;
  text-align: center;
}
.offer-label { font-size: 11px; font-weight: 800; color: var(--orange); margin-bottom: 4px; }
.offer-text  { font-size: 22px; font-weight: 900; color: var(--ink); }

.dashed-line { padding: 2px 0; }
.dashed {
  border-top: 2px dashed #DCEAE9;
}

.code-section { text-align: center; display: flex; flex-direction: column; gap: 4px; }
.code-label { font-size: 11px; font-weight: 800; color: var(--muted); }
.code-value {
  font-family: monospace; font-size: 18px; font-weight: 900;
  color: var(--navy); letter-spacing: 2px;
  background: #F0F7F6; border-radius: 10px; padding: 8px;
}
.code-valid { font-size: 11px; font-weight: 700; color: var(--muted); }

.usage-note {
  display: flex; align-items: center; gap: 8px;
  background: var(--sky); border-radius: 12px; padding: 10px 12px;
  font-size: 12px; font-weight: 800; color: var(--teal-dark);
}

/* ── 파트너십 피치 ── */
.partnership-pitch {
  margin: 0 16px; background: var(--navy); border-radius: 18px; padding: 16px;
}
.pitch-title { font-size: 14px; font-weight: 900; color: var(--orange); margin-bottom: 6px; }
.pitch-desc  { font-size: 12px; font-weight: 700; color: #9FC1C8; line-height: 1.5; word-break: keep-all; }

.coupon-actions { padding: 0 16px; display: flex; flex-direction: column; gap: 8px; }
.btn-go-map {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: var(--white); border: 1px solid #E0ECEA; border-radius: 14px;
  height: 48px; font-family: var(--font); font-size: 14px; font-weight: 800;
  color: var(--muted); cursor: pointer;
}
</style>
