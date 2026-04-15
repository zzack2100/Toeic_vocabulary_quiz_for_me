<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import SectionCard from '../common/SectionCard.vue'
import { login, register } from '../../services/authApi'
import { syncWordsToCloud } from '../../services/vocabularyService'
import { useAuthStore } from '../../stores/auth'
import { useVocabularyStore } from '../../stores/vocabulary'
import { useMistakesStore } from '../../stores/mistakes'
import { GoogleLogin } from 'vue3-google-login'

const authStore = useAuthStore()
const vocabularyStore = useVocabularyStore()
const mistakesStore = useMistakesStore()

const { isAuthenticated, userEmail } = storeToRefs(authStore)

const authEmail = ref('')
const authPassword = ref('')
const authStatus = ref('')
const authStatusTone = ref<'neutral' | 'success' | 'error'>('neutral')
const isSyncing = ref(false)

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

async function onGoogleLogin(response: { credential: string }) {
  authStatus.value = ''
  try {
    await authStore.handleGoogleAuth(response.credential)
    authStatusTone.value = 'success'
    authStatus.value = 'Logged in with Google successfully.'
  } catch (error) {
    authStatusTone.value = 'error'
    authStatus.value = error instanceof Error ? error.message : 'Google login failed.'
  }
}

async function handleSyncNow() {
  if (!authStore.token) return
  isSyncing.value = true
  authStatus.value = ''
  try {
    // Derive is_in_mistake_notebook from the actual notebook state rather than
    // the word's cached flag.  This is the "sync state reset": if clearNotebook
    // ran, mistakesStore.notebook is {}, so every word gets false — preventing
    // stale cached flags from resurrecting deleted items in the cloud.
    const reconciledWords = vocabularyStore.words.map((word) => ({
      ...word,
      memory: {
        ...word.memory,
        is_in_mistake_notebook:
          word.id in mistakesStore.notebook
            ? !mistakesStore.notebook[word.id].resolved
            : false,
      },
    }))
    await syncWordsToCloud(reconciledWords, authStore.token)
    authStatusTone.value = 'success'
    authStatus.value = `Synced ${vocabularyStore.words.length} words to cloud.`
  } catch (error) {
    authStatusTone.value = 'error'
    authStatus.value = error instanceof Error ? error.message : 'Sync failed.'
  } finally {
    isSyncing.value = false
  }
}
</script>

<template>
  <SectionCard title="Account &amp; Cloud Sync" subtitle="Sign in to sync your vocabulary progress across devices.">
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
      <div class="auth-separator">
        <span class="auth-separator__line"></span>
        <span class="auth-separator__text">or</span>
        <span class="auth-separator__line"></span>
      </div>
      <GoogleLogin :callback="onGoogleLogin" />
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
      class="auth-status"
      :class="`auth-status--${authStatusTone}`"
      style="margin-top: 14px"
    >
      {{ authStatus }}
    </p>
  </SectionCard>
</template>

<style scoped>
.auth-separator {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 0;
}

.auth-separator__line {
  flex: 1;
  height: 1px;
  background: var(--border);
}

.auth-separator__text {
  color: var(--text-muted, #888);
  font-size: 0.85rem;
}

.auth-status {
  margin: 16px 0 0;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius-md);
  background: var(--surface);
}

.auth-status--success {
  border-color: var(--success);
  background: var(--success-soft);
  color: var(--success);
}

.auth-status--error {
  border-color: var(--danger);
  background: var(--danger-soft);
  color: var(--danger);
}
</style>
