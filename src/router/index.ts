import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DailyQuizView from '../views/DailyQuizView.vue'
import QuizResultView from '../views/QuizResultView.vue'
import MistakeNotebookView from '../views/MistakeNotebookView.vue'
import ReviewQueueView from '../views/ReviewQueueView.vue'
import SettingsView from '../views/SettingsView.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/quiz/daily', name: 'daily-quiz', component: DailyQuizView },
  { path: '/quiz/result', name: 'quiz-result', component: QuizResultView },
  { path: '/mistakes', name: 'mistakes', component: MistakeNotebookView },
  { path: '/review', name: 'review', component: ReviewQueueView },
  { path: '/settings', name: 'settings', component: SettingsView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router