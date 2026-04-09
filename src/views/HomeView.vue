<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import StatCard from '../components/dashboard/StatCard.vue'
import SectionCard from '../components/common/SectionCard.vue'
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap.vue'
import AuthCard from '../components/auth/AuthCard.vue'
import { useVocabularyStore } from '../stores/vocabulary'
import { useReviewStore } from '../stores/review'
import { useMistakesStore } from '../stores/mistakes'
import { useSettingsStore } from '../stores/settings'

const vocabularyStore = useVocabularyStore()
const reviewStore = useReviewStore()
const mistakesStore = useMistakesStore()
const settingsStore = useSettingsStore()

const { isExpanding, expansionStatus, expansionProgress } = storeToRefs(vocabularyStore)

const TOEIC_CATEGORIES = [
  { value: 'General Business', label: '商業 (Business)' },
  { value: 'Marketing & Sales', label: '市場行銷 (Marketing)' },
  { value: 'Personnel & HR', label: '人事管理 (Personnel)' },
  { value: 'Finance & Banking', label: '金融財務 (Finance)' },
  { value: 'Office Procedures', label: '辦公實務 (Office)' },
  { value: 'Purchasing & Logistics', label: '採購物流 (Logistics)' },
  { value: 'Travel & Transport', label: '旅遊交通 (Travel)' },
  { value: 'Entertainment & Social', label: '社交與餐飲 (Social)' },
  { value: 'Healthcare', label: '醫療保健 (Health)' },
]

const expansionTopic = ref('General Business')
const includeImages = ref(false)
const resultMessage = ref('')
const resultTone = ref<'neutral' | 'success' | 'error'>('neutral')

async function handleVocabularyExpansion() {
  const topic = expansionTopic.value.trim()

  if (!topic) {
    resultTone.value = 'error'
    resultMessage.value = 'Enter a TOEIC topic before requesting new vocabulary.'
    return
  }

  resultMessage.value = ''

  try {
    const result = await vocabularyStore.expandVocabulary(topic, includeImages.value)
    resultTone.value = 'success'
    resultMessage.value = `Requested ${result.requestedCount} words for "${topic}". Added ${result.addedCount} new words and skipped ${result.skippedCount} duplicates.`
  } catch (error) {
    resultTone.value = 'error'
    resultMessage.value = error instanceof Error ? error.message : 'Vocabulary expansion failed.'
  }
}

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

    <AuthCard style="margin-bottom: 18px" />

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

    <ActivityHeatmap style="margin-top: 18px" />

    <SectionCard
      title="Vocabulary expansion"
      subtitle="Request 20 new TOEIC-level words from the backend API and append them to the local vocabulary set."
      style="margin-top: 18px"
    >
      <div class="field">
        <label for="expansion-topic">Topic</label>
        <select id="expansion-topic" v-model="expansionTopic">
          <option v-for="cat in TOEIC_CATEGORIES" :key="cat.value" :value="cat.value">
            {{ cat.label }}
          </option>
        </select>
      </div>
      <div class="field include-images-field" style="margin-top: 14px">
        <label class="include-images-label">
          <input type="checkbox" v-model="includeImages" class="include-images-checkbox" />
          Include images
        </label>
        <p class="muted include-images-hint">Fetches an illustrative photo for each word from Unsplash. Slower but helps visual memory.</p>
      </div>
      <div class="button-row" style="margin-top: 18px">
        <button class="button" :disabled="isExpanding" @click="handleVocabularyExpansion()">
          {{ isExpanding ? 'Expanding vocabulary...' : 'Expand vocabulary' }}
        </button>
      </div>
      <div v-if="isExpanding" class="expansion-progress">
        <div class="expansion-progress__bar">
          <div class="expansion-progress__fill" :style="{ width: expansionProgress + '%' }" />
        </div>
        <p class="expansion-progress__label">{{ expansionStatus }}</p>
      </div>
      <p
        v-if="resultMessage"
        class="expansion-status"
        :class="`expansion-status--${resultTone}`"
      >
        {{ resultMessage }}
      </p>
    </SectionCard>

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
.expansion-progress {
  margin: 16px 0 0;
}

.expansion-progress__bar {
  height: 8px;
  border-radius: 999px;
  background: var(--tone-neutral-soft);
  overflow: hidden;
}

.expansion-progress__fill {
  height: 100%;
  border-radius: 999px;
  background: var(--accent);
  transition: width 0.3s ease;
}

.expansion-progress__label {
  margin: 8px 0 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.expansion-status {
  margin: 16px 0 0;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius-md);
  background: var(--surface);
}

.expansion-status--success {
  border-color: var(--success);
  background: var(--success-soft);
  color: var(--success);
}

.expansion-status--error {
  border-color: var(--danger);
  background: var(--danger-soft);
  color: var(--danger);
}

.include-images-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
}

.include-images-checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
  cursor: pointer;
}

.include-images-hint {
  margin: 4px 0 0;
  font-size: 0.82rem;
}

.dashboard-action-card {
  display: grid;
  gap: 18px;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius-lg);
  background:
    linear-gradient(180deg, var(--panel-gradient-start), var(--panel-gradient-end)),
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
  background: var(--tone-neutral-soft);
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
  background: var(--surface-muted-strong);
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