<script setup lang="ts">
import type { QuizQuestion } from '../../types/quiz'

defineProps<{
  question: QuizQuestion
  questionNumber: number
  totalQuestions: number
  selectedAnswer?: string
}>()

const emit = defineEmits<{
  select: [value: string]
}>()
</script>

<template>
  <article class="question-card">
    <div class="question-card__meta">
      <span class="badge">Question {{ questionNumber }} / {{ totalQuestions }}</span>
      <span class="question-card__word">{{ question.prompt }}</span>
    </div>
    <div class="question-card__options">
      <button
        v-for="option in question.options"
        :key="option"
        class="option"
        :class="{ 'option--active': option === selectedAnswer }"
        @click="emit('select', option)"
      >
        {{ option }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.question-card {
  display: grid;
  gap: 20px;
}

.question-card__meta {
  display: grid;
  gap: 14px;
}

.question-card__word {
  font-size: clamp(2rem, 6vw, 3.6rem);
  line-height: 0.95;
}

.question-card__options {
  display: grid;
  gap: 12px;
}

.option {
  padding: 16px;
  border: 1px solid rgba(31, 36, 48, 0.12);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.76);
  text-align: left;
}

.option--active,
.option:hover {
  border-color: rgba(212, 106, 46, 0.45);
  background: rgba(212, 106, 46, 0.12);
}
</style>