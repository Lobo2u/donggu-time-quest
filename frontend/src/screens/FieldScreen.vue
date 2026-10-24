<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentStep = ref(1)

const steps = [
  { label: '1 도착' },
  { label: '2 인증' },
  { label: '3 단서' },
  { label: '4 퍼즐' },
]
</script>

<template>
  <div class="screen field-screen">
    <!-- Mission header -->
    <div class="mission-header">
      <button class="back-btn" @click="router.push('/map')">
        <span class="msr" style="font-size:26px; color: var(--navy)">arrow_back</span>
      </button>
      <span class="header-title">소제동 · 조각 A 관찰</span>
      <span class="msr" style="font-size:26px; color: var(--teal)">shield</span>
    </div>

    <!-- Safety notice -->
    <div class="safety-notice">
      <span class="msr" style="font-size:28px; color: var(--orange)">front_hand</span>
      <div class="safety-texts">
        <span class="safety-headline">안전한 곳에 멈춘 뒤 관찰하세요</span>
        <span class="safety-sub">GPS·QR은 구현 전 UI이며 다른 이용자 위치를 공개하지 않아요.</span>
      </div>
    </div>

    <!-- Mission steps progress -->
    <div class="mission-steps">
      <div
        v-for="(step, i) in steps"
        :key="i"
        class="step-item"
      >
        <div
          class="step-circle"
          :style="{ background: i < currentStep ? 'var(--teal)' : '#D4E2E3' }"
        ></div>
        <span
          class="step-label"
          :style="{ color: i < currentStep ? 'var(--ink)' : 'var(--muted)', fontWeight: i < currentStep ? '800' : '700' }"
        >{{ step.label }}</span>
      </div>
    </div>

    <!-- Verification options -->
    <div class="verify-options">
      <div class="verify-btn">
        <span class="msr" style="font-size:20px; color: var(--teal-dark)">my_location</span>
        <span>위치 확인</span>
      </div>
      <div class="verify-btn">
        <span class="msr" style="font-size:20px; color: var(--teal-dark)">qr_code_scanner</span>
        <span>QR 인증</span>
      </div>
    </div>

    <!-- Clue puzzle card -->
    <div class="clue-card">
      <span class="example-badge">창작 미션 예시 · 역사 자료 미사용</span>
      <h3 class="puzzle-title">안전한 관찰 지점에서<br>같은 형태와 색의 문양을 찾아요.</h3>

      <!-- Visual clue area -->
      <div class="visual-clue">
        <span class="msr" style="font-size:80px; color: var(--teal); position:absolute; left:88px; top:24px">roofing</span>
        <div class="clue-shard"></div>
      </div>

      <!-- Action buttons -->
      <div class="clue-actions">
        <button class="action-btn">
          <span class="msr" style="font-size:18px; color: var(--teal-dark)">image_search</span>
          단서 보기
        </button>
        <button class="action-btn">
          <span class="msr" style="font-size:18px; color: var(--teal-dark)">lightbulb</span>
          힌트
        </button>
        <button class="action-btn">
          <span class="msr" style="font-size:18px; color: var(--teal-dark)">replay</span>
          재도전
        </button>
      </div>
    </div>

    <!-- Character hint -->
    <div class="char-hint">
      <div class="hint-char">🐧</div>
      <p class="hint-dialogue">마중이: "시설은 만지지 말고, 보이는 모습만 살펴봐!"</p>
    </div>

    <!-- Check answer button -->
    <button class="btn-primary check-btn" @click="router.push('/complete')">
      <span class="msr" style="font-size:22px; color: var(--navy)">check_circle</span>
      단서 확인
    </button>

    <!-- Save and exit -->
    <button class="save-exit-btn" @click="router.push('/map')">
      <span class="msr" style="font-size:17px; color: var(--teal-dark)">save</span>
      저장 후 나가기
    </button>
  </div>
</template>

<style scoped>
.field-screen {
  background: var(--paper);
  padding: 52px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  overflow-y: auto;
}

.mission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
}

.header-title {
  font-size: 18px;
  font-weight: 900;
  color: var(--ink);
}

.safety-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--navy);
  border-radius: 18px;
  padding: 14px;
}

.safety-texts {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.safety-headline {
  font-size: 14px;
  font-weight: 900;
  color: var(--white);
}

.safety-sub {
  font-size: 10px;
  color: #BFD9DE;
  line-height: 1.4;
  word-break: keep-all;
}

.mission-steps {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.step-circle {
  width: 25px; height: 25px;
  border-radius: 50%;
  flex-shrink: 0;
}

.step-label {
  font-size: 11px;
}

.verify-options {
  display: flex;
  gap: 10px;
}

.verify-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 48px;
  background: #E1F3F1;
  border: 1px solid #B8DCD9;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 800;
  color: var(--ink);
  cursor: pointer;
}

.clue-card {
  background: var(--white);
  border-radius: 24px;
  border: 1px solid #D4E8E6;
  box-shadow: 0 7px 20px #08233F1F;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.example-badge {
  font-size: 11px;
  font-weight: 800;
  color: var(--orange);
}

.puzzle-title {
  font-size: 20px;
  font-weight: 900;
  color: var(--ink);
  line-height: 1.35;
}

.visual-clue {
  width: 100%;
  height: 150px;
  background: #DFF7F4;
  border-radius: 18px;
  position: relative;
  overflow: hidden;
}

.clue-shard {
  position: absolute;
  left: 226px; top: 42px;
  width: 42px; height: 42px;
  background: var(--orange);
  border-radius: 50%;
  box-shadow: 0 0 16px #FF9F1C88;
}

.clue-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 42px;
  background: #EEF6F5;
  border: none;
  border-radius: 13px;
  font-family: var(--font);
  font-size: 12px;
  font-weight: 800;
  color: var(--ink);
  cursor: pointer;
}

.char-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--orange-soft);
  border-radius: 18px;
  padding: 7px 12px;
  height: 62px;
}

.hint-char {
  font-size: 36px;
  line-height: 1;
  flex-shrink: 0;
}

.hint-dialogue {
  font-size: 12px;
  font-weight: 800;
  color: var(--ink);
  line-height: 1.4;
}

.check-btn {
  width: 100%;
  margin-top: 4px;
}

.save-exit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 34px;
  background: var(--white);
  border: 1px solid var(--teal);
  border-radius: 12px;
  font-family: var(--font);
  font-size: 11px;
  font-weight: 800;
  color: var(--ink);
  cursor: pointer;
}
</style>
