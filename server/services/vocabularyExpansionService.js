import { randomUUID } from 'node:crypto'
import OpenAI from 'openai'

export const TOEIC_VOCABULARY_EXPANSION_SYSTEM_PROMPT = `You are a TOEIC curriculum assistant generating business-English vocabulary for adult learners.
Return exactly 10 items as a JSON array.
Every item must strictly follow this schema:
{
  "id": "unique string",
  "word": "string",
  "translation_zh_TW": "string",
  "part_of_speech": "string",
  "example_sentence": "string",
  "difficulty": "medium",
  "tags": ["topic", "other relevant tags"]
}
Rules:
- Vocabulary must be practical TOEIC-level English, not obscure, literary, or academic jargon.
- Example sentences must be natural workplace or travel contexts.
- translation_zh_TW must use Traditional Chinese.
- difficulty must always be exactly "medium".
- tags must include the requested topic string exactly as provided by the user.
- Do not include markdown, commentary, numbering, or extra keys.
- Avoid duplicate words or near-synonym duplicates in the same batch.`

const VOCABULARY_BANK = [
  {
    word: 'agenda',
    translation_zh_TW: '議程',
    part_of_speech: 'noun',
    example_sentence: 'The manager shared the meeting agenda before the negotiation started.',
    tags: ['business', 'meeting', 'planning', 'negotiation'],
  },
  {
    word: 'proposal',
    translation_zh_TW: '提案',
    part_of_speech: 'noun',
    example_sentence: 'Our team submitted a pricing proposal to the overseas client yesterday.',
    tags: ['business', 'sales', 'negotiation', 'contracts'],
  },
  {
    word: 'counteroffer',
    translation_zh_TW: '還價；反提議',
    part_of_speech: 'noun',
    example_sentence: 'The supplier made a counteroffer after reviewing our target budget.',
    tags: ['business', 'negotiation', 'contracts', 'procurement'],
  },
  {
    word: 'compromise',
    translation_zh_TW: '妥協；折衷方案',
    part_of_speech: 'noun',
    example_sentence: 'Both sides reached a compromise on the delivery deadline.',
    tags: ['business', 'negotiation', 'management'],
  },
  {
    word: 'term',
    translation_zh_TW: '條款',
    part_of_speech: 'noun',
    example_sentence: 'Please review each payment term before signing the contract.',
    tags: ['business', 'contracts', 'legal', 'negotiation'],
  },
  {
    word: 'concession',
    translation_zh_TW: '讓步',
    part_of_speech: 'noun',
    example_sentence: 'The buyer requested an additional concession on shipping costs.',
    tags: ['business', 'negotiation', 'sales'],
  },
  {
    word: 'itinerary',
    translation_zh_TW: '旅行行程表',
    part_of_speech: 'noun',
    example_sentence: 'Please send your travel itinerary to the coordinator before departure.',
    tags: ['travel', 'transport', 'business travel'],
  },
  {
    word: 'boarding pass',
    translation_zh_TW: '登機證',
    part_of_speech: 'noun',
    example_sentence: 'Passengers must show their boarding pass at the gate.',
    tags: ['travel', 'transport', 'airport'],
  },
  {
    word: 'reservation',
    translation_zh_TW: '預約；訂位',
    part_of_speech: 'noun',
    example_sentence: 'I confirmed the hotel reservation for the sales conference.',
    tags: ['travel', 'hospitality', 'business travel'],
  },
  {
    word: 'shuttle',
    translation_zh_TW: '接駁車',
    part_of_speech: 'noun',
    example_sentence: 'A free shuttle runs between the airport and the exhibition center.',
    tags: ['travel', 'transport', 'logistics'],
  },
  {
    word: 'departure',
    translation_zh_TW: '出發；離境',
    part_of_speech: 'noun',
    example_sentence: 'The departure time was delayed because of heavy rain.',
    tags: ['travel', 'transport', 'airport'],
  },
  {
    word: 'commute',
    translation_zh_TW: '通勤',
    part_of_speech: 'verb',
    example_sentence: 'Many employees commute by train during the week.',
    tags: ['travel', 'transport', 'workplace'],
  },
  {
    word: 'revenue',
    translation_zh_TW: '營收',
    part_of_speech: 'noun',
    example_sentence: 'The quarterly report showed higher revenue than expected.',
    tags: ['finance', 'reports', 'accounting'],
  },
  {
    word: 'expense',
    translation_zh_TW: '支出；費用',
    part_of_speech: 'noun',
    example_sentence: 'Travel expenses should be submitted within five business days.',
    tags: ['finance', 'reports', 'accounting'],
  },
  {
    word: 'forecast',
    translation_zh_TW: '預測',
    part_of_speech: 'noun',
    example_sentence: 'The sales forecast was revised after the market survey.',
    tags: ['finance', 'reports', 'planning'],
  },
  {
    word: 'budget',
    translation_zh_TW: '預算',
    part_of_speech: 'noun',
    example_sentence: 'The department stayed within budget this quarter.',
    tags: ['finance', 'reports', 'planning'],
  },
  {
    word: 'audit',
    translation_zh_TW: '審計；查帳',
    part_of_speech: 'noun',
    example_sentence: 'The external audit will begin at the end of the month.',
    tags: ['finance', 'reports', 'compliance'],
  },
  {
    word: 'margin',
    translation_zh_TW: '利潤率；差額',
    part_of_speech: 'noun',
    example_sentence: 'We need to improve our profit margin before the next review.',
    tags: ['finance', 'reports', 'sales'],
  },
  {
    word: 'invoice',
    translation_zh_TW: '發票',
    part_of_speech: 'noun',
    example_sentence: 'Please attach the invoice to your reimbursement request.',
    tags: ['finance', 'accounting', 'procurement'],
  },
  {
    word: 'shipment',
    translation_zh_TW: '貨運；出貨',
    part_of_speech: 'noun',
    example_sentence: 'The shipment arrived at the warehouse ahead of schedule.',
    tags: ['transport', 'logistics', 'procurement'],
  },
  {
    word: 'warehouse',
    translation_zh_TW: '倉庫',
    part_of_speech: 'noun',
    example_sentence: 'All returned products are inspected at the central warehouse.',
    tags: ['transport', 'logistics', 'operations'],
  },
  {
    word: 'dispatch',
    translation_zh_TW: '發送；派遣',
    part_of_speech: 'verb',
    example_sentence: 'The orders will be dispatched this afternoon.',
    tags: ['transport', 'logistics', 'operations'],
  },
  {
    word: 'inventory',
    translation_zh_TW: '庫存',
    part_of_speech: 'noun',
    example_sentence: 'The inventory report showed a shortage of printer supplies.',
    tags: ['logistics', 'operations', 'reports'],
  },
  {
    word: 'supplier',
    translation_zh_TW: '供應商',
    part_of_speech: 'noun',
    example_sentence: 'We selected a new supplier for office equipment.',
    tags: ['procurement', 'business', 'negotiation'],
  },
  {
    word: 'deadline',
    translation_zh_TW: '截止期限',
    part_of_speech: 'noun',
    example_sentence: 'Please send the revised draft before the deadline.',
    tags: ['planning', 'workplace', 'reports'],
  },
  {
    word: 'contract',
    translation_zh_TW: '合約',
    part_of_speech: 'noun',
    example_sentence: 'The legal team approved the final contract yesterday.',
    tags: ['contracts', 'business', 'negotiation'],
  },
  {
    word: 'presentation',
    translation_zh_TW: '簡報',
    part_of_speech: 'noun',
    example_sentence: 'She gave a presentation on regional sales performance.',
    tags: ['business', 'reports', 'meeting'],
  },
  {
    word: 'briefing',
    translation_zh_TW: '簡報會；情況說明',
    part_of_speech: 'noun',
    example_sentence: 'All staff attended the safety briefing before the event.',
    tags: ['business', 'meeting', 'operations'],
  },
  {
    word: 'client',
    translation_zh_TW: '客戶',
    part_of_speech: 'noun',
    example_sentence: 'The client requested a follow-up call next week.',
    tags: ['business', 'sales', 'negotiation'],
  },
  {
    word: 'refund',
    translation_zh_TW: '退款',
    part_of_speech: 'noun',
    example_sentence: 'The customer received a full refund for the damaged item.',
    tags: ['finance', 'service', 'retail'],
  },
  {
    word: 'statement',
    translation_zh_TW: '報表；對帳單',
    part_of_speech: 'noun',
    example_sentence: 'Please compare the bank statement with the internal records.',
    tags: ['finance', 'reports', 'accounting'],
  },
]

