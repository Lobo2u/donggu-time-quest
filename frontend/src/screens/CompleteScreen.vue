<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="screen complete-screen">
    <!-- Celebration sparkles -->
    <div class="spark" style="left:28px; top:90px; width:10px; height:10px; background:var(--orange)"></div>
    <div class="spark" style="left:330px; top:130px; width:8px; height:8px; background:var(--white)"></div>
    <div class="spark" style="left:70px; top:250px; width:7px; height:7px; background:#7CE1D9"></div>
    <div class="spark" style="left:296px; top:280px; width:12px; height:12px; background:var(--orange)"></div>
    <div class="spark" style="left:42px; top:414px; width:8px; height:8px; background:var(--white)"></div>
    <div class="spark" style="left:340px; top:434px; width:7px; height:7px; background:#7CE1D9"></div>

    <!-- Kicker text -->
    <p class="complete-kicker">MEMORY RESTORED · 1 / 3</p>

    <!-- Main title -->
    <h1 class="complete-title">기억 한 장면이<br>돌아왔어요!</h1>

    <!-- Time shard -->
    <div class="shard-container">
      <div class="shard-hex">
        <span class="msr" style="font-size:60px; color: #FFF4D6">hexagon</span>
      </div>
    </div>

    <!-- Characters -->
    <div class="char-majung">🐧</div>
    <div class="char-jungang">🏪</div>

    <!-- Reward summary card -->
    <div class="reward-card">
      <h3 class="reward-place">지도에 '소제동' 이름이 다시 나타났다</h3>
      <div class="reward-values">
        <div class="reward-item">
          <span class="msr" style="font-size:22px; color: var(--orange)">diamond</span>
          <div class="reward-texts">
            <span class="reward-label">시간 조각 A</span>
            <span class="reward-value">획득 완료</span>
          </div>
        </div>
        <div class="reward-item">
          <span class="msr" style="font-size:22px; color: var(--orange)">bolt</span>
          <div class="reward-texts">
            <span class="reward-label">미션 상태</span>
            <span class="reward-value">완료 · 1회</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Next mission suggestion -->
    <div class="next-mission">
      <span class="msr" style="font-size:28px; color: var(--teal-dark)">route</span>
      <p class="next-text">다음 단서: 조각 A의 문양이 중앙시장을 가리켜요.</p>
    </div>

    <!-- Duplicate note -->
    <p class="duplicate-note">재진입 시 완료 장면만 재생 · 보상 중복 지급 없음</p>

    <!-- Buttons -->
    <button class="btn-primary cta-btn" @click="router.push('/map')">
      <span class="msr" style="font-size:22px; color: var(--navy)">route</span>
      다음 장소로
    </button>
    <button class="btn-secondary cta-btn cta-btn-2" @click="router.push('/collection')">
      <span class="msr" style="font-size:22px">pause_circle</span>
      오늘은 여기까지
    </button>
  </div>
</template>

<style scoped>
.complete-screen {
  background: linear-gradient(180deg, #062B48 0%, #087D79 58%, #E7FFF9 100%);
  overflow: hidden;
}

.spark {
  position: absolute;
  border-radius: 2px;
  transform: rotate(45deg);
  animation: sparkle 2s ease-in-out infinite alternate;
}

@keyframes sparkle {
  from { opacity: 0.4; transform: rotate(45deg) scale(0.8); }
  to   { opacity: 1;   transform: rotate(45deg) scale(1.2); }
}

.complete-kicker {
  position: absolute;
  left: 0; right: 0; top: 58px;
  text-align: center;
  font-size: 12px;
  font-weight: 900;
  color: var(--orange);
  letter-spacing: 1.4px;
}

.complete-title {
  position: absolute;
  left: 47px; top: 86px;
  font-size: 28px;
  font-weight: 900;
  color: var(--white);
  line-height: 1.2;
}

.shard-container {
  position: absolute;
  left: 120px; top: 145px;
  width: 150px; height: 150px;
  background: #FFFFFF18;
  border: 2px solid #FFFFFF66;
  border-radius: 75px;
  box-shadow: 0 0 34px #FF9F1C77;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shard-hex {
  width: 74px; height: 92px;
  background: linear-gradient(155deg, #FFE19A 0%, #FF9F1C 60%, #E66D00 100%);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 3px #FFF4D6 inset;
}

.char-majung {
  position: absolute;
  left: 24px; top: 282px;
  width: 165px; height: 185px;
  background: linear-gradient(135deg, #7CE8D5, #4CB5AB);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 90px;
}

.char-jungang {
  position: absolute;
  left: 201px; top: 282px;
  width: 165px; height: 185px;
  background: linear-gradient(135deg, #FFDDA0, #FFA940);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 86px;
}

.reward-card {
  position: absolute;
  left: 24px; top: 488px;
  width: 342px;
  background: #FFFFFFF2;
  border-radius: 24px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reward-place {
  font-size: 18px;
  font-weight: 900;
  color: var(--ink);
}

.reward-values {
  display: flex;
  justify-content: space-between;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 7px;
}

.reward-texts {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.reward-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--muted);
}

.reward-value {
  font-size: 15px;
  font-weight: 900;
  color: var(--ink);
}

.next-mission {
  position: absolute;
  left: 24px; top: 614px;
  width: 342px;
  height: 62px;
  background: #DDF4F1;
  border-radius: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
}

.next-text {
  font-size: 12px;
  font-weight: 800;
  color: var(--ink);
  line-height: 1.4;
  flex: 1;
  word-break: keep-all;
}

.duplicate-note {
  position: absolute;
  left: 56px; top: 682px;
  font-size: 10px;
  font-weight: 700;
  color: var(--teal-dark);
}

.cta-btn {
  position: absolute;
  left: 24px; top: 696px;
}

.cta-btn-2 {
  top: 760px;
  background: var(--white);
  color: var(--teal-dark);
}
</style>
