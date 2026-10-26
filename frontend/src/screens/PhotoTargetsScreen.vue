<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { LOCATIONS, FIELD_QUESTS } from '../data/gameData.js'
import { computeHash, hashToHex } from '../utils/imageHash.js'
import { photoRefs, setRef, clearRef } from '../store/photoRefStore.js'

const router = useRouter()
const groups = Object.values(FIELD_QUESTS).map(q => ({ quest: q, loc: LOCATIONS[q.locationId] }))

const camOpen = ref(false)
const camStatus = ref('idle')
const activeTarget = ref(null)
const videoEl = ref(null)
const toast = ref(null)
let stream = null

async function openFor(target) {
  activeTarget.value = target
  camOpen.value = true; camStatus.value = 'scanning'
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    videoEl.value.srcObject = stream; await videoEl.value.play()
  } catch (e) { camStatus.value = e.name === 'NotAllowedError' ? 'denied' : 'error' }
}
function capture() {
  if (!videoEl.value || videoEl.value.readyState < 2) return
  const hex = hashToHex(computeHash(videoEl.value))
  setRef(activeTarget.value.code, hex)
  toast.value = `${activeTarget.value.label} 기준 사진 등록 완료`
  setTimeout(() => { toast.value = null }, 1600)
  close()
}
function close() {
  camOpen.value = false
  if (stream) stream.getTracks().forEach(t => t.stop())
  stream = null
}
onBeforeUnmount(close)

const registeredCount = computed(() => Object.keys(photoRefs).length)
</script>

<template>
  <div class="screen pt-screen">
    <div class="pt-header">
      <div>
        <p class="pt-eyebrow">OPERATOR · 사진 인증 등록</p>
        <h1 class="pt-title">현장 기준 사진</h1>
      </div>
      <button class="close-btn" @click="router.push('/map')">
        <span class="msr" style="font-size:24px; color:white">close</span>
      </button>
    </div>

    <div class="pt-body">
      <div class="pt-guide">
        <span class="msr" style="font-size:16px; color:var(--teal)">info</span>
        <p>현장에서 각 타깃(예: 소제동 관사 지붕)을 같은 구도로 촬영해 기준 사진을 등록하세요. 방문자가 같은 구도로 찍으면 자동 인증됩니다. ({{ registeredCount }}개 등록됨)</p>
      </div>

      <div v-for="g in groups" :key="g.quest.id" class="pt-group">
        <h2 class="pt-loc">{{ g.loc.name }}</h2>
        <div v-for="t in g.quest.targets" :key="t.code" class="pt-target">
          <div class="pt-icon" :class="{ on: photoRefs[t.code] }">
            <span class="msr" style="font-size:22px">{{ photoRefs[t.code] ? 'check_circle' : t.icon }}</span>
          </div>
          <div class="pt-info">
            <span class="pt-label">{{ t.label }}</span>
            <span class="pt-hint">{{ t.riddle }}</span>
          </div>
          <button class="pt-cap" :class="{ done: photoRefs[t.code] }" @click="openFor(t)">
            {{ photoRefs[t.code] ? '재촬영' : '기준 촬영' }}
          </button>
          <button v-if="photoRefs[t.code]" class="pt-clear" @click="clearRef(t.code)">
            <span class="msr" style="font-size:18px; color:#D64B5F">delete</span>
          </button>
        </div>
      </div>
      <div style="height: 20px"></div>
    </div>

    <!-- 촬영 모달 -->
    <Transition name="cam">
      <div v-if="camOpen" class="cam-modal">
        <div class="cam-head">
          <span class="cam-title">{{ activeTarget?.label }} 기준 촬영</span>
          <button class="cam-close" @click="close"><span class="msr" style="font-size:24px; color:white">close</span></button>
        </div>
        <div class="cam-view" v-if="camStatus === 'scanning'">
          <video ref="videoEl" autoplay muted playsinline></video>
          <div class="cam-frame"><div class="c tl"></div><div class="c tr"></div><div class="c bl"></div><div class="c br"></div></div>
          <p class="cam-hint">타깃을 화면 중앙에 꽉 차게 맞추고 촬영해요</p>
        </div>
        <div class="cam-msg" v-else>
          <span class="msr" style="font-size:48px; color:#9FC1C8">{{ camStatus === 'denied' ? 'no_photography' : 'photo_camera' }}</span>
          <p>{{ camStatus === 'denied' ? '카메라 권한이 필요해요' : '카메라를 여는 중…' }}</p>
        </div>
        <button v-if="camStatus === 'scanning'" class="shutter" @click="capture">
          <span class="msr" style="font-size:24px; color:var(--navy)">camera</span> 기준 사진으로 등록
        </button>
      </div>
    </Transition>

    <Transition name="toast"><div v-if="toast" class="pt-toast">{{ toast }}</div></Transition>
  </div>
