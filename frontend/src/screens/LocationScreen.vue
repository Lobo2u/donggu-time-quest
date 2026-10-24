<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { game, markArrived, distanceTo } from '../store/gameStore.js'
import { LOCATIONS } from '../data/gameData.js'

const router = useRouter()
const route = useRoute()
const locationId = route.params.id
const loc = LOCATIONS[locationId]

if (!loc) router.replace('/map')

const storyStep = ref(0)
const gpsState = ref('idle') // idle | checking | near | far | denied
const userDistance = ref(null)

const arrived = computed(() => {
  return game.demoMode
    ? storyStep.value >= loc.storyContext.length
    : gpsState.value === 'near'
})

const alreadyComplete = computed(() => game.locations[locationId]?.missionComplete)

function nextStory() {
  if (storyStep.value < loc.storyContext.length) storyStep.value++
}

async function checkGPS() {
  gpsState.value = 'checking'
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
    )
    const d = distanceTo(pos.coords.latitude, pos.coords.longitude, loc.lat, loc.lng)
    userDistance.value = Math.round(d)
    gpsState.value = d <= loc.arrivalRadius ? 'near' : 'far'
  } catch {
    gpsState.value = 'denied'
  }
}

function confirmArrival() {
  markArrived(locationId)
  router.push(`/minigame/${locationId}`)
}

onMounted(() => {
  // 시연 모드가 아니고 이전에 GPS를 켠 적 없으면 자동 시도
  if (!game.demoMode) checkGPS()
})
</script>

