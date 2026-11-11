import { reactive } from 'vue'
import { game } from './gameStore.js'
import { REACTIONS, pick } from '../data/emotes.js'

// 가이드 마스코트(마중이/중앙이) 말풍선 리액션 — GuideReaction 컴포넌트가 표시
export const reaction = reactive({ visible: false, emote: 'idle', text: '', key: 0 })

let timer = null

// kind: REACTIONS 의 키 (arrive | wrong | correct | win)
export function react(kind, ms = 2200) {
  const r = REACTIONS[kind]
  if (!r || !game.initialized) return
  const who = game.guide ?? 'majung'
  const lines = r.lines[who] ?? r.lines.majung
  reaction.emote = pick(r.emote, who)
  reaction.text = lines[Math.floor(Math.random() * lines.length)]
  reaction.key++
  reaction.visible = true
  clearTimeout(timer)
  timer = setTimeout(() => { reaction.visible = false }, ms)
}
