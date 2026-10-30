<script setup>
import InstallPrompt from './components/InstallPrompt.vue'
import GuideReaction from './components/GuideReaction.vue'
import StoryDialog from './components/StoryDialog.vue'
</script>

<template>
  <RouterView />
  <InstallPrompt />
  <GuideReaction />
  <StoryDialog />
</template>
