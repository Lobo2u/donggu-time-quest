<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { stats, totals, byLocation, dailyTrend, funnel, hourlyDistribution, seedDemoData, clearStats } from '../store/statsStore.js'

const router = useRouter()

const t = computed(() => totals())
const locBars = computed(() => byLocation('visit'))
const trend = computed(() => dailyTrend(7))
const funnelData = computed(() => funnel())
const hourly = computed(() => hourlyDistribution())
const hasData = computed(() => stats.events.length > 0)

const maxLoc = computed(() => Math.max(1, ...locBars.value.map(l => l.count)))
const maxTrend = computed(() => Math.max(1, ...trend.value.map(d => d.count)))
const maxHour = computed(() => Math.max(1, ...hourly.value))

// 전환율
const conversionRate = computed(() => {
  const f = funnelData.value
  return f[0].count ? Math.round(f[1].count / f[0].count * 100) : 0
})
const couponRate = computed(() => {
  const f = funnelData.value
  return f[1].count ? Math.round(f[2].count / f[1].count * 100) : 0
})

const topLocation = computed(() => {
  const sorted = [...locBars.value].sort((a, b) => b.count - a.count)
  return sorted[0]?.count ? sorted[0].name : '-'
})

const peakHour = computed(() => {
  let max = 0, idx = 0
  hourly.value.forEach((v, i) => { if (v > max) { max = v; idx = i } })
  return max ? `${idx}시` : '-'
})

const statCards = computed(() => [
  { label: '총 방문', value: t.value.visit, icon: 'person_pin_circle', color: '#FF9F1C' },
  { label: '현장 강화', value: t.value.awaken, icon: 'auto_awesome', color: '#0E9F9A' },
  { label: '쿠폰 발급', value: t.value.coupon, icon: 'local_offer', color: '#D64B5F' },
  { label: '버디 수집', value: t.value.collect, icon: 'pets', color: '#673AB7' },
])

const locColors = ['#FF9F1C', '#0E9F9A', '#8BC34A', '#673AB7']

function barColor(i) { return locColors[i % locColors.length] }
</script>

