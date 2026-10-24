<script setup>
import { ref, nextTick, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { BUDDIES, LOCATIONS, BUDDY_QUICK_QUESTIONS, BUDDY_FALLBACKS } from '../data/gameData.js'
import BuddySvg from '../components/BuddySvg.vue'

const router  = useRouter()
const route   = useRoute()
const buddyId = route.params.buddyId
const buddy   = BUDDIES[buddyId]

if (!buddy) router.replace('/collection')

const loc = Object.values(LOCATIONS).find(l => l.buddyId === buddyId)

const messages = ref([
  {
    role: 'buddy',
    text: `안녕하세요! 저는 ${buddy?.name}이에요. ${loc?.name}에 대해 궁금한 게 있으면 물어봐요!`,
  },
])

const input    = ref('')
const loading  = ref(false)
const chatEl   = ref(null)
const buddyMood = ref('happy')
const apiAvail  = ref(true) // 처음엔 낙관적으로 시도

const quickQs = computed(() => BUDDY_QUICK_QUESTIONS[buddyId] ?? [])
const fallbacks = computed(() => BUDDY_FALLBACKS[buddyId] ?? {})

async function sendMessage(text) {
  const msg = (text ?? input.value).trim()
  if (!msg || loading.value) return
  input.value = ''

  messages.value.push({ role: 'user', text: msg })
  loading.value = true
  buddyMood.value = 'idle'
  scrollToBottom()

  let response = ''

  // 백엔드 호출 시도
  if (apiAvail.value) {
    try {
      const res = await fetch('http://localhost:8000/buddy-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buddyId, message: msg }),
        signal: AbortSignal.timeout(6000),
      })
      const data = await res.json()
      if (data.response) {
        response = data.response
      } else {
        apiAvail.value = false
      }
    } catch {
      apiAvail.value = false
    }
  }

  // 폴백: 사전 정의 응답
  if (!response) {
    response = fallbacks.value[msg]
      ?? fallbacks.value['default']
      ?? '...음, 잘 모르겠어요. 다른 걸 물어봐도 돼요!'
  }

  loading.value = false
  buddyMood.value = 'happy'
  messages.value.push({ role: 'buddy', text: response })
  scrollToBottom()
}

async function scrollToBottom() {
  await nextTick()
  chatEl.value?.scrollTo({ top: chatEl.value.scrollHeight, behavior: 'smooth' })
}
</script>

<template>
  <div class="screen chat-screen" v-if="buddy">
    <!-- 헤더 -->
    <div class="chat-header">
      <button class="back-btn" @click="$router.back()">
        <span class="msr" style="font-size:24px; color:white">arrow_back</span>
      </button>
      <div class="header-buddy">
        <BuddySvg :variant="buddy.variant" :mood="buddyMood" :size="44" />
        <div>
          <p class="header-name">{{ buddy.name }}</p>
          <p class="header-loc">{{ loc?.name }}</p>
        </div>
      </div>
      <div class="api-pill" :class="{ offline: !apiAvail }">
        <span class="msr" style="font-size:12px">{{ apiAvail ? 'smart_toy' : 'offline_bolt' }}</span>
        {{ apiAvail ? 'AI 대화' : '사전 응답' }}
      </div>
    </div>

    <!-- API 미설정 안내 -->
    <div class="api-notice" v-if="!apiAvail">
      <span class="msr" style="font-size:14px; color:var(--muted)">info</span>
      <p>백엔드 서버 또는 ANTHROPIC_API_KEY가 없어 사전 준비된 응답으로 대화해요.</p>
    </div>

    <!-- 채팅 메시지 영역 -->
    <div class="chat-messages" ref="chatEl">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="message-row"
        :class="msg.role"
      >
        <!-- 버디 아바타 -->
        <div class="buddy-avatar" v-if="msg.role === 'buddy'">
          <BuddySvg :variant="buddy.variant" mood="idle" :size="32" />
        </div>

        <div class="bubble" :class="msg.role">
          {{ msg.text }}
        </div>
      </div>

      <!-- 로딩 -->
      <div class="message-row buddy" v-if="loading">
        <div class="buddy-avatar">
          <BuddySvg :variant="buddy.variant" mood="idle" :size="32" />
        </div>
        <div class="bubble buddy loading">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
      </div>
    </div>

    <!-- 퀵 질문 -->
    <div class="quick-questions">
      <button
        v-for="q in quickQs"
        :key="q"
        class="quick-chip"
        :disabled="loading"
        @click="sendMessage(q)"
      >{{ q }}</button>
    </div>

    <!-- 입력창 -->
    <div class="chat-input-row">
      <input
        v-model="input"
        class="chat-input"
        :placeholder="`${buddy.name}에게 무엇이든 물어봐요`"
        :disabled="loading"
        @keyup.enter="sendMessage()"
      />
      <button class="send-btn" :disabled="loading || !input.trim()" @click="sendMessage()">
        <span class="msr" style="font-size:22px">send</span>
      </button>
    </div>

    <!-- Claude 사용 안내 -->
    <p class="ai-notice">AI 응답은 캐릭터 기반이며 실제 역사 사실과 다를 수 있어요.</p>
  </div>
