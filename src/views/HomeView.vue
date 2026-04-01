<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
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
    icon: '•',
    tone: 'accent' as const,
  },
  {
    label: 'Due Today',
    value: reviewStore.dueCount,
    hint: 'Items whose next review timestamp is already due.',
    icon: '✓',
    tone: 'success' as const,
  },
  {
    label: 'Mistake Notebook',
    value: mistakesStore.mistakeCount,
    hint: 'Words captured from incorrect answers.',
    icon: '✕',
    tone: 'danger' as const,
  },
  {
    label: 'Quiz Size',
    value: settingsStore.quizSize,
    hint: 'Configured number of questions for the daily session.',
    icon: '•',
    tone: 'neutral' as const,
  },
])

const dashboardActions = computed(() => [
  {
    eyebrow: 'Daily rhythm',
    title: 'Daily quiz',
    subtitle: 'One stored quiz per day, resumable until submission.',
    description:
      'The quiz engine ranks due reviews, mistakes, and low-exposure words before building the multiple-choice set.',
    icon: '•',
    tone: 'accent' as const,
    metrics: [
      { label: 'Target size', value: `${settingsStore.quizSize} questions` },
      { label: 'Due now', value: `${reviewStore.dueCount} queued` },
    ],
    primaryAction: { label: 'Open daily quiz', to: '/quiz/daily' },
    secondaryAction: { label: 'View due queue', to: '/review' },
  },
  {
    eyebrow: 'Recovery loop',
    title: 'Mistake notebook',
    subtitle: 'Incorrect answers stay visible and keep influencing future selection priority.',
    description:
      'Current scaffold includes notebook persistence, recent ordering, and a dedicated review page for repairing weak vocabulary.',
    icon: '✕',
    tone: 'danger' as const,
    metrics: [
      { label: 'Open mistakes', value: `${mistakesStore.mistakeCount} tracked` },
      { label: 'Vocabulary bank', value: `${vocabularyStore.totalWords} loaded` },
    ],
    primaryAction: { label: 'Inspect notebook', to: '/mistakes' },
    secondaryAction: { label: 'Adjust settings', to: '/settings' },
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
        :icon="stat.icon"
        :tone="stat.tone"
      />
    </div>

    <div class="grid grid--two" style="margin-top: 18px">
      <article
        v-for="action in dashboardActions"
        :key="action.title"
        class="dashboard-action-card"
        :class="`dashboard-action-card--${action.tone}`"
      >
        <div class="dashboard-action-card__header">
          <span class="dashboard-action-card__icon" aria-hidden="true">{{ action.icon }}</span>
          <div>
            <span class="dashboard-action-card__eyebrow">{{ action.eyebrow }}</span>
            <h2 class="dashboard-action-card__title">{{ action.title }}</h2>
            <p class="dashboard-action-card__subtitle">{{ action.subtitle }}</p>
          </div>
        </div>

        <p class="dashboard-action-card__description">
          {{ action.description }}
        </p>

        <div class="dashboard-action-card__metrics">
          <article
            v-for="metric in action.metrics"
            :key="metric.label"
            class="dashboard-action-card__metric"
          >
            <span class="dashboard-action-card__metric-label">{{ metric.label }}</span>
            <strong class="dashboard-action-card__metric-value">{{ metric.value }}</strong>
          </article>
        </div>

        <div class="button-row" style="margin-top: 18px">
          <RouterLink class="button" :to="action.primaryAction.to">{{ action.primaryAction.label }}</RouterLink>
          <RouterLink class="button button--ghost" :to="action.secondaryAction.to">
            {{ action.secondaryAction.label }}
          </RouterLink>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.dashboard-action-card {
  display: grid;
  gap: 18px;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius-lg);
  background:
    linear-gradient(180deg, rgba(255, 251, 245, 0.94), rgba(255, 246, 236, 0.96)),
    var(--surface);
  box-shadow: var(--shadow-soft);
}

.dashboard-action-card__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.dashboard-action-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: rgba(31, 36, 48, 0.08);
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1;
}

.dashboard-action-card__eyebrow {
  display: inline-block;
  margin-bottom: 6px;
  color: var(--text-muted);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.dashboard-action-card__title {
  margin: 0;
  color: var(--text-main);
  font-size: 1.45rem;
}

.dashboard-action-card__subtitle,
.dashboard-action-card__description {
  margin: 0;
  color: var(--text-muted);
}

.dashboard-action-card__subtitle {
  margin-top: 6px;
}

.dashboard-action-card__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.dashboard-action-card__metric {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius-md);
  background: rgba(255, 255, 255, 0.54);
}

.dashboard-action-card__metric-label {
  color: var(--text-muted);
  font-size: 0.88rem;
}

.dashboard-action-card__metric-value {
  color: var(--text-main);
  font-size: 1rem;
}

.dashboard-action-card--accent .dashboard-action-card__icon {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.dashboard-action-card--danger .dashboard-action-card__icon {
  background: var(--danger-soft);
  color: var(--danger);
}

@media (max-width: 720px) {
  .dashboard-action-card {
    padding: 20px;
  }

  .dashboard-action-card__metrics {
    grid-template-columns: 1fr;
  }
}
</style>