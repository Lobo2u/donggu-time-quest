<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { game, markArrived, distanceTo, setGuide } from '../store/gameStore.js'
import { LOCATIONS } from '../data/gameData.js'
import { playStory, story } from '../store/storyStore.js'
import ArrivalQr from '../components/ArrivalQr.vue'
import GuidePicker from '../components/GuidePicker.vue'
import MascotSvg from '../components/MascotSvg.vue'
import CameraMock from '../components/CameraMock.vue'

// 도착 확인 반경: 지도 근접 표시(arrivalRadius 300m)보다 좁게, 건물 앞에 있어야 QR 이 뜸.
// GPS 오차는 최대 30m 까지만 봐줌 (byeol-night gpsCheck 와 같은 규칙)
const CHECKIN_RADIUS = 50

const router = useRouter()
const route = useRoute()
const locationId = route.params.id
const loc = LOCATIONS[locationId]

if (!loc) router.replace('/map')

const storyStep = ref(0)
const gpsState = ref('idle') // idle | checking | near | far | denied
const userDistance = ref(null)
const checking = ref(false)   // 앱 안 QR 누른 뒤 확인 중
const checkinError = ref('')

const arrived = computed(() => {
  return game.demoMode
    ? storyStep.value >= loc.storyContext.length
    : gpsState.value === 'near'
})

const alreadyComplete = computed(() => game.locations[locationId]?.missionComplete)

function nextStory() {
  if (storyStep.value < loc.storyContext.length) storyStep.value++
}

async function readGPS() {
  const pos = await new Promise((res, rej) =>
    navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 8000 })
  )
  const d = distanceTo(pos.coords.latitude, pos.coords.longitude, loc.lat, loc.lng)
  userDistance.value = Math.round(d)
  return d <= CHECKIN_RADIUS + Math.min(pos.coords.accuracy ?? 0, 30)
}

async function checkGPS() {
  gpsState.value = 'checking'
  try {
    gpsState.value = (await readGPS()) ? 'near' : 'far'
  } catch {
    gpsState.value = 'denied'
  }
}

// 앱 안 QR 누름 → 위치와 QR 내용을 함께 확인 (시연 모드는 위치 확인 생략)
async function checkIn(payload) {
  checking.value = true
  checkinError.value = ''
  try {
    const gpsOk = game.demoMode || await readGPS()
    if (!gpsOk) {
      gpsState.value = 'far'
      checkinError.value = '건물 앞으로 조금 더 가까이 가 주세요'
    } else if (payload !== loc.qrCode) {
      checkinError.value = 'QR을 확인하지 못했어요. 다시 눌러 주세요'
    } else {
      confirmArrival()
    }
  } catch {
    checkinError.value = '위치를 확인하지 못했어요. 잠시 후 다시 눌러 주세요'
  }
  checking.value = false
}

// 흐름: QR 인식(scan) → 처음이면 동반자 고르기(pick) → 장소 스토리(story) → 미션 시작 / 스킵
const phase = ref('scan')
const storyEnded = ref(false)

function confirmArrival() {
  markArrived(locationId)
  if (!game.guide) phase.value = 'pick'
  else enterStory()
}

function onPick(guide) {
  setGuide(guide)
  playStory('intro')   // 고른 동반자의 첫 안내 대화 → 닫히면 스토리가 흐르기 시작
  enterStory()
}

async function enterStory() {
  phase.value = 'story'
  storyEnded.value = false
  await nextTick()
  if (!story.open) { resumeAutoScroll(400); peek('start') }
}
// 안내 대화가 닫히면 그때 스토리 자동 스크롤 시작
watch(() => story.open, (open) => {
  if (!open && phase.value === 'story') { resumeAutoScroll(300); peek('start') }
})

