<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import SectionCard from '../components/common/SectionCard.vue'
import StatCard from '../components/dashboard/StatCard.vue'
import { useVocabularyStore } from '../stores/vocabulary'
import { useReviewStore } from '../stores/review'
import { useMistakesStore } from '../stores/mistakes'
import { useSettingsStore } from '../stores/settings'

const vocabularyStore = useVocabularyStore()
const reviewStore = useReviewStore()
const mistakesStore = useMistakesStore()
const settingsStore = useSettingsStore()

const stats = computed(() => [
  {
    label: 'Vocabulary Bank',
    value: vocabularyStore.totalWords,
    hint: 'Words currently loaded from the static JSON source.',
  },
  {
    label: 'Due Today',
    value: reviewStore.dueCount,
    hint: 'Items whose next review timestamp is already due.',
  },
  {
    label: 'Mistake Notebook',
    value: mistakesStore.mistakeCount,
    hint: 'Words captured from incorrect answers.',
  },
  {
    label: 'Quiz Size',
    value: settingsStore.quizSize,
    hint: 'Configured number of questions for the daily session.',
  },
])
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <span class="badge">Vue 3 + Pinia + Local Storage</span>
        <h1 class="page-title">TOEIC study flow with daily pressure and recovery.</h1>
        <p class="page-subtitle">
          This starter already separates the static vocabulary catalog from learner progress so the
          next feature work can focus on quiz quality instead of app plumbing.
        </p>
      </div>
    </header>

    <div class="grid grid--stats">
      <StatCard
        v-for="stat in stats"
        :key="stat.label"
        :label="stat.label"
        :value="stat.value"
        :hint="stat.hint"
      />
    </div>

    <div class="grid grid--two" style="margin-top: 18px">
      <SectionCard
        title="Daily quiz"
        subtitle="One stored quiz per day, resumable across refreshes."
      >
        <p class="muted">
          The quiz engine ranks due reviews, mistakes, and low-exposure words before building the
          multiple-choice set.
        </p>
        <div class="button-row" style="margin-top: 18px">
          <RouterLink class="button" to="/quiz/daily">Open daily quiz</RouterLink>
          <RouterLink class="button button--ghost" to="/review">View due queue</RouterLink>
        </div>
      </SectionCard>

      <SectionCard
        title="Mistake notebook"
        subtitle="Incorrect answers stay visible and keep influencing future selection priority."
      >
        <p class="muted">
          Current scaffold includes notebook persistence, recent ordering, and a dedicated review page.
        </p>
        <div class="button-row" style="margin-top: 18px">
          <RouterLink class="button" to="/mistakes">Inspect notebook</RouterLink>
          <RouterLink class="button button--ghost" to="/settings">Adjust settings</RouterLink>
        </div>
      </SectionCard>
    </div>
  </section>
</template>