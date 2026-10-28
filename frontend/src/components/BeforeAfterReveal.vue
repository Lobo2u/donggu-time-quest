<script setup>
import { ref } from 'vue'
import SceneSvg from './SceneSvg.vue'

const props = defineProps({
  variant: { type: String, default: 'sojedom' },
  label: { type: String, default: '' },
})
const emit = defineEmits(['done'])

const pos = ref(50)  // 슬라이더 위치 %
const wrap = ref(null)
let dragging = false

function setFromClientX(clientX) {
  const r = wrap.value.getBoundingClientRect()
  pos.value = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100))
}
function onDown(e) { dragging = true; move(e) }
function onUp() { dragging = false }
function move(e) {
  if (!dragging) return
  const x = e.touches ? e.touches[0].clientX : e.clientX
  setFromClientX(x)
}
</script>

<template>
  <div class="ba-overlay">
    <div class="ba-card">
      <p class="ba-kicker">AI 기억 복원</p>
      <h2 class="ba-title">{{ label }}의 과거가 보여요</h2>
      <p class="ba-sub">손잡이를 좌우로 움직여 과거 ↔ 현재를 비교해요</p>

      <div class="ba-stage" ref="wrap"
        @mousemove="move" @mouseup="onUp" @mouseleave="onUp"
        @touchmove.prevent="move" @touchend="onUp">
        <!-- 현재 (아래 전체) -->
        <div class="ba-layer">
          <SceneSvg :variant="variant" era="present" />
          <span class="ba-tag present">현재</span>
        </div>
        <!-- 과거 (위, 슬라이더로 클립) -->
        <div class="ba-layer past-clip" :style="{ width: pos + '%' }">
          <div class="past-inner" ref="pastInner">
            <SceneSvg :variant="variant" era="past" />
          </div>
          <span class="ba-tag past">1930년대 (재현)</span>
        </div>
        <!-- 손잡이 -->
        <div class="ba-handle" :style="{ left: pos + '%' }"
          @mousedown.prevent="onDown" @touchstart.prevent="onDown">
          <div class="handle-line"></div>
          <div class="handle-knob"><span class="msr" style="font-size:18px; color:var(--navy)">drag_indicator</span></div>
        </div>
      </div>

      <p class="ba-note">※ 역사 재현 일러스트(창작)입니다. 실제 과거 사진이 아니에요.</p>
      <button class="ba-btn" @click="emit('done')">
        <span class="msr" style="font-size:20px; color:var(--navy)">palette</span>
        기억 복원하기
      </button>
    </div>
  </div>
</template>

<style scoped>
.ba-overlay { position: fixed; inset: 0; z-index: 1600; background: #08233Fdd; display: flex; align-items: center; justify-content: center; padding: 20px; }
.ba-card { background: white; border-radius: 24px; padding: 20px; width: 340px; max-width: 100%; display: flex; flex-direction: column; gap: 8px; }
.ba-kicker { font-size: 12px; font-weight: 900; color: var(--orange); letter-spacing: 1.2px; text-align: center; }
.ba-title { font-size: 19px; font-weight: 900; color: var(--ink); text-align: center; word-break: keep-all; }
.ba-sub { font-size: 12px; font-weight: 700; color: var(--muted); text-align: center; }

.ba-stage { position: relative; width: 100%; aspect-ratio: 320/220; border-radius: 16px; overflow: hidden; margin: 6px 0; user-select: none; touch-action: none; border: 2px solid #E0ECEA; }
.ba-layer { position: absolute; inset: 0; }
.ba-layer.past-clip { overflow: hidden; border-right: 3px solid white; }
.past-inner { position: absolute; top: 0; left: 0; height: 100%; aspect-ratio: 320/220; }
.ba-tag { position: absolute; top: 8px; font-size: 10px; font-weight: 900; padding: 3px 8px; border-radius: 8px; color: white; }
.ba-tag.present { right: 8px; background: #0E9F9Acc; }
.ba-tag.past { left: 8px; background: #6E5E42cc; }
.ba-handle { position: absolute; top: 0; bottom: 0; width: 0; display: flex; align-items: center; justify-content: center; cursor: ew-resize; }
.handle-line { position: absolute; top: 0; bottom: 0; width: 3px; background: white; box-shadow: 0 0 6px #0006; }
.handle-knob { width: 34px; height: 34px; border-radius: 50%; background: white; box-shadow: 0 2px 8px #0005; display: flex; align-items: center; justify-content: center; z-index: 2; }

.ba-note { font-size: 10px; font-weight: 600; color: var(--muted); text-align: center; word-break: keep-all; }
.ba-btn { margin-top: 6px; display: flex; align-items: center; justify-content: center; gap: 8px; height: 52px; background: var(--orange); color: var(--navy); border: none; border-radius: 16px; font-family: var(--font); font-size: 16px; font-weight: 900; cursor: pointer; }
</style>
