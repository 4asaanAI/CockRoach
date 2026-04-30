# CockRoach — Live Project Context

> **Working file for the build team.** Updated continuously as work
> progresses. Read this first to know where the project stands.

**Last updated:** 2026-06-29

---

## 1 · Project & ownership

- **Product:** CockRoach — AI-powered entrepreneurial intelligence platform
- **Tagline:** "Not a unicorn. Better."
- **Parent company:** Layaa AI (CockRoach is to Layaa AI what ChatGPT is
  to OpenAI)
- **Vision:** End-to-end co-pilot for entrepreneurs covering idea
  discovery, validation, research, execution, fundraising, hiring, and
  ongoing decisions. Primary on execution, secondary on discovery.
- **Reference docs:**
  - `documentation.md` — full product vision and feature catalog
  - `ARCHITECTURE.md` — engineering internals
  - `SECURITY.md` — trust model + key rotation playbook
  - `README.md` — setup
  - `claude.md` — this file (project context, live)

---

## 2 · Team

| Role | Person | Responsibilities |
|---|---|---|
| Founder / Product | **Abhi** | Product direction, marketing, customer outreach, final calls |
| AI Engineer | Claude (this assistant) | Code drafts, specs, migrations, research, KB authoring, doc upkeep |

> Note: Shubham (tech lead) was on this project earlier but is now busy
> on other things. The build is currently a two-person effort: Abhi +
> Claude.

---

## 3 · Constraints (hard)

- **Budget:** $0 cash. $2000 in Azure startup credits (covers testing,
  prod inference until launch + early users)
- **Timeline:** target launch ~30 days from 2026-06-29 — **flexible**.
  Compress phases when work runs ahead; avoid idle time between phases.
  Sequencing (guidance, not calendar-gated):
  - Phase 0 (Day 0): Resolve git divergence
  - Phase 1 (Days 1–7): Product capability sprint
  - Phase 2 (Days 8–14): Test + bug fix
  - Phase 3 (Days 15–21): Auth + billing + email + marketing
  - Phase 4 (Days 22–28): Soft launch + iterate
  - Phase 5 (Days 29–35): Public launch (target ~end of July 2026)
- **No paid APIs in V1:** No Crunchbase, Ahrefs, SEMrush, Apollo, etc.
  Free sources only (Reddit JSON, ProductHunt RSS, public scrapes).
- **No SOC2 audit, no HIPAA, no GDPR full audit** at launch. Defer until
  post-revenue.

---

## 4 · Launch goal

A monetizable, self-serve SaaS at `cockroach.<domain>` (or whatever the
final domain is — see Open Questions §10).

**Free tier:** 5 chats/month, 1 active project, 1 idea-validation
report/month, 3 watermarked exports/month.

**Pro tier ($29/mo):** unlimited chat, up to 5 active projects, all 13
modes, unlimited exports unwatermarked, project memory + decision log
+ artifacts, brand kit, email support.

(Max / Team / Enterprise tiers come later — not in V1.)

**Marketing surface:** single landing page at root domain explaining
the product + a "Start free" CTA into the app.

---

## 5 · Build plan — day by day

### Phase 1: Build (Days 1–7, 2026-04-26 → 2026-05-02)

**Day 1 — TODAY (2026-04-26)**
- [ ] Resolve git divergence (15 remote commits vs our local commit) — BLOCKER for everything else
- [ ] Update `documentation.md` and `ARCHITECTURE.md` to reflect Layaa AI ownership + SaaS positioning
- [ ] Create this `claude.md` ✓
- [ ] Sketch Layaa AI brand identity (text logo + accent palette, can refine later)
- [ ] Open Stripe account (founder action)
- [ ] Open Resend account or AWS SES for transactional email (founder action)
- [ ] Decide final domain (founder action — see Open Questions §10)

