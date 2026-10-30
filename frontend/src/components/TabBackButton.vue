<script setup>
// 하단 탭(코스·도감·내 기록) 화면 상단의 뒤로가기.
// 앱 안에서 넘어왔으면 이전 화면으로, 바로 열었으면 지도로.
import { useRouter } from 'vue-router'

const router = useRouter()
function goBack() {
  if (window.history.state?.back) router.back()
  else router.push('/map')
}
</script>

<template>
  <button class="tab-back" aria-label="뒤로 가기" @click="goBack">
    <span class="msr" style="font-size:24px; color:var(--navy)">arrow_back</span>
  </button>
</template>

<style scoped>
.tab-back {
  width: 40px; height: 40px; margin-bottom: 10px;
  display: flex; align-items: center; justify-content: center;
  background: var(--white); border: none; border-radius: 14px;
  box-shadow: var(--shadow); cursor: pointer;
}
</style>
