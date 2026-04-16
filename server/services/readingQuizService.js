import OpenAI from 'openai'

const READING_QUIZ_SYSTEM_PROMPT = `You are a TOEIC reading-comprehension quiz generator for adult ESL learners.

The user will provide exactly 5 English vocabulary words. You must:

1. Write a realistic TOEIC-style business email (120–180 words) that naturally incorporates ALL 5 words. The email should feel like a real workplace correspondence (e.g., project update, meeting request, complaint, announcement, logistics coordination).

2. Create exactly 3 multiple-choice reading-comprehension questions about the email. Each question must have exactly 4 answer choices labeled A, B, C, D, and exactly one correct answer.

Return ONLY a JSON object with this exact schema — no markdown, no commentary:

{
  "article": "string — the full business email text",
  "questions": [
    {
      "id": 1,
      "question": "string",
      "choices": {
        "A": "string",
        "B": "string",
        "C": "string",
        "D": "string"
      },
      "answer": "A|B|C|D",
      "explanation": "string — brief explanation of why the answer is correct"
    }
  ]
}

Rules:
- The email MUST use all 5 provided words naturally.
- Questions should test comprehension (main idea, detail, inference, vocabulary-in-context) — not grammar.
- Difficulty should match TOEIC Part 7 (reading comprehension).
- Use formal business English tone.
- Do NOT include any text outside the JSON object.`

export async function generateReadingQuiz(words) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured.')
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const userPrompt = `Generate a TOEIC-style business email and 3 reading comprehension questions using these 5 vocabulary words: ${words.join(', ')}.`

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: READING_QUIZ_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1200,
  })

  const content = completion.choices[0]?.message?.content

  if (!content) {
    throw new Error('OpenAI response did not include message content.')
  }

  const parsed = JSON.parse(content)

  if (!parsed.article || !Array.isArray(parsed.questions) || parsed.questions.length !== 3) {
    throw new Error('OpenAI returned an unexpected JSON structure.')
  }

  return parsed
}
