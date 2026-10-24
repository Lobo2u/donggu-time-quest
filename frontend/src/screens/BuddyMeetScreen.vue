<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { completeMission } from '../store/gameStore.js'
import { BUDDIES, LOCATIONS } from '../data/gameData.js'
import BuddySvg from '../components/BuddySvg.vue'

const router = useRouter()
const route = useRoute()
const buddyId = route.params.buddyId
const buddy = BUDDIES[buddyId]

if (!buddy) router.replace('/map')

// Find which location this buddy belongs to
const locationId = Object.values(LOCATIONS).find(l => l.buddyId === buddyId)?.id
const loc = locationId ? LOCATIONS[locationId] : null

// ── 만남 단계 ─────────────────────────────────────────────────────────────────
// phase: 'peek' | 'bonding' | 'success'
const phase = ref('peek')
const bondingStep = ref(0)
const trustLevel = ref(0)
const wrongChoice = ref(null)  // 오답 시 힌트 표시
const buddyMood = ref('idle')
const selectedChoice = ref(null)
const showResult = ref(false)  // 선택 결과 잠깐 표시

const currentStep = computed(() => buddy.bondingSteps[bondingStep.value])

function startBonding() {
  phase.value = 'bonding'
  buddyMood.value = 'shy'
}

function selectChoice(choice, choiceIndex) {
  if (showResult.value) return
  selectedChoice.value = choiceIndex
  showResult.value = true

  if (choice.correct) {
    wrongChoice.value = null
    buddyMood.value = bondingStep.value === 2 ? 'excited' : 'happy'

    setTimeout(() => {
      trustLevel.value++
      showResult.value = false
      selectedChoice.value = null

      if (bondingStep.value < buddy.bondingSteps.length - 1) {
        bondingStep.value++
        buddyMood.value = 'shy'
      } else {
        // 교감 완료
        phase.value = 'success'
        buddyMood.value = 'excited'
        completeMission(locationId, buddyId)
      }
    }, 1200)
  } else {
    buddyMood.value = 'shy'
    wrongChoice.value = choice.hint

    setTimeout(() => {
      showResult.value = false
      selectedChoice.value = null
    }, 1800)
  }
}

function goReward() {
  router.push('/complete')
}
</script>

<template>
  <div class="screen meet-screen">

    <!-- 만남 페이즈 → 소조가 등장 -->
    <div v-if="phase === 'peek'" class="peek-phase">
      <div class="peek-bg"></div>

      <div class="discovery-text">
        <p class="discovery-kicker">시간 친구 발견!</p>
        <h2 class="discovery-title">저기… 뭔가 움직여요!</h2>
        <p class="discovery-sub">소제동 골목 어딘가에서 작은 빛이 깜빡이고 있어요.</p>
      </div>

      <div class="buddy-reveal">
        <div class="buddy-glow"></div>
        <BuddySvg mood="shy" :size="140" :variant="buddy.variant" />
      </div>

      <div class="peek-info">
        <div class="buddy-name-card">
          <span class="buddy-question">???</span>
          <p class="buddy-hint">{{ loc?.name ?? '소제동' }}의 시간 친구가 나타났어요</p>
        </div>
      </div>

      <button class="btn-primary meet-cta" @click="startBonding">
        <span class="msr" style="font-size:22px; color:var(--navy)">favorite</span>
        조심스럽게 다가가기
      </button>
    </div>

    <!-- 교감 페이즈 -->
    <div v-else-if="phase === 'bonding'" class="bonding-phase">
      <!-- 신뢰 게이지 -->
      <div class="trust-header">
        <button class="back-btn" @click="phase = 'peek'; buddyMood = 'idle'">
          <span class="msr" style="font-size:22px; color:var(--muted)">arrow_back</span>
        </button>
        <div class="trust-bar-wrap">
          <span class="trust-label">신뢰도</span>
          <div class="trust-track">
            <TransitionGroup name="trust-fill" tag="div" class="trust-fill-wrap">
              <div
                v-for="n in buddy.bondingSteps.length"
                :key="n"
                class="trust-segment"
                :class="{ filled: n <= trustLevel }"
              ></div>
            </TransitionGroup>
          </div>
          <span class="trust-count">{{ trustLevel }} / {{ buddy.bondingSteps.length }}</span>
        </div>
      </div>

      <!-- 버디 표시 -->
      <div class="buddy-display" :class="{ wrong: wrongChoice }">
        <div class="buddy-glow-sm"></div>
        <BuddySvg :mood="buddyMood" :size="120" :variant="buddy.variant" />

        <!-- 버디 반응 버블 -->
        <Transition name="bubble">
          <div class="reaction-bubble" v-if="showResult && selectedChoice !== null">
            <span v-if="currentStep.choices[selectedChoice].correct" class="reaction-ok">
              {{ currentStep.choices[selectedChoice].reaction }}
            </span>
            <span v-else class="reaction-fail">
              {{ currentStep.choices[selectedChoice].hint }}
            </span>
          </div>
        </Transition>
      </div>

      <!-- 현재 상황 -->
      <div class="situation-card">
        <p class="situation-text">{{ currentStep.situation }}</p>
        <p class="question-text">{{ currentStep.question }}</p>
      </div>

      <!-- 선택지 -->
      <div class="choices-list">
        <button
          v-for="(choice, i) in currentStep.choices"
          :key="i"
          class="choice-btn"
          :class="{
            correct: showResult && choice.correct && selectedChoice === i,
            wrong:   showResult && !choice.correct && selectedChoice === i,
            disabled: showResult,
          }"
          :disabled="showResult"
          @click="selectChoice(choice, i)"
        >
          <div class="choice-icon">
            <span class="msr" style="font-size:18px">
              {{ showResult && selectedChoice === i ? (choice.correct ? 'check_circle' : 'cancel') : 'radio_button_unchecked' }}
            </span>
          </div>
          <span class="choice-label">{{ choice.label }}</span>
        </button>
      </div>

      <!-- 진행 표시 -->
      <div class="step-dots">
        <div
          v-for="n in buddy.bondingSteps.length"
          :key="n"
          class="step-dot"
          :class="{ active: n - 1 === bondingStep, done: n - 1 < bondingStep }"
        ></div>
      </div>
    </div>

    <!-- 성공 페이즈 -->
    <div v-else-if="phase === 'success'" class="success-phase">
      <div class="success-bg"></div>

      <p class="success-kicker">동료 영입!</p>
      <h2 class="success-title">{{ buddy.name }}가<br>동료가 되었어요!</h2>

      <div class="success-buddy">
        <div class="success-glow"></div>
        <BuddySvg mood="excited" :size="150" :variant="buddy.variant" />
      </div>

      <div class="buddy-profile-card">
        <div class="profile-header">
          <div>
            <h3 class="profile-name">{{ buddy.name }}</h3>
            <p class="profile-subtitle">{{ buddy.subtitle }}</p>
          </div>
          <div class="profile-location">
            <span class="msr" style="font-size:14px; color:var(--teal)">location_on</span>
            <span>{{ buddy.location }}</span>
          </div>
        </div>
        <p class="profile-desc">{{ buddy.description }}</p>
        <div class="profile-ability">
          <span class="msr" style="font-size:16px; color:var(--orange)">auto_fix_high</span>
          <div>
            <span class="ability-name">{{ buddy.ability.name }}</span>
            <span class="ability-desc">{{ buddy.ability.description }}</span>
          </div>
        </div>
      </div>

      <button class="btn-primary success-btn" @click="goReward">
        <span class="msr" style="font-size:22px; color:var(--navy)">auto_stories</span>
        도감에 등록하기
      </button>
    </div>
  </div>
