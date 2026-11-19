<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useArViewer } from '../composables/useArViewer.js'
import { getModel, resolveGlbUrl } from '../store/arModelStore.js'

const props = defineProps({ modelId: String, sceneStyle: { type: String, required: true } })
const canvas = ref(null)
const loadError = ref('')
const viewer = useArViewer()
const { state } = viewer
let dead = false, revoke = () => {}
onMounted(async () => {
  try {
    await viewer.init(canvas.value)
    if (dead) return
    viewer.setAutoRotate(false)
    const source = getModel(props.modelId) ?? getModel('daedong-maeul')
    const asset = await resolveGlbUrl(source)
    if (dead) { asset?.revoke(); return }
    if (!asset) { loadError.value = '미리 볼 GLB가 없습니다.'; return }
    revoke = asset.revoke
    await viewer.loadModel(asset.url, {
      baseUrl: new URL(import.meta.env.BASE_URL, location.href).href,
      yawDeg: source.yawDeg ?? 0,
      sceneStyle: props.sceneStyle,
    })
    if (!dead) viewer.setSceneStyle(props.sceneStyle)
  } catch {
    if (!dead) loadError.value = '이 브라우저에서 3D 미리보기를 열 수 없어요.'
  }
})
watch(() => props.sceneStyle, style => { if (state.loaded) viewer.setSceneStyle(style) })
onBeforeUnmount(() => { dead = true; viewer.dispose(); revoke() })
</script>

<template>
  <div class="preview" :data-scene="sceneStyle">
    <div ref="canvas" class="preview-canvas" aria-label="선택한 스타일의 회전 가능한 3D 미리보기"></div>
    <span v-if="loadError || state.status" class="preview-note" role="status">{{ loadError || state.status }}</span>
  </div>
</template>

<style scoped>
.preview { position: relative; min-height: 235px; overflow: hidden; border-radius: 12px; background: radial-gradient(ellipse at 45% 20%, #fff0ce, #a47957); }
.preview[data-scene="dusk"] { background: radial-gradient(ellipse at 45% 20%, #f1ae83, #4e394f); }
.preview[data-scene="original"] { background: radial-gradient(ellipse at 45% 20%, #315066, #102434); }
.preview-canvas { position: absolute; inset: 0; }
.preview-note { position: absolute; inset: auto 0 12px; text-align: center; font-weight: 800; color: #fff; text-shadow: 0 1px 4px #000; }
</style>
