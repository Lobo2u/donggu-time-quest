<script setup>
// 카메라 위 옛 모습 겹치기 — byeol-night 'AR 뮤지컬'의 카메라 + 위치 맞추기 방식을 옮김.
// 카메라 화면(목업: 장소의 현재 모습) 위에 과거 재현 일러스트를 반투명하게 겹치고,
// '위치 맞추기'를 켜면 손가락으로 옮기기/크기 조절해 실제 건물에 맞춘다.
import { ref } from 'vue'
import SceneSvg from './SceneSvg.vue'
import CameraMock from './CameraMock.vue'
import { useFit } from '../composables/useFit.js'

const props = defineProps({
  variant: { type: String, default: 'sojedom' },
  label:   { type: String, default: '' },
})
const emit = defineEmits(['close'])


const opacity = ref(0.6)
const aligning = ref(false)
const fit = useFit(aligning)

</script>

<template>
  <div class="past-cam">
    <CameraMock :variant="variant" />

    <!-- 상단: 닫기 · 장소 · 위치 맞추기 -->
    <div class="pc-head">
      <button class="pc-round" aria-label="닫기" @click="emit('close')">
        <span class="msr" style="font-size:22px; color:white">close</span>
      </button>
      <div class="pc-pill">{{ label }} · 1930년대 (재현)</div>
      <button class="pc-pill line" :class="{ on: aligning }" @click="aligning = !aligning">
        {{ aligning ? '맞추기 완료' : '위치 맞추기' }}
      </button>
    </div>
    <p class="pc-hint">{{ aligning ? '한 손가락으로 옮기고, 두 손가락으로 크기를 맞춰요' : '건물을 화면에 담고 옛 모습과 겹쳐 봐요' }}</p>

    <!-- 겹친 과거 장면 -->
    <div class="pc-scene" :class="{ aligning }" :style="[fit.style.value, { opacity }]" v-on="fit.handlers">
      <SceneSvg :variant="variant" era="past" />
    </div>

    <!-- 하단: 투명도 · 안내 -->
    <div class="pc-foot">
      <label class="pc-slider">
        <span>현재</span>
        <input type="range" min="0.15" max="1" step="0.05" v-model.number="opacity" aria-label="옛 모습 진하기" />
        <span>과거</span>
      </label>
      <p class="pc-note">※ 역사 재현 일러스트(창작)입니다. 실제 과거 사진이 아니에요.</p>
      <button class="pc-done" @click="emit('close')">다 봤어요</button>
    </div>
  </div>
</template>

<style scoped>
.past-cam { position: fixed; inset: 0; z-index: 1700; background: #1B2330; overflow: hidden; }
.pc-head {
  position: absolute; left: 12px; right: 12px; top: 16px; z-index: 2;
  display: flex; align-items: center; gap: 8px;
}
.pc-round {
  width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer;
  background: #0008; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.pc-pill {
  background: #0B2A45E6; color: white; border-radius: 16px; padding: 8px 12px;
  font-family: var(--font); font-size: 12px; font-weight: 900; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; min-width: 0;
}
.pc-pill.line { margin-left: auto; border: 2px solid var(--orange); background: #0008; cursor: pointer; flex-shrink: 0; }
.pc-pill.line.on { background: var(--orange); color: var(--navy); }
.pc-hint {
  position: absolute; left: 0; right: 0; top: 66px; z-index: 2; text-align: center;
  color: white; font-size: 12px; font-weight: 800; text-shadow: 0 1px 4px #000a;
}

.pc-scene {
  position: absolute; left: 50%; top: 42%; width: 320px; margin-left: -160px; margin-top: -110px;
  border-radius: 12px; overflow: hidden; touch-action: none; transform-origin: center;
}
.pc-scene.aligning { outline: 2px dashed var(--orange); outline-offset: 4px; cursor: move; }

.pc-foot {
  position: absolute; left: 12px; right: 12px; bottom: 16px; z-index: 2;
  background: #0B2A45E6; border-radius: 20px; padding: 14px; box-shadow: var(--shadow);
  display: flex; flex-direction: column; gap: 8px;
}
.pc-slider { display: flex; align-items: center; gap: 10px; color: white; font-size: 12px; font-weight: 800; }
.pc-slider input { flex: 1; accent-color: var(--orange); }
.pc-note { font-size: 10px; font-weight: 600; color: #BFD3E6; text-align: center; word-break: keep-all; }
.pc-done {
  height: 48px; border: none; border-radius: 14px; cursor: pointer;
  background: var(--orange); color: var(--navy); font-family: var(--font); font-size: 15px; font-weight: 900;
}
</style>