<template>
  <div class="screen dashboard-screen">
    <!-- 헤더 -->
    <div class="dash-header">
      <div>
        <p class="dash-eyebrow">OPERATOR DASHBOARD</p>
        <h1 class="dash-title">운영 현황</h1>
      </div>
      <button class="close-btn" @click="router.push('/map')">
        <span class="msr" style="font-size:24px; color:white">close</span>
      </button>
    </div>

    <div class="dash-body">
      <!-- 데이터 없을 때 -->
      <div v-if="!hasData" class="empty-state">
        <span class="msr" style="font-size:48px; color:#9FC1C8">bar_chart</span>
        <p class="empty-title">아직 집계된 데이터가 없어요</p>
        <p class="empty-sub">발표용 시연 데이터를 생성하거나, 게임을 플레이하면 방문 기록이 쌓여요.</p>
        <button class="btn-seed" @click="seedDemoData">
          <span class="msr" style="font-size:20px">auto_graph</span>
          시연 데이터 생성 (지난 7일)
        </button>
      </div>

      <template v-else>
        <!-- 핵심 지표 카드 -->
        <div class="stat-grid">
          <div v-for="c in statCards" :key="c.label" class="stat-card">
            <div class="stat-icon" :style="{ background: c.color + '22' }">
              <span class="msr" :style="{ fontSize: '22px', color: c.color }">{{ c.icon }}</span>
            </div>
            <div class="stat-num">{{ c.value.toLocaleString() }}</div>
            <div class="stat-label">{{ c.label }}</div>
          </div>
        </div>

        <!-- 인사이트 요약 -->
        <div class="insight-row">
          <div class="insight">
            <span class="ins-label">최다 방문지</span>
            <span class="ins-value">{{ topLocation }}</span>
          </div>
          <div class="insight">
            <span class="ins-label">피크 시간</span>
            <span class="ins-value">{{ peakHour }}</span>
          </div>
          <div class="insight">
            <span class="ins-label">강화 전환율</span>
            <span class="ins-value">{{ conversionRate }}%</span>
          </div>
        </div>

        <!-- 전환 퍼널 -->
        <div class="panel">
          <p class="panel-title">전환 퍼널 · 방문에서 쿠폰까지</p>
          <div class="funnel">
            <div v-for="(f, i) in funnelData" :key="f.stage" class="funnel-row">
              <span class="funnel-stage">{{ f.stage }}</span>
              <div class="funnel-bar-wrap">
                <div class="funnel-bar"
                  :style="{ width: (funnelData[0].count ? f.count / funnelData[0].count * 100 : 0) + '%',
                            background: locColors[i] }">
                  <span class="funnel-count">{{ f.count.toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>
          <p class="panel-note">쿠폰 전환율 {{ couponRate }}% · 현장 방문이 실제 상점 유입으로 이어집니다</p>
        </div>

        <!-- 장소별 인기도 -->
        <div class="panel">
          <p class="panel-title">장소별 방문 수</p>
          <div class="bars">
            <div v-for="(l, i) in locBars" :key="l.id" class="bar-row">
              <span class="bar-name">{{ l.name }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: (l.count / maxLoc * 100) + '%', background: barColor(i) }"></div>
              </div>
              <span class="bar-val">{{ l.count }}</span>
            </div>
          </div>
        </div>

        <!-- 일자별 추이 -->
        <div class="panel">
          <p class="panel-title">최근 7일 방문 추이</p>
          <div class="trend-chart">
            <div v-for="d in trend" :key="d.label" class="trend-col">
              <div class="trend-bar-wrap">
                <div class="trend-bar" :style="{ height: (d.count / maxTrend * 100) + '%' }">
                  <span class="trend-val">{{ d.count }}</span>
                </div>
              </div>
              <span class="trend-label">{{ d.label }}</span>
            </div>
          </div>
        </div>

        <!-- 시간대 분포 -->
        <div class="panel">
          <p class="panel-title">시간대별 방문 분포</p>
          <div class="hour-chart">
            <div v-for="(v, h) in hourly" :key="h" class="hour-col"
              :style="{ height: (v / maxHour * 100) + '%' }"
              :title="`${h}시: ${v}명`"></div>
          </div>
          <div class="hour-axis"><span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>23시</span></div>
        </div>

        <!-- 파트너십 가치 -->
        <div class="pitch-panel">
          <p class="pitch-title">🤝 파트너십 가치 제안</p>
          <p class="pitch-text">
            게임 플레이어가 <strong>{{ t.visit.toLocaleString() }}회</strong> 현장을 방문하고,
            그중 <strong>{{ conversionRate }}%</strong>가 강화 인증,
            <strong>{{ t.coupon.toLocaleString() }}건</strong>의 쿠폰이 발급됐습니다.
            방문 데이터를 기반으로 지역 상점과 성과 기반 파트너십을 확장할 수 있습니다.
          </p>
        </div>

        <!-- 데이터 관리 -->
        <div class="data-tools">
          <button class="tool-btn" @click="seedDemoData">
            <span class="msr" style="font-size:16px">refresh</span>
            시연 데이터 재생성
          </button>
          <button class="tool-btn danger" @click="clearStats">
            <span class="msr" style="font-size:16px">delete</span>
            데이터 초기화
          </button>
        </div>

        <p class="demo-disclaimer">※ 현재 데이터는 localStorage 기반 데모입니다. 실제 서비스에서는 백엔드 집계로 대체됩니다.</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dashboard-screen {
  background: var(--paper);
  display: flex; flex-direction: column; overflow: hidden;
}

.dash-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 52px 20px 16px; background: var(--navy); flex-shrink: 0;
}
.dash-eyebrow { font-size: 11px; font-weight: 900; color: var(--teal); letter-spacing: 1.4px; }
.dash-title { font-size: 24px; font-weight: 900; color: var(--white); margin-top: 2px; }
.close-btn { background: #FFFFFF18; border: none; border-radius: 12px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

.dash-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 48px 24px; text-align: center;
}
.empty-title { font-size: 16px; font-weight: 900; color: var(--ink); }
.empty-sub { font-size: 13px; font-weight: 600; color: var(--muted); word-break: keep-all; line-height: 1.5; }
.btn-seed {
  margin-top: 12px; display: flex; align-items: center; gap: 8px;
  background: var(--orange); color: var(--navy); border: none; border-radius: 14px;
  padding: 12px 20px; font-family: var(--font); font-size: 14px; font-weight: 800; cursor: pointer;
}

/* 지표 카드 */
.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.stat-card {
  background: var(--white); border-radius: 18px; padding: 14px;
  display: flex; flex-direction: column; gap: 6px; box-shadow: 0 4px 14px #08233F0D;
}
.stat-icon { width: 38px; height: 38px; border-radius: 11px; display: flex; align-items: center; justify-content: center; }
.stat-num { font-size: 26px; font-weight: 900; color: var(--ink); line-height: 1; }
.stat-label { font-size: 12px; font-weight: 700; color: var(--muted); }

/* 인사이트 */
.insight-row { display: flex; gap: 8px; }
.insight {
  flex: 1; background: var(--navy); border-radius: 14px; padding: 10px 12px;
  display: flex; flex-direction: column; gap: 2px;
}
.ins-label { font-size: 10px; font-weight: 700; color: #9FC1C8; }
.ins-value { font-size: 16px; font-weight: 900; color: var(--orange); }

/* 패널 공통 */
.panel { background: var(--white); border-radius: 18px; padding: 16px; box-shadow: 0 4px 14px #08233F0D; }
.panel-title { font-size: 13px; font-weight: 900; color: var(--ink); margin-bottom: 12px; }
.panel-note { font-size: 11px; font-weight: 700; color: var(--teal-dark); margin-top: 10px; word-break: keep-all; }

/* 퍼널 */
.funnel { display: flex; flex-direction: column; gap: 8px; }
.funnel-row { display: flex; align-items: center; gap: 10px; }
.funnel-stage { font-size: 11px; font-weight: 800; color: var(--muted); width: 84px; flex-shrink: 0; }
.funnel-bar-wrap { flex: 1; background: #EEF3F3; border-radius: 8px; overflow: hidden; }
.funnel-bar { height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: flex-end; padding: 0 10px; min-width: 40px; transition: width 0.5s; }
.funnel-count { font-size: 12px; font-weight: 900; color: white; }

/* 가로 막대 */
.bars { display: flex; flex-direction: column; gap: 10px; }
.bar-row { display: flex; align-items: center; gap: 10px; }
.bar-name { font-size: 12px; font-weight: 800; color: var(--ink); width: 70px; flex-shrink: 0; }
.bar-track { flex: 1; height: 20px; background: #EEF3F3; border-radius: 6px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 6px; transition: width 0.5s; }
.bar-val { font-size: 12px; font-weight: 900; color: var(--muted); width: 34px; text-align: right; }

/* 일자 추이 */
.trend-chart { display: flex; align-items: flex-end; gap: 8px; height: 120px; }
.trend-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; }
.trend-bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; }
.trend-bar {
  width: 100%; background: linear-gradient(180deg, var(--teal), var(--teal-dark));
  border-radius: 6px 6px 0 0; min-height: 4px; position: relative; transition: height 0.5s;
  display: flex; align-items: flex-start; justify-content: center;
}
.trend-val { font-size: 10px; font-weight: 900; color: white; margin-top: 3px; }
.trend-label { font-size: 10px; font-weight: 700; color: var(--muted); }

/* 시간대 */
.hour-chart { display: flex; align-items: flex-end; gap: 2px; height: 70px; }
.hour-col { flex: 1; background: var(--orange); border-radius: 2px 2px 0 0; min-height: 2px; opacity: 0.85; transition: height 0.4s; }
.hour-axis { display: flex; justify-content: space-between; margin-top: 6px; font-size: 9px; font-weight: 700; color: var(--muted); }

/* 피치 */
.pitch-panel { background: var(--navy); border-radius: 18px; padding: 16px; }
.pitch-title { font-size: 14px; font-weight: 900; color: var(--orange); margin-bottom: 8px; }
.pitch-text { font-size: 13px; font-weight: 700; color: #DCEAE9; line-height: 1.6; word-break: keep-all; }
.pitch-text strong { color: var(--white); }

/* 도구 */
.data-tools { display: flex; gap: 8px; }
.tool-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  background: var(--white); border: 1px solid #D4DEDE; border-radius: 12px; padding: 10px;
  font-family: var(--font); font-size: 12px; font-weight: 800; color: var(--muted); cursor: pointer;
}
.tool-btn.danger { color: #D64B5F; border-color: #F0C0C5; }

.demo-disclaimer { font-size: 10px; font-weight: 600; color: var(--muted); text-align: center; word-break: keep-all; }
</style>
