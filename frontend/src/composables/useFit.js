// "위치 맞추기": 카메라 위에 겹친 그림을 실제 건물에 맞춤 — byeol-night ui/useFit.js 를 Vue 로 옮김.
// 한 손가락 = 옮기기, 두 손가락 = 크기. enabled 가 false 면 손가락 입력을 무시.
import { reactive, computed } from 'vue'

export function useFit(enabled, initial) {
  const fit = reactive({ x: 0, y: 0, s: 1, ...(initial || {}) })
  const pts = new Map()
  let drag = null

  function down(e) {
    if (!enabled.value) return
    e.currentTarget.setPointerCapture(e.pointerId)
    pts.set(e.pointerId, [e.clientX, e.clientY])
    drag = { fit: { ...fit }, start: [...pts.values()].map(p => [...p]) }
  }
  function move(e) {
    if (!enabled.value || !drag || !pts.has(e.pointerId)) return
    pts.set(e.pointerId, [e.clientX, e.clientY])
    const now = [...pts.values()]
    const { fit: f0, start } = drag
    if (now.length >= 2 && start.length >= 2) {
      const d = a => Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1])
      fit.s = Math.min(2.5, Math.max(0.4, f0.s * (d(now) / d(start))))
    } else {
      fit.x = f0.x + now[0][0] - start[0][0]
      fit.y = f0.y + now[0][1] - start[0][1]
    }
  }
  function up(e) { pts.delete(e.pointerId); drag = null }

  return {
    state: fit, // { x, y, s } — 저장/복원용(관리자 저작 화면)
    style: computed(() => ({ transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.s})` })),
    handlers: { pointerdown: down, pointermove: move, pointerup: up, pointercancel: up },
  }
}
