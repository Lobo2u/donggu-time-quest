<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const deferredPrompt = ref(null)
const show = ref(false)
const isIOS = ref(false)
const showIOSGuide = ref(false)

function onBeforeInstall(e) {
  e.preventDefault()
  deferredPrompt.value = e
  if (!localStorage.getItem('dtq-install-dismissed')) show.value = true
}

async function install() {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') show.value = false
  deferredPrompt.value = null
}

function dismiss() {
  show.value = false
  showIOSGuide.value = false
  localStorage.setItem('dtq-install-dismissed', '1')
}

onMounted(() => {
  // 이미 설치된 상태면 노출 안 함
  if (window.matchMedia('(display-mode: standalone)').matches) return

  const ua = window.navigator.userAgent
  isIOS.value = /iphone|ipad|ipod/i.test(ua)
  // iOS는 beforeinstallprompt 미지원 → 수동 안내
  if (isIOS.value && !localStorage.getItem('dtq-install-dismissed')) {
    show.value = true
  }
  window.addEventListener('beforeinstallprompt', onBeforeInstall)
})
onBeforeUnmount(() => window.removeEventListener('beforeinstallprompt', onBeforeInstall))
</script>

<template>
  <Transition name="slide-up">
    <div v-if="show" class="install-banner">
      <div class="install-icon">
        <img src="/pwa-icon.svg" alt="앱 아이콘" />
      </div>
      <div class="install-text">
        <p class="install-title">홈 화면에 설치</p>
        <p class="install-sub" v-if="!isIOS">앱처럼 바로 실행하고 오프라인에서도 즐겨요</p>
        <p class="install-sub" v-else>공유 버튼 → "홈 화면에 추가"를 눌러요</p>
      </div>
      <button v-if="!isIOS" class="install-btn" @click="install">설치</button>
      <button v-else class="install-btn" @click="showIOSGuide = true">방법</button>
      <button class="install-close" @click="dismiss">
        <span class="msr" style="font-size:18px; color:#9FC1C8">close</span>
      </button>
    </div>
  </Transition>

  <!-- iOS 설치 안내 -->
  <Transition name="fade">
    <div v-if="showIOSGuide" class="ios-overlay" @click.self="showIOSGuide = false">
      <div class="ios-card">
        <p class="ios-title">홈 화면에 추가하기</p>
        <ol class="ios-steps">
          <li><span class="msr" style="font-size:18px; color:var(--teal)">ios_share</span> Safari 하단 공유 버튼을 누르세요</li>
          <li><span class="msr" style="font-size:18px; color:var(--teal)">add_box</span> "홈 화면에 추가"를 선택하세요</li>
          <li><span class="msr" style="font-size:18px; color:var(--teal)">check_circle</span> "추가"를 누르면 완료!</li>
        </ol>
        <button class="ios-close" @click="showIOSGuide = false; dismiss()">확인</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.install-banner {
  position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%);
  width: 358px; max-width: calc(100vw - 32px); z-index: 2000;
  background: var(--navy); border-radius: 18px; padding: 12px 14px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 12px 40px #00000055;
}
.install-icon { width: 44px; height: 44px; flex-shrink: 0; }
.install-icon img { width: 100%; height: 100%; border-radius: 10px; }
.install-text { flex: 1; min-width: 0; }
.install-title { font-size: 14px; font-weight: 900; color: white; }
.install-sub { font-size: 11px; font-weight: 600; color: #9FC1C8; word-break: keep-all; line-height: 1.3; }
.install-btn {
  background: var(--orange); color: var(--navy); border: none; border-radius: 12px;
  padding: 8px 16px; font-family: var(--font); font-size: 13px; font-weight: 900; cursor: pointer; flex-shrink: 0;
}
.install-close { background: none; border: none; cursor: pointer; padding: 4px; flex-shrink: 0; }

.ios-overlay {
  position: fixed; inset: 0; z-index: 2100; background: #08233Fcc;
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.ios-card { background: white; border-radius: 22px; padding: 22px; width: 100%; max-width: 330px; }
.ios-title { font-size: 18px; font-weight: 900; color: var(--ink); margin-bottom: 14px; }
.ios-steps { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.ios-steps li { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: var(--ink); }
.ios-close {
  margin-top: 18px; width: 100%; background: var(--navy); color: white; border: none;
  border-radius: 14px; padding: 12px; font-family: var(--font); font-size: 14px; font-weight: 800; cursor: pointer;
}

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s cubic-bezier(0.32,0.72,0,1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translate(-50%, 120%); opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
