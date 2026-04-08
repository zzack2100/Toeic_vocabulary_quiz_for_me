<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import SectionCard from '../components/common/SectionCard.vue'
import { storageService } from '../services/storageService'
import { login, register } from '../services/authApi'
import { syncWordsToCloud } from '../services/vocabularyService'
import { useAuthStore } from '../stores/auth'
import { useMistakesStore } from '../stores/mistakes'
import { useQuizStore } from '../stores/quiz'
import { useSettingsStore } from '../stores/settings'
import { useVocabularyStore } from '../stores/vocabulary'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const vocabularyStore = useVocabularyStore()
const mistakesStore = useMistakesStore()
const quizStore = useQuizStore()

const { isAuthenticated, userEmail } = storeToRefs(authStore)
const { quizSize, resetMemoryOnWrong, theme, } = storeToRefs(settingsStore)
const { isExpanding } = storeToRefs(vocabularyStore)

const authEmail = ref('')
const authPassword = ref('')
const authStatus = ref('')
const authStatusTone = ref<'neutral' | 'success' | 'error'>('neutral')
const isSyncing = ref(false)

const expansionTopic = ref('Business Negotiations')
const expansionStatus = ref('')
const expansionStatusTone = ref<'neutral' | 'success' | 'error'>('neutral')

async function handleLogin() {
  authStatus.value = ''
  try {
    const data = await login(authEmail.value, authPassword.value)
    authStore.setSession(data.token!, authEmail.value)
    authStatusTone.value = 'success'
    authStatus.value = 'Logged in successfully.'
    authEmail.value = ''
    authPassword.value = ''
  } catch (error) {
    authStatusTone.value = 'error'
    authStatus.value = error instanceof Error ? error.message : 'Login failed.'
  }
}

async function handleRegister() {
  authStatus.value = ''
  try {
    await register(authEmail.value, authPassword.value)
    authStatusTone.value = 'success'
    authStatus.value = 'Registered successfully. You can now log in.'
  } catch (error) {
    authStatusTone.value = 'error'
    authStatus.value = error instanceof Error ? error.message : 'Registration failed.'
  }
}

function handleLogout() {
  authStore.logout()
  authStatus.value = ''
}

async function handleSyncNow() {
  if (!authStore.token) return
  isSyncing.value = true
  authStatus.value = ''
  try {
    await syncWordsToCloud(vocabularyStore.words, authStore.token)
    authStatusTone.value = 'success'
    authStatus.value = `Synced ${vocabularyStore.words.length} words to cloud.`
  } catch (error) {
    authStatusTone.value = 'error'
    authStatus.value = error instanceof Error ? error.message : 'Sync failed.'
  } finally {
    isSyncing.value = false
  }
}

function resetAllProgress() {
  storageService.resetAll()
  mistakesStore.clearNotebook()
  quizStore.resetQuiz()
  settingsStore.resetSettings()
  vocabularyStore.loadVocabulary()
}

async function handleVocabularyExpansion() {
  const topic = expansionTopic.value.trim()

  if (!topic) {
    expansionStatusTone.value = 'error'
    expansionStatus.value = 'Enter a TOEIC topic before requesting new vocabulary.'
    return
  }

  try {
    const result = await vocabularyStore.expandVocabulary(topic)
    expansionStatusTone.value = 'success'
    expansionStatus.value = `Requested ${result.requestedCount} words for "${topic}". Added ${result.addedCount} new words and skipped ${result.skippedCount} duplicates.`
  } catch (error) {
    expansionStatusTone.value = 'error'
    expansionStatus.value = error instanceof Error ? error.message : 'Vocabulary expansion failed.'
  }
}
</script>

