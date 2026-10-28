<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { game, leaderboard, setNickname, playerScore } from '../store/gameStore.js'

const router = useRouter()
const board = computed(() => leaderboard())
const editing = ref(false)
const nameInput = ref(game.player.nickname)

function saveNick() {
  setNickname(nameInput.value)
  editing.value = false
}
function medal(rank) {
  return { 1: '🥇', 2: '🥈', 3: '🥉' }[rank] ?? null
}
</script>

<template>
  <div class="screen ranking-screen">
    <div class="rk-header">
      <button class="back-btn" @click="router.push('/courses')">
        <span class="msr" style="font-size:24px; color:white">arrow_back</span>
      </button>
      <div>
        <p class="rk-eyebrow">LEADERBOARD</p>
        <h1 class="rk-title">탐험가 랭킹</h1>
      </div>
    </div>

    <!-- 내 점수 카드 -->
    <div class="my-card">
      <div class="my-top">
        <div class="my-nick-row">
          <template v-if="!editing">
            <span class="my-nick">{{ game.player.nickname }}</span>
            <button class="edit-btn" @click="editing = true; nameInput = game.player.nickname">
              <span class="msr" style="font-size:16px; color:#9FC1C8">edit</span>
            </button>
          </template>
          <template v-else>
            <input v-model="nameInput" class="nick-input" maxlength="12" @keyup.enter="saveNick" />
            <button class="save-btn" @click="saveNick">저장</button>
          </template>
        </div>
        <span class="my-rank">{{ board.find(e => e.isMe)?.rank }}위</span>
      </div>
      <div class="my-score">{{ playerScore() }}<span>점</span></div>
      <p class="score-note">점수 = 단서조각×3 + 완주코스×50 + 동료×20 + 레벨×10</p>
    </div>

    <!-- 랭킹 리스트 -->
    <div class="rk-list">
      <div v-for="e in board" :key="e.name + e.rank" class="rk-item" :class="{ me: e.isMe }">
        <div class="rk-rank">
          <span v-if="medal(e.rank)" class="medal">{{ medal(e.rank) }}</span>
          <span v-else class="rank-num">{{ e.rank }}</span>
        </div>
        <span class="rk-name">{{ e.name }}<span v-if="e.isMe" class="me-tag">나</span></span>
        <span class="rk-score">{{ e.score }}점</span>
      </div>
    </div>

    <p class="rk-note">※ 데모 랭킹입니다. 실제 서비스에서는 전체 참여자 집계로 대체됩니다.</p>
    <div style="height: 20px"></div>
  </div>
</template>

<style scoped>
.ranking-screen { background: var(--paper); overflow-y: auto; display: flex; flex-direction: column; gap: 14px; padding-bottom: 20px; }
.rk-header { display: flex; align-items: center; gap: 12px; padding: 52px 20px 12px; background: var(--navy); }
.back-btn { background: none; border: none; cursor: pointer; }
.rk-eyebrow { font-size: 11px; font-weight: 900; color: var(--teal); letter-spacing: 1.4px; }
.rk-title { font-size: 24px; font-weight: 900; color: white; }

.my-card { margin: 0 16px; background: linear-gradient(135deg, var(--orange), #FF8A00); border-radius: 20px; padding: 18px; }
.my-top { display: flex; justify-content: space-between; align-items: center; }
.my-nick-row { display: flex; align-items: center; gap: 6px; }
.my-nick { font-size: 16px; font-weight: 900; color: var(--navy); }
.edit-btn { background: #08233F22; border: none; border-radius: 8px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.nick-input { width: 110px; border: none; border-radius: 8px; padding: 6px 10px; font-family: var(--font); font-size: 14px; font-weight: 800; color: var(--ink); outline: none; }
.save-btn { background: var(--navy); color: white; border: none; border-radius: 8px; padding: 6px 12px; font-family: var(--font); font-size: 12px; font-weight: 800; cursor: pointer; }
.my-rank { font-size: 20px; font-weight: 900; color: var(--navy); }
.my-score { font-size: 40px; font-weight: 900; color: var(--navy); line-height: 1.1; }
.my-score span { font-size: 16px; margin-left: 4px; }
.score-note { font-size: 10px; font-weight: 700; color: #7A4A0E; margin-top: 2px; }

.rk-list { margin: 0 16px; display: flex; flex-direction: column; gap: 6px; }
.rk-item { display: flex; align-items: center; gap: 12px; background: var(--white); border-radius: 14px; padding: 12px 14px; }
.rk-item.me { background: var(--sky); border: 2px solid var(--teal); }
.rk-rank { width: 32px; display: flex; justify-content: center; }
.medal { font-size: 20px; }
.rank-num { font-size: 15px; font-weight: 900; color: var(--muted); }
.rk-name { flex: 1; font-size: 15px; font-weight: 800; color: var(--ink); display: flex; align-items: center; gap: 6px; }
.me-tag { background: var(--teal); color: white; border-radius: 6px; padding: 1px 7px; font-size: 10px; font-weight: 900; }
.rk-score { font-size: 15px; font-weight: 900; color: var(--teal-dark); }
.rk-note { font-size: 10px; font-weight: 700; color: var(--muted); text-align: center; padding: 0 16px; word-break: keep-all; }
</style>
