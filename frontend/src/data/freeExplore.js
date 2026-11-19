// 시연용 분류·기준: 방문량 순위나 운영 확정 목록이 아니다.
export const FREE_EXPLORE = Object.freeze({
  categories: Object.freeze({ sojedom: 'popular', jungang: 'popular', heredi: 'hidden', indong: 'hidden' }),
  missions: Object.freeze({ sojedom: 'sojedom-memory', jungang: 'jungang-order', heredi: 'heredi-pattern', indong: 'indong-timeline' }),
  targets: Object.freeze({ popular: 1, hidden: 2 }),
  badge: '동구 자유 탐험 배지',
})

export function freeExploreCategory(id, config = FREE_EXPLORE) {
  return Object.hasOwn(config.categories, id) ? config.categories[id] : undefined
}

export function restoreFreeExplore(saved, config = FREE_EXPLORE) {
  const ids = Array.isArray(saved?.demoCompleted) ? saved.demoCompleted : []
  return {
    demoCompleted: [...new Set(ids.filter(id => typeof id === 'string' && freeExploreCategory(id, config)))],
    demoBadgeClaimed: saved?.demoBadgeClaimed === true,
  }
}

export function freeExploreProgress(state, config = FREE_EXPLORE) {
  const { demoCompleted, demoBadgeClaimed } = restoreFreeExplore(state, config)
  const counts = { popular: 0, hidden: 0 }
  for (const id of demoCompleted) counts[freeExploreCategory(id, config)]++
  const ready = counts.popular >= config.targets.popular && counts.hidden >= config.targets.hidden
  return { counts, ready, claimed: demoBadgeClaimed, completed: demoCompleted }
}

export function recordDemoCompletion(state, id, config = FREE_EXPLORE) {
  const normalized = restoreFreeExplore(state, config)
  if (!freeExploreCategory(id, config) || normalized.demoCompleted.includes(id)) return null
  normalized.demoCompleted.push(id)
  return normalized
}

export function claimDemoBadge(state, config = FREE_EXPLORE) {
  const progress = freeExploreProgress(state, config)
  if (!progress.ready || progress.claimed) return null
  return { demoCompleted: progress.completed, demoBadgeClaimed: true }
}
