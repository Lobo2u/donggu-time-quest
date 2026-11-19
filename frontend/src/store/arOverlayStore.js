import { reactive } from 'vue'

// 관리자(운영자)가 저작한 장소별 AR '과거 겹치기' 자료.
// byeol-night '카메라 위 옛 모습 겹치기'에서 겹칠 이미지/영상을 관리자가 직접 올려 저장한다.
// 제작은 전부 앱 안(브라우저)에서 이뤄지고 외부 도구를 쓰지 않는다.
// 실제 서비스에서는 백엔드 업로드로 대체. 현재는 localStorage 데모.

const AR_KEY = 'donggu-tq-ar-overlays-v1'

export const LOCATION_IDS = ['sojedom', 'jungang', 'heredi', 'indong']
export const LOCATION_NAMES = {
  sojedom: '소제동', jungang: '중앙시장', heredi: '한의약거리', indong: '인동시장',
}

function load() {
  try {
    const raw = localStorage.getItem(AR_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {} // { [variant]: { src, kind: 'image'|'video', opacity, x, y, s, updated } }
}

export const arOverlays = reactive(load())

function persist() {
  try {
    localStorage.setItem(AR_KEY, JSON.stringify(arOverlays))
  } catch {
    // dataURL 이 커서 localStorage 용량(≈5MB)을 넘으면 저장 실패
    throw new Error('저장 공간이 부족합니다. 더 작은 사진/영상을 사용해 주세요.')
  }
}

export function getOverlay(variant) {
  return arOverlays[variant] || null
}

export function saveOverlay(variant, data) {
  arOverlays[variant] = { ...data, updated: Date.now() }
  persist()
}

export function clearOverlay(variant) {
  delete arOverlays[variant]
  persist()
}
