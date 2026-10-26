import { reactive } from 'vue'

// 현장 타깃의 기준 사진 해시 저장 (운영자가 등록, localStorage 데모)
// 실제 서비스에서는 백엔드에 장소별 기준 이미지/해시를 둔다.
const KEY = 'dtq-photo-refs-v1'

function load() {
  try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r) } catch {}
  return {}
}

export const photoRefs = reactive(load())  // { [targetCode]: hashHex }

export function setRef(code, hashHex) {
  photoRefs[code] = hashHex
  try { localStorage.setItem(KEY, JSON.stringify(photoRefs)) } catch {}
}
export function clearRef(code) {
  delete photoRefs[code]
  try { localStorage.setItem(KEY, JSON.stringify(photoRefs)) } catch {}
}
export function hasRef(code) { return !!photoRefs[code] }
