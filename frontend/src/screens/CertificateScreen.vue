<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { game, courseProgress } from '../store/gameStore.js'
import { COURSES, LOCATIONS } from '../data/gameData.js'

const router = useRouter()
const route = useRoute()
const courseId = route.params.courseId
const course = COURSES[courseId]

if (!course || !courseProgress(courseId).complete) router.replace('/courses')

const today = new Date()
const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`
const certNo = `DTQ-${courseId.toUpperCase().slice(0, 4)}-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`

const shared = ref(false)
async function share() {
  const text = `🏅 동구 TIME QUEST 완주 인증\n${game.player.nickname}님이 "${course.name}" 코스를 완주했어요!\n${course.reward.badge} 뱃지 획득 · ${dateStr}\n#동구 #대전동구 #미션투어`
  if (navigator.share) { try { await navigator.share({ title: '완주 인증서', text }); shared.value = true } catch {} }
  else { await navigator.clipboard.writeText(text).catch(() => {}); shared.value = true }
}
</script>

<template>
  <div class="screen cert-screen" v-if="course">
    <div class="cert-guide no-print">
      <span class="msr" style="font-size:18px; color:var(--orange)">photo_camera</span>
      <span>이 화면을 캡처해 공유하면 완주 자랑이 돼요!</span>
    </div>

    <!-- 인증서 카드 -->
    <div class="certificate">
      <div class="cert-border">
        <div class="cert-seal">
          <span class="msr" style="font-size:36px; color:var(--orange)">workspace_premium</span>
        </div>
        <p class="cert-brand">동구 TIME QUEST</p>
        <p class="cert-head">완 주 인 증 서</p>
        <div class="cert-divider"></div>

        <p class="cert-to">{{ game.player.nickname }} 님</p>
        <p class="cert-body">
          위 탐험가는 <b>{{ course.name }}</b> 코스의<br>
          {{ course.stops.length }}개 미션을 모두 완수하여<br>
          이 인증서를 드립니다.
        </p>

        <!-- 스탬프 -->
        <div class="cert-stamps">
          <div v-for="id in course.stops" :key="id" class="cert-stamp">
            <span class="msr" style="font-size:20px; color:var(--teal)">verified</span>
            <span>{{ LOCATIONS[id]?.name }}</span>
          </div>
        </div>

        <div class="cert-badge">
          <span class="msr" style="font-size:18px; color:var(--orange)">military_tech</span>
          {{ course.reward.badge }}
        </div>

        <div class="cert-foot">
          <div>
            <p class="cf-label">발급일</p>
            <p class="cf-value">{{ dateStr }}</p>
          </div>
          <div style="text-align:right">
            <p class="cf-label">인증번호</p>
            <p class="cf-value" style="font-family:monospace; font-size:10px">{{ certNo }}</p>
          </div>
        </div>
        <p class="cert-issuer">대전 동구 로컬 미션투어 · 동구 TIME QUEST</p>
      </div>
    </div>

    <!-- 버튼 -->
    <div class="cert-actions no-print">
      <button class="btn-primary" style="width:100%" @click="share">
        <span class="msr" style="font-size:20px; color:var(--navy)">share</span>
        {{ shared ? '공유됨 ✓' : '인증서 공유하기' }}
      </button>
      <button class="cert-back" @click="router.push('/courses')">
        <span class="msr" style="font-size:18px">arrow_back</span> 코스로 돌아가기
      </button>
    </div>
  </div>
</template>

<style scoped>
.cert-screen { background: #0A1828; display: flex; flex-direction: column; gap: 14px; padding: 52px 16px 24px; overflow-y: auto; }
.cert-guide { display: flex; align-items: center; gap: 8px; justify-content: center; font-size: 13px; font-weight: 800; color: #9FC1C8; }

.certificate { background: linear-gradient(160deg, #FFFBF0, #FFF3D6); border-radius: 20px; padding: 10px; box-shadow: 0 12px 40px #FF9F1C22; }
.cert-border { border: 2px solid #D4A94C; border-radius: 14px; padding: 24px 20px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
.cert-seal { width: 64px; height: 64px; border-radius: 50%; background: #FFF3D6; border: 3px solid var(--orange); display: flex; align-items: center; justify-content: center; }
.cert-brand { font-size: 11px; font-weight: 900; color: #A67C1A; letter-spacing: 1.5px; margin-top: 4px; }
.cert-head { font-size: 24px; font-weight: 900; color: #3A2A1A; letter-spacing: 4px; }
.cert-divider { width: 60px; height: 3px; background: var(--orange); border-radius: 2px; margin: 4px 0; }
.cert-to { font-size: 22px; font-weight: 900; color: var(--ink); margin-top: 6px; }
.cert-body { font-size: 14px; font-weight: 700; color: #5A4A38; line-height: 1.7; }
.cert-body b { color: var(--orange); }
.cert-stamps { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 8px 0; }
.cert-stamp { display: flex; align-items: center; gap: 4px; background: #FFFFFFAA; border: 1px solid #E0C88C; border-radius: 10px; padding: 5px 10px; font-size: 11px; font-weight: 800; color: var(--ink); }
.cert-badge { display: flex; align-items: center; gap: 6px; background: var(--navy); color: white; border-radius: 12px; padding: 8px 16px; font-size: 14px; font-weight: 900; }
.cert-foot { width: 100%; display: flex; justify-content: space-between; margin-top: 8px; }
.cf-label { font-size: 10px; font-weight: 700; color: #A67C1A; }
.cf-value { font-size: 13px; font-weight: 900; color: #3A2A1A; }
.cert-issuer { font-size: 10px; font-weight: 700; color: #A67C1A; margin-top: 6px; }

.cert-actions { display: flex; flex-direction: column; gap: 8px; }
.cert-back { display: flex; align-items: center; justify-content: center; gap: 6px; background: #FFFFFF14; border: 1px solid #FFFFFF22; border-radius: 14px; height: 46px; font-family: var(--font); font-size: 14px; font-weight: 800; color: #9FC1C8; cursor: pointer; }
</style>
