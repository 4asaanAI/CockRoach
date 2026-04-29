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
- [ ] `useProjects` hook
- [ ] `/projects` list page + project detail page (chats / decisions / artifacts tabs)
- [ ] "Start project from this chat" action
- [ ] Project-aware system prompt (latest decisions injected)

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
**Local + origin/main:** aligned at `dbaf983` (chore: remove legacy doc files)
**Recent commits today (2026-06-29):**
- `dbaf983` — chore: remove legacy doc files (COCKROACH_AGENT_SYSTEM_PROMPT, COCKROACH_MASTER_PROMPT, metadata.json, supabase_schema.sql)
- `2f48765` — docs: add canonical product doc + live project context (documentation.md + claude.md)
- `6b2c654` — (other contributor) Make entire app fully responsive for mobile

**Phase 0 (git divergence) → ✅ DONE.**
**Phase 1 Day 1 → IN PROGRESS** (legacy deletes ✓; documentation.md and ARCHITECTURE.md updates ✓; claude.md log entry ⏳).

**Backup branch:** `backup-c6a8a8f` (local, holds our pre-merge commit; can delete once we're confident).

**Open notes:**
- 1Password SSH-signing still failing on commits; using `commit.gpgsign=false` per-commit. Re-sign later when 1Password agent is reachable.
- Azure key revoked; the dead string remains in pre-`dbaf983` git history. GitHub secret-scan alert can be closed as "Revoked" anytime.

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

---

*This file is the source of truth for "where are we?" and "what's next?".
Read it before starting any session. Append to §11 after every working
session. Update §6 (state snapshot), §8 (open questions), and §10 (cost
tracking) as their status changes.*
