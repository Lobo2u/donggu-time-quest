<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="screen ending-screen">
    <!-- Eyebrow -->
    <p class="ending-eyebrow">FIRST COURSE COMPLETE</p>

    <!-- Title -->
    <h1 class="ending-title">동구의 하루가 다시 이어졌어요</h1>

    <!-- Restored map scene -->
    <div class="map-scene">
      <div class="map-bg-mini"></div>
      <!-- Location pins -->
      <div class="restored-pin pin-a">
        <span class="msr" style="font-size:22px; color: var(--teal)">location_on</span>
        <span class="pin-name">소제동</span>
      </div>
      <div class="restored-pin pin-b">
        <span class="msr" style="font-size:22px; color: var(--teal)">location_on</span>
        <span class="pin-name">한의약거리</span>
      </div>
      <!-- Connection line -->
      <div class="connection-line"></div>
    </div>

    <!-- Story message -->
    <div class="story-card">
      <p class="story-label">탐험 메시지 · 창작 시나리오</p>
      <p class="story-quote">"사라진 것은 장소가 아니라,<br>그곳을 기억하던 우리의 하루였다."</p>
      <p class="story-attribution">이 이야기는 공식 역사 자료를 사용하지 않은 창작 서사입니다.</p>
    </div>

    <!-- Characters -->
    <div class="ending-chars">
      <div class="ending-char-majung">🐧</div>
      <div class="ending-char-jungang">🏪</div>
    </div>

    <!-- Character note -->
    <p class="char-note">마중이: "목적지 이동이 어려울 때를 위한 다음 출발 아이콘을 확인해."<br>중앙이: "탐험 기록에서 완료된 장면을 다시 볼 수 있어!"</p>

    <!-- CTA -->
    <button class="btn-primary explore-btn" @click="router.push('/record')">
      <span class="msr" style="font-size:22px; color: var(--navy)">book</span>
      탐험 기록 보기
    </button>

    <!-- Secondary -->
    <button class="replay-btn" @click="router.push('/')">
      <span class="msr" style="font-size:16px; color: var(--teal-dark)">replay</span>
      이야기 다시 보기
    </button>
  </div>
</template>

<style scoped>
.ending-screen {
  background: linear-gradient(180deg, #E8FFFB 0%, #C5EDE8 60%, #8FCECA 100%);
  overflow: hidden;
}

.ending-eyebrow {
  position: absolute;
  left: 0; right: 0; top: 54px;
  text-align: center;
  font-size: 11px;
  font-weight: 900;
  color: var(--teal-dark);
  letter-spacing: 1.4px;
}

.ending-title {
  position: absolute;
  left: 20px; top: 80px;
  font-size: 26px;
  font-weight: 900;
  color: var(--navy);
  line-height: 1.2;
  word-break: keep-all;
}

.map-scene {
  position: absolute;
  left: 20px; top: 142px;
  width: 350px; height: 282px;
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 6px 20px #08233F22;
}

.map-bg-mini {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(#c8d9b8 1px, transparent 1px),
    linear-gradient(90deg, #c8d9b8 1px, transparent 1px),
    #e8f0df;
  background-size: 20px 20px;
}

.restored-pin {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.pin-a { left: 60px; top: 60px; }
.pin-b { left: 220px; top: 130px; }

.pin-name {
  background: var(--navy);
  color: var(--white);
  border-radius: 8px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.connection-line {
  position: absolute;
  left: 82px; top: 80px;
  width: 170px; height: 2px;
  background: var(--teal);
  transform: rotate(18deg);
  transform-origin: left center;
  border-radius: 2px;
}

.story-card {
  position: absolute;
  left: 20px; top: 446px;
  width: 350px;
  background: #FFFFFFF0;
  border-radius: 22px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 6px 18px #08233F1A;
}

.story-label {
  font-size: 11px;
  font-weight: 800;
  color: var(--muted);
}

.story-quote {
  font-size: 17px;
  font-weight: 800;
  color: var(--ink);
  line-height: 1.5;
  word-break: keep-all;
}

.story-attribution {
  font-size: 10px;
  font-weight: 600;
  color: var(--muted);
}

.ending-chars {
  position: absolute;
  left: 20px; top: 614px;
  width: 350px;
  height: 92px;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
}

.ending-char-majung,
.ending-char-jungang {
  width: 72px; height: 72px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}

.ending-char-majung { background: linear-gradient(135deg, #7CE8D5, #4CB5AB); }
.ending-char-jungang { background: linear-gradient(135deg, #FFDDA0, #FFA940); }

.char-note {
  position: absolute;
  left: 20px; top: 712px;
  width: 350px;
  font-size: 10px;
  font-weight: 600;
  color: var(--teal-dark);
  line-height: 1.5;
  word-break: keep-all;
}

.explore-btn {
  position: absolute;
  left: 24px; top: 752px;
}

.replay-btn {
  position: absolute;
  left: 0; right: 0; top: 818px;
  margin: auto;
  background: none;
  border: none;
  font-family: var(--font);
  font-size: 11px;
  font-weight: 800;
  color: var(--teal-dark);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: fit-content;
}
</style>
