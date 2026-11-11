<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import InstallPrompt from './components/InstallPrompt.vue'
import GuideReaction from './components/GuideReaction.vue'
import StoryDialog from './components/StoryDialog.vue'
import { game, initPlayer } from './store/gameStore.js'

// 시작 화면이 없으므로 처음 열면 바로 새 게임으로 시작
if (!game.initialized) initPlayer()

// 화면 맞춤: 앱은 390×844 기준으로 그려져 있어 비율을 유지한 채 확대·축소한다.
// 폰 · 홈 화면 앱(PWA)에서는 틀 없이 화면을 꽉 채우고, PC 에서는 폰 틀 모양으로 창 높이에 맞춘다.
const W = 390, H = 844
const full = ref(false)
const scale = ref(1)
function fit() {
  const vw = window.innerWidth, vh = window.innerHeight
  full.value = vw <= 600 || window.matchMedia('(display-mode: standalone)').matches
  scale.value = full.value
    ? Math.min(vw / W, vh / H)
    : Math.min(1, (vh - 32) / H, (vw - 32) / W)
}
fit()
onMounted(() => window.addEventListener('resize', fit))
onBeforeUnmount(() => window.removeEventListener('resize', fit))
</script>

<template>
  <!-- 휴대폰 화면 틀: 안쪽의 position: fixed 팝업(카메라·대화창 등)이 브라우저 전체가 아니라 이 틀 안에 뜨게 함 -->
  <div class="frame-box" :class="{ full }" :style="{ width: W * scale + 'px', height: H * scale + 'px' }">
    <div class="phone-frame" :style="{ transform: `scale(${scale})` }">
      <RouterView />
      <GuideReaction />
      <StoryDialog />
    </div>
  </div>
  <InstallPrompt />
</template>
