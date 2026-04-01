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
  border: 1px solid rgba(31, 36, 48, 0.1);
  border-radius: 28px;
  background: rgba(255, 250, 241, 0.88);
  box-shadow: 0 18px 50px rgba(53, 41, 31, 0.12);
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
  font-size: 1.3rem;
}

.card__subtitle {
  margin: 6px 0 0;
  color: #5e6472;
}

.card__body {
  padding: 20px;
}
</style>