</template>

<style scoped>
.pt-screen { background: var(--paper); display: flex; flex-direction: column; overflow: hidden; }
.pt-header { display: flex; align-items: center; justify-content: space-between; padding: 52px 20px 16px; background: var(--navy); flex-shrink: 0; }
.pt-eyebrow { font-size: 11px; font-weight: 900; color: var(--teal); letter-spacing: 1.2px; }
.pt-title { font-size: 24px; font-weight: 900; color: white; margin-top: 2px; }
.close-btn { background: #FFFFFF18; border: none; border-radius: 12px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.pt-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.pt-guide { display: flex; align-items: flex-start; gap: 8px; background: var(--sky); border-radius: 14px; padding: 12px 14px; font-size: 12px; font-weight: 700; color: var(--ink); line-height: 1.4; word-break: keep-all; }
.pt-group { display: flex; flex-direction: column; gap: 8px; }
.pt-loc { font-size: 15px; font-weight: 900; color: var(--ink); }
.pt-target { display: flex; align-items: center; gap: 10px; background: var(--white); border: 1px solid #E2EEEC; border-radius: 14px; padding: 10px 12px; }
.pt-icon { width: 40px; height: 40px; border-radius: 12px; background: #EEF6F5; display: flex; align-items: center; justify-content: center; color: var(--muted); flex-shrink: 0; }
.pt-icon.on { background: var(--teal); color: white; }
.pt-icon .msr { color: inherit; }
.pt-info { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.pt-label { font-size: 13px; font-weight: 900; color: var(--ink); }
.pt-hint { font-size: 10px; font-weight: 700; color: var(--muted); word-break: keep-all; }
.pt-cap { background: var(--navy); color: white; border: none; border-radius: 10px; padding: 8px 12px; font-family: var(--font); font-size: 12px; font-weight: 800; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
.pt-cap.done { background: var(--teal); }
.pt-clear { background: none; border: none; cursor: pointer; flex-shrink: 0; }

.cam-modal { position: fixed; inset: 0; z-index: 1500; background: #08233F; display: flex; flex-direction: column; padding: 52px 16px 16px; gap: 12px; }
.cam-head { display: flex; align-items: center; justify-content: space-between; }
.cam-title { font-size: 18px; font-weight: 900; color: white; }
.cam-close { background: #FFFFFF18; border: none; border-radius: 10px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.cam-view { position: relative; border-radius: 20px; overflow: hidden; aspect-ratio: 1; background: #000; }
.cam-view video { width: 100%; height: 100%; object-fit: cover; }
.cam-frame { position: absolute; inset: 0; pointer-events: none; }
.cam-frame .c { position: absolute; width: 28px; height: 28px; border: 3px solid #7CE1D9; }
.cam-frame .tl { top: 16px; left: 16px; border-right: 0; border-bottom: 0; }
.cam-frame .tr { top: 16px; right: 16px; border-left: 0; border-bottom: 0; }
.cam-frame .bl { bottom: 16px; left: 16px; border-right: 0; border-top: 0; }
.cam-frame .br { bottom: 16px; right: 16px; border-left: 0; border-top: 0; }
.cam-hint { position: absolute; bottom: 12px; left: 0; right: 0; text-align: center; font-size: 12px; font-weight: 700; color: #FFFFFFCC; text-shadow: 0 1px 4px #000; }
.cam-msg { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; background: #FFFFFF0A; border-radius: 20px; color: white; font-weight: 700; }
.shutter { display: flex; align-items: center; justify-content: center; gap: 8px; height: 54px; background: var(--orange); color: var(--navy); border: none; border-radius: 16px; font-family: var(--font); font-size: 16px; font-weight: 900; cursor: pointer; }
.pt-toast { position: fixed; left: 50%; bottom: 30px; transform: translateX(-50%); background: var(--navy); color: white; border-radius: 14px; padding: 12px 18px; font-size: 13px; font-weight: 800; z-index: 2000; box-shadow: 0 6px 20px #00000055; }
.cam-enter-active, .cam-leave-active { transition: all 0.3s; } .cam-enter-from, .cam-leave-to { opacity: 0; }
.toast-enter-active, .toast-leave-active { transition: all 0.25s; } .toast-enter-from, .toast-leave-to { opacity: 0; }
</style>
