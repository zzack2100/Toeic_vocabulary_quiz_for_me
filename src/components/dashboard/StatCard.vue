<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  hint: string
}>()
</script>

<template>
  <article class="stat-card">
    <span class="stat-card__label">{{ label }}</span>
    <strong class="stat-card__value">{{ value }}</strong>
    <p class="stat-card__hint">{{ hint }}</p>
  </article>
</template>

<style scoped>
.stat-card {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 248, 236, 0.96));
  border: 1px solid rgba(31, 36, 48, 0.08);
}

.stat-card__label {
  color: #5e6472;
  font-size: 0.95rem;
}

.stat-card__value {
  font-size: 2rem;
  line-height: 1;
}

.stat-card__hint {
  margin: 0;
  color: #5e6472;
}
</style>