</template>

<style scoped>
.chat-screen {
  background: var(--paper);
  display: flex; flex-direction: column; overflow: hidden;
}

.chat-header {
  display: flex; align-items: center; gap: 10px;
  padding: 52px 16px 12px; background: var(--navy);
  flex-shrink: 0;
}
.back-btn { background: none; border: none; cursor: pointer; padding: 0; }
.header-buddy { display: flex; align-items: center; gap: 8px; flex: 1; }
.header-name { font-size: 15px; font-weight: 900; color: var(--white); }
.header-loc  { font-size: 11px; font-weight: 700; color: #9FC1C8; }

.api-pill {
  display: flex; align-items: center; gap: 4px;
  background: var(--teal); color: white; border-radius: 10px;
  padding: 4px 10px; font-size: 11px; font-weight: 900; white-space: nowrap;
}
.api-pill.offline { background: #61788C; }

.api-notice {
  display: flex; align-items: center; gap: 8px;
  background: #F0F7F6; padding: 8px 16px;
  font-size: 11px; font-weight: 700; color: var(--muted);
  line-height: 1.4; word-break: keep-all; flex-shrink: 0;
}

.chat-messages {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 12px;
}

.message-row {
  display: flex; align-items: flex-end; gap: 8px;
}
.message-row.user { flex-direction: row-reverse; }

.buddy-avatar { flex-shrink: 0; margin-bottom: 2px; }

.bubble {
  max-width: 72%; padding: 12px 14px; border-radius: 18px;
  font-size: 14px; font-weight: 700; line-height: 1.5; word-break: keep-all;
}
.bubble.buddy { background: var(--white); color: var(--ink); border-bottom-left-radius: 4px; }
.bubble.user  { background: var(--teal); color: white; border-bottom-right-radius: 4px; }

.bubble.loading {
  display: flex; gap: 4px; align-items: center; padding: 14px 18px;
}
.dot {
  width: 7px; height: 7px; border-radius: 50%; background: var(--muted);
  animation: dot-bounce 1.2s ease-in-out infinite;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes dot-bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40%           { transform: translateY(-6px); }
}

.quick-questions {
  display: flex; gap: 6px; overflow-x: auto; padding: 8px 16px 4px;
  flex-shrink: 0; scrollbar-width: none;
}
.quick-questions::-webkit-scrollbar { display: none; }
.quick-chip {
  white-space: nowrap; background: var(--white); border: 1.5px solid #D4E8E6;
  border-radius: 12px; padding: 7px 12px;
  font-family: var(--font); font-size: 12px; font-weight: 800; color: var(--ink);
  cursor: pointer; flex-shrink: 0; transition: all 0.15s;
}
.quick-chip:not(:disabled):active { background: var(--sky); }
.quick-chip:disabled { opacity: 0.5; cursor: not-allowed; }

.chat-input-row {
  display: flex; gap: 8px; padding: 8px 16px 12px;
  flex-shrink: 0; background: var(--white);
  border-top: 1px solid #E0ECEA;
}
.chat-input {
  flex: 1; background: var(--paper); border: 1.5px solid #D4E8E6;
  border-radius: 14px; padding: 10px 14px;
  font-family: var(--font); font-size: 14px; color: var(--ink); outline: none;
}
.chat-input::placeholder { color: var(--muted); }
.chat-input:focus { border-color: var(--teal); }
.send-btn {
  width: 46px; height: 46px; border-radius: 14px;
  background: var(--teal); border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center; color: white;
  flex-shrink: 0;
}
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.ai-notice {
  text-align: center; font-size: 10px; font-weight: 600;
  color: var(--muted); padding: 4px 16px 8px; flex-shrink: 0;
}
</style>
