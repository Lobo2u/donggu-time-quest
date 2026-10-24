<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { game, initPlayer, resetGame } from '../store/gameStore.js'
import BuddySvg from '../components/BuddySvg.vue'

const router = useRouter()
const selectedGuide = ref(game.guide ?? 'majung')

const guides = [
  { id: 'majung', name: '마중이', role: '길 안내', desc: '장소까지 가는 길과 힌트를 알려줘요.' },
  { id: 'jungang', name: '중앙이', role: '단서 해독', desc: '미션 속 단서 해석을 도와줘요.' },
]

function start() {
  initPlayer(selectedGuide.value)
  router.push('/map')
}

function reset() {
  if (confirm('진행 상황을 모두 초기화할까요?')) {
    resetGame()
    selectedGuide.value = 'majung'
  }
}

// 이미 시작했다면 바로 지도로
if (game.initialized) {
  router.replace('/map')
}
</script>

<template>
  <div class="screen welcome-screen">
    <div class="glow-one"></div>
    <div class="glow-two"></div>

    <span class="brand-eyebrow">창작 스토리 · 대전 동구 탐험</span>
    <div class="story-badge">코스 1 / 4</div>

    <h1 class="game-title">동구<br>TIME QUEST</h1>
    <p class="game-slogan">이름을 잃은 지도, 첫 기억을 찾아라</p>

    <!-- 가이드 마스코트 (마중이 · 중앙이) -->
    <div class="char-area">
      <div class="char-box char-majung">
        <BuddySvg variant="majung" mood="happy" :size="86" />
        <span class="char-name">마중이</span>
      </div>
      <div class="char-box char-jungang">
        <BuddySvg variant="jungang" mood="happy" :size="86" />
        <span class="char-name">중앙이</span>
      </div>
    </div>

    <!-- 안내 패널 -->
    <div class="setup-panel">
      <p class="setup-title">오래된 지도에서 장소의 기억이 사라지고 있어요</p>

      <p class="guide-label">탐험 동반자 선택</p>
      <div class="guide-choices">
        <button
          v-for="g in guides"
          :key="g.id"
          class="guide-btn"
          :class="{ active: selectedGuide === g.id }"
          @click="selectedGuide = g.id"
        >
          <span class="msr" style="font-size:18px">{{ g.id === 'majung' ? 'near_me' : 'search' }}</span>
          <div class="guide-info">
            <span class="guide-name">{{ g.name }} · {{ g.role }}</span>
            <span class="guide-desc">{{ g.desc }}</span>
          </div>
        </button>
      </div>

      <div class="demo-note">
        <span class="msr" style="font-size:16px; color:var(--teal)">info</span>
        <span>시연 모드로 시작합니다. 실제 GPS 인증 없이 플레이할 수 있어요.</span>
      </div>
    </div>

    <button class="btn-primary cta-start" @click="start">
      <span class="msr" style="font-size:22px; color:var(--navy)">near_me</span>
      탐험 시작
    </button>

    <button class="reset-btn" @click="reset">초기화</button>

    <p class="creative-note">이 게임의 스토리·캐릭터는 창작입니다. 실제 역사와 다를 수 있어요.</p>
  </div>
</template>

<style scoped>
.welcome-screen {
  background: linear-gradient(180deg, #E8FFFB 0%, #BEEDE7 55%, #0E7B79 100%);
}

.glow-one {
  position: absolute; left: -80px; top: 90px;
  width: 250px; height: 250px;
  background: #FFFFFF66; border-radius: 50%;
}
.glow-two {
  position: absolute; left: 255px; top: 190px;
  width: 180px; height: 180px;
  background: #FFB12644; border-radius: 50%;
}

.brand-eyebrow {
  position: absolute; left: 24px; top: 54px;
  font-size: 12px; font-weight: 800;
  color: var(--teal-dark); letter-spacing: 1.2px;
}

.story-badge {
  position: absolute; right: 24px; top: 54px;
  background: #FFFFFFCC; color: var(--teal-dark);
  font-size: 10px; font-weight: 900;
  border-radius: 14px; padding: 5px 12px;
}

.game-title {
  position: absolute; left: 24px; top: 80px;
  font-size: 40px; font-weight: 900;
  color: var(--navy); line-height: 1.02;
}

.game-slogan {
  position: absolute; left: 24px; top: 174px;
  font-size: 17px; font-weight: 700; color: var(--ink);
}

.char-area {
  position: absolute; left: 16px; top: 210px;
  width: 358px; display: flex; gap: 12px;
}

.char-box {
  flex: 1;
  display: flex; flex-direction: column; align-items: center;
  gap: 6px; padding: 12px 8px;
  border-radius: 24px;
}

.char-majung { background: linear-gradient(135deg, #7CE8D5, #4CB5AB); }
.char-jungang {
  background: linear-gradient(135deg, #D4E8E6, #A8C4C2);
  justify-content: center;
}

.char-question {
  font-size: 64px; line-height: 1; color: #FFFFFF88;
  font-weight: 900;
}

.char-name {
  font-size: 12px; font-weight: 900;
  color: var(--navy); background: #FFFFFFCC;
  border-radius: 10px; padding: 3px 10px;
}

.setup-panel {
  position: absolute; left: 16px; top: 400px; width: 358px;
  background: #FFFFFFEE; border-radius: 26px;
  box-shadow: 0 10px 30px #053C4930;
  padding: 18px; display: flex; flex-direction: column; gap: 12px;
}

.setup-title {
  font-size: 15px; font-weight: 900;
  color: var(--ink); line-height: 1.35; word-break: keep-all;
}

.guide-label {
  font-size: 11px; font-weight: 800; color: var(--muted);
}

.guide-choices { display: flex; gap: 8px; }

.guide-btn {
  flex: 1; display: flex; align-items: center; gap: 8px;
  padding: 10px; border-radius: 16px;
  border: 1.5px solid #C7DADA; background: #EAF3F3;
  font-family: var(--font); cursor: pointer;
  text-align: left; transition: all 0.15s;
}

.guide-btn.active {
  background: var(--navy);
  border-color: var(--orange); border-width: 2px;
  color: var(--white);
}

.guide-btn.active .msr { color: var(--orange); }

.guide-info { display: flex; flex-direction: column; gap: 2px; }
.guide-name { font-size: 12px; font-weight: 800; color: inherit; }
.guide-desc { font-size: 10px; font-weight: 600; color: inherit; opacity: 0.75; word-break: keep-all; }

.demo-note {
  display: flex; align-items: center; gap: 6px;
  background: var(--sky); border-radius: 12px; padding: 8px 10px;
  font-size: 11px; font-weight: 700; color: var(--ink);
  word-break: keep-all; line-height: 1.4;
}

.cta-start {
  position: absolute; left: 24px; top: 698px;
}

.reset-btn {
  position: absolute; left: 0; right: 0; top: 766px;
  background: none; border: none; font-family: var(--font);
  font-size: 11px; font-weight: 700; color: #9FC1C8;
  cursor: pointer; text-align: center;
}

.creative-note {
  position: absolute; left: 24px; top: 792px;
  font-size: 10px; font-weight: 600; color: #EFFFFF;
  word-break: keep-all;
}
</style>
