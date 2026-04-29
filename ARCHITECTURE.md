# Cockroach — Architecture & Internals

Complete reference for how the platform is built and why. Read alongside
`README.md` (setup), `documentation.md` (product narrative),
`SECURITY.md` (trust model), and `claude.md` (live build context).

Last updated: 2026-06-29.

---

## 1 · What Cockroach is

An AI-powered entrepreneurial-intelligence web app — **a product of
[Layaa AI](https://www.layaa.ai)**, modeled on the OpenAI → ChatGPT
relationship. Users chat with the Cockroach agent in one of nine
(soon sixteen) working modes and export polished artifacts (reports,
decks, spreadsheets).

**Stage:** Currently a closed-internal build (no auth, ≤5 trusted
profiles) being prepared for **public SaaS launch** in ~30 days from
2026-06-29. See `claude.md` for the live launch plan.

Tagline: *"Not a unicorn. Better."*

---

## 2 · Stack at a glance

| Layer | Technology | Why |
|---|---|---|
| UI | React 19 + Vite 6 + TypeScript 5.8 strict | Modern, fast dev loop, sharp types |
| Styling | Tailwind CSS 4 + `clsx` / `tailwind-merge` | Utility-first; dark theme |
| State | Zustand 5 with scoped `persist` | Simpler than Redux; DB is source of truth |
| Chat UI | `react-markdown` + `remark-gfm` + `shiki` | Rich markdown rendering with code highlighting |
| Diagrams | Mermaid 11 (via `MermaidDiagram` component) | Sanitized with DOMPurify |
| Motion | `motion` (formerly Framer Motion) | Entry animations, share banner transitions |
| Toasts | `sonner` | Consistent user feedback |
| Icons | `lucide-react` | Tree-shakable icon set |
| Charts | Recharts 3 | Used inline for lightweight charts |
| Exports | `jspdf`, `docx`, `@e965/xlsx`, `pptxgenjs` | Multi-format artifact generation |
| Dev server | Express 4 + Vite middleware (`tsx server.ts`) | Mirrors Vercel routing in local dev |
| API runtime | Vercel Node.js serverless functions | `api/*.js` auto-deployed |
| DB | Supabase Postgres | Direct-from-browser access (anon key) |
| LLM | Azure OpenAI (GPT-5.3 chat deployment) | Only provider; proxied server-side |
| Host | Vercel (`cock-roach.vercel.app`) | Auto-deploys on push to `main` |

---

## 3 · Directory layout

```
CockRoach/
├── api/                    # Vercel serverless functions
│   ├── chat.js            # Azure OpenAI streaming proxy
│   └── scrape.js          # SSRF-safe URL content extractor
├── kb/                     # Agent knowledge documents (Markdown)
│   ├── base-prompt.md     # Top-level system prompt
│   ├── SKILLS.md          # Always-on: deliverable craft
│   ├── foundation/        # Always-on (toggleable): identity + frameworks
│   │   ├── KB_01_IDENTITY_AND_PERSONALITY.md
│   │   ├── KB_02_IDEA_ANALYSIS_FRAMEWORK.md
│   │   ├── KB_03_USA_FUNDING_AND_GRANTS.md
│   │   └── KB_04_OUTPUT_FORMATS_AND_STRUCTURE.md
│   └── modes/             # Mode-specific behavior guides (one per mode)
│       ├── BUSINESS_MODEL.md
│       ├── DEEP_RESEARCH.md
│       ├── EXECUTION.md
│       ├── GENERAL.md
│       ├── IDEA_GENERATION.md
│       ├── IDEA_VALIDATION.md
│       ├── IMAGE_PROMPTING.md
│       ├── POSITIONING.md
│       └── THINKING.md
├── public/
│   └── profiles/          # Default profile avatars (referenced by users.avatar)
├── src/
│   ├── App.tsx            # Top-level composition; routing; shared state
│   ├── main.tsx           # React root; ErrorBoundary wrap
│   ├── index.css          # Tailwind + custom CSS vars
│   ├── vite-env.d.ts      # Ambient types for *.md?raw imports
│   ├── store.ts           # Zustand store + persist config + migrations
│   ├── components/
│   │   ├── DocumentViewer.tsx    # Side-panel preview of generated docs
│   │   ├── ErrorBoundary.tsx     # React error boundary
│   │   ├── MermaidDiagram.tsx    # Sanitized Mermaid renderer
│   │   ├── ProfileSelector.tsx   # Profile pick / create screen
│   │   ├── SettingsAgentBrain.tsx # System prompt + KB toggles + memory editor
│   │   └── SettingsLLM.tsx        # Azure config display + usage + pricing
│   ├── hooks/
│   │   ├── useAzureChat.ts       # Stream + cancel + token tracking
│   │   └── useShareLink.ts       # Create / revoke / resolve share tokens
│   └── lib/
│       ├── file-export.ts        # PDF / DOCX / XLSX / PPTX / CSV / MD / TXT
│       ├── kb-constants.ts       # Foundation KBs loaded via ?raw
│       ├── kb-mode-loader.ts     # Mode KBs + Skills KB loaded via ?raw
│       ├── logger.ts             # Centralized logger (level + context)
│       ├── supabase.ts           # Supabase client singleton
│       ├── system-prompt-builder.ts # Assembles full prompt per turn
│       ├── url-scraper.ts        # Client wrapper for /api/scrape
│       └── utils.ts              # cn() + provider detection helpers
├── supabase/
│   ├── schema.sql         # Tables, FKs, indexes — idempotent, no DROP
│   ├── policies.sql       # RLS state + grants (RLS intentionally off)
│   └── seed.sql           # 4 default profiles
├── .github/workflows/ci.yml  # Typecheck + Lint + Audit on every PR
├── server.ts              # Dev server (Express + Vite middleware)
├── vite.config.ts         # Vite + Tailwind + React plugin
├── tsconfig.json          # strict + noUnusedLocals + ...
├── eslint.config.mjs      # typescript-eslint flat + react-hooks
├── package.json
├── index.html             # Entry HTML (Vite template)
├── README.md              # Setup + stack summary
├── SECURITY.md            # Trust model + key rotation playbook
└── ARCHITECTURE.md        # This file
```

---

## 4 · Request lifecycle (happy path)

### Cold load
```
Browser → cock-roach.vercel.app
       → Vercel serves dist/index.html + dist/assets/*.js
       → React mounts <ErrorBoundary><App/></ErrorBoundary>
       → Zustand hydrates from localStorage (only session/UI fields)
       → No user yet → ProfileSelector renders
```

### User picks a profile
```
Click → setCurrentUser(profile)
     → App's useEffect fires syncLocalUserWithDatabase(profile)
     → Supabase upsert users/azure_configs/system_prompts/memory_items
     → store populated (azureConfig, kbToggles, memoryItems, systemPrompt)
     → Chat view renders
```

### User sends a message
```
Enter ↵ → handleSendMessage()
       → Save user message to messages table
       → Build messages payload: [system, ...history, user]
       → system = buildSystemPrompt({ systemPromptBase, kbToggles,
          memoryItems, activeMode, userName, isBrutalHonesty })
       → streamResponse({ messages, temperature, onChunk })
       → POST /api/chat with { messages, temperature }
       → Vercel function reads AZURE_OPENAI_* env
       → Fetches Azure Chat Completions (stream: true)
       → Pipes SSE stream back to browser
       → Client parses each `data: {...}` line, accumulates delta
       → setStreamingContent(partial) → UI re-renders
       → On [DONE]: save assistant message to DB; reset streaming state
```

### User clicks Stop mid-stream
```
cancelStream() → abortController.abort()
              → fetch is aborted
              → /api/chat fetch to Azure is GC'd (no more billing)
              → setIsStreaming(false)
```

### User shares a chat
```
Share button → useShareLink.createOrGetLink()
            → Look up existing share_token on chats
            → If active (not expired, not revoked) → reuse
            → Else → generate crypto.randomUUID(), set expires_at +30d,
              clear revoked_at
            → Set shareLink state → banner renders, URL in clipboard
```

### Someone opens ?shared=<token>
```
Mount → useShareLink useEffect sees the param
     → Supabase query: chats where share_token=X and not revoked
       and (expires_at is null or > now())
     → If found → setActiveChatId, setCurrentPage('chat'),
       setSharedChatBanner (with owner name)
     → If not → toast "expired/revoked/invalid"
```

---

## 5 · The system prompt: how it's assembled

Every call to `/api/chat` sends a fresh system message built by
`src/lib/system-prompt-builder.ts`:

```ts
buildSystemPrompt({
  systemPromptBase,  // user's editable prompt OR
                     // COCKROACH_DEFAULT_SYSTEM_PROMPT (from kb/base-prompt.md)
  kbToggles,         // { kb01, kb02, kb03, kb04 } — user-controlled
  memoryItems,       // DB-backed list for the user
  activeMode,        // GENERAL | IDEA_GENERATION | ...
  userName,          // profile name
  isBrutalHonesty,   // boolean toggle
});
```

Output shape (sections joined by `\n\n---\n\n`):

```
[COCKROACH AGENT SYSTEM PROMPT]
{systemPromptBase}

[KB-01: IDENTITY & PERSONALITY]          # if toggle on
{contents of kb/foundation/KB_01...}

[KB-02: IDEA ANALYSIS FRAMEWORK]         # if toggle on
{contents of kb/foundation/KB_02...}

[KB-03: USA FUNDING & GRANTS]            # if toggle on
...

[KB-04: OUTPUT FORMATS & STRUCTURE]      # if toggle on
...

[SKILLS KB — Reports, Decks, Models, Charts]    # ALWAYS
{contents of kb/SKILLS.md}

[MODE KB — {activeMode}]                 # based on activeMode
{contents of kb/modes/{activeMode}.md}

[COCKROACH MEMORY CONTEXT]               # if memoryItems.length > 0
Last updated: {iso}

- [category]: content
...
[/COCKROACH MEMORY CONTEXT]

CURRENT OPERATING MODE: {activeMode}

The user is {userName}.

CRITICAL: BRUTAL HONESTY MODE IS ON. ...  # if toggle on
```

Two loader files keep authoring simple:

- `kb-constants.ts` — imports the base prompt + KB_01…04 via `?raw`
- `kb-mode-loader.ts` — imports `SKILLS.md` + all nine mode KBs via `?raw`

Edit the `.md` files directly. Vite picks up the change on next build.
No duplicated TypeScript string constants to sync.

---

## 6 · Working modes (detail)

Modes are **user-selected** from the chat UI (the `activeMode` state). They
are not auto-detected from message content. The current mode label is
appended to the system prompt; the matching `kb/modes/{MODE}.md` is loaded
automatically.

| Mode | Purpose | KB |
|---|---|---|
| `GENERAL` | Default chat; answer what was asked, don't auto-run workflows | `kb/modes/GENERAL.md` |
| `IDEA_GENERATION` | Stream 8–12 ideas with tags + first-mile tests | `kb/modes/IDEA_GENERATION.md` |
| `IDEA_VALIDATION` | Full KB-02 Idea Intelligence Report (10 sections, scoring) | `kb/modes/IDEA_VALIDATION.md` |
| `DEEP_RESEARCH` | Sourced market / competitor / trend research | `kb/modes/DEEP_RESEARCH.md` |
| `THINKING` | Slow reasoning, multi-framing, named assumptions | `kb/modes/THINKING.md` |
| `BUSINESS_MODEL` | 9-block canvas + unit economics + defensibility | `kb/modes/BUSINESS_MODEL.md` |
| `POSITIONING` | Category frame + positioning stmt + taglines + pillars | `kb/modes/POSITIONING.md` |
| `IMAGE_PROMPTING` | Model-tuned image prompts (MJ/DALL·E/SD/Flux/Ideogram/Imagen) | `kb/modes/IMAGE_PROMPTING.md` |
| `EXECUTION` | 90-day build plan — milestones, sprints, budget, risks | `kb/modes/EXECUTION.md` |

Each mode KB defines:
- Purpose + when to use it
- Required inputs (clarifying questions to ask if missing)
- Output format and structural rules
- Handoff suggestions ("ready to move to X?")
- What that mode does NOT do (so scope stays clean)

---

## 7 · API reference

### `POST /api/chat`

Server-side Azure OpenAI proxy. The Azure key never reaches the browser.

**Request body:**
```json
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "temperature": 0.7,
  "max_tokens": 4000
}
```

**Headers:** `Content-Type: application/json`.

**Guards:**
- Origin allow-list — rejects cross-origin from unknown domains with 403
- Per-IP rate limit — 30 req/min (in-memory, per-instance; best-effort)
- Payload validation — max 100 messages, 50K chars per message, 200K total
- `max_tokens` capped server-side at 4000 regardless of client request
- `AZURE_OPENAI_*` env vars required; 500 if missing

**Response:** `text/event-stream` (SSE). Each line is `data: {json}`, with
`[DONE]` as the termination marker. Client parses `choices[0].delta.content`
for the streaming text and `usage` for token accounting.

### `GET /api/scrape?url=<url>`

SSRF-safe URL content fetcher.

**Query params:** `url` (required) — URL-encoded target.

**Guards:**
- Origin allow-list — same as `/api/chat`
- Per-IP rate limit — 20 req/min
- Protocol allowlist — `http:` and `https:` only
- Host blocklist — `localhost`, `127.*`, `10.*`, `172.16-31.*`, `192.168.*`,
  IPv6 ULA (`fc00:`), link-local (`169.254.*`, `fe80:`), and `.internal` /
  `.local` suffixes
- 10-second fetch timeout

**Response:**
```json
{
  "url": "final URL after redirects",
  "title": "...",
  "description": "...",
  "author": "...",
  "publishDate": "YYYY-MM-DD or null",
  "text": "cleaned text, up to 24000 chars"
}
```

Errors: 400 (bad URL), 403 (blocked host or origin), 429 (rate limited),
500 (upstream error).

---

## 8 · Database (Supabase)

All tables in the `public` schema, RLS intentionally disabled
(see `SECURITY.md`). Full DDL in `supabase/schema.sql`.

### `users`
- `id` text PK — client-generated UUID (no auth)
- `name`, `email` (UNIQUE), `avatar` (URL string), `updated_at`

### `azure_configs` (per-user display settings; credentials are server-side)
- `user_id` text PK → users.id
- `api_key` always `null` (scrubbed — server env only)
- `endpoint`, `deployment`, `model`, `version` — display strings
- `updated_at`

### `chats`
- `id` uuid PK
- `user_id` text → users.id (ON UPDATE CASCADE)
- `title`, `created_at`, `updated_at`
- `share_token` text UNIQUE nullable
- `share_expires_at`, `share_revoked_at` timestamptz nullable
- Partial index `idx_chats_active_share_token` for fast active-token lookup

### `messages`
- `id` uuid PK
- `chat_id` uuid → chats.id (ON DELETE CASCADE)
- `role` text (user | assistant | system)
- `content` text, `raw_text` text nullable
- `created_at`
- Index on `chat_id`

### `system_prompts` (per-user)
- `user_id` text PK → users.id
- `prompt` text, `kb_01_enabled`…`kb_04_enabled` booleans
- `updated_at`

### `memory_items`
- `id` uuid PK
- `user_id` text → users.id (indexed)
- `content` text, `category` text (default 'general')
- `created_at`

### `user_personalization`
- `user_id` text PK → users.id
- `tone`, `warm`, `enthusiastic`, `headers_lists`, `emoji` (style presets)
- `custom_instructions`, `nickname`, `occupation`, `location`, `interests`,
  `communication_style`
- `updated_at`

### `projects` and `research_reports`
Exist in the live DB (RLS enabled, 0 rows) but are not used by the current
UI. Captured in `schema.sql` with a "verify before relying" note.

### FK cascades
All `user_id` FKs have `ON DELETE CASCADE ON UPDATE CASCADE`, so
deleting or renaming a user automatically cleans up dependent rows.
Enables UUID renames (seed ran this during the dedup migration).

---

## 9 · State management (Zustand store)

Defined in `src/store.ts`. Single store, `persist` middleware.

### Shape

```ts
type AppState = {
  // Session / UI (persisted to localStorage)
  currentUser: UserProfile | null;
  profiles: UserProfile[];
  pricingRates: PricingRates;

  // DB-backed (NOT persisted — hydrated from Supabase on login)
  azureConfig: AzureConfigView;    // display-only, credentials are server
  kbToggles: KBToggles;
  memoryItems: MemoryItem[];
  systemPrompt: string;

  // setters…
};
```

### Persist scope

`partialize` is explicit: only `currentUser`, `profiles`, `pricingRates`
persist to localStorage. Everything else is re-hydrated from Supabase on
user sync. **Supabase is the source of truth** for all DB-backed fields.

### Migrations (`version: 7`)

- `v<4 → v4`: hard reset with INITIAL_PROFILES
- `v4 → v5`: add `pricingRates`
- `v5 → v6`: sync the 4 default profiles (DagnA/Subi/ManU/Gill) into
  persisted state — refreshes avatar/name/email on matching ids, appends
  missing ones, preserves user-created profiles
- `v6 → v7`: strip DB-backed fields (`azureConfig`, `kbToggles`,
  `memoryItems`, `systemPrompt`) from persisted state so existing users
  upgrade cleanly

---

## 10 · Hooks

### `useAzureChat`
Manages the chat streaming lifecycle.

- `sessionTokens: { prompt, completion }` — accumulates across the session
- `isStreaming: boolean`
- `streamResponse({ messages, temperature, onChunk })` — POSTs to
  `/api/chat`, parses SSE, calls `onChunk(partial)` for each delta
- `cancel()` — aborts via AbortController, stops Azure billing mid-stream

One generation at a time: calling `streamResponse` while another is in
flight aborts the first. Also auto-cancels on unmount.

### `useShareLink`
Manages share-token creation, resolution, and revocation.

- `shareLink: string | null` — the active share URL shown in the banner
- `createOrGetLink()` — reuses active token or creates a new 30-day one
- `revokeLink()` — sets `share_revoked_at` to now
- Internal effect — on mount, if `?shared=<token>` is in the URL,
  resolves it against Supabase and navigates to the chat (with banner
  showing owner name)

---

## 11 · Components

### `App.tsx` (top-level)
Router, global state orchestrator. Manages: sidebar states, chat page vs
settings/research/memory/projects pages, active mode selection, brutal
honesty toggle, chat history list, active chat, messages, streaming
state, file uploads, URL previews, summary metadata, keyboard shortcuts,
quick-add memory.

### `ProfileSelector.tsx`
Initial screen. Lets user pick from existing profiles or create a new
one (`crypto.randomUUID()` + Supabase upsert into `users`).

### `SettingsLLM.tsx`
Azure config display panel. API key field is `readOnly disabled` with
note "Managed server-side". Other fields (endpoint/deployment/model/
version) are editable and synced to `azure_configs` via `upsert`
(forcing `api_key: null`). Has a "Test Connection" button that pings
`/api/chat` with a trivial message to verify the proxy works. Shows
session token counts + Azure pricing lookups via public pricing API.

### `SettingsAgentBrain.tsx`
System prompt editor (persists to `system_prompts.prompt`), KB toggles
(`kb_01_enabled`…`kb_04_enabled`), memory editor (CRUD on
`memory_items`).

### `MermaidDiagram.tsx`
Renders Mermaid code blocks that appear in assistant messages.
- `mermaid.initialize({ securityLevel: 'strict', flowchart: { htmlLabels: false } })`
- SVG sanitized with DOMPurify using `svg` + `svgFilters` profiles, with
  explicit `FORBID_TAGS` (`script`, `foreignObject`) and blocklisted
  event-handler attrs
- Toolbar: switch visual/code view, zoom, SVG export, PNG export (via
  canvas + `toDataURL`)

### `DocumentViewer.tsx`
Right-side panel for viewing exported documents in a preview state
before download.

### `ErrorBoundary.tsx`
React error boundary. On caught error, logs via `logger.error` (with
component stack) and shows a "Something broke" panel with a Try-again
button.

---

## 12 · Library modules

### `src/lib/file-export.ts`
Format-conversion utilities. Takes Markdown content, parses it into
typed blocks (headings, paragraphs, bullets, tables, code, hr), then
renders to the target format.

Exports:
- `downloadMarkdown` — passthrough
- `downloadText` — strips markdown
- `downloadPDF` — jsPDF with CockRoach color palette, autoTable for
  tables, 18mm margins, page-break-aware
- `downloadDOCX` — docx library with real heading levels (ToC-friendly),
  inline text runs (bold / italic / code), tables with width=100%
- `downloadXLSX` — @e965/xlsx workbook with a Content sheet + one sheet
  per Markdown table found in the content
- `downloadCSV` — first table found, or stripped markdown lines
- `downloadPPTX` — pptxgenjs deck with cover slide + per-H1/H2 slides,
  auto-generated bar charts for numeric tables, 16:9 layout, CockRoach
  dark theme + red accent

All formats registered in the `EXPORT_FORMATS` const.

### `src/lib/kb-constants.ts`
Imports the base prompt + KB_01…04 from the `kb/` dir via `?raw`.
Re-exports as `COCKROACH_DEFAULT_SYSTEM_PROMPT`, `KB_01`, `KB_02`, `KB_03`,
`KB_04`.

### `src/lib/kb-mode-loader.ts`
Imports `kb/SKILLS.md` + all nine `kb/modes/*.md` via `?raw`.
Exports `SKILLS_KB`, `MODE_KBS` map, and `getModeKB(activeMode)`.

### `src/lib/system-prompt-builder.ts`
The only piece that knows how to assemble the final prompt (§5).
Re-exports `buildSystemPrompt`, `KBToggles`, `MemoryItem`,
`DEFAULT_KB_TOGGLES`.

### `src/lib/supabase.ts`
Single Supabase client instance. Reads `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` via `import.meta.env`.

### `src/lib/logger.ts`
Tiny centralized logger. Levels: `debug` (dev-only), `info`, `warn`,
`error`. Signature: `logger.error(message, { context })`. Currently
wraps `console` but exists so we can pipe to Sentry / Logflare later
without touching call sites.

### `src/lib/url-scraper.ts`
Client wrapper for `/api/scrape`. Also exports `detectUrls`,
`getUrlDomain`, `buildUrlContext`, and the `UrlPreview` type used for
the in-chat URL preview cards.

### `src/lib/utils.ts`
- `cn(...classes)` — classnames helper (`clsx` + `tailwind-merge`)
- `detectProvider(apiKey, baseUrl?)` — heuristic provider guess from
  key prefix (`sk-ant-` → anthropic, `sk-` → openai, etc.)

---

## 13 · Export formats (Skills KB reference)

See `kb/SKILLS.md` for the full craft-rules reference the agent uses
when generating deliverables. Quick recap:

| Format | Library | Best for |
|---|---|---|
| Markdown | native | Slack, Notion, git |
| Plain text | native | Email copy-paste |
| PDF | `jspdf` + `jspdf-autotable` | Investor / final reports |
| DOCX | `docx` | Editable hand-off (legal, edits) |
| XLSX | `@e965/xlsx` | Financial models, data tables |
| CSV | native | Data pipes, analytics ingestion |
| PPTX | `pptxgenjs` | Pitch decks, internal reviews |

`@e965/xlsx` is used instead of the original `xlsx` package because the
latter has unpatched prototype-pollution and ReDoS CVEs.

---

## 14 · Security

See `SECURITY.md` for the full trust model. Highlights:

- **No auth.** Client-generated UUIDs with RLS disabled. Works because
  the deployment URL is shared only with ≤5 trusted people.
- **Azure key** lives only in Vercel env (+ local `.env`). Never in the
  client bundle. `/api/chat` adds it per request.
- **`/api/chat` + `/api/scrape`** enforce an origin allow-list
  (Vercel-hosted URLs + localhost) and per-IP rate limits.
- **Share tokens** have 30-day expiry + explicit revoke (`share_revoked_at`).
- **Mermaid SVG** sanitized via DOMPurify on every render to prevent XSS
  from adversarial prompts.
- **`max_tokens` cap** on `/api/chat` prevents runaway Azure bills.
- **Streaming cancel** kills in-flight Azure completions the moment the
  user hits Stop or closes the tab.

---

## 15 · Environment variables

All set in Vercel project settings + local `.env`. See `.env.example`.

**Server-only** (Vercel serverless runtime only):
- `AZURE_OPENAI_ENDPOINT` — Azure OpenAI resource endpoint
- `AZURE_OPENAI_KEY` — API key (never send to browser)
- `AZURE_OPENAI_DEPLOYMENT` — deployment name
- `AZURE_OPENAI_VERSION` — API version (e.g., `2024-12-01-preview`)
- `AZURE_OPENAI_MODEL` — display-only label (e.g., `gpt-5.3-chat`)

**Client** (bundled into the Vite build — must be `VITE_`-prefixed):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Dev-only:**
- `DISABLE_HMR` — set to `'true'` to disable Vite HMR (useful when an
  agent is auto-editing files and triggering reloads)

---

## 16 · Development workflow

### Commands
- `npm run dev` — Express + Vite middleware on :3000. Uses `tsx` to run
  TypeScript directly; mounts the same `api/*` handlers as Express routes.
- `npm run build` — Vite production build to `dist/`
- `npm run preview` — serve `dist/` for local verification
- `npm run typecheck` — `tsc --noEmit` (strict mode)
- `npm run lint` — ESLint over `src/`, `api/`, `server.ts`
- `npm run test` — placeholder; no test framework wired yet
- `npm run clean` — `rm -rf dist`

### TypeScript
Strict mode + `noUnusedLocals` + `noUnusedParameters` + `noImplicitReturns` +
`noFallthroughCasesInSwitch`. `any` is permitted but warned.

### ESLint
typescript-eslint flat config + `react-hooks`. Notable rules:
- `react-hooks/rules-of-hooks` error
- `react-hooks/exhaustive-deps` warn
- `@typescript-eslint/no-unused-vars` error (except `_`-prefixed)
- `@typescript-eslint/consistent-type-imports` warn
- `no-console` warn (except in api/server where it's off)
- `eqeqeq` error (smart), `prefer-const` error

### CI
`.github/workflows/ci.yml` runs on every push + PR to `main`:
typecheck → lint → `npm audit --omit=dev --audit-level=high`.

---

## 17 · Deploy

Vercel project `cock-roach` under team `aasaanais-projects`.

- Push to `main` → Vercel build → auto-deploy
- `vite build` produces `dist/` — served as static
- Files under `api/` auto-deploy as Node.js serverless functions
- No `vercel.json` — defaults work (framework auto-detected as Vite)

### To roll back
Vercel dashboard → Deployments → any prior deployment → **Promote to
Production**. No CLI needed.

### Preview deployments
Every non-main branch gets a preview URL at
`cock-roach-git-{branch}-aasaanais-projects.vercel.app`. Already on the
origin allow-list regex in `api/chat.js` + `api/scrape.js`.

---

## 18 · When things break — common triage

| Symptom | First place to look |
|---|---|
| Chat returns "Azure OpenAI not configured" | Vercel env vars — `AZURE_OPENAI_*` missing or empty |
| Chat returns 429 | Rate-limit burst (30/min per IP on `/api/chat`). Wait or restart function for cold state |
| Scraper returns "Origin not permitted" | Add your origin to the regex in `api/scrape.js` + `api/chat.js` |
| Profile avatars don't load | Check `public/profiles/` contents and `users.avatar` column — should match |
| Settings values don't save | Check Supabase connectivity + browser console for RLS messages (shouldn't trigger but worth confirming) |
| Share link says "expired or invalid" | Expected if >30 days old or revoked. Generate a new one. |
| Mermaid diagram not rendering | Check `MermaidDiagram` — `securityLevel: strict` can reject some inputs; check browser console for parse errors |
| Build fails on `?raw` import | Missing `vite/client` reference in `src/vite-env.d.ts`, or a `.md` file was moved without updating `kb-constants.ts` / `kb-mode-loader.ts` |
| KB edit doesn't take effect | Dev server needs restart; Vite's `?raw` cache sometimes sticks |

---

## 19 · Extending the system

### Add a new mode
1. Create `kb/modes/NEW_MODE.md` (follow the existing mode-KB structure)
2. Add the import + map entry in `src/lib/kb-mode-loader.ts`
3. Add the mode to `APP_MODES` in `src/App.tsx` (the icon bar)
4. Done — the prompt builder will pick it up automatically when
   `activeMode === 'NEW_MODE'`

### Add a new export format
1. Add a `downloadXxx(content, filename)` function to
   `src/lib/file-export.ts`
2. Append to the `EXPORT_FORMATS` const
3. UI (chat header / download menu) picks it up automatically

### Add a new API endpoint
1. Create `api/my-endpoint.js` with `export default async function
   handler(req, res)` signature
2. Mount it in `server.ts` for dev parity:
   ```ts
   import myHandler from './api/my-endpoint.js';
   app.all('/api/my-endpoint', (req, res) => myHandler(req as never, res as never));
   ```
3. Copy the origin allow-list + rate-limit helpers from `api/chat.js` if
   the endpoint takes user input
4. No Vercel config needed — auto-deploys

### Add auth (if scope grows beyond ~5 users)
1. Add Supabase Auth (email/password or OAuth) in `ProfileSelector`
2. Migrate `users.id` from `text` to `uuid` keyed to `auth.users(id)`
3. Flip every table's RLS to `enable row level security`
4. Replace the `GRANT ALL … anon` grants in `supabase/policies.sql` with
   policies like `using (auth.uid()::text = user_id)`
5. Rotate the Supabase anon key — now actually meaningful
6. Update `SECURITY.md` to reflect the new trust model

---

*End of architecture reference. For user-facing setup, see `README.md`.
For trust model and key rotation, see `SECURITY.md`.*