<template>
  <div class="screen location-screen">
    <!-- 상단 헤더 -->
    <div class="loc-header">
      <button class="back-btn" @click="$router.push('/map')">
        <span class="msr" style="font-size:26px; color:var(--navy)">arrow_back</span>
      </button>
      <div class="header-center">
        <span class="loc-label">장소 도착</span>
        <span class="loc-name">{{ loc.name }}</span>
      </div>
      <div class="demo-pill" v-if="game.demoMode">시연</div>
    </div>

    <!-- 시연 모드 안내 -->
    <div class="demo-banner" v-if="game.demoMode">
      <span class="msr" style="font-size:16px; color:var(--teal)">science</span>
      <span>시연 모드 · 실제 GPS 도착을 시뮬레이션해요.</span>
    </div>

    <!-- 스토리 컨텍스트 카드 -->
    <div class="story-area">
      <div class="story-note-tag">
        <span class="msr" style="font-size:14px; color:var(--muted)">edit_note</span>
        <span>창작 시나리오</span>
      </div>

      <div class="story-card" :class="{ dimmed: storyStep < 1 }">
        <TransitionGroup name="fade-up" tag="div" class="story-lines">
          <p
            v-for="(line, i) in loc.storyContext.slice(0, storyStep + 1)"
            :key="i"
            class="story-line"
          >{{ line }}</p>
        </TransitionGroup>
        <p class="real-note" v-if="storyStep >= loc.storyContext.length - 1">
          {{ loc.storyNote }}
        </p>
      </div>

      <!-- 다음 버튼 or 도착 확인 -->
      <div class="story-nav" v-if="!alreadyComplete">
        <div v-if="storyStep < loc.storyContext.length">
          <button class="btn-story-next" @click="nextStory">
            <span v-if="storyStep === 0">이야기 시작</span>
            <span v-else>계속</span>
            <span class="msr" style="font-size:18px">arrow_forward</span>
          </button>
          <p class="story-progress">{{ storyStep + 1 }} / {{ loc.storyContext.length }}</p>
        </div>

        <!-- 스토리 다 읽음 → 도착 확인 -->
        <div v-else class="arrival-section">
          <!-- 시연 모드 -->
          <template v-if="game.demoMode">
            <div class="arrival-sim">
              <span class="msr" style="font-size:32px; color:var(--teal)">location_on</span>
              <div>
                <p class="arrival-title">{{ loc.name }} 도착 시뮬레이션</p>
                <p class="arrival-sub">시연 모드 · 실제 GPS 인증을 대신해요</p>
              </div>
            </div>
            <button class="btn-primary arrival-btn" @click="confirmArrival">
              <span class="msr" style="font-size:22px; color:var(--navy)">play_circle</span>
              탐험 시작 (시연)
            </button>
          </template>

          <!-- GPS 모드 -->
          <template v-else>
            <div v-if="gpsState === 'idle' || gpsState === 'checking'" class="gps-card">
              <span class="msr spin" style="font-size:32px; color:var(--teal)">my_location</span>
              <p>{{ gpsState === 'checking' ? '위치 확인 중...' : 'GPS로 도착을 확인해요' }}</p>
              <button v-if="gpsState === 'idle'" class="btn-primary" @click="checkGPS">
                위치 확인
              </button>
            </div>

            <div v-else-if="gpsState === 'near'" class="gps-near">
              <span class="msr" style="font-size:32px; color:var(--teal)">check_circle</span>
              <div>
                <p class="arrival-title">{{ loc.name }} 도착 확인됨</p>
                <p class="arrival-sub">{{ userDistance }}m · 도착 범위 안에 있어요</p>
              </div>
            </div>
            <button v-if="gpsState === 'near'" class="btn-primary arrival-btn" @click="confirmArrival">
              <span class="msr" style="font-size:22px; color:var(--navy)">explore</span>
              탐험 시작
            </button>

            <div v-else-if="gpsState === 'far'" class="gps-far">
              <span class="msr" style="font-size:32px; color:var(--muted)">location_searching</span>
              <div>
                <p class="arrival-title">아직 {{ loc.name }}까지 거리가 있어요</p>
                <p class="arrival-sub">현재 위치에서 약 {{ userDistance }}m · {{ loc.arrivalRadius }}m 안으로 이동하세요</p>
              </div>
            </div>
            <div v-if="gpsState === 'far'" class="gps-actions">
              <button class="btn-secondary" style="flex:1" @click="checkGPS">다시 확인</button>
              <button class="btn-primary" style="flex:1" @click="game.demoMode = true">시연 모드로 진행</button>
            </div>

            <div v-else-if="gpsState === 'denied'" class="gps-denied">
              <span class="msr" style="font-size:32px; color:var(--muted)">location_disabled</span>
              <div>
                <p class="arrival-title">위치 권한이 거부됐어요</p>
                <p class="arrival-sub">브라우저 설정에서 위치 권한을 허용하거나 시연 모드를 사용해요.</p>
              </div>
            </div>
            <button v-if="gpsState === 'denied'" class="btn-primary" @click="game.demoMode = true; gpsState = 'idle'">
              시연 모드로 진행
            </button>
          </template>
        </div>
      </div>

      <!-- 이미 완료 -->
      <div v-else class="already-done">
        <span class="msr" style="font-size:36px; color:var(--teal)">check_circle</span>
        <p>이미 탐험을 완료한 장소예요!</p>
        <div style="display:flex; gap:10px; margin-top:12px;">
          <button class="btn-secondary" style="flex:1" @click="$router.push('/map')">지도로</button>
          <button class="btn-primary" style="flex:1" @click="$router.push('/collection')">도감 보기</button>
        </div>
      </div>
    </div>

    <!-- QR 체크인 배너 -->
    <div class="qr-checkin-card" v-if="!alreadyComplete">
      <div class="qr-checkin-left">
        <span class="msr" style="font-size:28px; color:var(--orange)">qr_code_scanner</span>
        <div>
          <p class="qr-checkin-title" v-if="game.checkIns?.[locationId]">
            <span class="msr" style="font-size:16px; color:var(--teal)">check_circle</span>
            현장 QR 인증 완료!
          </p>
          <p class="qr-checkin-title" v-else>현장 QR 인증 시 버디 각성</p>
          <p class="qr-checkin-desc" v-if="!game.checkIns?.[locationId]">
            장소에 부착된 QR을 스캔하면 {{ loc.name }}의 시간 친구가 각성해요
          </p>
          <p class="qr-checkin-desc" v-else>버디 능력이 강화됐어요</p>
        </div>
      </div>
      <button
        v-if="!game.checkIns?.[locationId]"
        class="qr-scan-btn"
        @click="$router.push('/qrscan?from=' + locationId)"
      >스캔</button>
      <div v-else class="awoken-pill">각성됨</div>
    </div>

    <!-- 실제 장소 안내 -->
    <div class="real-note-card">
      <span class="msr" style="font-size:16px; color:var(--teal-dark)">info</span>
      <p>{{ loc.realNote }}</p>
    </div>
  </div>
</template>

<style scoped>
.location-screen {
  background: var(--paper);
  display: flex; flex-direction: column; gap: 12px;
  padding: 0 0 20px;
  overflow-y: auto;
}

