<script setup>
// 카메라(렌즈) 화면 목업 — 실제 카메라 대신 장소의 현재 모습 일러스트를 화면 가득 보여 준다.
// 카메라를 쓰는 모든 화면(장소 도착 · 과거 겹치기 · 현장 미션 · 매장 QR)에서 공통으로 쓴다.
import SceneSvg from './SceneSvg.vue'

defineProps({
  variant: { type: String, default: 'sojedom' }, // 장소 id (sojedom | jungang | heredi | indong)
})
</script>

<template>
  <div class="camera-mock" aria-hidden="true">
    <SceneSvg :variant="variant" era="present" fit="slice" />
    <span class="mock-tag">카메라 화면 (목업)</span>
  </div>
</template>

<style scoped>
.camera-mock { position: absolute; inset: 0; overflow: hidden; background: #1B2330; }
.camera-mock :deep(.scene) { width: 100%; height: 100%; filter: saturate(0.9) brightness(0.92); }
/* 렌즈 느낌의 가장자리 어둡게 */
.camera-mock::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 45%, transparent 45%, #0008 100%);
}
.mock-tag {
  position: absolute; right: 10px; top: 10px; z-index: 1;
  background: #0007; color: #FFFFFFCC; border-radius: 8px; padding: 3px 8px;
  font-size: 10px; font-weight: 800;
}
</style>
