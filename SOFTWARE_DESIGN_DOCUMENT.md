# TOEIC Vocabulary Quiz and Mistake Tracking System

## 1. Document Purpose

This Software Design Document (SDD) defines the architecture, data models, frontend structure, and state management design for a Single Page Application (SPA) called **TOEIC Vocabulary Quiz and Mistake Tracking System**.

The system is designed to help learners practice TOEIC vocabulary through daily quizzes, track wrong answers in a mistake notebook, and apply simplified spaced repetition using browser-side persistence only.

## 2. Scope

### In Scope

- Vue 3 SPA using Composition API
- Pinia for centralized state management
- Vue Router for page navigation
- Static JSON vocabulary source
- Local Storage persistence for user progress and mistake tracking
- Daily quiz generation with 20 multiple-choice questions
- Mistake notebook management
- Simplified Ebbinghaus-style review scheduling in the frontend

### Out of Scope

- Backend server and database
- User authentication and multi-device sync
- Admin tools for vocabulary import/editing
- Audio pronunciation and advanced analytics
- PWA offline caching beyond normal browser behavior

## 3. Goals and Non-Goals

### Goals

1. Provide a fast, client-only TOEIC vocabulary practice experience.
2. Increase retention by prioritizing forgotten and mistaken words.
3. Keep the architecture simple enough to evolve into a future backend-based product.
4. Ensure the persistence model remains understandable and debuggable in Local Storage.

### Non-Goals

1. Perfect scientific implementation of Ebbinghaus memory theory.
2. Real-time collaboration or shared profiles.
3. High-security storage of learning data.

## 4. Assumptions and Constraints

1. The vocabulary master dataset is delivered as a static JSON file bundled with the frontend app.
2. All user progress is stored in Local Storage under application-specific keys.
3. The application supports a single anonymous learner profile per browser.
4. Quiz generation and review scheduling run entirely in the browser.
5. The first release prioritizes maintainability and predictable behavior over algorithmic sophistication.

## 5. System Architecture Overview

### 5.1 Architecture Style

The application follows a **frontend-only layered SPA architecture**:

1. **Presentation Layer**
   - Vue components render screens, forms, quiz cards, result views, and notebook lists.
2. **Application State Layer**
   - Pinia stores manage vocabulary data, quiz session state, mistake notebook state, and review scheduling.
3. **Domain Logic Layer**
   - Pure utility modules implement quiz generation, distractor selection, scoring, mistake prioritization, and spaced repetition calculations.
4. **Persistence Layer**
   - Static JSON file supplies the vocabulary catalog.
   - Local Storage persists learner progress, review metadata, and mistake history.

### 5.2 High-Level Flow

1. On app startup, the vocabulary JSON file is loaded into memory.
2. Persisted progress from Local Storage is merged with the static vocabulary data.
3. The quiz engine builds a 20-question daily quiz.
4. Words with due review dates or past mistakes receive higher selection priority.
5. The learner answers questions.
6. The app updates memory level, next review interval, and mistake notebook records.
7. Updated progress is persisted back to Local Storage.

### 5.3 Logical Modules

| Module | Responsibility |
|---|---|
| `router` | Page routing and navigation guards |
| `stores/vocabulary` | Master vocabulary list and merged progress view |
| `stores/quiz` | Active quiz session, answer submission, scoring |
| `stores/mistakes` | Wrong-answer notebook and review counters |
| `stores/review` | Spaced repetition calculations and due word selection |
| `services/storage` | Local Storage read/write/versioning |
| `services/vocabularyLoader` | Load static JSON vocabulary file |
| `utils/quizGenerator` | Select words and generate multiple-choice options |
| `utils/spacedRepetition` | Interval and memory-level calculations |

### 5.4 Deployment Model

The SPA can be deployed as static assets to any static hosting platform.

- HTML, CSS, JavaScript bundle
- Static JSON vocabulary file
- No server runtime
- No external database dependency

