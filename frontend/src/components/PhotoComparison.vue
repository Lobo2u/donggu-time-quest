<script setup>
import { useId } from 'vue'
const split = defineModel({ type: Number, default: 50 })
defineProps({ ready: Boolean, beforeLabel: String, afterLabel: String, contain: Boolean })
const sliderId = useId()
</script>

<template>
  <div class="comparison">
    <div class="preview" :class="{ ready, contain }">
      <slot />
      <div v-if="ready" class="overlay" :style="{ clipPath: 'inset(0 ' + (100 - split) + '% 0 0)' }"><slot name="before" /></div>
      <template v-if="ready">
        <div class="divider" :style="{ left: split + '%' }" aria-hidden="true"></div>
        <span class="badge past">{{ beforeLabel }}</span><span class="badge present">{{ afterLabel }}</span>
      </template>
    </div>
    <div v-if="ready" class="adjust">
      <label :for="sliderId">{{ beforeLabel }} · {{ afterLabel }} 비교 {{ split }}%</label>
      <input :id="sliderId" v-model.number="split" type="range" min="0" max="100" step="1" aria-label="사진 비교 경계">
    </div>
  </div>
</template>

<style scoped>
.preview { aspect-ratio:4/3; overflow:hidden; position:relative; background:#292725; color:white; border-radius:.6rem; }
.preview :deep(video),.preview :deep(img),.overlay { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.preview.contain :deep(img) { object-fit:contain; }
.divider { position:absolute; top:0; bottom:0; width:2px; background:white; box-shadow:0 0 0 1px #332b26; pointer-events:none; }
.badge { position:absolute; top:.5rem; background:#30231ce6; padding:.2rem .4rem; border-radius:.3rem; font-size:.8rem; }
.past { left:.5rem; }.present { right:.5rem; }
.adjust { padding-top:.65rem; }
.adjust input { display:block; width:100%; min-height:44px; accent-color:#185f55; }
.adjust input:focus-visible { outline:2px solid #185f55; outline-offset:2px; }
</style>