**Day 2 (2026-04-27)**
- [ ] Replace no-auth UUID model with Supabase Auth (email/password + Google OAuth)
- [ ] Migrate `users.id` from `text` to `uuid` linked to `auth.users(id)`
- [ ] Backfill existing 4 profiles to Auth users (or fresh-start if data is throwaway)
- [ ] Enable RLS on every table; add per-user policies via `auth.uid()`
- [ ] Replace `GRANT ALL anon` with policy-driven access
- [ ] Rotate Supabase anon key (now actually meaningful)
- [ ] First-run flow: signup → email verify → onboarding tour

**Day 3 (2026-04-28)**
- [ ] Onboarding flow: 4-step (welcome → mode tour → "have an idea or want one?" → first chat)
- [ ] Founder Fit assessment (lightweight, persists as memory)
- [ ] Update `ProfileSelector` → become a real account-selector for orgs (deferred) / for now redirect to a single-account flow
- [ ] Introduce `org_id` table + plumbing (single-user-per-org for V1, ready for Team tier later)
- [ ] Account settings page (profile, password, sign out)

**Day 4 (2026-04-29)**
- [ ] Stripe integration: products, prices, checkout, customer portal
- [ ] Webhook handler for `customer.subscription.{created,updated,deleted}`
- [ ] `subscriptions` table on Supabase; tier resolution helper
- [ ] Free vs Pro tier feature gating in code (decorator pattern via `useTier()` hook)
- [ ] Quota enforcement on `/api/chat`: per-user counters, hard cap on free, soft on Pro

**Day 5 (2026-04-30)**
- [ ] Project spine migrations (Phase 1 from documentation.md):
  - extend `projects` table (stage, chosen_idea_id)
  - new `decisions` table
  - new `project_artifacts` table
  - add `project_id` FK to `chats` and `memory_items`
- [x] `useProjects` hook
- [ ] `/projects` list page (active-default view; stage filter chips; create modal; skeleton + empty state)
- [ ] Project detail page with 4 tabs: **Chats / Decisions / Artifacts / Inbox**
- [ ] **Decisions tab defaults to Reversibility Kanban** (Reversible / Expensive / One-way columns) — Notion launched this exact pattern Feb 2026; validates the Bezos schema design
- [ ] Decision form modal (category, question, decision, reversibility, optional pre_mortem + revisit_at)
- [ ] Inbox tab — actionable items: revisit-due / decay-near / pulse-overdue
- [ ] KPI strip on project detail from `health_score` jsonb
- [ ] **Project switcher in left sidebar** (Notion-style top-of-sidebar; higher discoverability than chat-header)
- [ ] "Start project from this chat" action
- [ ] Project-aware system prompt (latest 10 decisions + project description injected when active)
- [ ] Skeleton loaders (Linear/Stripe pattern) for list + detail tabs
- [ ] Empty states with action prompts (e.g., "Start your first project from a validation chat")

**Day 6 (2026-05-01)**
- [ ] Author 4 operator-mode KBs:
  - `kb/modes/PRICING.md`
  - `kb/modes/GO_TO_MARKET.md`
  - `kb/modes/FUNDRAISING.md`
  - `kb/modes/HIRING_AND_EQUITY.md`
- [ ] Wire into `kb-mode-loader.ts` + `APP_MODES`
- [ ] Mode reorder in nav: post-idea modes promoted; discovery modes in submenu
- [ ] Brand kit MVP: per-org logo upload + 1 accent color → applied to PPTX/PDF exports
- [ ] Watermark on free-tier exports

**Day 7 (2026-05-02)**
- [ ] Marketing landing page at root (chat moves to `/app`)
- [ ] Privacy policy + ToS (template-based via Termly or hand-written from a template)
- [ ] Cookie banner for EU visitors (if relevant)
- [ ] Sentry wired to logger
- [ ] PostHog wired for product analytics
- [ ] Cost-monitoring dashboard (LLM tokens per user, cumulative spend)
- [ ] Email templates: welcome, password reset, payment receipt, weekly digest stub
- [ ] Dry-run end-to-end: signup → onboarding → first project → chat → upgrade → export → cancel

