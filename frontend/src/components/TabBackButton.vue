<script setup>
// 하단 탭(코스·도감·내 기록) 화면 상단의 뒤로가기 — 어디서 왔든 항상 지도로.
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <button class="tab-back" aria-label="지도로 돌아가기" @click="router.push('/map')">
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
