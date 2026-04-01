<script setup lang="ts">
import { storeToRefs } from 'pinia'
import SectionCard from '../components/common/SectionCard.vue'
import { storageService } from '../services/storageService'
import { useMistakesStore } from '../stores/mistakes'
import { useQuizStore } from '../stores/quiz'
import { useSettingsStore } from '../stores/settings'
import { useVocabularyStore } from '../stores/vocabulary'

const settingsStore = useSettingsStore()
const vocabularyStore = useVocabularyStore()
const mistakesStore = useMistakesStore()
const quizStore = useQuizStore()

const { quizSize, resetMemoryOnWrong } = storeToRefs(settingsStore)

function resetAllProgress() {
  storageService.resetAll()
  mistakesStore.clearNotebook()
  quizStore.resetQuiz()
  settingsStore.resetSettings()
  vocabularyStore.loadVocabulary()
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

    <div class="grid grid--two">
      <SectionCard title="Quiz preferences" subtitle="Starter configuration persisted in Local Storage.">
        <div class="field">
          <label for="quiz-size">Quiz size</label>
          <input id="quiz-size" v-model.number="quizSize" min="4" max="50" type="number" />
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