# COCKROACH — Entrepreneurial Idea Intelligence Platform
## Master Build Prompt v1.1 (Finalized)

---

## BRAND IDENTITY

**Name:** Cockroach
**Tagline:** "Not a unicorn. Better."
**Philosophy:** The startups that survive aren't unicorns, they're cockroaches. Resilient. Ugly. Unstoppable.
**Tone:** Dark humor meets brutal honesty meets startup intelligence. The UI should feel premium-dark, slightly irreverent, and deeply functional. Microcopy throughout the app should carry this personality — error messages, empty states, loading text, button labels.

---

## WHAT IS COCKROACH?

Cockroach is a full-stack, production-grade, AI-powered entrepreneurial intelligence web application built for a maximum of 2 users. Its sole purpose: help the user deeply brainstorm, research, validate, and roadmap startup ideas before committing time or money to them.

It is NOT a generic AI chatbot.
It IS a personal co-founder that:
- Researches markets, competitors, and clients in real-time using live web search
- Validates ideas with real data before a dollar is spent
- Surfaces non-obvious opportunities: government grants, incubator programs, SBA loans, and strategic loopholes — even tangentially related ones
- Recommends smart, legal bypasses and workarounds to maximize benefits with minimum friction (e.g., minority-owned business certifications, women-owned business programs, veteran entrepreneur benefits, state-specific economic development grants)
- Maps next steps in detail if the user decides to proceed with an idea
- Predicts feasibility, performance, and commercial logic of an idea
- Generates beautifully formatted, deeply researched reports matching the quality and depth of Gemini Deep Research
- Understands and analyzes any file type the user attaches
- Scrapes any URL the user provides for relevant data
- Remembers user preferences, decisions, and context across sessions

---

## CORE TECHNICAL REQUIREMENTS

### Frontend
- **Framework:** Next.js 14+ (App Router, TypeScript throughout)
- **Styling:** Tailwind CSS + shadcn/ui component library
- **State Management:** Zustand
- **File Rendering:**
  - PDF: react-pdf
  - DOCX: Mammoth.js
  - XLSX/XLS: SheetJS
  - Markdown: react-markdown + remark-gfm
  - PPTX: render slides as images
  - Audio: native HTML5 audio player
  - Video: native HTML5 video player
- **Code Highlighting:** Shiki or Prism.js
- **Charts/Data Visualization:** Recharts
- **Icons:** Lucide React
- **Notifications:** sonner (toast library)

