import { reactive, watch } from 'vue'

// 운영자/분석용 이벤트 로그 (플레이어 게임 상태와 분리)
// 실제 서비스에서는 백엔드 집계로 대체. 현재는 localStorage 데모.

const STATS_KEY = 'donggu-tq-stats-v1'

const LOCATION_IDS = ['sojedom', 'jungang', 'heredi', 'indong']
const LOCATION_NAMES = {
  sojedom: '소제동', jungang: '중앙시장', heredi: '한의약거리', indong: '인동시장',
}

function load() {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { events: [] } // [{ type, locationId, ts }]
}

export const stats = reactive(load())

watch(
  () => stats.events.length,
  () => { try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)) } catch {} },
)

// 이벤트 종류: visit(방문/도착) · awaken(QR강화) · coupon(쿠폰발급) · collect(버디수집)
export function track(type, locationId) {
  stats.events.push({ type, locationId, ts: Date.now() })
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)) } catch {}
}

export function clearStats() {
  stats.events = []
  try { localStorage.removeItem(STATS_KEY) } catch {}
}

// ── 집계 ─────────────────────────────────────────────────────────────────────

export function totals() {
  const t = { visit: 0, awaken: 0, coupon: 0, collect: 0 }
  for (const e of stats.events) if (t[e.type] !== undefined) t[e.type]++
  return t
}

// 장소별 방문 수 (인기도)
export function byLocation(type = 'visit') {
  const m = Object.fromEntries(LOCATION_IDS.map(id => [id, 0]))
  for (const e of stats.events) if (e.type === type && m[e.locationId] !== undefined) m[e.locationId]++
  return LOCATION_IDS.map(id => ({ id, name: LOCATION_NAMES[id], count: m[id] }))
}

// 최근 7일 일자별 방문 추이
export function dailyTrend(days = 7) {
  const now = new Date()
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i); d.setHours(0, 0, 0, 0)
    const start = d.getTime(), end = start + 86400000
    const count = stats.events.filter(e => e.type === 'visit' && e.ts >= start && e.ts < end).length
    out.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, count })
  }
  return out
}

// 시간대별 분포 (0~23시)
export function hourlyDistribution() {
  const h = Array(24).fill(0)
  for (const e of stats.events) if (e.type === 'visit') h[new Date(e.ts).getHours()]++
  return h
}

// 전환 퍼널: 방문 → 강화 → 쿠폰
export function funnel() {
  const t = totals()
  return [
    { stage: '장소 방문', count: t.visit },
    { stage: '현장 강화(QR)', count: t.awaken },
    { stage: '쿠폰 발급', count: t.coupon },
  ]
}

// ── 발표용 시드 데이터 ────────────────────────────────────────────────────────
// 지난 7일간 현실적인 방문 패턴을 생성 (점심·주말 피크 반영)
export function seedDemoData() {
  clearStats()
  const now = Date.now()
  const popularity = { sojedom: 1.0, jungang: 1.4, heredi: 0.7, indong: 0.5 } // 중앙시장 인기
  const events = []

  for (let day = 6; day >= 0; day--) {
    const base = new Date(now); base.setDate(base.getDate() - day)
    const weekend = [0, 6].includes(base.getDay())
    const dayVisitors = Math.round((weekend ? 38 : 22) * (0.8 + Math.random() * 0.4))

    for (let v = 0; v < dayVisitors; v++) {
      // 시간대: 11~14시, 17~19시 피크
      const hourPool = [10, 11, 11, 12, 12, 13, 13, 14, 15, 16, 17, 18, 18, 19, 20]
      const hour = hourPool[Math.floor(Math.random() * hourPool.length)]
      const ts = new Date(base); ts.setHours(hour, Math.floor(Math.random() * 60), 0, 0)

      // 방문 장소 선택 (인기도 가중)
      const weighted = []
      for (const id of LOCATION_IDS) for (let k = 0; k < popularity[id] * 10; k++) weighted.push(id)
      const locId = weighted[Math.floor(Math.random() * weighted.length)]

      events.push({ type: 'visit', locationId: locId, ts: ts.getTime() })
      // 방문자 중 일부가 강화(QR) → 그 중 일부가 쿠폰
      if (Math.random() < 0.62) {
        events.push({ type: 'awaken', locationId: locId, ts: ts.getTime() + 60000 })
        events.push({ type: 'collect', locationId: locId, ts: ts.getTime() + 30000 })
        if (Math.random() < 0.48) events.push({ type: 'coupon', locationId: locId, ts: ts.getTime() + 120000 })
      }

      // 도보 동선: 진입 지점부터 코스를 따라 이어 걷기 (연속 확률 감소)
      let idx = LOCATION_IDS.indexOf(locId)
      let t = ts.getTime() + 15 * 60000
      while (idx < LOCATION_IDS.length - 1 && Math.random() < 0.56) {
        const from = LOCATION_IDS[idx], to = LOCATION_IDS[idx + 1]
        events.push({ type: 'segment', from, to, ts: t })
        events.push({ type: 'visit', locationId: to, ts: t + 60000 })
        idx++; t += 20 * 60000
      }
    }
  }
  events.sort((a, b) => a.ts - b.ts)
  stats.events = events
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)) } catch {}
}

// 도보 동선: 코스 연속 구간별 통행량 + 전환율
const COURSE_PATH = ['sojedom', 'jungang', 'heredi', 'indong']
export function segmentFlow() {
  const visitByLoc = Object.fromEntries(LOCATION_IDS.map(id => [id, 0]))
  const segCount = {}
  for (const e of stats.events) {
    if (e.type === 'visit') visitByLoc[e.locationId] = (visitByLoc[e.locationId] || 0) + 1
    if (e.type === 'segment') { const k = `${e.from}>${e.to}`; segCount[k] = (segCount[k] || 0) + 1 }
  }
  const out = []
  for (let i = 0; i < COURSE_PATH.length - 1; i++) {
    const from = COURSE_PATH[i], to = COURSE_PATH[i + 1]
    const flow = segCount[`${from}>${to}`] || 0
    const rate = visitByLoc[from] ? Math.round(flow / visitByLoc[from] * 100) : 0
    out.push({ from, to, fromName: LOCATION_NAMES[from], toName: LOCATION_NAMES[to], flow, rate })
  }
  return out
}

// 도시재생 인사이트 (가장 전환율 낮은 구간 = 개선 필요)
export function flowInsight() {
  const segs = segmentFlow().filter(s => s.flow > 0)
  if (!segs.length) return null
  const weak = [...segs].sort((a, b) => a.rate - b.rate)[0]
  return {
    weakSegment: `${weak.fromName} → ${weak.toName}`,
    weakRate: weak.rate,
    suggestion: `${weak.fromName}–${weak.toName} 구간 전환율이 낮아요. 보행 환경 개선(가로등·쉼터·안내 사인)이 필요한 구간입니다.`,
  }
}

export { LOCATION_NAMES }
