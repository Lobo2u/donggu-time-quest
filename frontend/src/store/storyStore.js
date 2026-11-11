import { reactive } from 'vue'
import { game } from './gameStore.js'
import { STORIES } from '../data/story.js'

// 하단 대화창(StoryDialog) 상태
export const story = reactive({ open: false, id: null, lines: [], index: 0 })

// 아직 본 적 없는 스토리면 띄우고 true, 이미 봤으면 false (force 로 다시 보기)
export function playStory(id, { force = false } = {}) {
  const lines = STORIES[id]
  if (!lines?.length) return false
  if (!force && game.seenStories.includes(id)) return false
  if (!game.seenStories.includes(id)) game.seenStories.push(id)
  story.id = id
  story.lines = lines
  story.index = 0
  story.open = true
  return true
}

export function nextLine() {
  if (story.index < story.lines.length - 1) story.index++
  else closeStory()
}

export function closeStory() {
  story.open = false
}
