export const TOUR_KEEPSAKES = Object.freeze([
  { id: 'daejeon-station', place: '대전역', name: '출발 승차권', icon: '🎟️' },
  { id: 'woosong', place: '우송대', name: '캠퍼스 스케치 엽서', icon: '🖼️' },
  { id: 'daedongcheon', place: '대동천', name: '푸른 물길 배지', icon: '💧' },
  { id: 'daedong-maeul', place: '대동벽화마을', name: '벽화색 날개', icon: '🪽' },
  { id: 'daedong-sky', place: '대동하늘공원', name: '전망대 풍차 몸체', icon: '🏡' },
].map(Object.freeze))

const PREFIX = 'donggu.experience.keepsake.v1:'

export function earnKeepsake(storage, id) {
  if (!TOUR_KEEPSAKES.some(item => item.id === id)) return false
  try {
    storage.setItem(PREFIX + id, '1')
    return true
  } catch { return false }
}

export function readKeepsakes(storage) {
  try { return TOUR_KEEPSAKES.filter(item => storage.getItem(PREFIX + item.id) === '1') }
  catch { return [] }
}

export function windmillStage(items) {
  const ids = new Set(items.map(item => item.id))
  const blades = ids.has('daedong-maeul')
  const body = ids.has('daedong-sky')
  return { blades, body, complete: blades && body }
}

export function keepsakeStorage() {
  try { return window.localStorage }
  catch { return null }
}
