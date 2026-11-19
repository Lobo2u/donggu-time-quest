import { reactive, watch } from 'vue'
import { WIND_QUEST, WIND_PART_IDS } from '../data/windQuest.js'

// 「대동의 바람을 찾아서」 전용 진행 저장.
// 운영 진행(gameStore)과 섞지 않도록 별도 localStorage 키를 쓴다.
// - 부품 0/3, 재도전해도 중복 지급 없음(불리언 집합), 새로고침 후 복원.
// - 스톱별 완료 방식(현장 관찰 / 사진으로) 구분 저장.
// - 데모(답사 자료 전) 진행이므로 운영 지도·기록에 영향 없음.

const KEY = 'donggu-tq-wind-v1'

function defaults() {
  return {
    started: false,
    parts: { wing: false, base: false, center: false }, // 수집한 부품
    solved: {},        // { [stopId]: true } — 해결한 스톱(상태 표시용)
    mode: {},          // { [stopId]: 'field' | 'photo' } — 완료 방식
    assembled: null,   // { wingColor, wingName, name, at } — 완성한 풍차
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw)
      const base = defaults()
      return {
        ...base, ...p,
        parts: { ...base.parts, ...(p.parts || {}) },
        solved: { ...(p.solved || {}) },
        mode: { ...(p.mode || {}) },
      }
    }
  } catch {}
  return defaults()
}

export const wind = reactive(load())

watch(wind, () => {
  try { localStorage.setItem(KEY, JSON.stringify(wind)) } catch {}
}, { deep: true })

export function startQuest() { wind.started = true }

export function hasPart(partId) { return !!wind.parts[partId] }
export function partsCount() { return WIND_PART_IDS.filter(id => wind.parts[id]).length }
export function allPartsCollected() { return partsCount() >= WIND_PART_IDS.length }
export function isSolved(stopId) { return !!wind.solved[stopId] }
export function completeMode(stopId) { return wind.mode[stopId] || null }

// 스톱 해결 → 부품 지급(중복 없음) + 완료 방식 기록.
export function solveStop(stopId, { reward, mode = 'field' } = {}) {
  wind.solved[stopId] = true
  wind.mode[stopId] = mode
  if (reward) wind.parts[reward] = true // 이미 true 여도 그대로(중복 지급 없음)
}

export function setAssembled(data) {
  wind.assembled = { ...data, at: Date.now() }
}

export function resetQuest() {
  const d = defaults()
  Object.assign(wind, d)
  wind.parts = { ...d.parts }; wind.solved = {}; wind.mode = {}
}

export { WIND_QUEST }
