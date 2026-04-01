<script setup lang="ts">
import { computed } from 'vue'
import { formatDateLabel } from '../../utils/date'
import type { MistakeRecord, ToeicWord } from '../../types/vocabulary'

const props = defineProps<{
  record: MistakeRecord
  word?: ToeicWord
}>()

const reviewedLabel = computed(() => formatDateLabel(props.record.last_wrong_at))
</script>

<template>
  <article class="mistake-card">
    <div>
      <h3 class="mistake-card__title">{{ word?.word ?? record.word_id }}</h3>
      <p class="mistake-card__translation">{{ word?.translation_zh_TW ?? 'Translation unavailable' }}</p>
    </div>
    <dl class="mistake-card__meta">
      <div>
        <dt>Wrong Count</dt>
        <dd>{{ record.wrong_count }}</dd>
      </div>
      <div>
        <dt>Last Wrong</dt>
        <dd>{{ reviewedLabel }}</dd>
      </div>
      <div>
        <dt>Last Selection</dt>
        <dd>{{ record.last_selected_answer || 'No answer captured' }}</dd>
      </div>
    </dl>
  </article>
</template>

<style scoped>
.mistake-card {
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(31, 36, 48, 0.08);
}

.mistake-card__title {
  margin: 0;
  font-size: 1.5rem;
}

.mistake-card__translation {
  margin: 6px 0 0;
  color: #5e6472;
}

.mistake-card__meta {
  display: grid;
  gap: 8px;
  margin: 0;
}

.mistake-card__meta div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.mistake-card__meta dt {
  color: #5e6472;
}

.mistake-card__meta dd {
  margin: 0;
}
</style>