function normalizeTopic(topic) {
  return topic.trim().toLowerCase()
}

function scoreEntryForTopic(entry, normalizedTopic) {
  const words = normalizedTopic.split(/[^a-z0-9]+/).filter(Boolean)
  const tagMatches = entry.tags.reduce((score, tag) => {
    const normalizedTag = tag.toLowerCase()

    if (normalizedTopic.includes(normalizedTag) || normalizedTag.includes(normalizedTopic)) {
      return score + 5
    }

    return score + words.filter((word) => normalizedTag.includes(word)).length * 2
  }, 0)

  const text = `${entry.word} ${entry.example_sentence}`.toLowerCase()
  const textMatches = words.filter((word) => text.includes(word)).length

  return tagMatches + textMatches
}

function buildVocabularyItem(entry, topic) {
  return {
    id: randomUUID(),
    word: entry.word,
    translation_zh_TW: entry.translation_zh_TW,
    part_of_speech: entry.part_of_speech,
    example_sentence: entry.example_sentence,
    difficulty: 'medium',
    tags: Array.from(new Set([topic, ...entry.tags])),
  }
}

function buildMockVocabulary(topic) {
  const normalizedTopic = normalizeTopic(topic)
  const rankedEntries = [...VOCABULARY_BANK]
    .map((entry) => ({ entry, score: scoreEntryForTopic(entry, normalizedTopic) }))
    .sort((left, right) => right.score - left.score || left.entry.word.localeCompare(right.entry.word))

  const selectedEntries = rankedEntries
    .filter((item) => item.score > 0)
    .slice(0, 10)
    .map((item) => item.entry)

  const fallbackEntries = rankedEntries
    .filter((item) => !selectedEntries.includes(item.entry))
    .map((item) => item.entry)

  while (selectedEntries.length < 10 && fallbackEntries.length > 0) {
    const nextEntry = fallbackEntries.shift()

    if (!nextEntry) {
      break
    }

    selectedEntries.push(nextEntry)
  }

  return selectedEntries.map((entry) => buildVocabularyItem(entry, topic))
}

