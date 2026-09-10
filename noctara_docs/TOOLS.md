# NOCTARA — Tools & Provider Registry

## 1. Tool philosophy

A tool is an explicit capability, not an implicit power of the model.

Every tool is:

- discoverable
- schema-defined
- permissioned
- auditable
- time-bounded
- rate-limited where necessary

## 2. Suggested initial tools

### Core

- web search
- web fetch
- browser automation
- file read/write
- code execution
- calculator
- time/date

### Knowledge

- PDF parsing
- image analysis
- embeddings
- semantic retrieval

### External systems

- GitHub
- Google services
- maps
- weather
- email
- calendar

### Creative

- image generation
- audio/TTS
- transcription
- video generation where available

## 3. Provider abstraction

All external model providers should implement an internal adapter.

```ts
interface ProviderAdapter {
  id: string;
  capabilities: string[];
  healthCheck(): Promise<boolean>;
}
```

## 4. Model router policy

The router should prefer:

1. capability fit
2. reliability
3. latency
4. cost

Free-tier providers can be used where practical, but the architecture must assume that free limits, availability, and quotas can change.

## 5. Tool permissions

Example permission levels:

- `read`
- `search`
- `draft`
- `write`
- `execute`
- `publish`
- `admin`

Tools should declare the minimum required permission.

## 6. Secret handling

The LLM should never receive raw API keys as ordinary prompt text.

Use a server-side secret manager or encrypted environment configuration. The tool gateway injects credentials only when executing the approved adapter.

## 7. Tool failure handling

A failed tool call should return structured error information:

```ts
interface ToolError {
  code: string;
  message: string;
  retryable: boolean;
  provider?: string;
  details?: unknown;
}
```

The agent can retry only within job budget.