### Phase 2: Test + bug fix (Days 8–14, 2026-05-03 → 2026-05-09)

- [ ] Internal team test (Abhishek, Shubham, the 4 default profiles as Layaa AI team accounts)
- [ ] Beta cohort (5–10 friends-and-family founders) with Pro access for free
- [ ] Daily bug bash → triage → fix → redeploy
- [ ] Cost monitoring: any user above expected token spend gets reviewed
- [ ] Onboarding refinement based on observed drop-off
- [ ] Mobile (PWA) sanity check on iOS Safari + Android Chrome
- [ ] Final security review: RLS policies tested for cross-user leakage, share tokens scoped correctly
- [ ] Performance: cold-start cost on Vercel functions, bundle size reduction (currently 3 MB / 920 KB gzip)

### Phase 3: Polish + soft launch (Days 15–25, 2026-05-10 → 2026-05-20)

- [ ] Open beta — invite list goes live (signup gated by waitlist or open)
- [ ] First 50 paying users
- [ ] Feedback loops: NPS pulse + in-app feedback widget
- [ ] Iterate on highest-friction points
- [ ] Marketing assets prep: ProductHunt page, HN launch text, demo video, screenshots, landing-page copy refinement, Twitter thread
- [ ] First weekly digest email goes out
- [ ] Affiliate / referral program scaffolding (deferred to post-launch if time-tight)

### Phase 4: Public launch (Days 26–35, 2026-05-21 → 2026-05-31)

