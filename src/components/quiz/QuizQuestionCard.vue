<script setup lang="ts">
import type { QuizQuestion } from '../../types/quiz'

const props = withDefaults(
  defineProps<{
  question: QuizQuestion
  questionNumber: number
  totalQuestions: number
  selectedAnswer?: string
  partOfSpeech?: string
  definition?: string
  exampleSentence?: string
  correctAnswer?: string
  showFeedback?: boolean
}>(),
  {
    partOfSpeech: '',
    definition: '',
    exampleSentence: '',
    correctAnswer: '',
    showFeedback: false,
  },
)

const emit = defineEmits<{
  select: [value: string]
}>()

function handleSelect(option: string) {
  if (props.showFeedback) {
    return
  }

  emit('select', option)
}

function getOptionState(option: string) {
  if (props.showFeedback && option === props.correctAnswer) {
    return 'correct'
  }

  if (
    props.showFeedback &&
    option === props.selectedAnswer &&
    props.correctAnswer &&
    option !== props.correctAnswer
  ) {
    return 'incorrect'
  }

  if (option === props.selectedAnswer) {
    return 'selected'
  }

  return 'idle'
}

function getOptionStateLabel(option: string) {
  const state = getOptionState(option)

  if (state === 'correct') {
    return 'Correct'
  }

  if (state === 'incorrect') {
    return 'Wrong'
  }

  if (state === 'selected') {
    return 'Selected'
  }

  return ''
}

function getOptionStateIcon(option: string) {
  const state = getOptionState(option)

  if (state === 'correct') {
    return '✓'
  }

  if (state === 'incorrect') {
    return '✕'
  }

  if (state === 'selected') {
    return '•'
  }

  return ''
}

function speakWord() {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(props.question.prompt)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}
</script>

<template>
  <article class="question-card">
    <div class="question-card__meta">
      <span class="badge">Question {{ questionNumber }} / {{ totalQuestions }}</span>
      <div class="question-card__copy">
        <div v-if="partOfSpeech || definition" class="question-card__supporting">
          <span v-if="partOfSpeech" class="question-card__part-of-speech">{{ partOfSpeech }}</span>
          <p v-if="definition" class="question-card__definition">{{ definition }}</p>
        </div>
        <div class="question-card__word-row">
          <span class="question-card__word">{{ question.prompt }}</span>
          <button
            type="button"
            class="speak-btn"
            aria-label="Listen to pronunciation"
            @click="speakWord"
          >🔊</button>
        </div>
        <p v-if="exampleSentence" class="question-card__example">{{ exampleSentence }}</p>
      </div>
    </div>
    <div class="question-card__options">
      <button
        v-for="(option, index) in question.options"
        :key="option"
        type="button"
        class="option"
        :class="{
          'option--selected': getOptionState(option) === 'selected',
          'option--correct': getOptionState(option) === 'correct',
          'option--incorrect': getOptionState(option) === 'incorrect',
          'option--readonly': showFeedback,
        }"
        :aria-pressed="option === selectedAnswer"
        :disabled="showFeedback"
        @click="handleSelect(option)"
      >
        <span class="option__body">
          <span class="option__index">{{ index + 1 }}</span>
          <span class="option__label">{{ option }}</span>
        </span>
        <span v-if="getOptionStateLabel(option)" class="option__state">
          <span class="option__state-icon" aria-hidden="true">{{ getOptionStateIcon(option) }}</span>
          {{ getOptionStateLabel(option) }}
        </span>
      </button>
    </div>
  </article>
</template>

<style scoped>
.question-card {
  display: grid;
  gap: 24px;
}

.question-card__meta {
  display: grid;
  gap: 16px;
}

.question-card__copy {
  display: grid;
  gap: 12px;
}

.question-card__supporting {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
}

.question-card__part-of-speech {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.question-card__definition {
  margin: 0;
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 600;
}

.question-card__word {
  color: var(--text-main);
  font-size: clamp(2.2rem, 6vw, 4rem);
  font-weight: 700;
  line-height: 0.94;
  letter-spacing: -0.04em;
}

.question-card__word-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.speak-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 1.1rem;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background-color var(--transition-speed-fast) ease,
    border-color var(--transition-speed-fast) ease,
    transform var(--transition-speed-fast) ease;
}

.speak-btn:hover {
  background: var(--surface-hover);
  border-color: var(--accent);
  transform: scale(1.1);
}

.speak-btn:active {
  transform: scale(0.95);
}

.question-card__example {
  margin: 0;
  max-width: 62ch;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.65;
  font-style: italic;
}

.question-card__options {
  display: grid;
  gap: 14px;
}

.option {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 18px 20px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-soft);
  color: var(--text-main);
  text-align: left;
  transition:
    transform var(--transition-speed-fast) ease,
    background-color var(--transition-speed-fast) ease,
    border-color var(--transition-speed-fast) ease,
    box-shadow var(--transition-speed-fast) ease;
}

.option:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  background: var(--surface-hover);
  box-shadow: var(--shadow-hover);
}

.option:active {
  transform: translateY(0);
  background: var(--surface-pressed);
}

.option:disabled {
  cursor: default;
}

.option__body {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 14px;
  min-width: 0;
  flex: 1;
}

.option__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  min-width: 32px;
  height: 32px;
  border-radius: 999px;
  background: var(--tone-neutral-soft-strong);
  color: var(--text-muted);
  font-size: 0.95rem;
  font-weight: 700;
}

.option__label {
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
  font-size: 1.03rem;
  font-weight: 600;
  line-height: 1.5;
}

.option__state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--tone-neutral-soft-strong);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.option__state-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  font-size: 0.9rem;
  line-height: 1;
}

.option--selected {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.option--selected .option__index,
.option--selected .option__state {
  background: var(--tone-accent-strong-soft);
  color: var(--accent-strong);
}

.option--correct {
  border-color: var(--success);
  background: var(--success-soft);
  color: var(--text-main);
}

.option--correct .option__index,
.option--correct .option__state {
  background: var(--tone-success-strong-soft);
  color: var(--success);
}

.option--incorrect {
  border-color: var(--danger);
  background: var(--danger-soft);
  color: var(--text-main);
}

.option--incorrect .option__index,
.option--incorrect .option__state {
  background: var(--tone-danger-strong-soft);
  color: var(--danger);
}

.option--readonly:hover {
  transform: none;
  box-shadow: var(--shadow-soft);
}

@media (max-width: 720px) {
  .question-card {
    gap: 20px;
  }

  .question-card__word {
    font-size: clamp(1.9rem, 9vw, 3rem);
  }

  .option {
    padding: 16px;
  }

  .option__body {
    gap: 12px;
  }
}
</style>