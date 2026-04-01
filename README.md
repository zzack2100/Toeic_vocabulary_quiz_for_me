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

### Mock LLM design

The current implementation is a mock service that ranks a curated TOEIC-style vocabulary bank by topic relevance and returns 10 results.

The LLM system prompt that would be sent to a provider such as OpenAI is stored in:

- `server/services/vocabularyExpansionService.js`

The same file also exposes a `buildLlmRequest(topic)` helper showing the message structure a future real LLM integration can reuse.
