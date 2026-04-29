# CockRoach — Product Documentation

> *"Not a unicorn. Better."*
> The startups that survive aren't unicorns — they're cockroaches.
> Resilient. Ugly. Unstoppable.

**A product of [Layaa AI](https://www.layaa.ai).** CockRoach is to Layaa
AI what ChatGPT is to OpenAI: a focused, opinionated product within the
parent company's portfolio.

The complete reference for what CockRoach is, every problem it solves,
every tool it ships, and every feature on the roadmap. Read alongside:

- `README.md` — setup and stack overview
- `ARCHITECTURE.md` — engineering internals (modules, APIs, schemas)
- `SECURITY.md` — trust model and credential rotation
- `claude.md` — live build context (project state, plan, update log)
- `kb/base-prompt.md` — the agent's top-level system prompt
- `kb/modes/*.md` — per-mode behavior guides
- `kb/SKILLS.md` — deliverable craft (PPT / Excel / PDF rules)

Status legend used throughout this document:

- ✅ **Shipped** — live in the current build
- 🚧 **Planned** — designed and scoped, not yet implemented
- 💭 **Considered** — under evaluation, lower priority

Last updated: 2026-06-29.

---

## 1 · Vision and positioning

CockRoach is an AI-powered **entrepreneurial intelligence co-pilot** built
for the entire lifecycle of starting and scaling a business. It is not a
chatbot, not a wrapper around an LLM, and not a generic assistant. It is
an opinionated co-founder that:

- **Listens like a strategist** — patient, asking the right questions
  before answering
- **Researches like an analyst** — pulls real data, cites real sources,
  flags what it can't verify
- **Decides like an operator** — takes a stance, names trade-offs,
  refuses to manufacture false balance
- **Writes like a senior partner** — outputs you can hand to investors,
  partners, or your own team without rework

CockRoach is built to be the **all-in-one tool a founder reaches for**
across the entire journey: from "I don't know what to build" through
"we just closed our seed round and need to hire a head of growth" to
"do we pivot or persevere?"

### Who it is for

Founders, operators, and intrapreneurs who:

- Have an idea and need rigorous validation before committing time/money
- Don't yet have an idea and want a thinking partner to find one
- Are post-launch and need help with pricing, GTM, hiring, fundraising,
  or pivot decisions
- Want polished deliverables (decks, models, reports) without grinding
  in PowerPoint or Excel

### What CockRoach is *not*

- Not a generic chat assistant — it has opinions, a personality, and a
  fixed scope
- Not a substitute for legal, financial, or tax advice — surfaces risks
  and frameworks, recommends professionals for binding decisions
- Not a yes-machine — bad ideas get scored badly; weak assumptions get
  flagged

> **Stage:** Currently a closed-internal build (no auth, ≤5 trusted
> profiles) being prepared for **public SaaS launch in ~30 days from
> 2026-06-29**. Auth, billing, marketing surface, and tier gating are
> the final additions before launch (see `claude.md` for the live
> launch plan and current phase).

---

## 2 · Pain points CockRoach addresses

Mapped to the real founder journey, in order of typical occurrence:

### Pre-idea / discovery
- "I want to start something but don't know what" → IDEA_GENERATION
- "Is this trend real or noise?" → DEEP_RESEARCH
- "Who's already doing this?" → DEEP_RESEARCH + competitive matrix
- "Does my background fit this idea?" → 🚧 AI_FOUNDER_FIT
- "What's worth building right now?" → 🚧 IDEA_DATABASE + 🚧 IDEA_OF_THE_DAY

### Validation
- "Is this idea any good?" → IDEA_VALIDATION (KB-02 10-section report)
- "How big is the market actually?" → DEEP_RESEARCH (TAM/SAM/SOM with sources)
- "Why now? What changed?" → IDEA_VALIDATION §3
- "What are the proof signals?" → IDEA_VALIDATION §6
- "Where's the gap competitors miss?" → DEEP_RESEARCH + 🚧 MARKET_GAP analysis
- "How risky is this?" → IDEA_VALIDATION §9 risk register

### Strategy & build
- "How does this make money?" → BUSINESS_MODEL (9-block canvas + unit economics)
- "What's the wedge customer?" → 🚧 CUSTOMER_DISCOVERY
- "What's the simplest MVP?" → EXECUTION (90-day build plan)
- "How do I price this?" → 🚧 PRICING
- "What's my positioning?" → POSITIONING (April Dunford stack)
- "Which framework fits this offer?" → 🚧 FRAMEWORKS_LIBRARY (Value Equation, ACP, Value Matrix, Value Ladder)

### Go-to-market
- "PLG or sales-led?" → 🚧 GO_TO_MARKET
- "Which channel for first 100 customers?" → 🚧 GO_TO_MARKET
- "What CAC can I afford?" → BUSINESS_MODEL + 🚧 GO_TO_MARKET
- "How do I structure a sales call?" → 🚧 GO_TO_MARKET (planned scripts)

### Funding
- "Should I raise or bootstrap?" → 🚧 FUNDRAISING
- "How much should I raise?" → 🚧 FUNDRAISING (dilution math)
- "What grants do I qualify for?" → KB-03 USA Funding & Grants (always-on)
- "Is my deck ready?" → 🚧 FUNDRAISING + Skills KB (PPTX craft)

### Hiring & ops
- "Who should I hire first?" → 🚧 HIRING_AND_EQUITY
- "What equity do I offer?" → 🚧 HIRING_AND_EQUITY
- "LLC or C-corp?" → 🚧 LEGAL_AND_OPS
- "What tools do I need at this stage?" → 🚧 LEGAL_AND_OPS / 🚧 VENDOR_SELECTION

### Hard decisions
- "Should I pivot?" → 🚧 PIVOT_OR_PERSEVERE
- "Are my metrics real or vanity?" → 🚧 METRICS_AND_DASHBOARDS
- "Is this still working?" → 🚧 PIVOT_OR_PERSEVERE + project decision log

### Output craft
- "I need a pitch deck by Monday" → Skills KB (PPTX)
- "Investor wants a financial model" → Skills KB (XLSX)
- "We need a one-pager" → Skills KB (PDF / DOCX)
- "Send me the cleaned-up version" → multi-format export from Document Preview Panel

---

## 3 · The two entry paths

### Path A — "I don't have an idea yet"

The user is in discovery mode. CockRoach guides them from no-idea to a
short list of validated candidates:

1. **IDEA_GENERATION** — produces 8–12 specific ideas with tags, market
   signals, and first-mile tests
2. 🚧 **IDEA_DATABASE** — browse a growing internal catalog of pre-
   validated ideas with scores and tags
3. 🚧 **IDEA_OF_THE_DAY** — daily curated nudge surfaced in the app
   (and optionally emailed)
4. 🚧 **AI_SUGGEST** — personalized idea recommendations based on the
   user's interests, skills, and prior conversations
5. 🚧 **AI_FOUNDER_FIT** — given a candidate idea, score founder-idea
   compatibility (skills, network, capital tolerance, time horizon)
6. **IDEA_VALIDATION** — once a candidate idea is picked, run the full
   KB-02 framework

### Path B — "I already have an idea"

The user has committed to an idea and wants help executing. The validation
step is still useful but as a filter, not a discovery tool:

1. **IDEA_VALIDATION** — sanity-check the chosen idea (KB-02 report)
2. **BUSINESS_MODEL** — translate to revenue + unit economics
3. **POSITIONING** — name the category, sharpen the message
4. 🚧 **PRICING** — model + tiers + sensitivity
5. 🚧 **GO_TO_MARKET** — channel selection + first-100 playbook
6. **EXECUTION** — 90-day build plan with weekly sprints
7. 🚧 **CUSTOMER_DISCOVERY** — interviews, segmentation, validation loops
8. 🚧 **FUNDRAISING** — raise/don't, deck, target list, term-sheet basics
9. 🚧 **HIRING_AND_EQUITY** — first 5 roles, equity bands, sourcing
10. 🚧 **LEGAL_AND_OPS** — entity, contracts, IP, compliance flags
11. 🚧 **PIVOT_OR_PERSEVERE** — when in doubt, structured pivot framework

Both paths converge on **execution**. The difference is just where the
user enters.

---

## 4 · Working modes — full catalog

Modes are user-selected from the chat UI. Each mode loads a dedicated
behavior KB (`kb/modes/{MODE}.md`) that defines: purpose, required
inputs, output format, handoff suggestions, and explicit "what this mode
does NOT do."

### Currently shipped (9 modes)

| Mode | Purpose | KB |
|---|---|---|
| ✅ `GENERAL` | Default chat. Answer what was asked, don't auto-run workflows. | `kb/modes/GENERAL.md` |
| ✅ `IDEA_GENERATION` | Stream 8–12 specific ideas with tags + first-mile tests. | `kb/modes/IDEA_GENERATION.md` |
| ✅ `IDEA_VALIDATION` | Full KB-02 Idea Intelligence Report — 10 sections, scoring, verdict. | `kb/modes/IDEA_VALIDATION.md` |
| ✅ `DEEP_RESEARCH` | Sourced market / competitor / trend research with explicit research plan. | `kb/modes/DEEP_RESEARCH.md` |
| ✅ `THINKING` | Slow reasoning, multi-framing, named assumptions, pre-mortem. | `kb/modes/THINKING.md` |
| ✅ `BUSINESS_MODEL` | 9-block canvas + unit economics + defensibility diagnostic. | `kb/modes/BUSINESS_MODEL.md` |
| ✅ `POSITIONING` | Category frame + positioning statement + taglines + pillars + competitive matrix. | `kb/modes/POSITIONING.md` |
| ✅ `IMAGE_PROMPTING` | Model-tuned image generation prompts (MJ, DALL·E, SD, Flux, Ideogram, Imagen). | `kb/modes/IMAGE_PROMPTING.md` |
| ✅ `EXECUTION` | 90-day build plan: milestones, weekly sprints, budget scenarios, risk register. | `kb/modes/EXECUTION.md` |

### Planned post-idea modes (the operator layer)

| Mode | Purpose | Priority |
|---|---|---|
| 🚧 `PRICING` | Pricing model selection, tier design, anchoring, sensitivity analysis, pricing-page copy. | High |
| 🚧 `GO_TO_MARKET` | PLG vs sales-led decision, channel breakdown with CAC math, first-100 playbook, sales scripts. | High |
| 🚧 `FUNDRAISING` | Raise/bootstrap call, target check, dilution math, deck structure, investor list, term-sheet red flags. | High |
| 🚧 `HIRING_AND_EQUITY` | First 5 hires, role-vs-contractor, equity bands by stage, vesting, sourcing, screening rubrics. | High |
| 🚧 `CUSTOMER_DISCOVERY` | Mom-test interview script, problem vs solution validation, segmentation from transcripts, exit criteria. | Medium |
| 🚧 `LEGAL_AND_OPS` | Entity choice (LLC / C-corp / PBC), founder agreements, IP assignment, compliance flags (HIPAA / SOC2 / GDPR). | Medium |
| 🚧 `PIVOT_OR_PERSEVERE` | Pivot framework, sunk-cost detection, pivot type taxonomy, decision rubric. | Medium |
| 💭 `METRICS_AND_DASHBOARDS` | What to track per stage, target setting, vanity-metric detection. May fold into BUSINESS_MODEL. | Low |
| 💭 `VENDOR_SELECTION` | Opinionated picks for payments, billing, analytics, support tooling per stage. May fold into EXECUTION. | Low |

### Discovery enhancements (planned)

These are not modes per se — they're features that augment IDEA_GENERATION
and surface throughout the UI:

- 🚧 **IDEA_OF_THE_DAY** — daily curated idea on first login
- 🚧 **IDEA_DATABASE** — browsable catalog of saved/scored ideas
- 🚧 **AI_SUGGEST** — personalized recommendations based on user history
- 🚧 **AI_FOUNDER_FIT** — founder-idea compatibility score
- 🚧 **MARKET_GAP** — gap-finding analysis layered on DEEP_RESEARCH
- 🚧 **TAGS_AND_TRENDS** — categorical browsing of ideas by tag and trend

---

## 5 · The Project spine (planned architectural pillar)

The biggest planned change. Currently CockRoach treats every conversation
as standalone; chats are linked to a user but not to a *venture*. The
Project spine introduces a persistent context layer that turns CockRoach
from "AI chat with modes" into "AI co-pilot with persistent venture
memory."

### What a Project is

A Project represents a single venture/idea the user is pursuing. It has:

- A **stage**: `idea` → `validated` → `building` → `launched` → `scaling`
  (or `paused`)
- A **chosen idea description** (locked once committed)
- All **chats** the user runs under this project (filtered)
- A **decision log** — append-only record of strategic choices
- An **artifacts catalog** — every PPTX, XLSX, DOCX exported under this
  project
- **Revisit timers** — "check this assumption in 90 days"

### Decision log

Every strategic choice the user makes (with the agent's recommendation)
can be saved as a Decision:

```
Category:        pricing | gtm | hiring | fundraise | pivot | legal | …
Question:        What pricing model to launch with?
Decision:        Per-seat at $99/user/month, with a 14-day free trial.
Rationale:       …
Reversibility:   reversible | expensive | one-way
Decided at:      2026-05-12
Revisit at:      2026-08-12  (90 days)
```

The agent **reads the recent decision log** as part of every chat in the
project, so it never asks "what's your pricing model?" twice — it
remembers, and can challenge the user if their next decision contradicts
the prior one.

### Artifacts catalog

Every export (PDF, DOCX, XLSX, PPTX) saved under a project becomes a
named artifact: `Pitch Deck v3`, `Q3 Financial Model`, `Positioning
Doc`, `90-day Plan`. Browsable from the project page; one click to
re-export or remix.

### Why it matters

It's the difference between "an LLM that forgets every Monday" and "a
co-founder who remembers every decision since you started." For an
operator working a real venture over months, that's the entire product.

---

## 6 · Frameworks built in

Frameworks are the structured mental models CockRoach applies. Most live
inside mode KBs; some are planned as standalone framework KBs.

### Currently shipped

- ✅ **KB-02 Idea Intelligence Report** — the 10-section validation
  framework: clarity scores, market sizing, competition, customer pain,
  business model, why-now, proof signals, risk register, scoring, verdict
- ✅ **Business Model Canvas** (in BUSINESS_MODEL mode) — 9-block
  canvas + unit economics table + defensibility diagnostic
- ✅ **April Dunford positioning stack** (in POSITIONING mode) — category
  frame, positioning statement (3 variants: safe / sharp / contrarian),
  taglines (2×3 grid), voice & tone rubric, messaging pillars,
  competitive matrix, name candidates
- ✅ **90-day execution plan** (in EXECUTION mode) — North Star, 3–5
  milestones, weekly sprints with task quality bar, 3-scenario budget
  (lean / realistic / aggressive), risk register, weekly metrics
- ✅ **Mom Test interview principles** (referenced in IDEA_VALIDATION
  for customer discovery)
- ✅ **Cockroach Score** — composite verdict with Clarity / Uniqueness
  / Timing dimensions, 0–100 scale

### Planned framework library

- 🚧 **Value Equation** (Alex Hormozi) — `(Dream Outcome × Perceived
  Likelihood) ÷ (Time Delay × Effort & Sacrifice)`
- 🚧 **ACP Framework** (Greg Isenberg) — Acquisition / Churn / Pricing
  diagnostic
- 🚧 **Value Matrix** — value-prop ↔ market-fit mapping
- 🚧 **Value Ladder** (Russell Brunson) — offer escalation from lead
  magnet to high-ticket
- 🚧 **Dream 100** — target customer / partner concentration framework
- 🚧 **Lean Canvas** (alternative to BMC for very early stage)
- 🚧 **Jobs to Be Done** — explicit JTBD interview structure
- 🚧 **North Star Metric framework** — selection, decomposition, traps

Each will ship as a standalone KB under `kb/frameworks/*.md` plus a
"Run this framework on my idea" button in the chat UI that injects the
framework KB into the next turn.

---

## 7 · Tools and capabilities

What the agent can actually *do* — not just talk about.

### ✅ Streaming chat (`/api/chat`)

Server-side proxy to Azure OpenAI (`gpt-5.3-chat` deployment).
End-to-end SSE streaming. The Azure key never reaches the browser.

- **Per-turn system prompt assembly** — base prompt + foundation KBs
  (toggleable) + Skills KB (always-on) + active Mode KB (auto-injected)
  + memory items + user identity + brutal-honesty flag
- **Token cap** — 4000 completion tokens per request, server-enforced
- **Stream cancel** — user can hit Stop mid-generation; the AbortController
  kills the upstream Azure stream and stops billing
- **Origin allow-list** — only deployments under the project's Vercel
  domains + localhost can call the proxy
- **Per-IP rate limit** — 30 req/min, in-memory per-instance

### ✅ URL fetcher (`/api/scrape`)

SSRF-safe content extractor. Used by:

- The agent itself, when it needs to read a specific URL the user
  provided or a source it wants to cite
- The frontend's URL preview cards (when a user pastes a link in chat)

Returns: cleaned text (24K char cap), title, description, author,
publish date.

Guards:
- Protocol allowlist (http/https only)
- Host blocklist (private RFC1918, IPv6 ULA / link-local, `.internal`,
  `.local`)
- 10-second fetch timeout
- 20 req/min per IP rate limit
- Origin allow-list

### ✅ Document Preview Panel + multi-format export

The headline output craft tool. Click the Export action on any assistant
message to open a right-docked panel showing:

- **Rendered view** — the message as polished markdown with proper
  headings, tables, code blocks
- **Source view** — the raw markdown for copy-paste

Plus a footer with seven format chips. Pick a format, click Download:

| Format | Library | Best for |
|---|---|---|
| Markdown | native | Slack / Notion / git |
| Plain Text | native | Email body |
| **PDF** | jspdf + jspdf-autotable | Investor / final report |
| **DOCX** | docx | Editable hand-off (legal, edits) |
| **XLSX** | @e965/xlsx | Financial models, data tables |
| CSV | native | Data pipes, analytics ingestion |
| **PPTX** | pptxgenjs | Pitch decks, internal reviews |

All formats run client-side. The Markdown is parsed once into typed
blocks (heading / paragraph / bullet / code / table / hr) and each
exporter renders from that shared tree — that's why tables stay real
tables in DOCX/XLSX/PPTX, not pipe-text.

### ✅ Mermaid diagram rendering

When the agent emits a `mermaid` code block, it renders as an interactive
SVG diagram inline:

- Toolbar with Visual / Code view toggle
- Zoom in / out / reset
- Export as SVG or PNG (PNG via canvas)
- DOMPurify-sanitized output (defense-in-depth XSS protection)
- `securityLevel: 'strict'` and `htmlLabels: false` on the Mermaid
  initializer

### ✅ Inline charts (Recharts)

For data the agent renders as a chart inline (responsive, with tooltips).

### ✅ Share links

Every chat can be shared via a tokenized URL:

- 30-day default expiry
- Explicit revoke (sets `share_revoked_at = now()`)
- Token uniqueness enforced at the DB level
- Partial index for fast active-link lookup
- Anyone with the link can view the chat in read mode

### ✅ Memory items

Per-user persistent memory the agent treats as ground truth:

- Categories (e.g., `preferences`, `decisions`, `constraints`,
  `projects`)
- Injected into every chat's system prompt under `[COCKROACH MEMORY
  CONTEXT]`
- Editable from Agent Brain settings tab
- 🚧 In the Project spine, memory items will optionally scope to a
  project rather than user-globally

### ✅ KB toggles

User-level switches for the four foundation KBs (KB-01 Identity, KB-02
Idea Analysis, KB-03 USA Funding, KB-04 Output Formats). Useful for
specialists who want to silence sections that don't apply.

### ✅ Brutal Honesty toggle

Drops respect-layering. The agent calls out weak assumptions and blind
spots head-on instead of softening. Persistent toggle in the chat UI.

### ✅ File and URL ingestion

When the user uploads a file or pastes a URL:

- Files: text content extracted into the chat context
- URLs: fetched via `/api/scrape` and rendered as preview cards inline
- Both can be referenced naturally in the next turn

### ✅ Multi-message conversation actions

Hover-revealed action bars on every message:

**Assistant messages:**
- Copy
- Thumbs up / down (single-select rating, in-memory)
- Export → opens Document Preview Panel
- Regenerate (last assistant message only)

**User messages:**
- Copy (uses `rawText` if available)
- Edit & resend (drops content back into input)

### ✅ Document side viewer

For long-form outputs, a right-docked panel shows the full document
rendered as a reading-optimized view. Used by both the Export panel and
the legacy "Open as document" handler (now consolidated into the Export
panel's preview).

### Planned tools

- 🚧 **Project switcher** — top-bar dropdown showing active projects
  with stage chips; switching scopes all subsequent chats
- 🚧 **Decision log button** — in chat, capture the agent's
  recommendation as a structured Decision record with category,
  reversibility, and revisit timer
- 🚧 **Artifact saver** — when an export happens inside a project,
  prompt to save the artifact under that project with a name
- 🚧 **Revisit-now banner** — on app load, surface decisions whose
  `revisit_at` has passed: "It's been 90 days — is this still true?"
- 🚧 **Founder Fit assessment** — interactive questionnaire on first
  use; results persist as user-scope memory and inform IDEA_GENERATION
- 🚧 **"Run this framework on my idea"** quick action — one click to
  apply Value Equation / ACP / Value Matrix / Value Ladder to the
  current project's chosen idea
- 🚧 **Trends panel** — for users in discovery, lightweight surfacing
  of trending tags from the idea database
- 💭 **Reddit listener** — scheduled scrape of r/startups, r/SaaS,
  r/Entrepreneur top threads → auto-extract candidate ideas → save to
  database. Lower priority for ≤5 user scale.
- 💭 **Search-volume integration** — paid API (DataForSEO / Ahrefs /
  SerpApi). Costs money and probably overkill at this scale.

---

## 8 · Skills KB — output craft

The Skills KB (`kb/SKILLS.md`) is **always loaded** into the agent's
context. It defines the standards CockRoach holds itself to when
generating reports, decks, financial models, and visualizations.

### Coverage

- **Pitch / report deck rules (PPTX)** — 10–12 slide structure that
  closes, one-idea-per-slide rule, 6-word title rule, large-number
  typography, chart-vs-table heuristics, pptxgenjs API patterns,
  CockRoach dark theme defaults
- **Excel / financial model craft** — assumption block in one place,
  blue/black/green/red color convention, mandatory check cells,
  separate Inputs/Calcs/Outputs/Charts sheets, copy-down-safe formulas,
  standard model templates (24-month P&L, SaaS cohort retention,
  LTV:CAC sensitivity, scenario analysis), `@e965/xlsx` API patterns
- **Chart selection** — when to use bar / line / area / pie / scatter
  / waterfall, and explicit "never" list (3D effects, rainbow gradients,
  pie charts with 12 slices)
- **DOCX rules** — real heading levels (HeadingLevel.H1..H6) for ToC,
  inline runs (bold/italic/code), 100% width tables
- **PDF rules** — A4, 18mm margins, font hierarchy, dark-red brand
  divider after H1/H2, autoTable styling
- **Format selection guide** — what to recommend based on the
  recipient (PDF for investor, DOCX for legal, PPTX for pitch, XLSX
  for model)
- **Honesty rules** — never fabricate numbers, label projections
  clearly, cite sources for external claims, no visual deception
  (truncated y-axes, fake totals)

### Effect on user output

Because Skills is always-on, CockRoach produces meaningfully better
deliverables than a vanilla LLM. A "make me a pitch deck" prompt
goes through:

1. The active mode KB (e.g., POSITIONING) defines content
2. Skills KB defines structure, visual rules, and craft standards
3. The exporter (PPTX) generates a real, opens-in-Keynote file

Most LLMs do step 1 and stop. CockRoach does all three.

---

## 9 · Foundation KBs

Always-on (each user-toggleable) reference layers loaded into every
chat:

### ✅ KB-01 — Identity & Personality

The voice rulebook. Defines tone, microcopy patterns, the "what
CockRoach never does" list, persona across modes. Ensures the bot's
voice stays consistent in technical responses, in error states, in
reports.

### ✅ KB-02 — Idea Analysis Framework

The 10-section Idea Intelligence Report structure. Used in
IDEA_VALIDATION mode but also referenced from elsewhere when scoring
or analysis surfaces. Sections:

1. Idea Clarity & Initial Scores
2. Market Analysis (TAM / SAM / SOM with sources)
3. Customer Discovery (target persona, pain depth)
4. Competition Landscape (direct + adjacent)
5. Business Model & Revenue
6. Why Now? + Proof Signals
7. Funding & Capital Path
8. Risks & Blind Spots
9. Cockroach Score + Verdict
10. 30/60/90 Roadmap

### ✅ KB-03 — USA Funding & Grants

Comprehensive reference for U.S. funding programs:

- SBA loan programs (7(a), 504, microloans)
- SBIR / STTR (Phase I, II, III)
- State-specific economic development grants
- Minority / women / veteran-owned business certifications and benefits
- Accelerator and incubator landscape
- Crowdfunding rules and tactics

### ✅ KB-04 — Output Formats & Structure

Response-format rules per output type — works in concert with Skills
KB. Where Skills focuses on file-export craft, KB-04 focuses on
in-chat formatting (headers, tables, blockquotes, callouts, emoji
use, brevity rules).

---

## 10 · Personalization

CockRoach lets each user shape the agent's behavior:

### ✅ Voice & tone preferences

Stored in `user_personalization` table:

- **Tone**: Professional / Friendly / Direct / Witty
- **Warmth**: warm vs cool
- **Enthusiasm**: high / default / low
- **Headers & lists usage**: heavy / default / minimal
- **Emoji use**: liberal / default / none
- **Custom instructions**: free-text system-prompt addendum
- **Nickname**, **occupation**, **location**, **interests**
- **Communication style**: Direct / Verbose / Concise / Story-driven

### ✅ Custom system prompt

User can override the base prompt entirely (with the default visible
as a starting point in the editor).

### ✅ KB toggles

Disable any of KB-01..KB-04 if not relevant to the user's scope.

### ✅ Memory items

Append to the agent's knowledge of the user across sessions. Categorized
free-form facts.

### 🚧 Project-scoped personalization

Same as above but per-project, so a user can have different tones in
different ventures (e.g., crisp/data-driven for a B2B SaaS project,
playful for a consumer-app side project).

---

## 11 · Data and persistence

Everything the user creates is persisted to Supabase Postgres. The DB is
the **source of truth**; local browser state is a minimal cache.

### ✅ Tables (current)

| Table | Purpose |
|---|---|
| `users` | Profile records (id, name, email, avatar) |
| `azure_configs` | Display-only Azure settings per user (key is server-side) |
| `system_prompts` | User's prompt + KB toggles |
| `user_personalization` | Tone / style / nickname / interests / etc. |
| `chats` | Conversation records (with share_token, expiry, revoke fields) |
| `messages` | Chat messages (role, content, raw_text) |
| `memory_items` | Persistent agent memory per user |

### 🚧 Tables (planned for Project spine)

| Table | Purpose |
|---|---|
| `projects` | One row per venture (already in DB, currently unused) |
| `decisions` | Append-only decision log per project |
| `project_artifacts` | Saved exports (decks, models, memos) per project |
| `ideas` | Browsable catalog of generated/validated ideas (lite version) |

See ARCHITECTURE.md §8 for full DDL of current tables. Planned tables
will be added in Phase 2 of the roadmap.

### Storage philosophy

- **No client-side persistence of DB-backed fields.** When a user logs
  in, the store hydrates from Supabase. Reload = fresh fetch.
- Only **session/UI** state persists locally: which profile is selected,
  the in-flight pricing-rates cache, and v6+ migrations.
- See ARCHITECTURE.md §9 for the Zustand store design and v7 migration.

---

## 12 · Trust model summary

Detailed in `SECURITY.md`. Quick recap of the **current** posture
(closed-internal build):

- **No authentication.** User identity is a client-generated UUID.
  RLS is intentionally disabled.
- **Azure key never reaches the browser.** Lives in Vercel env vars,
  used only by `/api/chat`.
- **Origin allow-list + per-IP rate limit** on both `/api/chat` and
  `/api/scrape`.
- **`max_completion_tokens: 4000` cap** on chat completions to prevent
  runaway costs.
- **Stream cancel** kills upstream generation immediately.
- **Share tokens** have 30-day expiry + explicit revoke.
- **Mermaid output sanitized** with DOMPurify (XSS defense).

🚧 **At public-launch time** (Phase 3 of the launch plan), this changes:
- Add Supabase Auth (email/password + Google OAuth)
- Migrate `users.id` from `text` to `uuid` keyed to `auth.users(id)`
- Flip RLS on across every table; per-user policies via `auth.uid()`
- Replace `GRANT ALL anon` with policy-driven access
- Rotate the Supabase anon key (now meaningful)
- Stripe billing + tier-based feature gating
- Privacy policy + Terms of Service

See `SECURITY.md` § "What changes if you ever add auth" for the
migration runbook.

---

## 13 · Roadmap by phase

The product is shippable as-is. Each phase below is additive — none
breaks earlier phases.

> **Active sprint:** Public SaaS launch under Layaa AI in ~30 days
> from 2026-06-29. Phases 1, 2, and 3 below + auth/billing/email
> infrastructure are all in scope for that sprint. See `claude.md`
> for day-by-day tasks. Phases 4 onward come after launch.

### ✅ Phase 0 — Foundation (shipped)

- 9 working modes with dedicated KBs
- Server-side Azure proxy with token cap + stream cancel
- SSRF-safe URL scraper
- Multi-format export (PDF / DOCX / XLSX / PPTX / CSV / MD / TXT)
- Document Preview Panel (Claude-artifacts style)
- Persistent memory items
- Per-user personalization (tone, style, KBs, custom prompt)
- Share links with expiry + revoke
- Mermaid diagram rendering with sanitization
- Strict TypeScript, ESLint, CI (typecheck + lint + audit)
- Comprehensive documentation (README, SECURITY, ARCHITECTURE, this)

### 🚧 Phase 1 — Project spine (next)

The architectural pivot from "AI chat with modes" to "AI co-pilot with
persistent venture memory."

- Wire up `projects` table (already in DB, unused)
- New `decisions` table — append-only log
- New `project_artifacts` table
- Project list UI page (currentPage='projects')
- Project detail page with tabs: chats / decisions / artifacts /
  reminders
- "Start project from this chat" action
- Project-scoped chat filtering
- Project-aware system prompt (latest 10 decisions + project description
  injected)
- Mode reorder in UI: post-idea modes promoted, discovery modes moved
  to a Discovery submenu

**Estimated effort:** ~10–12 hours. **Highest leverage** of any planned
work.

### 🚧 Phase 2 — Operator modes

The four post-idea modes that cover the highest-frequency founder pain
points after commitment:

- `PRICING` — pricing model + tiers + sensitivity tables + page copy
- `GO_TO_MARKET` — PLG vs sales-led + channel selection + first-100
  playbook
- `FUNDRAISING` — raise/bootstrap call + deck + investor list + dilution
  math + term-sheet basics
- `HIRING_AND_EQUITY` — first 5 hires + equity bands + sourcing +
  screening rubrics

Each mode = one ~150-line KB + import in `kb-mode-loader.ts` + entry
in `APP_MODES`. **~4 hours total.**

### 🚧 Phase 3 — Decision log + artifact catalog

The interactive layer on top of Phase 1's data model:

- "Log decision" button in chat (extracts agent recommendation, lets
  user tag with category/reversibility/revisit timer)
- "Save as artifact" prompt on every export inside a project
- Project page shows artifacts with re-export and remix actions
- Revisit banners on first login each day for any decision whose
  `revisit_at` has passed

### 🚧 Phase 4 — Specialist modes

- `CUSTOMER_DISCOVERY` — Mom-test scripts, segmentation, exit criteria
- `LEGAL_AND_OPS` — entity choice, founder agreements, IP, compliance
- `PIVOT_OR_PERSEVERE` — pivot framework, sunk-cost detection, decision
  rubric

### 🚧 Phase 5 — Frameworks library

Standalone framework KBs at `kb/frameworks/*.md` with a "Run this
framework on my project's idea" quick action:

- Value Equation (Hormozi)
- ACP — Acquisition / Churn / Pricing (Isenberg)
- Value Matrix
- Value Ladder (Brunson)
- Dream 100
- Lean Canvas
- Jobs to Be Done
- North Star Metric framework

### 🚧 Phase 6 — Discovery enhancements

For the secondary use case (user without an idea):

- `IDEA_DATABASE` — browsable catalog with filter by score / tag /
  date, populated from saved IDEA_VALIDATION reports + bulk seed runs
- `IDEA_OF_THE_DAY` — daily curated banner on first login (or
  optional email)
- `AI_SUGGEST` — personalized recommendations based on user history /
  Founder Fit profile / saved decisions
- `AI_FOUNDER_FIT` — interactive assessment, persistent profile
- `MARKET_GAP` — gap-finding analysis layer on top of DEEP_RESEARCH

### 💭 Phase 7 — Optional ingestion

Lower priority for ≤5 user scale, but mapped if needed:

- Reddit listener (scheduled scrape of r/startups, r/SaaS, r/Entrepreneur
  → auto-extract idea candidates)
- Search-volume integration via paid API (DataForSEO / Ahrefs / SerpApi)
- Email digest of weekly trends + saved-idea progress
- Trends dashboard with charts

### 💭 Phase 8 — Multi-user collaboration (only if scale changes)

- Add Supabase Auth (replaces no-auth model)
- Flip RLS on, scope per `auth.uid()`
- Rotate anon key
- Project sharing across users
- Comment threads on decisions and artifacts
- Activity feed

This requires a fundamental trust-model shift (see SECURITY.md). Only
relevant if CockRoach goes from internal tool to multi-tenant product.

---

## 14 · Comparison: CockRoach vs. similar tools

| Tool | Strength | Where CockRoach differs |
|---|---|---|
| **Ideabrowser** | Curated idea catalog with structured scores; trend signals | CockRoach is operator-focused (post-idea-chosen primary, discovery secondary). Project spine + decision log + multi-format exports + mode-aware agent |
| **Generic ChatGPT / Claude** | Broad capability | CockRoach has opinionated personality, dedicated mode behaviors, real export craft (PPTX with charts, XLSX models), and persistent venture context |
| **Notion AI** | Flexible workspace + AI | CockRoach is purpose-built for the founder journey, not a generic doc tool. Specialist modes, brutal-honesty default, structured frameworks |
| **Lenny's Newsletter / Lenny's Bot** | Curated PM advice | Q&A-only; no exports, no project memory, no validation framework. CockRoach covers more of the journey end-to-end |
| **Specialist tools (Pitch, Plus AI, …)** | Best-in-class single-purpose | CockRoach is the connective tissue — produces the inputs those tools polish, plus the strategy layer they don't cover |

CockRoach's lane: **end-to-end founder co-pilot with persistent venture
memory and enterprise-grade output craft**, primary on execution and
secondary on discovery. No competitor occupies that exact slot.

---

## 15 · For developers

This document is the product narrative. For engineering details:

- **`README.md`** — setup, env vars, `npm` scripts
- **`ARCHITECTURE.md`** — every module, every API, every table, every
  hook, every component, with extension recipes for adding modes /
  formats / endpoints / auth
- **`SECURITY.md`** — trust model, key rotation playbooks, what
  changes if auth is added
- **`kb/base-prompt.md`** — the agent's top-level prompt
- **`kb/SKILLS.md`** — output craft rules (always-on)
- **`kb/foundation/KB_01..04.md`** — identity / framework / funding /
  format reference KBs
- **`kb/modes/*.md`** — per-mode behavior guides

To ship a new mode: write the KB → add an entry in
`src/lib/kb-mode-loader.ts` → add a tile in `APP_MODES` in `App.tsx`.
That's it — the system prompt builder picks it up automatically.

To ship a new framework KB: write `kb/frameworks/{NAME}.md` → add the
loader entry → add a "Run this framework" quick action in the chat UI.

To ship a new export format: implement `downloadXxx(content, filename)`
in `src/lib/file-export.ts` → append to `EXPORT_FORMATS` → the Document
Preview Panel picks it up automatically.

---

## 16 · The CockRoach promise

For founders who've ever stared at a blank Notion page wondering "where
do I even start?", CockRoach is the answer. For operators five months
into a venture asking "is this still working?", CockRoach is the
answer. For someone with a half-formed idea and no validation, CockRoach
is the answer.

It's not a chatbot. It's not a productivity tool. It's a co-founder
that:

- Has read every business book
- Has studied every market
- Knows every grant program
- Will never tell you what you want to hear if the truth is more useful
- Remembers every decision you've made since you started
- Produces deliverables you can hand to investors without rework
- Survives on truth and data, not vibes and validation

The startups that survive aren't unicorns — they're cockroaches.
**Resilient. Ugly. Unstoppable.**

CockRoach is the tool built for them.

---

*End of product documentation. For engineering internals see
`ARCHITECTURE.md`. For the trust model see `SECURITY.md`. For setup
see `README.md`.*
