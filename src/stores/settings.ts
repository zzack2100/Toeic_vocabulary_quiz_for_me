import { defineStore } from 'pinia'
import { storageService } from '../services/storageService'

interface SettingsState {
  quizSize: number
  resetMemoryOnWrong: boolean
  locale: string
  theme: 'light' | 'dark'
}

const DEFAULT_SETTINGS: SettingsState = {
  quizSize: 20,
  resetMemoryOnWrong: true,
  locale: 'zh-TW',
  theme: 'light',
}

function applyTheme(theme: SettingsState['theme']) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = theme
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    ...DEFAULT_SETTINGS,
  }),
  actions: {
    loadSettings() {
      Object.assign(this, storageService.getSettings(DEFAULT_SETTINGS))
      applyTheme(this.theme)
    },
    saveSettings() {
      storageService.saveSettings({
        quizSize: this.quizSize,
        resetMemoryOnWrong: this.resetMemoryOnWrong,
        locale: this.locale,
        theme: this.theme,
      })
      applyTheme(this.theme)
    },
    setTheme(theme: SettingsState['theme']) {
      this.theme = theme
      this.saveSettings()
    },
    toggleTheme() {
      this.setTheme(this.theme === 'light' ? 'dark' : 'light')
    },
    resetSettings() {
      Object.assign(this, DEFAULT_SETTINGS)
      this.saveSettings()
    },
  },
})