// 동반자가 스토리 패널 위로 잠깐 올라와 알려 줌 (시작할 때 · 다 읽었을 때)
const PEEK_LINES = {
  start: { majung: { emote: 'aha', text: '이 장소의 이야기예요. 천천히 읽어 봐요!' },
           jungang: { emote: 'humming', text: '여기 이야기 들어 볼래요? 끝까지 보면 미션이 열려요~' } },
  end:   { majung: { emote: 'hype', text: '다 읽었네요! 미션 시작을 눌러요!' },
           jungang: { emote: 'laugh', text: '좋아요! 이제 미션 시작!' } },
}
const peekLine = ref(null)
const peeked = new Set()
let peekTimer = null
function peek(kind) {
  if (peeked.has(kind)) return
  peeked.add(kind)
  peekLine.value = PEEK_LINES[kind][game.guide ?? 'majung']
  clearTimeout(peekTimer)
  peekTimer = setTimeout(() => { peekLine.value = null }, 3800)
}
watch(storyEnded, (ended) => { if (ended) peek('end') })

function startMission() {
  router.push(`/minigame/${locationId}`)
}

// ── 카메라 도착 화면: 카메라(목업) + 틀 안의 앱 안 QR + 자동으로 올라가는 스토리 ──

const qrVisible = computed(() => game.demoMode || gpsState.value === 'near')
const frameMsg = computed(() => ({
  idle: '위치를 확인하고 있어요',
  checking: '위치를 확인하고 있어요…',
  far: `건물 앞 ${CHECKIN_RADIUS}m 안으로 오면 QR이 떠요${userDistance.value != null ? ` · 약 ${userDistance.value}m` : ''}`,
  denied: '위치 권한이 필요해요',
}[gpsState.value] ?? ''))


// 스토리: 한 번 천천히 올라가고 끝에서 멈춤.
// 손가락·마우스로 끌면 글을 직접 올리고 내릴 수 있고, 놓으면 그 자리에서 다시 흘러감.
const storyEl = ref(null)
let scrollRaf = null
let scrollStart = null
let resumeTimer = null
const SCROLL_SPEED = 60 // px/s
function autoScroll(t) {
  const el = storyEl.value
  if (!el) return
  scrollStart ??= { t, top: el.scrollTop }
  el.scrollTop = scrollStart.top + ((t - scrollStart.t) / 1000) * SCROLL_SPEED
  if (el.scrollTop + el.clientHeight < el.scrollHeight - 1) scrollRaf = requestAnimationFrame(autoScroll)
  else storyEnded.value = true
}
// 손으로 끝까지 내려도 '미션 시작'이 나오게
function onStoryScroll() {
  const el = storyEl.value
  if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 4) storyEnded.value = true
}
function stopAutoScroll() { cancelAnimationFrame(scrollRaf); scrollRaf = null; clearTimeout(resumeTimer) }
function resumeAutoScroll(delay = 1200) {
  stopAutoScroll()
  resumeTimer = setTimeout(() => { scrollStart = null; scrollRaf = requestAnimationFrame(autoScroll) }, delay)
}

// 끌어서 스크롤 (터치·마우스 공통)
let drag = null
function onStoryDown(e) {
  if (e.target.closest('button')) return // 안의 QR 스캔 버튼은 그대로 눌리게
  stopAutoScroll()
  drag = { y: e.clientY, top: storyEl.value.scrollTop }
  e.currentTarget.setPointerCapture(e.pointerId)
}
function onStoryMove(e) {
  if (!drag) return
  storyEl.value.scrollTop = drag.top - (e.clientY - drag.y)
}
function onStoryUp() {
  if (!drag) return
  drag = null
  resumeAutoScroll()
}
function onStoryWheel() { resumeAutoScroll() }

onMounted(async () => {
  // 시연 모드가 아니고 이전에 GPS를 켠 적 없으면 자동 시도
  if (!game.demoMode) checkGPS()
})
onBeforeUnmount(stopAutoScroll)
</script>