function stripCodeFences(value) {
  return value.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
}

function normalizeGeneratedItem(item, topic) {
  if (!item || typeof item !== 'object') {
    throw new Error('Generated item is not an object.')
  }

  const word = typeof item.word === 'string' ? item.word.trim() : ''
  const translation = typeof item.translation_zh_TW === 'string' ? item.translation_zh_TW.trim() : ''
  const partOfSpeech = typeof item.part_of_speech === 'string' ? item.part_of_speech.trim() : ''
  const exampleSentence = typeof item.example_sentence === 'string' ? item.example_sentence.trim() : ''
  const rawTags = Array.isArray(item.tags) ? item.tags.filter((tag) => typeof tag === 'string' && tag.trim()) : []

  if (!word || !translation || !partOfSpeech || !exampleSentence) {
    throw new Error('Generated item is missing required string fields.')
  }

  return {
    id: randomUUID(),
    word,
    translation_zh_TW: translation,
    part_of_speech: partOfSpeech,
    example_sentence: exampleSentence,
    difficulty: 'medium',
    tags: Array.from(new Set([topic, ...rawTags.map((tag) => tag.trim())])),
  }
}

function parseGeneratedVocabulary(content, topic) {
  const parsed = JSON.parse(stripCodeFences(content))

  if (!Array.isArray(parsed)) {
    throw new Error('OpenAI response is not a JSON array.')
  }

  if (parsed.length !== 10) {
    throw new Error('OpenAI response did not return exactly 10 vocabulary items.')
  }

  return parsed.map((item) => normalizeGeneratedItem(item, topic))
}

async function expandVocabularyWithOpenAi(topic) {
  if (!process.env.OPENAI_API_KEY) {
    return null
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const llmRequest = buildLlmRequest(topic)
  const completion = await client.chat.completions.create({
    model: llmRequest.model,
    messages: llmRequest.messages,
  })
  const content = completion.choices[0]?.message?.content

  if (!content) {
    throw new Error('OpenAI response did not include message content.')
  }

  return parseGeneratedVocabulary(content, topic)
}

export function buildLlmRequest(topic) {
  return {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: TOEIC_VOCABULARY_EXPANSION_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Generate 10 TOEIC-level vocabulary words for the topic "${topic}". Return JSON only.`,
      },
    ],
  }
}

export async function expandVocabularyByTopic(topic) {
  try {
    const words = await expandVocabularyWithOpenAi(topic)

    if (words) {
      return {
        words,
        llmRequest: buildLlmRequest(topic),
      }
    }
  } catch (error) {
    console.warn('Falling back to mock TOEIC vocabulary expansion.', error)
  }

  return {
    words: buildMockVocabulary(topic),
    llmRequest: buildLlmRequest(topic),
  }
}