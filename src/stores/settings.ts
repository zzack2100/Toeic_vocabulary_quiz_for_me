import { defineStore } from 'pinia'
import { storageService } from '../services/storageService'

interface SettingsState {
  quizSize: number
  resetMemoryOnWrong: boolean
  locale: string
}

const DEFAULT_SETTINGS: SettingsState = {
  quizSize: 20,
  resetMemoryOnWrong: true,
  locale: 'zh-TW',
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    ...DEFAULT_SETTINGS,
  }),
  actions: {
    loadSettings() {
      Object.assign(this, storageService.getSettings(DEFAULT_SETTINGS))
    },
    saveSettings() {
      storageService.saveSettings({
        quizSize: this.quizSize,
        resetMemoryOnWrong: this.resetMemoryOnWrong,
        locale: this.locale,
      })
    },
    resetSettings() {
      Object.assign(this, DEFAULT_SETTINGS)
      this.saveSettings()
    },
  },
})