<template>
  <!-- 카메라 도착 화면 -->
  <div v-if="!alreadyComplete" class="screen cam-arrival">
    <CameraMock :variant="locationId" />

    <div class="ca-head">
      <button class="ca-back" aria-label="지도로" @click="$router.push('/map')">
        <span class="msr" style="font-size:24px; color:white">arrow_back</span>
      </button>
      <span class="ca-title">{{ loc.name }}</span>
      <span class="ca-demo" v-if="game.demoMode">시연</span>
    </div>

    <!-- 네 모서리 틀: 건물 앞이면 앱 안 QR 이 이 안에 뜸 -->
    <div class="ca-frame">
      <i class="cn tl"></i><i class="cn tr"></i><i class="cn bl"></i><i class="cn br"></i>
      <div v-if="phase !== 'scan'" class="ca-done">
        <span class="msr" style="font-size:40px; color:var(--orange)">check_circle</span>
        <p>도착 확인 완료</p>
      </div>
      <ArrivalQr v-else-if="qrVisible" :payload="loc.qrCode" :place="loc.name" :busy="checking" @press="checkIn" />
      <p v-else class="ca-frame-msg">{{ frameMsg }}</p>
    </div>
    <p v-if="checkinError" class="ca-error">{{ checkinError }}</p>
    <div v-if="phase === 'scan' && !game.demoMode && (gpsState === 'far' || gpsState === 'denied')" class="ca-actions">
      <button v-if="gpsState === 'far'" class="ca-chip" @click="checkGPS">다시 확인</button>
      <button class="ca-chip solid" @click="game.demoMode = true">시연 모드로 진행</button>
    </div>

    <!-- 첫 QR 인식: 동반자 고르기 -->
    <GuidePicker v-if="phase === 'pick'" @pick="onPick" />

    <!-- 스토리: QR 인식 후 아래에서 올라오고, 자동으로 천천히 흐름 -->
    <Transition name="story-up">
    <div v-if="phase === 'story'" class="ca-story">
      <!-- 동반자가 패널 위로 잠깐 올라와 한마디 -->
      <Transition name="peek">
        <div v-if="peekLine" class="ca-peek" :key="peekLine.text">
          <MascotSvg :character="game.guide ?? 'majung'" :mood="peekLine.emote" :size="78" />
          <p class="ca-peek-bubble">{{ peekLine.text }}</p>
        </div>
      </Transition>
      <div class="ca-story-head">
        <span class="ca-story-label">스토리</span>
        <button class="ca-skip" @click="startMission">스킵 ›</button>
      </div>
      <div class="ca-story-scroll" ref="storyEl"
        @pointerdown="onStoryDown" @pointermove="onStoryMove" @pointerup="onStoryUp" @pointercancel="onStoryUp"
        @wheel.passive="onStoryWheel" @scroll.passive="onStoryScroll">
        <div class="ca-spacer"></div>
        <p v-for="(line, i) in loc.storyContext" :key="i" class="ca-line">{{ line }}</p>
        <p class="ca-note">{{ loc.storyNote }}</p>
        <p class="ca-real">{{ loc.realNote }}</p>
        <button v-if="!game.checkIns?.[locationId]" class="ca-qr-link" @click="$router.push('/qrscan?from=' + locationId)">
          <span class="msr" style="font-size:16px">qr_code_scanner</span>
          가게 QR을 스캔하면 시간 친구가 강화돼요
        </button>
      </div>
      <Transition name="fade">
        <button v-if="storyEnded" class="ca-mission" @click="startMission">
          <span class="msr" style="font-size:20px; color:var(--navy)">play_arrow</span>
          미션 시작
        </button>
      </Transition>
    </div>
    </Transition>
  </div>

  <div v-else class="screen location-screen">
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
                <p class="arrival-title">{{ loc.name }} 앞에 QR이 떠 있어요</p>
                <p class="arrival-sub">시연 모드 · 위치 확인 없이 QR만 눌러요</p>
              </div>
            </div>
            <ArrivalQr :payload="loc.qrCode" :busy="checking" @press="checkIn" />
            <p v-if="checkinError" class="checkin-error">{{ checkinError }}</p>
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
                <p class="arrival-title">건물 앞에 QR이 떠 있어요</p>
                <p class="arrival-sub">{{ userDistance }}m · 누르면 도착을 확인하고 탐험이 시작돼요</p>
              </div>
            </div>
            <ArrivalQr v-if="gpsState === 'near'" :payload="loc.qrCode" :busy="checking" @press="checkIn" />
            <p v-if="gpsState === 'near' && checkinError" class="checkin-error">{{ checkinError }}</p>

            <div v-else-if="gpsState === 'far'" class="gps-far">
              <span class="msr" style="font-size:32px; color:var(--muted)">location_searching</span>
              <div>
                <p class="arrival-title">아직 {{ loc.name }}까지 거리가 있어요</p>
                <p class="arrival-sub">현재 위치에서 약 {{ userDistance }}m · 건물 앞 {{ CHECKIN_RADIUS }}m 안에서 QR이 떠요</p>
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
        <div style="display:flex; gap:10px; margin-top:12px; width:100%;">
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
          <p class="qr-checkin-title" v-else>현장 QR 인증 시 캐릭터 강화</p>
          <p class="qr-checkin-desc" v-if="!game.checkIns?.[locationId]">
            가게에 붙은 QR을 스캔하면 {{ loc.name }}의 시간 친구가 강화돼요
          </p>
          <p class="qr-checkin-desc" v-else>버디 능력이 강화됐어요</p>
        </div>
      </div>
      <button
        v-if="!game.checkIns?.[locationId]"
        class="qr-scan-btn"
        @click="$router.push('/qrscan?from=' + locationId)"
      >스캔</button>
      <div v-else class="awoken-pill">강화 완료</div>
    </div>

    <!-- 실제 장소 안내 -->
    <div class="real-note-card">
      <span class="msr" style="font-size:16px; color:var(--teal-dark)">info</span>
      <p>{{ loc.realNote }}</p>
    </div>
  </div>
