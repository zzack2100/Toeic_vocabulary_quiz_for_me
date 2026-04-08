<script setup lang="ts">
import { computed } from 'vue'
import { storageService } from '../../services/storageService'

const DAYS = 30

const dayCells = computed(() => {
  const history = storageService.getActivityHistory()
  const countByDate: Record<string, number> = {}

  for (const ts of history) {
    const key = ts.slice(0, 10) // YYYY-MM-DD
    countByDate[key] = (countByDate[key] ?? 0) + 1
  }

  const cells: { date: string; label: string; count: number; level: number }[] = []
  const today = new Date()

  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const count = countByDate[key] ?? 0
    const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : 3

    cells.push({
      date: key,
      label: `${key}: ${count} session${count !== 1 ? 's' : ''}`,
      count,
      level,
    })
  }

  return cells
})

const totalSessions = computed(() =>
  dayCells.value.reduce((sum, c) => sum + c.count, 0),
)

const activeDays = computed(() =>
  dayCells.value.filter((c) => c.count > 0).length,
)
</script>

<template>
  <div class="heatmap">
    <div class="heatmap__header">
      <h3 class="heatmap__title">30-day activity</h3>
      <span class="heatmap__summary">{{ totalSessions }} sessions across {{ activeDays }} days</span>
    </div>
    <div class="heatmap__grid">
      <div
        v-for="cell in dayCells"
        :key="cell.date"
        class="heatmap__cell"
        :class="`heatmap__cell--l${cell.level}`"
        :title="cell.label"
        :aria-label="cell.label"
      />
    </div>
    <div class="heatmap__legend">
      <span class="heatmap__legend-label">Less</span>
      <div class="heatmap__cell heatmap__cell--l0" />
      <div class="heatmap__cell heatmap__cell--l1" />
      <div class="heatmap__cell heatmap__cell--l2" />
      <div class="heatmap__cell heatmap__cell--l3" />
      <span class="heatmap__legend-label">More</span>
    </div>
  </div>
</template>

<style scoped>
.heatmap {
  display: grid;
  gap: 12px;
  padding: 20px 24px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius-lg);
  background:
    linear-gradient(180deg, var(--panel-gradient-start), var(--panel-gradient-end)),
    var(--surface);
  box-shadow: var(--shadow-soft);
}

.heatmap__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.heatmap__title {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-main);
}

.heatmap__summary {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.heatmap__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 18px);
  gap: 4px;
}

.heatmap__cell {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  transition: transform var(--transition-speed-fast) ease;
}

.heatmap__cell:hover {
  transform: scale(1.3);
}

.heatmap__cell--l0 {
  background: var(--tone-neutral-soft);
}

.heatmap__cell--l1 {
  background: var(--accent-soft);
}

.heatmap__cell--l2 {
  background: var(--accent);
  opacity: 0.7;
}

.heatmap__cell--l3 {
  background: var(--accent);
}

.heatmap__legend {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-self: end;
}

.heatmap__legend-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0 4px;
}

.heatmap__legend .heatmap__cell {
  width: 14px;
  height: 14px;
}

@media (max-width: 720px) {
  .heatmap__grid {
    grid-template-columns: repeat(auto-fill, 14px);
    gap: 3px;
  }

  .heatmap__cell {
    width: 14px;
    height: 14px;
  }
}
</style>
