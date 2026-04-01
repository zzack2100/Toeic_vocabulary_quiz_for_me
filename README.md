# TOEIC Vocabulary Quiz and API

This workspace now contains:

- A Vue 3 + Vite frontend for the TOEIC quiz workflow
- A small Express backend for topic-based vocabulary expansion

## Backend API

### Start the API

```bash
npm run dev:api
```

The server listens on `http://localhost:3001` by default. Override with `API_PORT` if needed.

### OpenAI setup

To enable real LLM-backed vocabulary generation, set `OPENAI_API_KEY` before starting the API.

PowerShell example:

```powershell
$env:OPENAI_API_KEY = "your-api-key"
npm run dev:api
```

Behavior:

- If `OPENAI_API_KEY` exists, the backend calls OpenAI with `gpt-4o-mini`
- If the key is missing, the backend falls back to the built-in ranked mock vocabulary generator
- If the OpenAI call fails or returns invalid JSON, the backend also falls back to the same mock generator

### Endpoint

`POST /api/vocabulary/expand`

Request body:

```json
{
	"topic": "Business Negotiations"
}
```

Response body:

```json
[
	{
		"id": "0c8f7f8d-1234-5678-90ab-example",
		"word": "proposal",
		"translation_zh_TW": "提案",
		"part_of_speech": "noun",
		"example_sentence": "Our team submitted a pricing proposal to the overseas client yesterday.",
		"difficulty": "medium",
		"tags": ["Business Negotiations", "business", "sales", "negotiation", "contracts"]
	}
]
```

### LLM design

The backend supports two execution paths:

- Preferred path: real OpenAI generation through the official `openai` package
- Fallback path: a ranked curated TOEIC-style vocabulary bank that still returns 10 valid results without external dependencies

The LLM system prompt that would be sent to a provider such as OpenAI is stored in:

- `server/services/vocabularyExpansionService.js`

The same file also exposes a `buildLlmRequest(topic)` helper showing the exact message structure used for the OpenAI request.

Current OpenAI model:

- `gpt-4o-mini`
