<script setup>
// 「대동의 바람을 찾아서」 데모용 자체 제작 일러스트(SVG).
// 실제 답사 사진이 없을 때 쓰는 플레이스홀더 — 참고 사이트 사진을 복제하지 않는다.
// 답사 후에는 데이터의 photo(실사진 URL)로 교체된다.
defineProps({ name: { type: String, required: true } })
</script>

<template>
  <!-- 바람개비(하늘이 대체 아이콘) -->
  <svg v-if="name === 'wind'" viewBox="0 0 64 64" class="wa" aria-label="바람 아이콘">
    <g transform="translate(32 28)">
      <path d="M0 0 L0 -22 A22 22 0 0 1 22 0 Z" fill="#4f97c4" />
      <path d="M0 0 L22 0 A22 22 0 0 1 0 22 Z" fill="#f2c559" />
      <path d="M0 0 L0 22 A22 22 0 0 1 -22 0 Z" fill="#e2726b" />
      <path d="M0 0 L-22 0 A22 22 0 0 1 0 -22 Z" fill="#6aa37a" />
      <circle r="4" fill="#08233F" />
    </g>
    <rect x="30" y="30" width="4" height="30" fill="#8a6a4a" />
  </svg>

  <!-- 벽화 조각(크롭) -->
  <svg v-else-if="name === 'mural-crop'" viewBox="0 0 120 120" class="wa">
    <rect width="120" height="120" fill="#cfe0d6" />
    <g transform="translate(60 56)">
      <path d="M0 0 L0 -26 A26 26 0 0 1 26 0 Z" fill="#4f97c4" />
      <path d="M0 0 L26 0 A26 26 0 0 1 0 26 Z" fill="#f2c559" />
      <path d="M0 0 L0 26 A26 26 0 0 1 -26 0 Z" fill="#e2726b" />
      <path d="M0 0 L-26 0 A26 26 0 0 1 0 -26 Z" fill="#6aa37a" />
      <circle r="5" fill="#3a2a1a" />
    </g>
    <rect x="58" y="60" width="5" height="52" fill="#8a6a4a" />
  </svg>

  <!-- 벽화 전체(정답 공개) -->
  <svg v-else-if="name === 'mural-full'" viewBox="0 0 320 180" class="wa">
    <rect width="320" height="180" fill="#bcd7c2" />
    <path d="M0 150 Q80 120 160 140 T320 130 L320 180 L0 180 Z" fill="#8fbf8a" />
    <!-- 알록달록 집들 -->
    <g>
      <rect x="20" y="96" width="46" height="46" fill="#e2b1a0" /><path d="M16 96 L43 78 L70 96 Z" fill="#c75b4a" />
      <rect x="90" y="104" width="44" height="38" fill="#cdd8a0" /><path d="M86 104 L112 86 L138 104 Z" fill="#6a8f4f" />
      <rect x="158" y="98" width="46" height="44" fill="#a7c6d8" /><path d="M154 98 L181 80 L208 98 Z" fill="#3b6e86" />
    </g>
    <!-- 바람개비 그림 -->
    <g transform="translate(255 70)">
      <path d="M0 0 L0 -24 A24 24 0 0 1 24 0 Z" fill="#4f97c4" />
      <path d="M0 0 L24 0 A24 24 0 0 1 0 24 Z" fill="#f2c559" />
      <path d="M0 0 L0 24 A24 24 0 0 1 -24 0 Z" fill="#e2726b" />
      <path d="M0 0 L-24 0 A24 24 0 0 1 0 -24 Z" fill="#6aa37a" />
      <circle r="5" fill="#3a2a1a" />
      <rect x="-2" y="0" width="4" height="60" fill="#8a6a4a" />
    </g>
  </svg>

  <!-- 하늘공원 입구(언덕길) -->
  <svg v-else-if="name === 'gate'" viewBox="0 0 320 180" class="wa">
    <rect width="320" height="180" fill="#cfe6f2" />
    <path d="M0 180 L0 120 Q120 60 320 40 L320 180 Z" fill="#6aa37a" />
    <path d="M60 180 Q150 120 230 70 L250 80 Q170 130 90 180 Z" fill="#d8cdb4" />
    <!-- 작은 집들 -->
    <rect x="30" y="118" width="30" height="26" fill="#e2b1a0" /><path d="M27 118 L45 104 L63 118 Z" fill="#c75b4a" />
    <rect x="70" y="128" width="28" height="22" fill="#a7c6d8" /><path d="M67 128 L84 114 L101 128 Z" fill="#3b6e86" />
    <!-- 언덕 위 풍차(멀리) -->
    <g transform="translate(245 60)">
      <rect x="-3" y="0" width="6" height="22" fill="#b05a4a" />
      <g transform="translate(0 -2)">
        <path d="M0 0 L0 -12 A12 12 0 0 1 12 0 Z" fill="#e2726b" />
        <path d="M0 0 L12 0 A12 12 0 0 1 0 12 Z" fill="#e2726b" />
        <path d="M0 0 L0 12 A12 12 0 0 1 -12 0 Z" fill="#e2726b" />
        <path d="M0 0 L-12 0 A12 12 0 0 1 0 -12 Z" fill="#e2726b" />
      </g>
    </g>
  </svg>

  <!-- 전망 스카이라인(쌍둥이 타워 포함) -->
  <svg v-else-if="name === 'skyline'" viewBox="0 0 300 300" class="wa" preserveAspectRatio="xMidYMid slice">
    <rect width="300" height="300" fill="#bcd6e8" />
    <path d="M0 300 L0 150 Q150 90 300 150 L300 300 Z" fill="#7fa6b8" opacity="0.5" />
    <!-- 저층 도시 -->
    <g fill="#9fb0bd">
      <rect x="10" y="170" width="24" height="90" /><rect x="40" y="186" width="20" height="74" />
      <rect x="70" y="160" width="26" height="100" /><rect x="110" y="196" width="18" height="64" />
      <rect x="135" y="178" width="22" height="82" /><rect x="235" y="190" width="20" height="70" />
      <rect x="262" y="176" width="22" height="84" />
    </g>
    <!-- 철도트윈타워(가운데-오른쪽 구역: index 5) -->
    <g fill="#5b7488">
      <rect x="196" y="120" width="18" height="140" /><rect x="218" y="120" width="18" height="140" />
      <rect x="196" y="112" width="18" height="10" /><rect x="218" y="112" width="18" height="10" />
    </g>
    <g fill="#cfe0ee" opacity="0.7">
      <rect x="199" y="130" width="12" height="6" /><rect x="199" y="146" width="12" height="6" /><rect x="199" y="162" width="12" height="6" />
      <rect x="221" y="130" width="12" height="6" /><rect x="221" y="146" width="12" height="6" /><rect x="221" y="162" width="12" height="6" />
    </g>
  </svg>

  <!-- 타워만 잘라낸 힌트 -->
  <svg v-else-if="name === 'twin-crop'" viewBox="0 0 80 120" class="wa">
    <rect width="80" height="120" fill="#dbe8f0" />
    <g fill="#5b7488">
      <rect x="22" y="20" width="16" height="92" /><rect x="42" y="20" width="16" height="92" />
      <rect x="22" y="12" width="16" height="8" /><rect x="42" y="12" width="16" height="8" />
    </g>
    <g fill="#cfe0ee" opacity="0.8">
      <rect x="25" y="30" width="10" height="5" /><rect x="25" y="44" width="10" height="5" /><rect x="25" y="58" width="10" height="5" />
      <rect x="45" y="30" width="10" height="5" /><rect x="45" y="44" width="10" height="5" /><rect x="45" y="58" width="10" height="5" />
    </g>
  </svg>

  <svg v-else viewBox="0 0 64 64" class="wa"><rect width="64" height="64" fill="#ccc" /></svg>
</template>

<style scoped>
.wa { display: block; width: 100%; height: 100%; }
</style>
