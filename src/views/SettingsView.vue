<script setup lang="ts">
import { storeToRefs } from 'pinia'
import SectionCard from '../components/common/SectionCard.vue'
import AuthCard from '../components/auth/AuthCard.vue'
import { storageService } from '../services/storageService'
import { resetDatabaseProgress } from '../services/vocabularyService'
import { useMistakesStore } from '../stores/mistakes'
import { useQuizStore } from '../stores/quiz'
import { useAuthStore } from '../stores/auth'
import { useSettingsStore } from '../stores/settings'
import { useVocabularyStore } from '../stores/vocabulary'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const vocabularyStore = useVocabularyStore()
const mistakesStore = useMistakesStore()
const quizStore = useQuizStore()

const { quizSize, resetMemoryOnWrong, theme, } = storeToRefs(settingsStore)

async function resetAllProgress() {
  if (authStore.isAuthenticated) {
    await resetDatabaseProgress(authStore.token!)
  }
  storageService.resetAll()
  window.location.reload()
}
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <span class="badge">Local-first configuration</span>
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">This scaffold keeps persistence intentionally simple so migrations stay obvious later.</p>
      </div>
    </header>

    <AuthCard style="margin-bottom: 18px" />

    <div class="grid grid--two">
      <SectionCard title="Quiz preferences" subtitle="Starter configuration persisted in Local Storage.">
        <div class="field">
          <label for="quiz-size">Quiz size</label>
          <input id="quiz-size" v-model.number="quizSize" min="4" max="50" type="number" />
        </div>
        <div class="field" style="margin-top: 16px">
          <label for="theme-mode">Theme mode</label>
          <div class="theme-setting">
            <button
              id="theme-mode"
              type="button"
              class="theme-setting__switch"
              :class="{ 'theme-setting__switch--dark': theme === 'dark' }"
              :aria-pressed="theme === 'dark'"
              @click="settingsStore.toggleTheme()"
            >
              <span class="theme-setting__switch-track">
                <span class="theme-setting__switch-thumb">{{ theme === 'dark' ? '◐' : '◑' }}</span>
              </span>
              <span>{{ theme === 'dark' ? 'Dark mode' : 'Light mode' }}</span>
            </button>
            <p class="muted theme-setting__hint">
              Changes apply immediately and are stored locally for the next visit.
            </p>
          </div>
        </div>
        <div class="field" style="margin-top: 16px">
          <label for="wrong-strategy">On wrong answer</label>
          <select id="wrong-strategy" v-model="resetMemoryOnWrong">
            <option :value="true">Reset memory level to 0</option>
            <option :value="false">Decrease memory level by 1</option>
          </select>
        </div>
        <div class="button-row" style="margin-top: 18px">
          <button class="button" @click="settingsStore.saveSettings()">Save settings</button>
        </div>
      </SectionCard>

      <SectionCard title="Data operations" subtitle="Manual reset tools for the browser-only prototype.">
        <div class="list">
          <p><strong>Loaded words:</strong> {{ vocabularyStore.totalWords }}</p>
          <p><strong>Mistakes:</strong> {{ mistakesStore.mistakeCount }}</p>
          <p><strong>Stored quiz:</strong> {{ quizStore.quizDate || 'None' }}</p>
        </div>
        <div class="button-row" style="margin-top: 18px">
          <button class="button button--ghost" @click="quizStore.resetQuiz()">Reset daily quiz</button>
          <button class="button button--ghost" @click="resetAllProgress()">Reset all progress</button>
        </div>
      </SectionCard>
    </div>


  </section>
</template>

<style scoped>
.theme-setting {
  display: grid;
  gap: 10px;
}

.theme-setting__switch {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-start;
  width: fit-content;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-main);
  padding: 10px 14px;
  transition:
    transform var(--transition-speed-fast) ease,
    border-color var(--transition-speed-fast) ease,
    background-color var(--transition-speed-fast) ease;
}

.theme-setting__switch:hover {
  transform: translateY(-1px);
  border-color: var(--accent);
  background: var(--surface-hover);
}

.theme-setting__switch-track {
  display: inline-flex;
  align-items: center;
  width: 44px;
  height: 24px;
  padding: 2px;
  border-radius: 999px;
  background: var(--accent-soft);
}

.theme-setting__switch-thumb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: var(--surface-strong);
  transform: translateX(0);
  transition: transform var(--transition-speed-fast) ease;
  font-size: 0.8rem;
}

.theme-setting__switch--dark .theme-setting__switch-thumb {
  transform: translateX(20px);
}

.theme-setting__hint {
  margin: 0;
}
</style>