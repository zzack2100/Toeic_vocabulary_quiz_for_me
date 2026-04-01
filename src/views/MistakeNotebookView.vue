<script setup lang="ts">
import { computed } from 'vue'
import SectionCard from '../components/common/SectionCard.vue'
import MistakeWordCard from '../components/notebook/MistakeWordCard.vue'
import { useMistakesStore } from '../stores/mistakes'
import { useVocabularyStore } from '../stores/vocabulary'

const mistakesStore = useMistakesStore()
const vocabularyStore = useVocabularyStore()

const cards = computed(() =>
  mistakesStore.sortedMistakes.map((record) => ({
    record,
    word: vocabularyStore.getWordById(record.word_id),
  })),
)
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <span class="badge">{{ mistakesStore.mistakeCount }} tracked items</span>
        <h1 class="page-title">Mistake notebook</h1>
        <p class="page-subtitle">Every wrong answer is persisted locally and pushed back into future quiz selection.</p>
      </div>
      <button class="button button--ghost" @click="mistakesStore.clearNotebook()">Clear notebook</button>
    </header>

    <SectionCard title="Tracked words" subtitle="Ordered by most recent failure.">
      <div v-if="cards.length > 0" class="list">
        <MistakeWordCard
          v-for="item in cards"
          :key="item.record.word_id"
          :record="item.record"
          :word="item.word"
        />
      </div>
      <p v-else class="muted">No mistakes recorded yet.</p>
    </SectionCard>
  </section>
</template>