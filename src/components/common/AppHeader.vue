<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { RouterLink, useRoute } from 'vue-router'
import { useSettingsStore } from '../../stores/settings'

const route = useRoute()
const settingsStore = useSettingsStore()
const { theme } = storeToRefs(settingsStore)

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/quiz/daily', label: 'Daily Quiz' },
  { to: '/mistakes', label: 'Mistakes' },
  { to: '/review', label: 'Review Queue' },
  { to: '/settings', label: 'Settings' },
]
</script>

<template>
  <header class="header">
    <div class="header__inner">
      <RouterLink class="brand" to="/">
        <span class="brand__eyebrow">TOEIC Vocabulary</span>
        <strong class="brand__title">Quiz and Mistake Tracker</strong>
      </RouterLink>
      <div class="header__controls">
        <nav class="nav">
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="nav__link"
            :class="{ 'nav__link--active': route.path === link.to }"
          >
            {{ link.label }}
          </RouterLink>
        </nav>
        <button
          type="button"
          class="theme-switch"
          :class="{ 'theme-switch--dark': theme === 'dark' }"
          :aria-pressed="theme === 'dark'"
          @click="settingsStore.toggleTheme()"
        >
          <span class="theme-switch__track">
            <span class="theme-switch__thumb">{{ theme === 'dark' ? '◐' : '◑' }}</span>
          </span>
          <span class="theme-switch__label">{{ theme === 'dark' ? 'Dark' : 'Light' }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(12px);
  background: var(--header-bg);
  border-bottom: 1px solid var(--header-border);
}

.header__inner {
  width: min(calc(100% - 32px), 1180px);
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 18px 0;
}

.header__controls {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand {
  display: grid;
  gap: 2px;
}

.brand__eyebrow {
  color: var(--accent-strong);
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.brand__title {
  color: var(--text-main);
  font-size: 1.05rem;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.nav__link {
  padding: 10px 14px;
  border-radius: 999px;
  color: var(--text-muted);
}

.nav__link--active,
.nav__link:hover {
  color: var(--text-main);
  background: var(--accent-soft);
}

.theme-switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-main);
  transition:
    transform var(--transition-speed-fast) ease,
    border-color var(--transition-speed-fast) ease,
    background-color var(--transition-speed-fast) ease;
}

.theme-switch:hover {
  transform: translateY(-1px);
  border-color: var(--accent);
  background: var(--surface-hover);
}

.theme-switch__track {
  display: inline-flex;
  align-items: center;
  width: 42px;
  height: 24px;
  padding: 2px;
  border-radius: 999px;
  background: var(--accent-soft);
}

.theme-switch__thumb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: var(--surface-strong);
  transform: translateX(0);
  transition: transform var(--transition-speed-fast) ease;
  font-size: 0.8rem;
}

.theme-switch--dark .theme-switch__thumb {
  transform: translateX(18px);
}

.theme-switch__label {
  font-size: 0.92rem;
}

@media (max-width: 720px) {
  .header__inner {
    align-items: start;
    flex-direction: column;
    width: min(calc(100% - 20px), 1180px);
  }

  .header__controls {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .theme-switch {
    align-self: flex-start;
  }
}
</style>