import { defineStore } from 'pinia'

const TOKEN_KEY = 'toeic.auth.token'
const EMAIL_KEY = 'toeic.auth.email'

interface AuthState {
  token: string | null
  userEmail: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem(TOKEN_KEY),
    userEmail: localStorage.getItem(EMAIL_KEY),
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    setSession(token: string, email: string) {
      this.token = token
      this.userEmail = email
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(EMAIL_KEY, email)
    },
    logout() {
      this.token = null
      this.userEmail = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(EMAIL_KEY)
    },
  },
})