<template>
  <section>
    <header class="page-header">
      <div>
        <span class="badge">Local-first configuration</span>
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">This scaffold keeps persistence intentionally simple so migrations stay obvious later.</p>
      </div>
    </header>

    <SectionCard title="Account &amp; Cloud Sync" subtitle="Sign in to sync your vocabulary progress across devices." style="margin-bottom: 18px">
      <template v-if="!isAuthenticated">
        <div class="field">
          <label for="auth-email">Email</label>
          <input id="auth-email" v-model.trim="authEmail" type="email" placeholder="you@example.com" />
        </div>
        <div class="field" style="margin-top: 12px">
          <label for="auth-password">Password</label>
          <input id="auth-password" v-model="authPassword" type="password" placeholder="Your password" />
        </div>
        <div class="button-row" style="margin-top: 18px">
          <button class="button" @click="handleLogin()">Login</button>
          <button class="button button--ghost" @click="handleRegister()">Register</button>
        </div>
      </template>
      <template v-else>
        <div class="list">
          <p><strong>Signed in as:</strong> {{ userEmail }}</p>
        </div>
        <div class="button-row" style="margin-top: 18px">
          <button class="button" :disabled="isSyncing" @click="handleSyncNow()">
            {{ isSyncing ? 'Syncing...' : 'Sync Now' }}
          </button>
          <button class="button button--ghost" @click="handleLogout()">Logout</button>
        </div>
      </template>
      <p
        v-if="authStatus"
        class="expansion-status"
        :class="`expansion-status--${authStatusTone}`"
        style="margin-top: 14px"
      >
        {{ authStatus }}
      </p>
    </SectionCard>

    <div class="grid grid--two">
      <SectionCard title="Quiz preferences" subtitle="Starter configuration persisted in Local Storage.">
        <div class="field">
          <label for="quiz-size">Quiz size</label>
          <input id="quiz-size" v-model.number="quizSize" min="4" max="50" type="number" />
        </div>
        <div class="field" style="margin-top: 16px">
          <label for="theme-mode">Theme mode</label>
          <div class="theme-setting">
            <button
              id="theme-mode"
              type="button"
              class="theme-setting__switch"
              :class="{ 'theme-setting__switch--dark': theme === 'dark' }"
              :aria-pressed="theme === 'dark'"
              @click="settingsStore.toggleTheme()"
            >
              <span class="theme-setting__switch-track">
                <span class="theme-setting__switch-thumb">{{ theme === 'dark' ? '◐' : '◑' }}</span>
              </span>
              <span>{{ theme === 'dark' ? 'Dark mode' : 'Light mode' }}</span>
            </button>
            <p class="muted theme-setting__hint">
              Changes apply immediately and are stored locally for the next visit.
            </p>
          </div>
        </div>
        <div class="field" style="margin-top: 16px">
          <label for="wrong-strategy">On wrong answer</label>
          <select id="wrong-strategy" v-model="resetMemoryOnWrong">
            <option :value="true">Reset memory level to 0</option>
            <option :value="false">Decrease memory level by 1</option>
          </select>
        </div>
        <div class="button-row" style="margin-top: 18px">
          <button class="button" @click="settingsStore.saveSettings()">Save settings</button>
        </div>
      </SectionCard>

      <SectionCard title="Data operations" subtitle="Manual reset tools for the browser-only prototype.">
        <div class="list">
          <p><strong>Loaded words:</strong> {{ vocabularyStore.totalWords }}</p>
          <p><strong>Mistakes:</strong> {{ mistakesStore.mistakeCount }}</p>
          <p><strong>Stored quiz:</strong> {{ quizStore.quizDate || 'None' }}</p>
        </div>
        <div class="button-row" style="margin-top: 18px">
          <button class="button button--ghost" @click="quizStore.resetQuiz()">Reset daily quiz</button>
          <button class="button button--ghost" @click="resetAllProgress()">Reset all progress</button>
        </div>
      </SectionCard>
    </div>

    <SectionCard
      title="Vocabulary expansion"
      subtitle="Request 10 new TOEIC-level words from the backend API and append them to the local vocabulary set."
      style="margin-top: 18px"
    >
      <div class="field">
        <label for="expansion-topic">Topic</label>
        <input
          id="expansion-topic"
          v-model.trim="expansionTopic"
          placeholder="Business Negotiations"
          type="text"
        />
      </div>
      <p class="muted expansion-note">
        Start the backend with `npm run dev:api` so the frontend can call `/api/vocabulary/expand` during development.
      </p>
      <div class="button-row" style="margin-top: 18px">
        <button class="button" :disabled="isExpanding" @click="handleVocabularyExpansion()">
          {{ isExpanding ? 'Expanding vocabulary...' : 'Expand vocabulary' }}
        </button>
      </div>
      <p
        v-if="expansionStatus"
        class="expansion-status"
        :class="`expansion-status--${expansionStatusTone}`"
      >
        {{ expansionStatus }}
      </p>
    </SectionCard>
  </section>
</template>

<style scoped>
.expansion-note {
  margin: 14px 0 0;
}

.expansion-status {
  margin: 16px 0 0;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius-md);
  background: var(--surface);
}

.expansion-status--success {
  border-color: var(--success);
  background: var(--success-soft);
  color: var(--success);
}

.expansion-status--error {
  border-color: var(--danger);
  background: var(--danger-soft);
  color: var(--danger);
}

.theme-setting {
  display: grid;
  gap: 10px;
}

.theme-setting__switch {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-start;
  width: fit-content;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-main);
  padding: 10px 14px;
  transition:
    transform var(--transition-speed-fast) ease,
    border-color var(--transition-speed-fast) ease,
    background-color var(--transition-speed-fast) ease;
}

.theme-setting__switch:hover {
  transform: translateY(-1px);
  border-color: var(--accent);
  background: var(--surface-hover);
}

.theme-setting__switch-track {
  display: inline-flex;
  align-items: center;
  width: 44px;
  height: 24px;
  padding: 2px;
  border-radius: 999px;
  background: var(--accent-soft);
}

.theme-setting__switch-thumb {
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

.theme-setting__switch--dark .theme-setting__switch-thumb {
  transform: translateX(20px);
}

.theme-setting__hint {
  margin: 0;
}
</style>