</template>

<style scoped>
.meet-screen {
  background: linear-gradient(180deg, #062B48 0%, #087D79 70%, #E7FFF9 100%);
  overflow-y: auto;
}

/* ── Peek Phase ── */
.peek-phase {
  display: flex; flex-direction: column;
  align-items: center; padding: 52px 24px 32px; gap: 20px; min-height: 844px;
}
.peek-bg {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 60%, #0E9F9A22 0%, transparent 70%);
}
.discovery-text { text-align: center; z-index: 1; }
.discovery-kicker { font-size: 12px; font-weight: 900; color: var(--orange); letter-spacing: 1.4px; }
.discovery-title { font-size: 26px; font-weight: 900; color: var(--white); margin: 6px 0; }
.discovery-sub { font-size: 14px; font-weight: 700; color: #A8D8D4; word-break: keep-all; }

.buddy-reveal { position: relative; margin: 20px 0; z-index: 1; }
.buddy-glow {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 180px; height: 180px; border-radius: 50%;
  background: radial-gradient(#7CE1D944, transparent 70%);
  animation: pulse-glow 2s ease-in-out infinite alternate;
}

.peek-info { z-index: 1; width: 100%; }
.buddy-name-card {
  background: #FFFFFF18; border: 1px solid #FFFFFF33;
  border-radius: 18px; padding: 14px; text-align: center;
}
.buddy-question { font-size: 28px; font-weight: 900; color: #FFFFFF88; display: block; }
.buddy-hint { font-size: 13px; font-weight: 700; color: #A8D8D4; margin-top: 4px; }

.meet-cta { z-index: 1; }

/* ── Bonding Phase ── */
.bonding-phase {
  display: flex; flex-direction: column; gap: 14px;
  padding: 52px 16px 24px; min-height: 844px;
}
.trust-header {
  display: flex; align-items: center; gap: 10px;
}
.back-btn { background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0; }
.trust-bar-wrap { flex: 1; display: flex; align-items: center; gap: 8px; }
.trust-label { font-size: 11px; font-weight: 800; color: #A8D8D4; white-space: nowrap; }
.trust-track { flex: 1; display: flex; gap: 4px; }
.trust-fill-wrap { display: flex; gap: 4px; width: 100%; }
.trust-segment {
  flex: 1; height: 8px; border-radius: 4px; background: #FFFFFF22;
  transition: background 0.4s;
}
.trust-segment.filled { background: var(--teal); }
.trust-count { font-size: 11px; font-weight: 800; color: #A8D8D4; white-space: nowrap; }

.buddy-display {
  display: flex; align-items: center; justify-content: center;
  position: relative; padding: 16px 0;
  transition: transform 0.3s;
}
.buddy-display.wrong { animation: shake 0.4s ease; }
.buddy-glow-sm {
  position: absolute;
  width: 140px; height: 140px; border-radius: 50%;
  background: radial-gradient(#7CE1D933, transparent 70%);
}

.reaction-bubble {
  position: absolute; top: 0; right: 20px;
  background: var(--white); border-radius: 18px 18px 18px 4px;
  padding: 10px 14px; max-width: 180px;
  box-shadow: 0 4px 16px #00000022;
  font-size: 12px; font-weight: 700; line-height: 1.4; word-break: keep-all;
}
.reaction-ok { color: var(--teal-dark); }
.reaction-fail { color: #D64B5F; }

.situation-card {
  background: #FFFFFF18; border: 1px solid #FFFFFF22;
  border-radius: 20px; padding: 16px;
  display: flex; flex-direction: column; gap: 6px;
}
.situation-text { font-size: 13px; font-weight: 700; color: #A8D8D4; line-height: 1.4; }
.question-text { font-size: 17px; font-weight: 900; color: var(--white); word-break: keep-all; }

.choices-list { display: flex; flex-direction: column; gap: 8px; }
.choice-btn {
  display: flex; align-items: center; gap: 12px;
  width: 100%; padding: 14px 16px;
  background: #FFFFFF14; border: 1.5px solid #FFFFFF22;
  border-radius: 16px; font-family: var(--font); cursor: pointer;
  transition: all 0.15s; text-align: left;
}
.choice-btn:not(:disabled):active { transform: scale(0.97); }
.choice-btn.disabled { cursor: not-allowed; }
.choice-btn.correct { background: #0E9F9A33; border-color: var(--teal); }
.choice-btn.wrong   { background: #D64B5F22; border-color: #D64B5F; }
.choice-icon .msr { color: #7CE1D9; }
.choice-btn.correct .msr { color: var(--teal); }
.choice-btn.wrong .msr   { color: #D64B5F; }
.choice-label { font-size: 15px; font-weight: 800; color: var(--white); word-break: keep-all; }

.step-dots { display: flex; justify-content: center; gap: 8px; padding: 4px 0; }
.step-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #FFFFFF33; transition: all 0.3s;
}
.step-dot.active { background: var(--orange); width: 20px; border-radius: 4px; }
.step-dot.done   { background: var(--teal); }

/* ── Success Phase ── */
.success-phase {
  display: flex; flex-direction: column;
  align-items: center; padding: 52px 24px 32px; gap: 16px; min-height: 844px;
}
.success-bg {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 40%, #FF9F1C18 0%, transparent 60%);
}
.success-kicker { font-size: 12px; font-weight: 900; color: var(--orange); letter-spacing: 1.4px; }
.success-title { font-size: 28px; font-weight: 900; color: var(--white); text-align: center; line-height: 1.2; }
.success-buddy { position: relative; }
.success-glow {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 200px; height: 200px; border-radius: 50%;
  background: radial-gradient(#FF9F1C33, transparent 70%);
  animation: pulse-glow 1.5s ease-in-out infinite alternate;
}

.buddy-profile-card {
  background: #FFFFFFF2; border-radius: 24px; padding: 18px; width: 100%;
  display: flex; flex-direction: column; gap: 10px;
}
.profile-header { display: flex; justify-content: space-between; align-items: flex-start; }
.profile-name { font-size: 22px; font-weight: 900; color: var(--ink); }
.profile-subtitle { font-size: 12px; font-weight: 700; color: var(--muted); }
.profile-location {
  display: flex; align-items: center; gap: 2px;
  font-size: 11px; font-weight: 800; color: var(--teal);
}
.profile-desc { font-size: 13px; font-weight: 700; color: var(--ink); line-height: 1.5; word-break: keep-all; }
.profile-ability {
  display: flex; align-items: flex-start; gap: 8px;
  background: var(--orange-soft); border-radius: 14px; padding: 10px 12px;
}
.ability-name { font-size: 12px; font-weight: 900; color: var(--ink); display: block; }
.ability-desc { font-size: 11px; font-weight: 600; color: var(--muted); display: block; }

.success-btn { width: 100%; }

/* Animations */
@keyframes pulse-glow {
  from { transform: translate(-50%, -50%) scale(0.95); opacity: 0.6; }
  to   { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25%       { transform: translateX(-6px); }
  75%       { transform: translateX(6px); }
}

.bubble-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.bubble-enter-from   { opacity: 0; transform: scale(0.7) translateY(10px); }
.bubble-leave-active { transition: opacity 0.2s; }
.bubble-leave-to     { opacity: 0; }

.trust-fill-enter-active { transition: background 0.4s; }
</style>
