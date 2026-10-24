<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BottomNavigation from '../components/BottomNavigation.vue'

const router = useRouter()
const selectedMission = ref(null)

const missions = [
  { id: 'sojedom', name: '소제동',   x: 48,  y: 252, status: 'active',      icon: 'explore' },
  { id: 'heredi',  name: '한의약거리', x: 236, y: 310, status: 'unvisited',   icon: 'museum' },
  { id: 'jungang', name: '중앙시장',  x: 146, y: 470, status: 'unvisited',   icon: 'storefront' },
  { id: 'indong',  name: '이용 불가', x: 260, y: 558, status: 'unavailable', icon: 'local_mall' },
]

const markerColor = (status) => ({
  active:      { dot: '#FF9F1C', border: '#FF9F1C', glow: '#FF9F1C99' },
  unvisited:   { dot: '#8EA4AF', border: '#8EA4AF', glow: '#FF9F1C44' },
  unavailable: { dot: '#D64B5F', border: '#D64B5F', glow: '#FF9F1C44' },
}[status])

function selectMission(m) {
  if (m.status === 'unavailable') return
  selectedMission.value = selectedMission.value?.id === m.id ? null : m
}
</script>

<template>
  <div class="screen map-screen" @click.self="selectedMission = null">

    <!-- Map background (simulated city grid) -->
    <div class="map-bg"></div>
    <div class="map-tint"></div>

    <!-- Sync notice -->
    <div class="sync-notice">
      <span class="msr" style="font-size:14px; color:#7CE1D9">wifi</span>
      지도 연동 전 화면 예시
    </div>

    <!-- Player status -->
    <div class="player-status">
      <div class="level-badge">
        <span class="msr" style="font-size:12px; color: var(--orange)">person</span>
      </div>
      <span class="level-text">LV. 07</span>
      <div class="status-divider"></div>
      <span class="msr" style="font-size:21px; color: var(--orange)">diamond</span>
      <span class="shard-text">시간 조각&nbsp; 12 / 30</span>
    </div>

    <!-- Map controls -->
    <div class="map-controls">
      <button class="map-ctrl-btn">
        <span class="msr" style="font-size:24px; color: var(--navy)">my_location</span>
      </button>
      <button class="map-ctrl-btn">
        <span class="msr" style="font-size:24px; color: var(--navy)">navigation</span>
      </button>
    </div>

    <!-- Current objective -->
    <div class="objective">
      <div class="obj-step">
        <span class="msr" style="font-size:18px; color: var(--navy)">flag</span>
      </div>
      <div class="obj-texts">
        <span class="obj-label">현재 목표 · 코스 1 / 3</span>
        <span class="obj-action">소제동에서 조각 A의 문양 찾기</span>
        <span class="obj-next">다음 행동: 미션 핀을 눌러 상세 확인</span>
      </div>
    </div>

    <!-- Mission markers -->
    <div
      v-for="m in missions"
      :key="m.id"
      class="mission-marker"
      :style="{ left: m.x + 'px', top: m.y + 'px' }"
      @click="selectMission(m)"
    >
      <div
        class="marker-dot"
        :style="{
          background: markerColor(m.status).dot + '44',
          borderColor: markerColor(m.status).border,
          boxShadow: `0 0 18px ${markerColor(m.status).glow}`
        }"
      ></div>
      <div class="marker-label">{{ m.name }}</div>
    </div>

    <!-- Player avatar -->
    <div class="player-avatar">
      <div class="avatar-inner">🐧</div>
    </div>

    <!-- Map pin legend -->
    <div class="pin-legend">
      <div class="pin-item">
        <span class="pin-dot" style="background:#FF9F1C"></span>
        <span>진행 중</span>
      </div>
      <div class="pin-item">
        <span class="pin-dot" style="background:#8EA4AF"></span>
        <span>미방문</span>
      </div>
      <div class="pin-item">
        <span class="pin-dot" style="background:#D64B5F"></span>
        <span>이용 불가</span>
      </div>
    </div>

    <!-- Compact guide -->
    <div class="compact-guide" v-if="!selectedMission">
      <div class="guide-char">🏪</div>
      <div class="guide-text">
        <span class="guide-name">중앙이의 탐험 제안</span>
        <span class="guide-line">소제동 핀을 눌러 이번에 찾을 단서를 확인해요.</span>
      </div>
    </div>

    <!-- Bottom navigation -->
    <div class="nav-wrap">
      <BottomNavigation />
    </div>

    <!-- Mission bottom sheet -->
    <Transition name="sheet">
      <div class="bottom-sheet" v-if="selectedMission">
        <div class="sheet-handle"></div>

        <!-- Mission card -->
        <div class="mission-card">
          <span class="mission-tag">소제동 · 관찰 미션</span>
          <h3 class="mission-title">조각 A의 문양을 찾아라</h3>
          <p class="mission-meta">난이도 기본 · 보상 시간 조각 A</p>
          <p class="mission-desc">이번에 찾을 단서: 다음 장소를 가리키는 형태와 색<br>인증: 위치 확인 또는 현장 QR · 온라인 대체 가능</p>
        </div>

        <!-- Verification options -->
        <div class="verify-options">
          <div class="verify-btn">
            <span class="msr" style="font-size:16px; color:var(--teal-dark)">location_on</span>
            현장
          </div>
          <div class="verify-btn">
            <span class="msr" style="font-size:16px; color:var(--teal-dark)">qr_code_2</span>
            QR
          </div>
          <div class="verify-btn">
            <span class="msr" style="font-size:16px; color:var(--teal-dark)">language</span>
            온라인
          </div>
        </div>

        <!-- CTA -->
        <button class="btn-primary" style="width:100%" @click="router.push('/field')">
          <span class="msr" style="font-size:22px; color: var(--navy)">flag</span>
          목적지로 설정
        </button>
        <p class="sheet-note">이동 가능성·거리·이용 시간은 확인 전이며 기능은 구현 전 UI입니다.</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.map-screen {
  background: #e0ead4;
  overflow: hidden;
}