## 6. Proposed Directory Structure

```text
src/
  assets/
  components/
    common/
    quiz/
    notebook/
    dashboard/
  composables/
  router/
    index.ts
  services/
    storageService.ts
    vocabularyService.ts
  stores/
    vocabulary.ts
    quiz.ts
    mistakes.ts
    review.ts
    settings.ts
  types/
    vocabulary.ts
    quiz.ts
  utils/
    quizGenerator.ts
    spacedRepetition.ts
    date.ts
  views/
    HomeView.vue
    DailyQuizView.vue
    QuizResultView.vue
    MistakeNotebookView.vue
    ReviewQueueView.vue
    SettingsView.vue
  App.vue
  main.ts
public/
  data/
    toeic_vocabulary.json
```

## 7. Data Models

### 7.1 Core Design Principle

The static vocabulary JSON file should contain immutable lexical content. Learner-specific progress should be stored separately in Local Storage and merged at runtime. This separation avoids rewriting bundled assets and keeps persistence concerns clean.

### 7.2 TOEIC Vocabulary Word Schema

Below is the recommended JSON structure for a vocabulary word. It includes lexical data and frontend review metadata required by the project.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ToeicVocabularyWord",
  "type": "object",
  "required": [
    "id",
    "word",
    "translation_zh_TW",
    "part_of_speech",
    "example_sentence",
    "memory"
  ],
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique stable identifier, for example TOEIC-0001"
    },
    "word": {
      "type": "string",
      "description": "English vocabulary word"
    },
    "translation_zh_TW": {
      "type": "string",
      "description": "Chinese translation"
    },
    "part_of_speech": {
      "type": "string",
      "enum": [
        "noun",
        "verb",
        "adjective",
        "adverb",
        "preposition",
        "conjunction",
        "pronoun",
        "phrase",
        "other"
      ]
    },
    "example_sentence": {
      "type": "string",
      "description": "Example English sentence using the word"
    },
    "difficulty": {
      "type": "string",
      "enum": ["easy", "medium", "hard"],
      "default": "medium"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "default": []
    },
    "memory": {
      "type": "object",
      "required": [
        "memory_level",
        "last_reviewed_date",
        "interval_days",
        "next_review_date",
        "times_seen",
        "times_correct",
        "times_incorrect",
        "is_in_mistake_notebook"
      ],
      "properties": {
        "memory_level": {
          "type": "integer",
          "minimum": 0,
          "maximum": 7,
          "description": "Simplified Ebbinghaus stage"
        },
        "last_reviewed_date": {
          "type": ["string", "null"],
          "format": "date-time"
        },
        "interval_days": {
          "type": "integer",
          "minimum": 0,
          "description": "Current review interval in days"
        },
        "next_review_date": {
          "type": ["string", "null"],
          "format": "date-time"
        },
        "times_seen": {
          "type": "integer",
          "minimum": 0
        },
        "times_correct": {
          "type": "integer",
          "minimum": 0
        },
        "times_incorrect": {
          "type": "integer",
          "minimum": 0
        },
        "is_in_mistake_notebook": {
          "type": "boolean"
        },
        "last_result": {
          "type": ["string", "null"],
          "enum": ["correct", "incorrect", null]
        }
      }
    }
  }
}
```

### 7.3 Example Vocabulary Record

```json
{
  "id": "TOEIC-0001",
  "word": "negotiate",
  "translation_zh_TW": "協商；談判",
  "part_of_speech": "verb",
  "example_sentence": "The manager negotiated a better price with the supplier.",
  "difficulty": "medium",
  "tags": ["business", "meeting", "contract"],
  "memory": {
    "memory_level": 0,
    "last_reviewed_date": null,
    "interval_days": 0,
    "next_review_date": null,
    "times_seen": 0,
    "times_correct": 0,
    "times_incorrect": 0,
    "is_in_mistake_notebook": false,
    "last_result": null
  }
}
```

### 7.4 Recommended Persistence Split

#### Static JSON: `public/data/toeic_vocabulary.json`

- `id`
- `word`
- `translation_zh_TW`
- `part_of_speech`
- `example_sentence`
- `difficulty`
- `tags`

#### Local Storage: learner progress only

Recommended key names:

- `toeic.vocab.progress`
- `toeic.quiz.daily`
- `toeic.mistakes`
- `toeic.settings`
- `toeic.app.version`

This avoids duplication of the master vocabulary file and makes migration simpler.

### 7.5 Local Storage Progress Model

```json
{
  "TOEIC-0001": {
    "memory_level": 2,
    "last_reviewed_date": "2026-04-01T08:30:00.000Z",
    "interval_days": 3,
    "next_review_date": "2026-04-04T08:30:00.000Z",
    "times_seen": 4,
    "times_correct": 3,
    "times_incorrect": 1,
    "is_in_mistake_notebook": true,
    "last_result": "incorrect"
  }
}
```

## 8. Simplified Spaced Repetition Design

### 8.1 Objective

Implement a lightweight frontend-only approximation of the Ebbinghaus Forgetting Curve by increasing review intervals when answers are correct and shortening them when answers are wrong.

### 8.2 Simplified Memory Levels

| Memory Level | Interval |
|---|---|
| 0 | same day |
| 1 | 1 day |
| 2 | 2 days |
| 3 | 4 days |
| 4 | 7 days |
| 5 | 15 days |
| 6 | 30 days |
| 7 | 60 days |

### 8.3 Review Update Rules

#### On Correct Answer

1. Increase `memory_level` by 1, capped at 7.
2. Set `interval_days` based on the new level.
3. Set `last_reviewed_date` to current timestamp.
4. Set `next_review_date = now + interval_days`.
5. Increment `times_seen` and `times_correct`.
6. If the word has been answered correctly enough times consecutively, it may remain in the mistake notebook history but should lose priority.

#### On Incorrect Answer

1. Reset `memory_level` to 0 or reduce it by 1 to 2 levels.
2. Set `interval_days` to 0 or 1 depending on product preference.
3. Set `last_reviewed_date` to current timestamp.
4. Set `next_review_date` to immediate review or next day.
5. Increment `times_seen` and `times_incorrect`.
6. Mark `is_in_mistake_notebook = true`.
7. Increase its quiz selection priority.

### 8.4 Due Review Logic

A word is considered **due** if:

```text
next_review_date is null OR next_review_date <= current_time
```

### 8.5 Priority Score for Quiz Selection

To balance variety with retention, each word can be assigned a simple selection score:

```text
priority_score = due_weight + mistake_weight + freshness_weight
```

Suggested rules:

- `due_weight = 50` if review is due, otherwise `0`
- `mistake_weight = times_incorrect * 10`
- `freshness_weight = 20 - memory_level * 2`

Higher scores are more likely to be selected into the next quiz.

### 8.6 Why This Works in a Frontend-Only App

- Timestamps are deterministic and easy to store in Local Storage.
- The algorithm is transparent and debuggable.
- It supports future migration to a backend without changing the business rules significantly.

## 9. Quiz Design

### 9.1 Daily Quiz Mode

The daily quiz generates 20 multiple-choice questions.

#### Question Generation Rules

1. Build a candidate pool from the full vocabulary set.
2. Rank candidates using review priority and mistake history.
3. Select 20 unique words.
4. For each question, present:
   - English word
   - Four Chinese translation options
   - Exactly one correct answer
5. Distractors should preferably come from the same part of speech or similar difficulty to increase learning quality.

#### Recommended Selection Mix

- 50% due review words
- 30% mistake notebook words
- 20% new or low-exposure words

If a category has insufficient items, the remaining slots are filled from other categories.

### 9.2 Quiz Session Lifecycle

1. Generate session questions.
2. Persist current session in memory and optionally Local Storage.
3. Record answer selection per question.
4. On submit, calculate score.
5. Update review metadata for each answered word.
6. Save incorrect answers into the mistake notebook.
7. Show results and recommended next reviews.

### 9.3 Daily Quiz Idempotency

To avoid regenerating a different daily quiz on refresh, store:

```json
{
  "date": "2026-04-01",
  "question_ids": ["TOEIC-0001", "TOEIC-0104", "TOEIC-0033"]
}
```

If the stored date matches today, reuse the same question IDs.

## 10. Mistake Notebook Design

### 10.1 Purpose

The mistake notebook stores words answered incorrectly so the learner can revisit weak points.

### 10.2 Notebook Record Model

```json
{
  "TOEIC-0001": {
    "word_id": "TOEIC-0001",
    "wrong_count": 3,
    "last_wrong_at": "2026-04-01T08:30:00.000Z",
    "last_selected_answer": "談判",
    "resolved": false
  }
}
```

### 10.3 Entry Rules

1. Add a word when the learner answers incorrectly.
2. Increment `wrong_count` for repeated mistakes.
3. Update `last_wrong_at` every time.
4. Keep the record until the learner answers correctly for a configured threshold, such as 2 consecutive reviews.

### 10.4 Priority Behavior

Mistake notebook words should be favored in future quiz generation by:

1. Adding extra selection weight.
2. Showing them in a dedicated review page.
3. Allowing a user-triggered “review mistakes only” mode in a later iteration.

## 11. Frontend Component Tree

### 11.1 Application Tree

```text
App
├─ AppLayout
│  ├─ AppHeader
│  ├─ AppSidebar or BottomNav
│  └─ RouterView
│     ├─ HomeView
│     │  ├─ DashboardSummary
│     │  ├─ TodayQuizCard
│     │  ├─ ReviewDueCard
│     │  └─ MistakeNotebookSummary
│     ├─ DailyQuizView
│     │  ├─ QuizProgressBar
│     │  ├─ QuizQuestionCard
│     │  │  ├─ WordPrompt
│     │  │  ├─ ChoiceList
│     │  │  └─ ChoiceItem
│     │  ├─ QuizNavigation
│     │  └─ QuizSubmitBar
│     ├─ QuizResultView
│     │  ├─ ScoreSummary
│     │  ├─ IncorrectWordList
│     │  └─ ReviewRecommendationPanel
│     ├─ MistakeNotebookView
│     │  ├─ MistakeFilterBar
│     │  ├─ MistakeWordList
│     │  └─ MistakeWordCard
│     ├─ ReviewQueueView
│     │  ├─ DueTodaySummary
│     │  └─ ReviewWordList
│     └─ SettingsView
│        ├─ StorageManagementPanel
│        └─ QuizPreferenceForm
└─ GlobalToast
```

### 11.2 Component Responsibilities

| Component | Responsibility |
|---|---|
| `AppLayout` | Common shell, navigation, responsive layout |
| `DashboardSummary` | Show counts for due words, mistakes, streaks, and total learned |
| `TodayQuizCard` | Entry point for daily quiz |
| `QuizQuestionCard` | Render one question and answer choices |
| `ChoiceList` | Display multiple-choice options |
| `ScoreSummary` | Final score and correctness ratio |
| `IncorrectWordList` | Show words answered incorrectly with explanations |
| `MistakeWordCard` | Render notebook item with metadata and quick review action |
| `ReviewWordList` | Show words currently due by schedule |
| `StorageManagementPanel` | Export, reset, or clear local progress |

## 12. Routing Design

### 12.1 Routes

| Path | View | Purpose |
|---|---|---|
| `/` | `HomeView` | Dashboard and entry point |
| `/quiz/daily` | `DailyQuizView` | Start or resume daily quiz |
| `/quiz/result` | `QuizResultView` | Show quiz result summary |
| `/mistakes` | `MistakeNotebookView` | Review wrong-answer notebook |
| `/review` | `ReviewQueueView` | Show currently due words |
| `/settings` | `SettingsView` | Local preferences and data operations |

### 12.2 Navigation Rules

1. If a daily quiz already exists for the current date, navigating to `/quiz/daily` should resume it.
2. `/quiz/result` should only be accessible after a completed quiz session.
3. Route guards can prevent invalid direct navigation states.

## 13. State Management Design (Pinia)

### 13.1 Store Overview

| Store | Primary Responsibility |
|---|---|
| `useVocabularyStore` | Load vocabulary and merge with progress metadata |
| `useQuizStore` | Manage active quiz session and answer state |
| `useMistakesStore` | Track mistake notebook records |
| `useReviewStore` | Compute due reviews and update memory scheduling |
| `useSettingsStore` | Persist preferences such as quiz size and reset behavior |

### 13.2 `useVocabularyStore`

#### State

```ts
{
  words: ToeicWord[]
  isLoaded: boolean
  lastLoadedAt: string | null
}
```

#### Actions

- `loadVocabulary()`
- `mergeProgress(progressMap)`
- `getWordById(id)`
- `getWordsByIds(ids)`

#### Getters

- `totalWords`
- `newWords`
- `learnedWords`

### 13.3 `useQuizStore`

#### State

```ts
{
  quizDate: string | null,
  questions: QuizQuestion[],
  currentIndex: number,
  answers: Record<string, string>,
  isSubmitted: boolean,
  score: number
}
```

#### Actions

- `generateDailyQuiz()`
- `resumeDailyQuiz()`
- `answerQuestion(wordId, selectedOption)`
- `goToQuestion(index)`
- `submitQuiz()`
- `resetQuiz()`

#### Getters

- `currentQuestion`
- `answeredCount`
- `progressPercent`
- `incorrectQuestionIds`

### 13.4 `useMistakesStore`

#### State

```ts
{
  notebook: Record<string, MistakeRecord>
}
```

#### Actions

- `loadNotebook()`
- `markMistake(wordId, selectedAnswer)`
- `resolveMistake(wordId)`
- `clearNotebook()`

#### Getters

- `mistakeCount`
- `activeMistakes`
- `sortedMistakes`

### 13.5 `useReviewStore`

#### State

```ts
{
  dueWordIds: string[],
  lastCalculatedAt: string | null
}
```

#### Actions

- `calculateDueWords(words)`
- `updateWordReview(wordId, result)`
- `recalculatePriorityQueue()`

#### Getters

- `dueCount`
- `isWordDue(wordId)`

### 13.6 `useSettingsStore`

#### State

```ts
{
  quizSize: 20,
  resetMemoryOnWrong: true,
  locale: "zh-TW"
}
```

#### Actions

- `loadSettings()`
- `saveSettings()`
- `resetAllProgress()`

## 14. Key Domain Types

```ts
export interface MemoryMetadata {
  memory_level: number
  last_reviewed_date: string | null
  interval_days: number
  next_review_date: string | null
  times_seen: number
  times_correct: number
  times_incorrect: number
  is_in_mistake_notebook: boolean
  last_result: 'correct' | 'incorrect' | null
}

