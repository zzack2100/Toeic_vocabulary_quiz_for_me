<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <section class="card">
    <header class="card__header">
      <div>
        <h2 class="card__title">{{ title }}</h2>
        <p v-if="subtitle" class="card__subtitle">{{ subtitle }}</p>
      </div>
      <slot name="header" />
    </header>
    <div class="card__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.card {
  border: 1px solid var(--border);
  border-radius: var(--border-radius-lg);
  background: var(--card-surface);
  box-shadow: var(--shadow);
}

.card__header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 16px;
  padding: 20px 20px 0;
}

.card__title {
  margin: 0;
  color: var(--text-main);
  font-size: 1.3rem;
}

.card__subtitle {
  margin: 6px 0 0;
  color: var(--text-muted);
}

.card__body {
  padding: 20px;
}
</style>