.map-bg {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(#c8d9b8 1px, transparent 1px),
    linear-gradient(90deg, #c8d9b8 1px, transparent 1px),
    linear-gradient(#d5e4c5 2px, transparent 2px),
    linear-gradient(90deg, #d5e4c5 2px, transparent 2px),
    #e8f0df;
  background-size: 24px 24px, 24px 24px, 120px 120px, 120px 120px;
}

.map-tint {
  position: absolute;
  inset: 0;
  background: #0C6D7530;
}

.sync-notice {
  position: absolute;
  left: 88px; top: 56px;
  display: flex;
  align-items: center;
  gap: 5px;
  background: #08233FDE;
  color: var(--white);
  border-radius: 14px;
  padding: 5px 14px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.player-status {
  position: absolute;
  left: 16px; top: 98px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #FFFFFFF2;
  border-radius: 20px;
  padding: 8px 12px;
  box-shadow: 0 5px 14px #062B4033;
  height: 58px;
}

.level-badge {
  width: 40px; height: 40px;
  background: var(--navy);
  border: 3px solid var(--orange);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.level-text {
  font-size: 14px;
  font-weight: 900;
  color: var(--ink);
}

.status-divider {
  width: 1px; height: 28px;
  background: #C9DBDE;
}

.shard-text {
  font-size: 13px;
  font-weight: 800;
  color: var(--ink);
}

.map-controls {
  position: absolute;
  right: 16px; top: 100px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.map-ctrl-btn {
  width: 48px; height: 48px;
  background: #FFFFFFF2;
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 12px #062B4033;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.objective {
  position: absolute;
  left: 16px; top: 170px;
  width: 358px;
  height: 78px;
  background: #08233FF0;
  border-radius: 20px;
  box-shadow: 0 6px 16px #00152255;
  display: flex;
  gap: 12px;
  padding: 11px 14px;
  align-items: center;
}

.obj-step {
  width: 42px; height: 42px;
  background: var(--orange);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.obj-texts {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.obj-label {
  font-size: 10px;
  font-weight: 900;
  color: var(--orange);
}

.obj-action {
  font-size: 14px;
  font-weight: 900;
  color: var(--white);
}

.obj-next {
  font-size: 10px;
  font-weight: 700;
  color: #BDD9DE;
}

.mission-marker {
  position: absolute;
  width: 92px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.marker-dot {
  width: 58px; height: 58px;
  border: 2px solid;
  border-radius: 50%;
  transition: transform 0.15s;
}

.mission-marker:active .marker-dot {
  transform: scale(0.92);
}

.marker-label {
  background: #08233FE8;
  color: var(--white);
  border-radius: 10px;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.player-avatar {
  position: absolute;
  left: 158px; top: 370px;
  width: 76px; height: 76px;
  background: var(--white);
  border: 4px solid var(--teal);
  border-radius: 50%;
  box-shadow: 0 6px 18px #043F4955;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-inner {
  font-size: 42px;
  line-height: 1;
  margin-top: 2px;
}

.pin-legend {
  position: absolute;
  left: 16px; top: 600px;
  display: flex;
  gap: 12px;
  background: #FFFFFFE8;
  border-radius: 15px;
  padding: 6px 14px;
  align-items: center;
}

.pin-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  font-weight: 800;
  color: var(--ink);
}

.pin-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.compact-guide {
  position: absolute;
  left: 16px; top: 642px;
  width: 285px;
  height: 82px;
  background: #FFFFFFF2;
  border-radius: 20px;
  box-shadow: 0 5px 16px #062B4033;
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  align-items: center;
}

.guide-char {
  font-size: 44px;
  line-height: 1;
  flex-shrink: 0;
}

.guide-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.guide-name {
  font-size: 11px;
  font-weight: 800;
  color: var(--teal);
}

.guide-line {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.4;
  word-break: keep-all;
}

.nav-wrap {
  position: absolute;
  left: 16px; top: 754px;
}

/* Bottom sheet */
.bottom-sheet {
  position: absolute;
  left: 16px;
  bottom: 10px;
  width: 358px;
  background: #E9FAF7F5;
  border-radius: 28px 28px 22px 22px;
  box-shadow: 0 -8px 28px #062B4040;
  padding: 8px 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 10;
}

.sheet-handle {
  width: 42px; height: 5px;
  background: #A8C4C6;
  border-radius: 3px;
  margin: 0 auto 4px;
}

.mission-card {
  background: var(--white);
  border-radius: 18px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mission-tag {
  font-size: 11px;
  font-weight: 800;
  color: var(--muted);
}

.mission-title {
  font-size: 20px;
  font-weight: 900;
  color: var(--ink);
}

.mission-meta {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
}

.mission-desc {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.5;
}

.verify-options {
  display: flex;
  gap: 7px;
}

.verify-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: #D5EFEC;
  border-radius: 12px;
  padding: 7px 6px;
  font-size: 11px;
  font-weight: 800;
  color: var(--ink);
  cursor: pointer;
}

.sheet-note {
  font-size: 10px;
  font-weight: 600;
  color: var(--muted);
  text-align: center;
}

.sheet-enter-active, .sheet-leave-active {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s;
}
.sheet-enter-from, .sheet-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