- [ ] **Launch day = 2026-05-31** (or earlier if everything's green)
- [ ] ProductHunt + HN + Twitter coordinated launch
- [ ] Founder communities: Indie Hackers, IndiePass, r/Entrepreneur, r/SaaS
- [ ] Watch the support inbox + feedback channel for first 72 hours
- [ ] Hot-fix any issues
- [ ] Post-launch retrospective

---

## 6 · Current state snapshot (live)

**Build status:** ✓ typecheck clean · ✓ lint 0 errors (43 warnings, all `any` types, non-blocking)
**Deployed prod:** `cock-roach.vercel.app` (auto-deploys from `main`)
**Local + origin/main:** aligned at `aad125e` (docs: align documentation/architecture/claude.md for Layaa AI launch)
**Canonical remote:** `origin` → `https://github.com/layaaai222-art/CockRoach.git` (Layaa AI's repo)
**Backup remote:** `4asaan` → `https://github.com/4asaanAI/CockRoach.git` (preserved)

**Phase 0 (git divergence) → ✅ DONE.**
**Phase 1 Day 1 → ✅ DONE** (legacy deletes; documentation.md + ARCHITECTURE.md updates).
**Phase 1 Day 2 (Project spine — data layer) → ✅ DONE** 2026-04-30.
**Phase 1 Day 3 (Project spine — UI) → ✅ DONE** 2026-04-30 (same-day; we ran ahead).

**Day 2 progress (today, 2026-04-30):**
- ✅ Supabase MCP reconfigured to hosted HTTP + OAuth (project-scope `.mcp.json`).
- ✅ Migration `project_spine_full_schema` applied — extended `projects` (stage, chosen_idea_id, description, health_score, founder_fit_alignment, last_pulse_at) + new `decisions` / `project_artifacts` / `project_pulse_log` tables + nullable `project_id` FK on `chats` and `memory_items` + 9 indexes + unique pulse-per-week constraint + `updated_at` trigger.
- ✅ RLS disabled on the 4 project-spine tables for consistency with the no-auth model; `grant all` to anon+authenticated.
- ⏳ Local file work remaining → schema.sql / policies.sql updated · types.ts created · useProjects hook created · supabase.ts supports new publishable-key var name · `.env` + `.env.example` updated · docs being updated now.

**Backup branch:** `backup-c6a8a8f` (local, pre-merge commit; safe to delete).

**Open notes:**
- 1Password SSH-signing still failing on commits; using `commit.gpgsign=false` per-commit. Re-sign later when 1Password agent is reachable.
- Azure key was rotated 2026-04-30; new key in `.env` and Vercel.
- Supabase auth now via OAuth (hosted MCP at `https://mcp.supabase.com/mcp`); no PAT in chat history.

---

## 7 · Decisions made (with rationale)

- **No-auth model is acceptable for current 4–5 user state but MUST be replaced before public launch.** Phase 1 Day 2 is the auth migration.
- **Pro tier is the only paid tier at launch.** Max + Team + Enterprise come post-launch as we learn what users will pay extra for.
- **Free tier is generous (5 chats/month) by design** — needed for word-of-mouth growth; can tighten post-launch if costs run high.
- **Brutal Honesty stays as a per-user toggle, defaults to balanced.** Some users will love the personality, some will complain — toggle defuses both reactions.
- **No live data integrations at launch.** Crunchbase / Ahrefs / SEMrush / Apollo all $$$/month; out of $2000 budget. Use scrapers + free sources only.
- **No multi-user collab at launch.** Single-user-per-org for V1; org table is set up so Team tier can drop in later without schema rewrite.
- **PWA, not native apps, for V1 mobile reach.** Already comes for free with Vite.
- **Termly or template-based Privacy/ToS at launch.** Lawyer-reviewed comes when revenue justifies it.
- **Existing default profiles (DagnA / Subi / ManU / Gill Saab) become the Layaa AI team's free Pro accounts post-auth migration.**

---

## 8 · Open questions (need founder answers)

These block specific tasks. Asterisks mark blocking-Day-1.

1. *** Domain — `cockroach.ai`? `cockroach.app`? `cockroach.layaaai.com`? Subdomain split (marketing on root, app on `app.`)?
2. *** Merge — should I integrate the 15 remote commits into our local work? (Need permission to run `git merge`.) Or do you handle the merge yourself?
3. *** Stripe account — does Layaa AI already have one, or do you create one today?
4. *** Transactional email provider — Resend (cheaper, modern) or AWS SES (already-have-AWS scenarios)?
5. Logo — is there a Layaa AI / CockRoach logo asset, or do I generate a text-mark version for V1?
6. Beta cohort — do you have a friends-and-family list of 5–10 founders ready to test?
7. Existing 4 default profiles — keep their data after auth migration, or fresh-start everyone?
8. Are the avatar PNGs in `public/profiles/` final, or replace as part of brand refresh?
9. Pricing finalization — is `Free / Pro $29` the call, or do we want a different price point?
10. Launch list — who's our distribution channel on launch day? (Founder's network, ProductHunt, IndieHackers, paid ads?)
11. Azure credit timing — is the $2000 a one-time pool that expires, or refreshing? Affects how aggressive we can be in testing.

---

## 9 · Conventions & guardrails

- **Update protocol after every change** — claude reports: WHAT changed, HOW the platform changes, WHY beneficial, POINTERS to be aware of.
- **Update `documentation.md` and `ARCHITECTURE.md`** alongside any feature change so they don't drift.
- **Update this file** with a new entry under §11 every working session.
- **Never bypass git signing** without explicit one-time approval.
- **Never force-push** without explicit "force push, I authorize destruction" instruction.
- **Brutal Honesty rule:** if a planned feature is harmful or strictly worse than an alternative, claude must flag before silently building. Timeline impossibility is OUT-OF-SCOPE for flagging — that's been acknowledged.
- **Cost-watch rule:** before any change that increases per-user LLM spend (longer prompts, more tools, multi-turn agents), claude states the projected token-impact and asks for go-ahead.
- **Question-first rule:** when claude is unsure about product direction or scope, ASK before building.

---

## 10 · Cost tracking

| Date | Azure spend (cumulative) | Trigger | Notes |
|---|---|---|---|
| 2026-04-22 | ~$0 | Session work | Internal-only usage so far |
| ... | | | |

**Budget breakdown for 35 days:**
- Azure inference budget: ~$1500 (leaves $500 buffer for unexpected)
- Daily testing burn: target <$30/day during Phase 1–2; tighten if spiking
- Public-launch buffer: $300 set aside for first 1000 free users hitting the API

**Kill-switch policy:** if cumulative Azure spend exceeds $1700 before
launch, freeze all non-essential testing and shift to mock-mode for QA.

---

## 11 · Update log

### 2026-04-26 — Plan kickoff (initial draft)
- Created `claude.md` (this file).
- Outlined 35-day plan from build → test → soft launch → public launch.
- Defined V1 scope: auth + billing + project spine + 4 operator modes
  + brand transition + marketing site.
- Identified 11 open questions blocking specific tasks.

### 2026-06-29 — Plan revision (founder corrections)
- Date corrected to today (2026-06-29).
- **Auth + billing + email moved to the END** (Phase 3) — founder
  wants product capability built first since no users exist yet.
- **Address founder as "Abhi"**, not Abhishek (saved to memory).
- **Two-person team**: Shubham off the project; build is Abhi + Claude.
- **Timeline flexible** — compress when ahead; minimize idle time.
- **Small-task discipline** — break big asks into atomic steps,
  use `/batch` on independent sub-tasks to avoid hallucination drift.
- **Update protocol** locked in: every change-set gets a 4-line report
  (What / Changes / Why beneficial / Pointers).
- Plan approved + saved at `~/.claude/plans/compressed-conjuring-wilkes.md`.
- Next action: Phase 0 git divergence resolution.

### 2026-06-29 — Phase 0 + Day 1 execution
- **Phase 0 (git divergence) ✅ resolved.** Reset local to origin/main
  (which had been silently integrated by another contributor, likely
  Shubham before stepping off). Restored `documentation.md` (only
  missing piece). Pushed as commit `2f48765`.
- **Phase 1 Day 1 progress:**
  - Deleted 4 legacy files (COCKROACH_AGENT_SYSTEM_PROMPT.md,
    COCKROACH_MASTER_PROMPT.md, metadata.json, supabase_schema.sql)
    that the other contributor restored. Authorized by Abhi. Pushed
    as `dbaf983`. -1064 lines, build still clean.
  - Updated `documentation.md` to reflect Layaa AI ownership +
    SaaS-launch positioning + 2026-06-29 date.
  - Updated `ARCHITECTURE.md` for Layaa AI parent + SaaS staging
    note.
  - This `claude.md` §6 + §11 entry being added now.
- **Verified post-merge:** typecheck ✓ / lint 0 errors / npm audit 0.
- **Backup branch `backup-c6a8a8f`** still local; safe to delete
  whenever Abhi wants.
- Next: complete Day 1 by committing the doc updates, then start
  Day 2 (Project spine — data layer migrations).

### 2026-04-30 — Phase 1 Day 2: Project spine (data layer)
- **Strategy lock-in.** Researched ChatGPT Projects, Claude Projects, and
  Bezos's Type-1/Type-2 doors framework. Both competitors offer
  sandboxed memory + file uploads; neither has structured decision logs,
  reversibility classification, or weekly pulse summaries. CockRoach's
  2x lever is the persistent venture-context layer with:
  - Decision log with reversibility (`reversible | expensive | one_way`)
    + `reversibility_decay_at` (decisions become harder to reverse over
    time; surface this).
  - Decision dependency graph via `depends_on_decision_id`.
  - Decision reversal trail via `reversed_at` + `reversed_by_decision_id`.
  - `pre_mortem` field captured at decision time.
  - Weekly auto-generated `project_pulse_log` summarising the project's
    state — Claude's 24h synthesis, but founder-focused + persisted.
  - Versioned `project_artifacts` with `parent_artifact_id` lineage
    (ChatGPT/Claude can't show diff between Pitch Deck v2 and v3; we
    will).
  - Project `health_score` + `founder_fit_alignment` JSONB fields for
    composite metrics over time.
- **Supabase MCP swap.** Moved from npx stdio (PAT-based) to hosted
  HTTP MCP at `https://mcp.supabase.com/mcp` with OAuth flow. Cleaner
  auth model — no PAT in chat history, no rotation needed for the MCP.
  `.mcp.json` at project scope so future sessions inherit the setup.
- **Migration `project_spine_full_schema` applied.** Extended `projects`
  with 6 new columns + stage check constraint; created `decisions`
  (16 cols + 5 indexes + 3 check constraints), `project_artifacts`
  (versioning + 3 indexes + 3 check constraints), `project_pulse_log`
  (1 unique index for project+week dedup); added nullable `project_id`
  FK on `chats` and `memory_items`; created `set_updated_at_now()`
  trigger function and bound it to `project_artifacts`.
- **Read flag finding.** New tables defaulted to RLS-on (Supabase
  default). Disabled RLS on the 4 spine tables to match the rest of
  the no-auth-phase schema; `grant all` to anon + authenticated.
- **Local file work shipped:**
  - `supabase/schema.sql` — full idempotent schema with all spine
    tables and indexes.
  - `supabase/policies.sql` — grants + RLS-disable for the 4 new
    tables.
  - `src/lib/types.ts` — TypeScript types for Project, Decision,
    ProjectArtifact, ProjectPulseLog plus enum metadata
    (PROJECT_STAGES, DECISION_CATEGORIES, REVERSIBILITY_LEVELS,
    ARTIFACT_KINDS).
  - `src/hooks/useProjects.ts` — fetch/create/update/archive/remove
    + memoised `byId`.
  - `src/lib/supabase.ts` — supports both `VITE_SUPABASE_PUBLISHABLE_KEY`
    (preferred) and `VITE_SUPABASE_ANON_KEY` (legacy fallback).
  - `.env` updated with the new publishable key alongside the legacy
    JWT (gitignored).
  - `.env.example` updated to show new var as preferred.
- **Verified:** `npm run typecheck` passes; build pipeline clean.
- **Next:** Day 3 (Project spine — UI).
  - `/projects` list page + project detail page (4 tabs: Chats /
    Decisions / Artifacts / Reminders).
  - "Start project from this chat" action.
  - Project switcher in chat header.
  - Project-aware system prompt (latest 10 decisions + project
    description injected when active).
  - Mode reorder + Discovery submenu.

### 2026-04-30 — Phase 1 Day 3: Project spine (UI)
- **Research lock-in.** Investigated ChatGPT Projects, Claude Projects,
  Notion's new "Decision Tracker Kanban" template (Feb 2026), Linear,
  Vercel dashboard patterns, and 2026 SaaS UI trends. Two adoption
  decisions:
  - **Reversibility Kanban** as the default decisions view — Notion
    just shipped this exact pattern, validating Bezos's framework as
    a real UX primitive (not just a mental model).
  - **Project switcher in left sidebar (top, Notion workspace-pattern)**
    rather than chat header — higher discoverability per Notion's
    workspace-switcher design.
- **Shipped (3 commits, all today):**
  - **Batch A** (`7b412b1`): hooks + project list page.
    - `useDecisions(projectId)` — fetch + log + markRevisited + reverse
      (with full reversal trail). The `reverse()` helper inserts a
      replacement decision and stamps the original with `reversed_at`
      + `reversed_by_decision_id`, so no decision history is ever lost.
    - `useArtifacts(projectId)` — fetch + save + saveNewVersion
      (auto-bumps `version` and sets `parent_artifact_id`) + remove.
    - `usePulseLog(projectId)` — read-only fetcher; pulse generation
      is server-side later.
    - `useProjectInbox({ project, decisions, pulseLogs })` — pure
      derivation surfacing actionable items: revisit_due / decay_near /
      pulse_overdue / no_recent_activity. Sorted by severity → days
      overdue.
    - `ProjectsList` component with stage-color-coded cards, filter
      chips (Active / All / per-stage), skeleton loaders (Stripe
      pattern), empty state with action prompt.
    - `CreateProjectModal` with name + description + stage selector.
  - **Batch B** (`b1d29dd`): project detail page + 4 tabs +
    decision form modal.
    - `ProjectDetail` with header (rename in place, stage selector
      dropdown, archive button), KPI strip (Linear/Vercel pattern;
      tiles for Created / Last activity / Health / Pulse), 4 tabs.
    - `ChatsTab` — chats with this project's `project_id`; click
      switches to chat view with that chat active.
    - `DecisionsTab` — defaults to **Reversibility Kanban** with 3
      columns (Reversible / Expensive / One-way). Each column gets
      its own colored border and inline help (Bezos reasoning surfaced
      to the user). Card shows: category, question (truncated), decision
      (truncated), confidence, decided-at, plus indicator badges
      (Reversed strikethrough, Revisit due clock, Decay-near alert).
      Toggle to flat List view.
    - `DecisionFormModal` — category grid (11 categories), question +
      decision required textareas, **visual reversibility selector
      with inline Bezos help text** (educates users on the framework),
      confidence pills, optional rationale, collapsible advanced
      section with `pre_mortem` ("if wrong, what's the most likely
      failure mode?") and `revisit_at` date picker.
    - `ArtifactsTab` — kind-color-coded grid; follows
      `parent_artifact_id` chain to find the latest version of each
      artifact root; shows version count and exported_format badge.
    - `InboxTab` — surfaces useProjectInbox items with severity badges
      and original-decision context where applicable.
  - **Batch C** (this commit): sidebar project switcher + project-aware
    system prompt + chat→project linking.
    - `ProjectSwitcher` in left sidebar (top, between brand and
      "New Conversation"). Notion-style: shows current active project +
      caret; dropdown reveals up to 8 active projects + "Manage all
      projects" + "Create new project". Clear button (X) when active.
    - `formatProjectContext(project, decisions)` in `lib/project-context.ts`
      — formats project + latest 10 non-reversed decisions into a
      markdown block for system-prompt injection. Includes pre-mortems.
      Tells the agent: "If the user is about to contradict a recent
      one-way-door decision, flag it before answering."
    - `system-prompt-builder.ts` extended with optional `projectContext`
      param; emits `[PROJECT CONTEXT]…[/PROJECT CONTEXT]` block before
      memory context.
    - App.tsx wires it: useProjects + useDecisions scoped to
      activeProjectId, computes projectContext via useMemo, passes to
      every `buildSystemPrompt` call.
    - New chats inherit `activeProjectId` automatically when inserted.
- **Verified:** `npm run typecheck` passes through all 3 batches;
  `npm run lint` 0 errors (42 pre-existing `any` warnings).
- **Skipped for Day 3 (deferred):** "Anchor existing chat to project"
  pill in chat header (small UX polish; existing chats can be moved
  later); decision dependency graph viz (Day 5+); pulse widget
  visualization (Day 5/6 once first pulse logs exist); cross-project
  search (Day 5).
- **Next:** Day 4 (operator modes — PRICING, GO_TO_MARKET, FUNDRAISING,
  HIRING_AND_EQUITY) + mode reorder + Discovery submenu.

---

*This file is the source of truth for "where are we?" and "what's next?".
Read it before starting any session. Append to §11 after every working
session. Update §6 (state snapshot), §8 (open questions), and §10 (cost
tracking) as their status changes.*