### Backend
- **Runtime:** Node.js via Next.js API Routes (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **File Storage:** Local filesystem (structured uploads directory), architected to be swappable to S3-compatible storage later
- **Authentication:** NextAuth.js — credentials provider only (username + password, no email verification, no OAuth, max 2 user accounts)
- **Background Jobs:** node-cron for scheduled memory synthesis
- **Web Scraping:** Puppeteer + Cheerio for general URLs
- **Video Download:** yt-dlp (via child_process) for YouTube and other video platforms — download to server, then serve to user via streaming
- **Search:** Tavily API (primary) with SerpAPI as fallback for real-time web search during research

### Security
- All API keys encrypted at rest using AES-256
- API keys NEVER exposed to frontend — all LLM calls go through backend API routes only
- Passwords hashed with bcrypt
- Session-based auth via NextAuth

---

## AI LAYER — CRITICAL ARCHITECTURE REQUIREMENT

### Provider-Agnostic Design
The platform must be 100% LLM-provider agnostic. No provider name, model name, or API key must ever be hardcoded anywhere in the codebase. All LLM configuration is:
- Stored encrypted in the database per user
- Fully configurable through the Settings UI at runtime
- Switchable mid-session without any code changes or restarts

### Supported LLM Providers
All of the following must be implemented and selectable:

1. **OpenAI** — gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo, o1, o1-mini, o3-mini
2. **Google Gemini** — gemini-2.0-flash, gemini-2.0-pro, gemini-1.5-pro, gemini-1.5-flash
3. **Anthropic** — claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022, claude-3-opus-20240229
4. **Mistral** — mistral-large-latest, mistral-medium-latest, mistral-small-latest
5. **Groq** — llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768, gemma2-9b-it
6. **Cohere** — command-r-plus, command-r
7. **Perplexity** — sonar-pro, sonar (best for research tasks due to built-in web search)
8. **Ollama** — any locally running model, configured via custom base URL

### LLM Abstraction Layer
Build a unified `LLMClient` service class that:
- Accepts `{ provider, model, apiKey, baseURL, settings }` as configuration
- Exposes a single `chat(messages, options)` async method
- Exposes a `stream(messages, options)` method returning an async iterator
- Handles tool/function calling uniformly across all providers
- Normalizes response format across all providers into a standard shape
- Gracefully handles model unavailability with clear error messages
- Tracks and logs token usage per message and per conversation
- Supports different models for different task types (see Settings section)

---

## APPLICATION STRUCTURE

### Routes
```
/                          → Login page
/chat                      → Main chat interface (default after login)
/chat/[id]                 → Specific conversation
/projects                  → Projects dashboard
/projects/[id]             → Active project workspace
/projects/[id]/chat/[id]   → Project-scoped conversation
/research                  → Standalone research + report generation
/files                     → Global file manager
/settings                  → Settings root
/settings/llm              → LLM provider + model configuration
/settings/keys             → API key management
/settings/memory           → Memory system configuration
/settings/appearance       → UI preferences
```

### Core Layout (persistent across all routes)
```
┌─────────────────────────────────────────────────────┐
│  LEFT SIDEBAR (collapsible, 260px)                  │
│  ├── Cockroach logo + tagline                       │
│  ├── [Cmd+K] Universal Search Bar                   │
│  ├── [+ New Chat] button                            │
│  ├── PINNED chats section                           │
│  ├── RECENT chats list                              │
│  │     each item: rename / delete / pin options     │
│  ├── PROJECTS section                               │
│  │     each project: name + last modified           │
│  └── Bottom: Settings icon + User avatar            │
├─────────────────────────────────────────────────────┤
│  MAIN CONTENT AREA (flex-1)                         │
│  Context-aware: Chat / Project / Research / Files   │
├─────────────────────────────────────────────────────┤
│  RIGHT SIDEBAR (collapsible, contextual, 280px)     │
│  ├── Memory context panel                           │
│  ├── Attached files panel                           │
│  ├── Research sources panel                         │
│  └── Session summary                               │
└─────────────────────────────────────────────────────┘
```

---

## CHAT INTERFACE — DETAILED REQUIREMENTS

### Message Input Area
- Multi-line textarea with auto-resize (min 1 row, max 6 rows)
- File attachment button — supports:
  `.pdf, .docx, .xlsx, .xls, .pptx, .ppt, .md, .txt, .csv, .png, .jpg, .jpeg, .heic, .webp, .mp3, .mp4, .mov, .avi, .wav`
- Each attached file shows before sending:
  - File type icon + file name + file size
  - **Preview button** — renders the file inline in an overlay before sending
  - **Metadata panel** — shows relevant metadata (image: dimensions/format, video: duration/resolution, doc: word count/pages, audio: duration/bitrate)
  - Remove (×) button
- URL auto-detection: if user pastes a URL in the input, show a highlighted chip offering to scrape it
- Model selector: small dropdown showing `[Provider] / [Model]` — clicking opens full model switcher
- Send button + `Cmd/Ctrl+Enter` keyboard shortcut
- Character/token counter (approximate)

### Message Display
- **User messages:** right-aligned, subtle background, rounded
- **AI messages:** left-aligned, full-width, clean markdown rendering
- Full markdown support: H1-H6, tables, code blocks, lists, bold, italic, blockquotes, horizontal rules, inline code
- Code blocks: syntax highlighted (Shiki) + copy button + language label
- Tables: clean styling, horizontally scrollable on mobile
- Copy button on every AI message
- Regenerate button on last AI message
- Edit button on user messages (re-runs conversation from that point)
- Timestamp visible on hover
- Token count visible on hover (per message)
- Streaming: text appears token by token with a subtle cursor

### File Understanding in Chat
The AI must genuinely read and analyze all attached content — not just acknowledge its existence.
- **Images:** render inline, pass to vision-capable model
- **PDFs:** extract text + render with react-pdf inline viewer
- **DOCX:** convert via Mammoth.js, render as formatted text, pass content to AI
- **XLSX/XLS:** parse with SheetJS, render as interactive table, pass data to AI
- **PPTX:** extract text from slides + render slide thumbnails
- **MP3/WAV:** render HTML5 audio player, transcribe via Whisper API if available
- **MP4/MOV/AVI:** render HTML5 video player, extract transcript or use vision frames
- **CSV:** parse and render as table, pass data to AI
- **MD/TXT:** render formatted, pass content to AI

### URL Scraping in Chat
- When a URL is submitted (pasted or as a chip):
  - Scrape full page content via Puppeteer
  - Extract: title, main text content, metadata, all links, images
  - Store scraped content in `url_cache` table (TTL: 24 hours)
  - Show user a summary card of what was scraped
  - Full scraped content injected into AI context
- **YouTube / Video Platform URLs specifically:**
  - Extract video title, description, metadata, channel info
  - Extract transcript if available (YouTube Data API or yt-dlp)
  - If no transcript: extract keyframes and pass to vision model
  - Show video metadata card in chat
  - Offer **Download Video** button → triggers yt-dlp on server → downloads to `/uploads/videos/` → streams file to user browser
  - Support: YouTube, Vimeo, Twitter/X, Instagram (best effort)

### Chat History Management
- Every conversation auto-saved with auto-generated title (from first message)
- User can rename: double-click title or right-click → rename
- User can delete: right-click → delete (confirmation modal)
- User can pin: right-click → pin (appears in PINNED section)
- User can star/favorite conversations
- Conversations grouped by: Today, Yesterday, Last 7 days, Last 30 days, Older

---

## IDEA INTELLIGENCE REPORT — CORE FEATURE

When a user describes a startup idea in chat, Cockroach detects it and shows a prompt:
> **"This looks like a startup idea. Want me to run a full Cockroach Analysis on it?"**
> [Run Full Analysis] [Just Chat About It]

If user clicks **Run Full Analysis**, generate a comprehensive report with the following sections. The report must be Gemini Deep Research quality — detailed, data-backed, well-cited, beautifully formatted.

### Report Sections

**1. Idea Clarity & Score**
- Restate the idea in one crisp paragraph
- Clarity Score (0-100), Uniqueness Score (0-100), Timing Score (0-100)
- One-line brutal honest verdict (with Cockroach personality)

**2. Market Analysis**
- TAM / SAM / SOM with methodology explained
- Market growth rate + CAGR
- Key market trends (with sources)
- Geographic scope: **USA by default**; user can specify any other country, state, or region for localized analysis — if specified, that location takes priority
- Market timing: is now a good time? Why?

**3. Competitor Landscape**
- Direct competitors table: Name | Funding | Founded | USP | Key Weakness
- Indirect competitors
- Market gaps and white spaces
- Differentiation opportunities for this idea

**4. Target Customer Analysis**
- Primary and secondary customer personas
- Core pain points being solved
- Willingness to pay signals
- Best customer acquisition channels with estimated CAC

**5. Revenue Model Options**
- 3-5 viable revenue models with pros/cons for each
- Recommended pricing strategy
- Unit economics estimate (LTV, CAC, payback period)
- Realistic path to first $1,000 in revenue (and $10,000 milestone)

**6. Risk Assessment**
- Top 5 critical risks, each scored on Probability (H/M/L) × Impact (H/M/L)
- Regulatory and legal risks (USA federal + state-specific by default; adjusts to user's specified location)
- Technology risks
- Market risks
- Mitigation strategy for each risk

**7. Feasibility Scores**
- Technical Feasibility: 0-100
- Financial Feasibility: 0-100
- Market Feasibility: 0-100
- **Overall Cockroach Score: 0-100**
- Final Verdict displayed as one of three states:
  - 🪲 **KILL IT** — Here's why this idea should die
  - 🔄 **PIVOT IT** — The core is good, here's what to change
  - 🚀 **BUILD IT** — Green light, here's how to start

**8. Funding, Grants & Smart Moves**
This section is a key differentiator. Research and surface every relevant opportunity for the user's idea, defaulting to USA-based programs. If the user specifies a different country or state, adjust all recommendations accordingly.

**USA Federal Programs (default):**
- SBA loans: 7(a), 504, Microloan programs
- SBIR / STTR grants (if idea is tech or research-adjacent)
- USDA Rural Development grants (if applicable)
- DOE, NIH, NSF grant programs (if applicable)
- IRS Section 1202 QSBS — up to 100% capital gains exclusion for qualifying startup stock

**USA State-Level Programs (based on user's state if specified):**
- State economic development grants
- State-specific angel investor tax credit programs
- Enterprise zones and opportunity zone benefits
- State university incubator and accelerator programs

**Private Programs:**
- Top accelerators currently accepting applications (YC, Techstars, a16z START, etc.)
- Relevant vertical-specific accelerators
- Angel networks and syndicates relevant to this idea
- Crowdfunding platforms most suited to this idea (Kickstarter, Republic, Wefunder, etc.)

**Certification-Based Advantages — Smart Moves:**
Research and recommend strategic, legal advantages the user may qualify for:
- **Minority-Owned Business (MBE):** Access to MBDA programs, corporate supplier diversity pipelines, set-aside contracts
- **Women-Owned Small Business (WOSB):** Federal contracting set-asides, SBA WOSB program, grants worth up to $500K+
- **Veteran-Owned Business (VOSB/SDVOSB):** VA contracting preferences, Boots to Business program
- **HUBZone Certification:** 10% price preference on federal contracts if operating in historically underutilized zones
- **B Corp Certification:** Access to impact investor networks and ESG-focused capital
- **Disadvantaged Business Enterprise (DBE):** DOT contracting opportunities
- Creative structural moves: e.g., "If you have a qualifying co-founder, WOSB certification opens federal contract set-asides that are legally ring-fenced from larger competitors — a moat most founders ignore entirely"

Each program listed as: Name | Benefit | Eligibility | How to Apply | Link

**9. Next Steps Roadmap**
- 30-day action plan (specific, numbered tasks)
- 90-day milestone map
- What you need to get started: team roles, tech stack, capital requirement, time commitment
- Build vs. Buy vs. Partner decision for each component
- MVP definition: exactly what to build first, what to leave out

**10. Sources & Research Trail**
- All data points cited with source name + URL
- Data freshness indicator per source
- Confidence level per major claim (High / Medium / Low)
- Total sources used count

### Report Output Options
- Rendered beautifully inline in chat
- Export as: PDF | DOCX | Markdown
- Save to current Project
- Share via unique read-only link (optional)

---

## UNIVERSAL SEARCH

- Triggered by: Cmd/Ctrl+K or clicking search bar in sidebar
- Searches across: all conversations, all projects, all files, all reports, all memory items
- Full-text search with relevance ranking
- Filter by: date range, project, content type (chat / file / report / memory)
- Results show: source type icon + title + context snippet with match highlighted
- Click result → jumps directly to that message or file
- Keyboard navigable (arrow keys + enter)

---

## PROJECTS SYSTEM

### Projects Dashboard (/projects)
- Grid of project cards showing: name, description, last modified, conversation count, file count
- [+ New Project] button
- Each card: Open | Settings | Archive | Delete

### Active Project Workspace (/projects/[id])
- Project header: name, description, path, status, memory confidence score
- Left panel: file tree of project files
- Center: project-scoped chat interface (memory auto-loaded)
- Right panel: memory context summary + session info
- Project-specific chat history (isolated from global chats)
- Project settings: name, description, tags, constraints, tech stack, team members

---

## SETTINGS — LLM CONFIGURATION UI (/settings/llm)

### Provider Cards
- Visual card grid, one per provider, showing provider logo + name
- Each card: active/inactive toggle, connection status indicator
- Click card to expand configuration

### Per-Provider Configuration (expanded)
- API Key: masked input with show/hide toggle
- Base URL override: for Ollama and custom OpenAI-compatible endpoints
- Default model: searchable dropdown showing all available models for that provider
- [Test Connection] button: sends minimal API call and shows latency + success/failure
- Token usage tracker: total tokens used this month + estimated USD cost

### Model Catalog
Each provider shows full model list with:
- Model name + version
- Context window size
- Strengths (tags: Research / Coding / Speed / Cost-Efficient / Vision / Long-context)
- Approximate cost per 1M tokens (input + output)

### Task-Specific Model Assignment
User can assign different models to different task types:
- **Default Chat:** general conversations
- **Deep Research:** idea analysis reports (use most capable model)
- **File Understanding:** processing attached documents (use vision-capable model)
- **Quick Response:** fast replies, summaries (use fastest/cheapest model)
- **Memory Synthesis:** background summarization jobs

### Global AI Settings
- Temperature: slider 0.0 to 2.0 (default: 0.7)
- Max tokens per response: slider (default: 4096)
- Custom system prompt: textarea (prepended to all conversations)
- Response language preference: English (American) by default; user can set any preferred language
- Streaming: on/off toggle (default: on)
- Show token counts in UI: on/off toggle

---

## LANGUAGE & PERSONALITY

### Response Language
- Default: English (American)
- The AI should naturally understand and respond to any language the user writes in
- User can write in any language — AI matches naturally
- Formal reports (Idea Intelligence Reports) always in English regardless of chat language
- Language preference is configurable in Settings

### App Microcopy (Cockroach personality throughout)
Loading states:
- "Crawling through the internet like the cockroach we are..."
- "Asking the AI so you don't have to embarrass yourself..."
- "Researching competitors who probably have more funding than you..."
- "Surviving nuclear-level data processing..."
- "Finding grants the government hoped you wouldn't notice..."

Empty states:
- No chats: "No ideas yet. That's either zen or terrifying."
- No projects: "Your graveyard is empty. For now."
- No files: "Nothing attached. Bold move."
- Search no results: "Nothing found. Even cockroaches have limits."

Error states:
- API key invalid: "Your API key is dead. Like most startup ideas."
- Rate limit: "Slow down. Even cockroaches need to breathe."
- Upload failed: "That file didn't survive. Survival of the fittest."

---

## THEME & UI DESIGN

### Theme
- **Dark mode only** (no light mode toggle needed)
- **Color Palette:**
  - Page background: `#0a0a0a`
  - Surface / card: `#111111`
  - Elevated surface: `#1a1a1a`
  - Border: `#2a2a2a`
  - Accent / primary: `#d4ff00` (acid yellow-green)
  - Accent hover: `#bfe000`
  - Text primary: `#ffffff`
  - Text secondary: `#a0a0a0`
  - Text muted: `#555555`
  - Success: `#00ff88`
  - Danger: `#ff4444`
  - Warning: `#ffaa00`
- **Typography:** Geist (preferred) or Inter — import from Google Fonts
- **Border radius:** 6px standard, 10px for cards, 999px for pills/badges
- **Shadows:** subtle dark shadows only — no bright glows except on accent elements
- **Animations:** 150-200ms transitions, ease-out — purposeful, not decorative

### Component Personality
- Buttons: sharp, confident — primary uses accent color `#d4ff00` with black text
- Sidebar: near-black background, subtle hover states
- Chat bubbles: minimal, clean — no heavy borders
- Code blocks: distinct dark surface with subtle border
- Report cards: clean sections with left accent border in `#d4ff00`
- Score indicators: circular progress or bar in accent color
- Verdict badges: colored pill — red for KILL IT, yellow for PIVOT IT, green for BUILD IT

---

## DATABASE SCHEMA

```sql
-- Users (max 2)
users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
)

-- Conversations
conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id) NULL,
  title TEXT,
  pinned BOOLEAN DEFAULT false,
  starred BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Messages
messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  role VARCHAR(20) NOT NULL, -- user | assistant | system
  content TEXT NOT NULL,
  metadata JSONB, -- file refs, sources, tool calls
  tokens_used INTEGER,
  provider VARCHAR(50),
  model VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
)

-- Projects
projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  config JSONB, -- tech stack, constraints, team, stage
  status VARCHAR(20) DEFAULT 'active',
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Files
files (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  conversation_id UUID REFERENCES conversations(id) NULL,
  project_id UUID REFERENCES projects(id) NULL,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  filetype VARCHAR(50),
  filesize INTEGER,
  metadata JSONB,
  extracted_content TEXT, -- for AI context
  created_at TIMESTAMP DEFAULT NOW()
)

-- Memory Items
memory_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id) NULL,
  type VARCHAR(50), -- preference | decision | constraint | context
  content TEXT NOT NULL,
  confidence FLOAT DEFAULT 0.8,
  evidence_count INTEGER DEFAULT 1,
  scope VARCHAR(50) DEFAULT 'global',
  last_updated TIMESTAMP DEFAULT NOW()
)

-- LLM Configurations
llm_configs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  api_key_encrypted TEXT,
  base_url TEXT,
  is_default BOOLEAN DEFAULT false,
  task_type VARCHAR(50), -- chat | research | files | quick | memory
  settings JSONB, -- temperature, max_tokens, etc.
  created_at TIMESTAMP DEFAULT NOW()
)

-- Research Reports
research_reports (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id) NULL,
  conversation_id UUID REFERENCES conversations(id) NULL,
  title TEXT NOT NULL,
  content JSONB, -- structured report sections
  sources JSONB,
  cockroach_score INTEGER,
  verdict VARCHAR(20), -- kill | pivot | build
  created_at TIMESTAMP DEFAULT NOW()
)

-- URL Cache
url_cache (
  id UUID PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  scraped_content TEXT,
  metadata JSONB,
  scraped_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
)
```

---

## NON-FUNCTIONAL REQUIREMENTS

- TypeScript throughout — no `any` types
- Full error boundaries on all major components
- Loading skeletons for all async data
- Toast notifications (sonner) for all user actions
- Keyboard shortcuts: Cmd+K (search), Cmd+Enter (send), Cmd+N (new chat)
- Auto-save conversations every 30 seconds
- Offline detection with graceful degradation message
- Mobile responsive — usable on phone (single column layout)
- PWA manifest (installable to home screen)
- All API keys AES-256 encrypted before storing in DB
- Rate limiting on API routes (express-rate-limit or similar)
- Request logging for debugging
- Graceful handling of LLM provider downtime

---

## BUILD PRIORITY ORDER

Build in this exact sequence — each phase must be complete before starting the next:

**Phase 1 — Foundation**
1. Next.js 14 project scaffold with TypeScript + Tailwind + shadcn/ui
2. PostgreSQL + Prisma setup with full schema migration
3. NextAuth.js credentials authentication (login/logout, session)
4. Core layout: sidebar + main area + right panel shell
5. Dark theme configuration with Cockroach color palette

**Phase 2 — AI Core**
6. LLM abstraction layer (LLMClient class — all 8 providers)
7. Settings > LLM UI — provider cards, API key management, model selector
8. Test connection functionality per provider

**Phase 3 — Chat**
9. Core chat interface with streaming AI responses
10. Chat history: create, rename, delete, pin, star
11. Markdown rendering + code highlighting in messages
12. Model switcher in chat input

**Phase 4 — Files & URLs**
13. File upload system (all supported types)
14. File preview modal with metadata
15. File content extraction for AI context
16. URL scraping (Puppeteer + Cheerio)
17. YouTube download (yt-dlp integration)

**Phase 5 — Intelligence**
18. Idea detection in chat + analysis trigger prompt
19. Idea Intelligence Report generation (all 10 sections)
20. Report rendering inline + export (PDF/DOCX/MD)
21. Universal search (Cmd+K)

**Phase 6 — Projects**
22. Projects dashboard + creation flow
23. Project workspace with scoped chat
24. Project settings panel

**Phase 7 — Memory & Advanced**
25. Memory system (auto-summarization + injection)
26. Local folder integration
27. Connectors + Plugins + Skills architecture
28. Auto-synthesis scheduler (node-cron)

---

## IMPORTANT RULES FOR CODE GENERATION

1. Write complete, production-ready code — zero placeholders, zero TODOs
2. Every component fully implemented with real logic — no mock data in final output
3. TypeScript strict mode — no `any` types
4. The LLM provider must NEVER be hardcoded anywhere
5. API keys must NEVER appear in frontend code or be logged anywhere
6. All LLM calls go through `/api/` backend routes only
7. Follow Next.js 14 App Router conventions strictly
8. Use server components where possible, client components only where interactivity requires it
9. Every page and component needs proper loading, error, and empty states
10. All database queries go through Prisma — no raw SQL except for migrations
```
