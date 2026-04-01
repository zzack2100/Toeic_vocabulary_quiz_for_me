<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

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
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(12px);
  background: rgba(246, 242, 234, 0.82);
  border-bottom: 1px solid rgba(31, 36, 48, 0.08);
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

.brand {
  display: grid;
  gap: 2px;
}

.brand__eyebrow {
  color: #af4d1a;
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.brand__title {
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
  color: #5e6472;
}

.nav__link--active,
.nav__link:hover {
  color: #1f2430;
  background: rgba(212, 106, 46, 0.12);
}

@media (max-width: 720px) {
  .header__inner {
    align-items: start;
    flex-direction: column;
    width: min(calc(100% - 20px), 1180px);
  }
}
</style>