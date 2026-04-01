<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from './components/common/AppHeader.vue'
import { useVocabularyStore } from './stores/vocabulary'
import { useReviewStore } from './stores/review'
import { useMistakesStore } from './stores/mistakes'
import { useSettingsStore } from './stores/settings'

const vocabularyStore = useVocabularyStore()
const reviewStore = useReviewStore()
const mistakesStore = useMistakesStore()
const settingsStore = useSettingsStore()

const isReady = computed(() => vocabularyStore.isLoaded)
const errorMessage = computed(() => vocabularyStore.errorMessage)

onMounted(async () => {
  settingsStore.loadSettings()
  mistakesStore.loadNotebook()
  await vocabularyStore.loadVocabulary()
  reviewStore.calculateDueWords(vocabularyStore.words)
})
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main class="app-main">
      <p v-if="errorMessage" class="status-banner status-banner--error">
        {{ errorMessage }}
      </p>
      <p v-else-if="!isReady" class="status-banner">Loading vocabulary set...</p>
      <RouterView v-else />
    </main>
  </div>
</template>