</template>

<style scoped>
/* ── 카메라 도착 화면 ── */
.cam-arrival { background: #1B2330; }
.ca-head {
  position: absolute; left: 0; right: 0; top: 0; z-index: 2;
  display: flex; align-items: center; gap: 8px; padding: 50px 16px 14px;
  background: linear-gradient(#07243EE6, #07243E00);
}
.ca-back { background: none; border: none; cursor: pointer; padding: 0; display: flex; }
.ca-title { font-size: 18px; font-weight: 900; color: white; text-shadow: 0 1px 4px #0008; }
.ca-demo { margin-left: auto; background: var(--orange); color: var(--navy); border-radius: 8px; padding: 2px 8px; font-size: 11px; font-weight: 900; }

.ca-frame {
  position: absolute; left: 50%; top: 150px; width: 260px; height: 300px; margin-left: -130px; z-index: 1;
  display: flex; align-items: center; justify-content: center;
}
.cn { position: absolute; width: 34px; height: 34px; border: 0 solid white; filter: drop-shadow(0 1px 3px #0008); }
.cn.tl { left: 0; top: 0; border-top-width: 4px; border-left-width: 4px; border-top-left-radius: 8px; }
.cn.tr { right: 0; top: 0; border-top-width: 4px; border-right-width: 4px; border-top-right-radius: 8px; }
.cn.bl { left: 0; bottom: 0; border-bottom-width: 4px; border-left-width: 4px; border-bottom-left-radius: 8px; }
.cn.br { right: 0; bottom: 0; border-bottom-width: 4px; border-right-width: 4px; border-bottom-right-radius: 8px; }
.ca-frame-msg {
  max-width: 200px; text-align: center; color: white; font-size: 13px; font-weight: 800;
  line-height: 1.5; word-break: keep-all; text-shadow: 0 1px 4px #000a;
}
.ca-error {
  position: absolute; left: 16px; right: 16px; top: 462px; z-index: 2; text-align: center;
  font-size: 12px; font-weight: 800; color: white;
  background: #D64B5FE6; border-radius: 10px; padding: 6px 10px;
}
.ca-actions { position: absolute; left: 0; right: 0; top: 500px; z-index: 2; display: flex; justify-content: center; gap: 8px; }
.ca-chip {
  border: 2px solid white; background: #0006; color: white; border-radius: 14px; padding: 8px 14px;
  font-family: var(--font); font-size: 13px; font-weight: 800; cursor: pointer;
}
.ca-chip.solid { background: var(--orange); border-color: var(--orange); color: var(--navy); }

.ca-story {
  position: absolute; left: 0; right: 0; bottom: 0; height: 320px; z-index: 2;
  background: #0B2A45F0; border-radius: 24px 24px 0 0; padding: 14px 20px 0;
  box-shadow: 0 -6px 20px #0005; display: flex; flex-direction: column;
}
.ca-peek {
  position: absolute; left: 14px; top: -96px; z-index: 3;
  display: flex; align-items: flex-end; gap: 4px; pointer-events: none;
}
.ca-peek-bubble {
  position: relative; max-width: 220px; margin-bottom: 34px;
  background: var(--white); color: var(--ink); border: 2px solid var(--navy);
  border-radius: 14px 14px 14px 4px; padding: 8px 12px;
  font-size: 12.5px; font-weight: 800; line-height: 1.4; word-break: keep-all;
  box-shadow: 0 4px 12px #0005;
}
.peek-enter-active { transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s; }
.peek-leave-active { transition: transform 0.3s ease-in, opacity 0.3s; }
.peek-enter-from, .peek-leave-to { transform: translateY(40px); opacity: 0; }

.ca-story-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.ca-story-label { font-size: 12px; font-weight: 900; color: var(--orange); letter-spacing: 1px; }
.ca-skip {
  background: #FFFFFF1A; border: none; border-radius: 10px; padding: 5px 10px; cursor: pointer;
  font-family: var(--font); font-size: 12px; font-weight: 800; color: #DCE6F0;
}
.ca-mission {
  margin: 4px 0 16px; height: 50px; border: none; border-radius: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 6px; flex-shrink: 0;
  background: var(--orange); color: var(--navy); font-family: var(--font); font-size: 16px; font-weight: 900;
}
.ca-done { display: flex; flex-direction: column; align-items: center; gap: 6px; color: white; font-size: 14px; font-weight: 900; text-shadow: 0 1px 4px #000a; }
.story-up-enter-active { transition: transform 0.35s ease-out, opacity 0.35s; }
.story-up-enter-from { transform: translateY(60px); opacity: 0; }
.fade-enter-active { transition: opacity 0.3s; }
.fade-enter-from { opacity: 0; }
.ca-story-scroll {
  flex: 1; overflow-y: auto; scrollbar-width: none; padding-bottom: 24px;
  touch-action: none; user-select: none; cursor: grab;
  -webkit-mask-image: linear-gradient(transparent 0, #000 18px, #000 calc(100% - 24px), transparent);
          mask-image: linear-gradient(transparent 0, #000 18px, #000 calc(100% - 24px), transparent);
}
.ca-story-scroll::-webkit-scrollbar { display: none; }
.ca-spacer { height: 70px; }  /* 글이 패널 아래에서 올라오며 시작 */
.ca-line { font-size: 16px; font-weight: 700; color: white; line-height: 1.7; margin: 10px 0 14px; word-break: keep-all; }
.ca-note { font-size: 11px; font-weight: 600; color: #9FB5CA; margin-bottom: 14px; }
.ca-real { font-size: 12px; font-weight: 600; color: #C9D6E3; line-height: 1.6; word-break: keep-all; margin-bottom: 12px; }
.ca-qr-link {
  display: flex; align-items: center; gap: 6px; background: none; border: 1.5px solid #FFFFFF55; border-radius: 12px;
  color: white; padding: 8px 12px; font-family: var(--font); font-size: 12px; font-weight: 800; cursor: pointer; margin-bottom: 8px;
}

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
.checkin-error { font-size: 12px; font-weight: 800; color: #D64B5F; text-align: center; }

.already-done {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; background: var(--sky); border-radius: 22px; padding: 24px;
  font-size: 15px; font-weight: 800; color: var(--ink); text-align: center;
}

.qr-checkin-card {
  margin: 0 16px;
  background: linear-gradient(135deg, #07243E, #1D4E7A);
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