export interface ToeicWord {
  id: string
  word: string
  translation_zh_TW: string
  part_of_speech: string
  example_sentence: string
  difficulty?: 'easy' | 'medium' | 'hard'
  tags?: string[]
  memory: MemoryMetadata
}

export interface QuizQuestion {
  wordId: string
  prompt: string
  correctAnswer: string
  options: string[]
}

export interface MistakeRecord {
  word_id: string
  wrong_count: number
  last_wrong_at: string
  last_selected_answer: string
  resolved: boolean
}
```

## 15. Local Storage Design

### 15.1 Persistence Strategy

Use a thin persistence service that serializes only store slices that must survive refresh.

### 15.2 Recommended Storage API

```ts
storageService.getProgress()
storageService.saveProgress(progress)
storageService.getDailyQuiz()
storageService.saveDailyQuiz(quiz)
storageService.getMistakes()
storageService.saveMistakes(notebook)
storageService.getSettings()
storageService.saveSettings(settings)
```

### 15.3 Versioning

Include an app data version in Local Storage to handle future schema migration.

```json
{
  "version": 1
}
```

## 16. Core Algorithms

### 16.1 Quiz Candidate Selection

1. Load all vocabulary items.
2. Merge learner progress metadata.
3. Partition into:
   - due review words
   - mistake notebook words
   - unseen or low-frequency words
4. Apply weighted random selection.
5. Ensure uniqueness of question words.
6. Build distractors from other vocabulary entries.

### 16.2 Distractor Selection Rules

1. Exclude the correct answer.
2. Prefer words with the same part of speech.
3. Prefer translations with similar semantic category or length.
4. Shuffle options after generation.

### 16.3 Post-Quiz Update Logic

For each answered word:

1. Check whether the answer is correct.
2. Update spaced repetition metadata.
3. Update mistake notebook if wrong.
4. Persist the new progress snapshot.

## 17. Error Handling and Edge Cases

### 17.1 Empty Dataset

- Show an empty state if the JSON vocabulary file cannot be loaded.
- Prevent quiz generation when fewer than 4 words are available.

### 17.2 Small Dataset

- If total vocabulary count is below 20, generate a quiz with the maximum available count and show a notice.

### 17.3 Corrupted Local Storage

- Wrap JSON parsing in `try/catch`.
- Fallback to defaults.
- Provide a reset option in Settings.

### 17.4 Duplicate Daily Quiz Generation

- Store quiz date and selected IDs.
- Reuse the same quiz until the day changes.

## 18. Performance Considerations

1. Vocabulary datasets in this scope are small enough for in-memory processing.
2. Use computed getters in Pinia for filtered views.
3. Persist after major events, not on every keystroke.
4. Keep Local Storage payloads compact by storing progress separately from master vocabulary.

## 19. Security and Privacy Considerations

1. All data remains in the browser.
2. Local Storage is not secure for sensitive information, but it is acceptable for anonymous vocabulary progress.
3. The app should avoid storing unnecessary personal data.

## 20. Testing Strategy

### 20.1 Unit Tests

- spaced repetition interval calculation
- quiz candidate selection
- distractor generation
- mistake notebook updates
- Local Storage serialization and deserialization

### 20.2 Component Tests

- quiz question rendering
- answer selection behavior
- result summary rendering
- mistake notebook filtering

### 20.3 End-to-End Tests

- load app and start daily quiz
- submit answers and verify score
- wrong answers appear in notebook
- due reviews reappear on future sessions

## 21. Future Evolution

1. Add backend synchronization for cross-device progress.
2. Add login and user profiles.
3. Add pronunciation audio and sentence audio.
4. Add review-only modes, such as “mistakes only” and “due today only”.
5. Replace Local Storage with IndexedDB if dataset size grows.

## 22. Recommended MVP Delivery Order

1. Load static vocabulary JSON.
2. Build Pinia stores and Local Storage service.
3. Implement daily quiz generation.
4. Implement result processing and score view.
5. Implement mistake notebook.
6. Implement spaced repetition scheduling.
7. Add settings and reset/export tools.

## 23. Summary

This design uses a clean frontend-only architecture that is appropriate for an MVP TOEIC learning application. The key architectural decision is to separate immutable vocabulary content from learner progress metadata. That makes the system simple, maintainable, and easy to evolve later.

The most important product behaviors are:

1. Generate one daily 20-question quiz.
2. Save wrong answers into a mistake notebook.
3. Increase repetition frequency for forgotten words using timestamp-based review intervals.
4. Persist all learner state in Local Storage without requiring a backend.

This provides a practical foundation for a later migration to cloud persistence while keeping the first release lightweight and fast.