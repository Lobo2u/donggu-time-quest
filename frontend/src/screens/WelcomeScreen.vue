<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const selectedGuide = ref('majung')
const selectedDiff = ref('intro')
</script>

<template>
  <div class="screen welcome-screen">
    <!-- Ambient glows -->
    <div class="glow-one"></div>
    <div class="glow-two"></div>

    <!-- Eyebrow + badge -->
    <span class="brand-eyebrow">창작 스토리 시안 · 사라진 동구의 하루</span>
    <div class="story-badge">도입 1 / 3</div>

    <!-- Game title -->
    <h1 class="game-title">동구<br>TIME QUEST</h1>
    <p class="game-slogan">이름을 잃은 지도, 첫 기억을 찾아라</p>

    <!-- Skip button -->
    <button class="skip-btn" @click="router.push('/map')">건너뛰기</button>

    <!-- Character illustrations -->
    <div class="char-majung">🐧</div>
    <div class="char-jungang">🏪</div>

    <!-- Explorer setup panel -->
    <div class="setup-panel">
      <p class="setup-title">오래된 지도에서 장소의 기억이 사라지고 있어요</p>

      <div class="choices">
        <button
          class="choice"
          :class="{ active: selectedGuide === 'majung' }"
          @click="selectedGuide = 'majung'"
        >
          <span class="msr" style="font-size:20px; color: inherit">near_me</span>
          <span>마중이 · 길 안내</span>
        </button>
        <button
          class="choice"
          :class="{ active: selectedGuide === 'jungang' }"
          @click="selectedGuide = 'jungang'"
        >
          <span class="msr" style="font-size:20px; color: inherit">search</span>
          <span>중앙이 · 단서 해독</span>
        </button>
      </div>

      <div class="difficulty-row">
        <span class="diff-label">저장된 탐험</span>
        <div class="diff-chips">
          <button
            class="chip"
            :class="{ active: selectedDiff === 'resume' }"
            @click="selectedDiff = 'resume'"
          >이어 보기</button>
          <button
            class="chip"
            :class="{ active: selectedDiff === 'intro' }"
            @click="selectedDiff = 'intro'"
          >도입 다시 보기</button>
        </div>
      </div>
    </div>

    <!-- CTA buttons -->
    <button class="btn-primary cta" @click="router.push('/map')">
      <span class="msr" style="font-size:22px; color: var(--navy)">near_me</span>
      현장 탐험 시작
    </button>
    <button class="btn-secondary cta" style="top: 724px">
      <span class="msr" style="font-size:22px">language</span>
      온라인 탐험
    </button>

    <p class="online-note">건너뛰기·다시 보기 제공 · 위치 권한 없이 온라인 이용 가능</p>
  </div>
</template>

<style scoped>
.welcome-screen {
  background: linear-gradient(180deg, #E8FFFB 0%, #BEEDE7 55%, #0E7B79 100%);
}

.glow-one {
  position: absolute;
  left: -80px; top: 90px;
  width: 250px; height: 250px;
  background: #FFFFFF66;
  border-radius: 50%;
}

.glow-two {
  position: absolute;
  left: 255px; top: 190px;
  width: 180px; height: 180px;
  background: #FFB12644;
  border-radius: 50%;
}

.brand-eyebrow {
  position: absolute;
  left: 24px; top: 54px;
  font-size: 12px;
  font-weight: 800;
  color: var(--teal-dark);
  letter-spacing: 1.2px;
}

.story-badge {
  position: absolute;
  right: 24px; top: 54px;
  background: #FFFFFFCC;
  color: var(--teal-dark);
  font-size: 10px;
  font-weight: 900;
  border-radius: 14px;
  padding: 5px 12px;
  white-space: nowrap;
}

.game-title {
  position: absolute;
  left: 24px; top: 80px;
  font-size: 40px;
  font-weight: 900;
  color: var(--navy);
  line-height: 1.02;
}

.game-slogan {
  position: absolute;
  left: 24px; top: 174px;
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
}

.skip-btn {
  position: absolute;
  left: 306px; top: 194px;
  background: none;
  border: none;
  font-family: var(--font);
  font-size: 11px;
  font-weight: 900;
  color: var(--teal-dark);
  cursor: pointer;
}

.char-majung {
  position: absolute;
  left: 22px; top: 218px;
  width: 180px; height: 190px;
  background: linear-gradient(135deg, #7CE8D5, #4CB5AB);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 90px;
  box-shadow: 0 10px 22px #07475233;
}

.char-jungang {
  position: absolute;
  left: 188px; top: 230px;
  width: 180px; height: 178px;
  background: linear-gradient(135deg, #FFDDA0, #FFA940);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 86px;
  box-shadow: 0 10px 22px #07475233;
}

.setup-panel {
  position: absolute;
  left: 16px; top: 430px;
  width: 358px;
  background: #FFFFFFEE;
  border-radius: 26px;
  box-shadow: 0 10px 30px #053C4930;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setup-title {
  font-size: 16px;
  font-weight: 900;
  color: var(--ink);
  line-height: 1.35;
  word-break: keep-all;
}

.choices {
  display: flex;
  gap: 10px;
}

.choice {
  flex: 1;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 16px;
  border: 1px solid #C7DADA;
  background: #EAF3F3;
  color: var(--ink);
  font-family: var(--font);
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.choice.active {
  background: var(--navy);
  border-color: var(--orange);
  border-width: 2px;
  color: var(--white);
}

.difficulty-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.diff-label {
  font-size: 13px;
  font-weight: 800;
  color: var(--ink);
}

.diff-chips {
  display: flex;
  gap: 6px;
}

.chip {
  background: #EAF3F3;
  color: var(--muted);
  border: none;
  border-radius: 12px;
  padding: 7px 14px;
  font-family: var(--font);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.chip.active {
  background: var(--orange);
  color: var(--navy);
}

.btn-primary.cta {
  position: absolute;
  left: 24px; top: 660px;
}

.btn-secondary.cta {
  position: absolute;
  left: 24px; top: 724px;
}

.online-note {
  position: absolute;
  left: 45px; top: 792px;
  font-size: 11px;
  font-weight: 600;
  color: #EFFFFF;
}
</style>
