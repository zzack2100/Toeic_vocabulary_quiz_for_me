<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  hint: string
  icon: string
  tone?: 'neutral' | 'accent' | 'success' | 'danger'
}>()
</script>

<template>
  <article class="stat-card" :class="`stat-card--${tone ?? 'neutral'}`">
    <div class="stat-card__header">
      <span class="stat-card__icon" aria-hidden="true">{{ icon }}</span>
      <span class="stat-card__label">{{ label }}</span>
    </div>
    <strong class="stat-card__value">{{ value }}</strong>
    <p class="stat-card__hint">{{ hint }}</p>
  </article>
</template>

<style scoped>
.stat-card {
  display: grid;
  gap: 12px;
  min-height: 188px;
  padding: 18px;
  border-radius: var(--border-radius-lg);
  background: linear-gradient(180deg, var(--card-gradient-start), var(--card-gradient-end));
  border: 1px solid var(--border);
  box-shadow: var(--shadow-soft);
  transition:
    transform var(--transition-speed-fast) ease,
    border-color var(--transition-speed-fast) ease,
    box-shadow var(--transition-speed-fast) ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
}

.stat-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: var(--tone-neutral-soft);
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1;
}

.stat-card__label {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.stat-card__value {
  font-size: clamp(2rem, 4vw, 2.5rem);
  line-height: 0.95;
  color: var(--text-main);
}

.stat-card__hint {
  margin: 0;
  color: var(--text-muted);
}

.stat-card--accent .stat-card__icon {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.stat-card--success .stat-card__icon {
  background: var(--success-soft);
  color: var(--success);
}

.stat-card--danger .stat-card__icon {
  background: var(--danger-soft);
  color: var(--danger);
}
</style>