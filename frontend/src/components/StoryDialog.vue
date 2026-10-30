<script setup>
// 스토리·튜토리얼 대화창: 화면 하단 텍스트 상자 + 왼쪽 위 모서리에 걸친 마스코트
// 대사는 한 글자씩 출력되고, 탭하면 (출력 중이면 전체 표시 →) 다음 대사로 넘어간다.
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { story, nextLine, closeStory } from '../store/storyStore.js'
import { game } from '../store/gameStore.js'
import { MASCOTS, pick } from '../data/emotes.js'
import MascotSvg from './MascotSvg.vue'

const TYPE_MS = 35

// 말하는 사람은 플레이어가 고른 동반자 한 명
const line = computed(() => {
  const raw = story.lines[story.index]
  if (!raw) return null
  const who = game.guide ?? 'majung'
  return { who, emote: pick(raw.emote, who), text: pick(raw.text, who) }
})
const shown = ref('')
const typing = computed(() => !!line.value && shown.value.length < line.value.text.length)

let timer = null
function startTyping() {
  clearInterval(timer)
  shown.value = ''
  const text = line.value?.text ?? ''
  timer = setInterval(() => {
    shown.value = text.slice(0, shown.value.length + 1)
    if (shown.value.length >= text.length) clearInterval(timer)
  }, TYPE_MS)
}

watch(() => story.open && `${story.id}:${story.index}`, (v) => { if (v) startTyping() }, { immediate: true })
onBeforeUnmount(() => clearInterval(timer))

function advance() {
  if (typing.value) {
    clearInterval(timer)
    shown.value = line.value.text
  } else {
    nextLine()
  }
}
</script>

<template>
  <Transition name="story-fade">
    <div class="story-layer" v-if="story.open && line" @click="advance">
      <div class="story-box">
        <div class="story-portrait">
          <MascotSvg :character="line.who" :mood="line.emote" :size="92" />
        </div>
        <span class="story-name" :class="line.who">{{ MASCOTS[line.who]?.name }}</span>
        <button class="story-skip" @click.stop="closeStory">건너뛰기</button>

        <p class="story-text">{{ shown }}<span v-if="typing" class="caret"></span></p>

        <span class="story-next" v-if="!typing">
          {{ story.index < story.lines.length - 1 ? '▼' : '닫기' }}
        </span>
        <span class="story-count">{{ story.index + 1 }} / {{ story.lines.length }}</span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.story-layer {
  position: fixed; inset: 0; z-index: 1000;
  background: linear-gradient(to top, #0008 0%, #0003 40%, transparent 70%);
  display: flex; align-items: flex-end; justify-content: center;
  padding: 0 12px calc(16px + env(safe-area-inset-bottom));
  cursor: pointer; user-select: none;
}
.story-box {
  position: relative; width: 100%; max-width: 480px; min-height: 132px;
  background: var(--white); border: 3px solid var(--navy); border-radius: 18px;
  padding: 30px 18px 30px; box-shadow: 0 8px 24px #0004;
}
.story-portrait {
  position: absolute; left: 6px; top: -100px;
  animation: pop-in 0.25s ease-out;
}
.story-name {
  position: absolute; left: 100px; top: -15px;
  padding: 4px 14px; border-radius: 12px;
  font-size: 13px; font-weight: 900; color: var(--white);
  background: #1F2D55;
}
.story-name.jungang { background: #E8463C; }
.story-skip {
  position: absolute; right: 10px; top: 8px;
  background: none; border: none; cursor: pointer;
  font-family: var(--font); font-size: 11px; font-weight: 800; color: var(--muted);
}
.story-text {
  font-size: 15px; font-weight: 700; line-height: 1.6; color: var(--ink);
  word-break: keep-all; white-space: pre-line;
}
.caret {
  display: inline-block; width: 2px; height: 1em; margin-left: 2px;
  background: var(--ink); vertical-align: -2px; animation: blink 0.8s step-end infinite;
}
.story-next {
  position: absolute; right: 16px; bottom: 10px;
  font-size: 12px; font-weight: 900; color: var(--navy);
  animation: nudge 0.9s ease-in-out infinite;
}
.story-count {
  position: absolute; left: 18px; bottom: 10px;
  font-size: 10px; font-weight: 800; color: var(--muted);
}

@keyframes blink { 50% { opacity: 0; } }
@keyframes nudge { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(3px); } }
@keyframes pop-in { from { transform: translateY(10px) scale(0.9); opacity: 0; } to { transform: none; opacity: 1; } }

.story-fade-enter-active, .story-fade-leave-active { transition: opacity 0.2s ease; }
.story-fade-enter-from, .story-fade-leave-to { opacity: 0; }
</style>
