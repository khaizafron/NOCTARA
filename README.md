<p align="center">
  <img src="./public/main-logo.png" alt="NOCTARA Core Intelligence Logo" width="320" />
</p>

<h1 align="center">NOCTARA</h1>
<p align="center"><strong>Autonomous Dual-Agent Living Intelligence Chamber</strong></p>
<p align="center">
  <em>A private, single-owner AI living environment engineered for Khai (ROOT).</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Authority-ROOT__KHAI-00e5ff?style=for-the-badge" alt="Authority" />
  <img src="https://img.shields.io/badge/Core%20Entities-NOX%20%7C%20ARIA-a855f7?style=for-the-badge" alt="Entities" />
  <img src="https://img.shields.io/badge/Engine-WebGPU%20Procedural-38bdf8?style=for-the-badge" alt="Engine" />
  <img src="https://img.shields.io/badge/Status-Online%20%26%20Active-10b981?style=for-the-badge" alt="Status" />
</p>

```
       _  _  ____   ___ _____ _   ____     _   
      | \| |/ __ \ / __|_   _/_\ |  _ \   /_\  
      | .` | |__| | (__  | |/ _ \| |_) | / _ \ 
      |_|\_|\____/ \___| |_/_/ \_\_.__/ /_/ \_\
```

> **A private, single-owner AI living environment engineered for Khai (ROOT).**  
> Powered by two distinct autonomous entities — **NOX** (Tactical Execution) and **ARIA** (Strategic Intuition) — with persistent memory, real-time voice synthesis, multimodal telemetry, and policy-governed self-improvement.

---

## 🏛 Documentation Map

All in-depth architectural and design specifications reside in [`noctara_docs/`](./noctara_docs):

| Document | Focus |
| :--- | :--- |
| [**README**](./noctara_docs/README.md) | Architectural index and core vision |
| [**PRD**](./noctara_docs/PRD.md) | Product requirements, user experience, and invariants |
| [**ARCHITECTURE**](./noctara_docs/ARCHITECTURE.md) | Technical architecture, runtime design, and data flows |
| [**AGENTS**](./noctara_docs/AGENTS.md) | NOX and ARIA identities, behavioral boundaries, and tone |
| [**MEMORY**](./noctara_docs/MEMORY.md) | Persistent memory schema, consolidation, retrieval, and correction |
| [**AUTONOMY**](./noctara_docs/AUTONOMY.md) | Planning & execution loop, permissions, and self-improvement |
| [**TOOLS**](./noctara_docs/TOOLS.md) | Tool registry, provider abstraction, API integrations, and sandboxing |
| [**SECURITY**](./noctara_docs/SECURITY.md) | Threat model, trust boundaries, policy engine, and kill-switch |
| [**UI_UX**](./noctara_docs/UI_UX.md) | Volumetric spatial interface, particle physics, and audio reactions |
| [**ROADMAP**](./noctara_docs/ROADMAP.md) | Implementation milestones and verification gates |

---

## 🏗 Repository Structure (Monorepo)

```text
NOCTARA/
├── apps/
│   └── web/                     # Next.js 15 Web Application (Noctara Room UI, WebGL Canvas, Voice API)
├── packages/
│   ├── agent-core/              # NOX & ARIA runtime, dialogue orchestration, deduplication
│   ├── autonomy/                # Plan generation, step execution, verification loops
│   ├── github/                  # GitHub App integration, secure webhook handler, HMAC validation
│   ├── memory/                  # Long-term memory store, Supabase vector integration, audit log
│   ├── model-router/            # Multi-provider fallback (Gemini Pro -> TokenRouter -> OpenRouter)
│   ├── policy/                  # Security policy engine, permission gates, kill-switch invariants
│   ├── realtime/                # Realtime event bus and telemetry distribution
│   ├── shared/                  # Shared TypeScript types, schemas, and utility contracts
│   ├── tools/                   # Tool registry, filesystem tools, bash execution, web fetch
│   └── voice/                   # Voice response formatting, markdown sanitizer, synthesis helpers
├── worker/
│   └── autonomous-worker/       # Background autonomy engine, self-improvement worker
├── noctara_docs/                # Project documentation suite
├── .env.example                 # Environment variable template
└── .gitignore                   # Comprehensive ignore rules
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: >= 20.0.0
- **Package Manager**: `pnpm` (recommended) or `npm`

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the repository root and populate your credentials:

```bash
cp .env.example .env
```

Required keys include:
- `GEMINI_API_KEY` — Primary reasoning engine (`gemini-2.5-pro`)
- `ELEVENLABS_API_KEY` — Real-time high-fidelity voice stream
- `ELEVENLABS_NOX_VOICE_ID` / `ELEVENLABS_ARIA_VOICE_ID` — Entity voices
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — Memory and state persistence
- `GITHUB_WEBHOOK_SECRET` — GitHub App secure event handling

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Verification Suite
```bash
pnpm test
```
Runs the full Vitest suite covering agent orchestration, webhooks, policy invariants, and memory retrieval.

### 6. Production Build
```bash
pnpm build
```

---

## 🛡 Security & Invariants

- **Root Authority**: Only Khai (ROOT) possesses authorization to approve write actions, commits, or deployments.
- **Emergency Kill-Switch**: Accessible via UI button, ESC key, or `POST /api/emergency-stop`. Instantly halts all autonomous execution and speech synthesis.
- **Dual-Stream Voice**: Conversational answers are rendered in full in the transcript, while spoken voice outputs concise 1–2 sentence summaries to conserve API bandwidth.