.loc-header {
  display: flex; align-items: center; gap: 10px;
  padding: 52px 16px 12px;
  background: var(--white);
  box-shadow: 0 2px 8px #08233F0A;
}
.back-btn { background: none; border: none; cursor: pointer; padding: 0; }
.header-center { flex: 1; }
.loc-label { font-size: 11px; font-weight: 800; color: var(--teal); display: block; }
.loc-name { font-size: 20px; font-weight: 900; color: var(--ink); }
.demo-pill {
  background: var(--sky); color: var(--teal-dark);
  border-radius: 10px; padding: 4px 10px;
  font-size: 11px; font-weight: 900;
}

.demo-banner {
  display: flex; align-items: center; gap: 8px;
  background: var(--sky); margin: 0 16px;
  border-radius: 14px; padding: 10px 14px;
  font-size: 12px; font-weight: 700; color: var(--ink);
}

.story-area { padding: 0 16px; display: flex; flex-direction: column; gap: 12px; }

.story-note-tag {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 700; color: var(--muted);
}

.story-card {
  background: var(--white); border-radius: 22px;
  padding: 18px; min-height: 140px;
  box-shadow: 0 4px 16px #08233F0F;
  display: flex; flex-direction: column; gap: 10px;
}
.story-card.dimmed { background: #F2F8F7; }

.story-lines { display: flex; flex-direction: column; gap: 10px; }
.story-line {
  font-size: 16px; font-weight: 700; color: var(--ink);
  line-height: 1.6; word-break: keep-all;
}
.real-note { font-size: 11px; color: var(--muted); font-style: italic; }

.story-nav { display: flex; flex-direction: column; gap: 8px; }
.btn-story-next {
  width: 100%; height: 52px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: var(--navy); color: var(--white);
  border: none; border-radius: 16px;
  font-family: var(--font); font-size: 16px; font-weight: 800; cursor: pointer;
}
.story-progress { text-align: center; font-size: 11px; color: var(--muted); font-weight: 700; }

.arrival-section { display: flex; flex-direction: column; gap: 10px; }
.arrival-sim, .gps-near, .gps-far, .gps-denied {
  display: flex; align-items: center; gap: 12px;
  background: var(--sky); border-radius: 18px; padding: 14px;
}
.gps-card {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  background: var(--sky); border-radius: 18px; padding: 20px;
  text-align: center; font-size: 14px; font-weight: 700; color: var(--ink);
}
.arrival-title { font-size: 15px; font-weight: 900; color: var(--ink); }
.arrival-sub { font-size: 12px; font-weight: 600; color: var(--muted); margin-top: 2px; word-break: keep-all; }
.arrival-btn { width: 100%; }
.gps-actions { display: flex; gap: 8px; }

.already-done {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; background: var(--sky); border-radius: 22px; padding: 24px;
  font-size: 15px; font-weight: 800; color: var(--ink); text-align: center;
}

.qr-checkin-card {
  margin: 0 16px;
  background: linear-gradient(135deg, #08233F, #0E4A4A);
  border: 1px solid var(--orange);
  border-radius: 18px; padding: 14px 16px;
  display: flex; align-items: center; gap: 12px;
}
.qr-checkin-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.qr-checkin-title { font-size: 14px; font-weight: 900; color: var(--white); display: flex; align-items: center; gap: 4px; }
.qr-checkin-desc  { font-size: 11px; font-weight: 700; color: #9FC1C8; margin-top: 3px; word-break: keep-all; line-height: 1.4; }
.qr-scan-btn {
  background: var(--orange); border: none; border-radius: 12px;
  padding: 8px 16px; font-family: var(--font); font-size: 13px; font-weight: 900;
  color: var(--navy); cursor: pointer; white-space: nowrap; flex-shrink: 0;
}
.awoken-pill {
  background: var(--teal); color: white; border-radius: 12px;
  padding: 6px 12px; font-size: 12px; font-weight: 900; white-space: nowrap; flex-shrink: 0;
}

.real-note-card {
  display: flex; align-items: flex-start; gap: 8px;
  background: #EEF6F5; margin: 0 16px; border-radius: 16px; padding: 12px 14px;
  font-size: 11px; font-weight: 600; color: var(--muted); line-height: 1.5;
}

@keyframes spin { to { transform: rotate(360deg); } }
.spin { display: inline-block; animation: spin 1.2s linear infinite; }

.fade-up-enter-active { transition: all 0.4s ease; }
.fade-up-enter-from { opacity: 0; transform: translateY(10px); }
</style>
