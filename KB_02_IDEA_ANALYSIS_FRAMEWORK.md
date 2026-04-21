# KB-02: Idea Analysis Framework & Scoring Logic
### Knowledge Base for Cockroach Agent | Azure AI Foundry

---

## 1. OVERVIEW

This KB defines the complete framework Cockroach uses to analyze startup ideas. Every Idea Intelligence Report must follow this structure exactly — in this order, with this depth, at this quality bar.

The standard is Gemini Deep Research quality: data-backed, well-cited, comprehensively structured, and genuinely useful to someone making a real business decision.

**Report trigger:** User clicks "Run Full Analysis" after Cockroach surfaces the analysis offer.
**Estimated generation time to set expectations:** "This takes a few minutes — I'm doing real research, not guessing."
**Output:** Rendered inline in chat + exportable as PDF / DOCX / Markdown.

---

## 2. PRE-ANALYSIS CHECKLIST

Before generating the report, Cockroach must gather or infer:

| Required Input | How to Get It |
|---|---|
| Idea description | From conversation — ask for clarification if too vague |
| Target market / customer | From conversation or ask: "Who specifically is this for?" |
| Geographic focus | Default USA; ask if unclear or if user has specified elsewhere |
| Stage of thinking | Is this day-1 ideation or do they have traction? Affects depth of roadmap |

If the idea description is too vague to analyze (e.g., "an app for people"), ask one clarifying question before proceeding: *"Before I dig in — who specifically has this problem, and what's the core thing your solution does for them?"*

---

## 3. REPORT STRUCTURE — ALL 10 SECTIONS

### SECTION 1: Idea Clarity & Initial Scores

**Purpose:** Restate the idea clearly, score its raw quality before research.

**What to produce:**
- One crisp paragraph restating the idea in Cockroach's own words — this confirms understanding and removes ambiguity
- Three scores, each 0–100 with a one-line rationale:
  - **Clarity Score:** How well-defined is the problem + solution + customer?
  - **Uniqueness Score:** How differentiated is this from existing solutions?
  - **Timing Score:** Is the market ready for this now? Is it too early or too late?
- One-line brutal honest verdict in Cockroach voice

**Scoring rubric:**
| Dimension | 0-40 | 41-70 | 71-100 |
|---|---|---|---|
| Clarity | Vague problem, undefined customer | Clear problem, fuzzy customer or solution | Sharp problem, defined customer, clear solution |
| Uniqueness | Direct clone of existing product | Meaningful differentiation in one area | Genuinely novel approach or untapped angle |
| Timing | Too early (market doesn't exist) or too late (market saturated) | Market emerging or growing | Perfect window — demand exists, competition not yet dominant |

---

### SECTION 2: Market Analysis

**Purpose:** Define the real market opportunity with data.

**What to produce:**
- **TAM** (Total Addressable Market): the full global or national market for this category
- **SAM** (Serviceable Addressable Market): the portion realistically reachable given the model and geography
- **SOM** (Serviceable Obtainable Market): realistic capture in years 1-3
- Methodology note: briefly explain how each figure was derived (bottom-up preferred over top-down)
- Market growth rate + CAGR with source
- 3-5 key market trends shaping this space right now (cited, dated)
- Geographic focus: USA by default; recalibrate if user specified a different location
- Market timing verdict: is now the right time? What's driving or blocking adoption?

**Data requirements:** All TAM/SAM/SOM figures must be sourced. If no direct source exists, use adjacent market data and flag as estimate.

**Format:** Narrative paragraphs for context + a summary table:
```
| Metric | Value | Source |
|--------|-------|--------|
| TAM    | $X.XB | [Source, Year] |
| SAM    | $X.XB | Derived from TAM × [logic] |
| SOM    | $X.XM | Based on [assumptions] |
| CAGR   | X%    | [Source, Year] |
```

---

### SECTION 3: Competitor Landscape

**Purpose:** Map who already exists and what the real competitive dynamics are.

**What to produce:**
- **Direct Competitors Table** (minimum 3, maximum 8):

```
| Company | Founded | Funding | Valuation | USP | Key Weakness |
|---------|---------|---------|-----------|-----|--------------|
```

- **Indirect Competitors:** solutions users currently use to solve this problem (even if not direct competitors)
- **Market Gaps:** specific unmet needs none of the competitors address well
- **Differentiation Opportunities:** 2-3 concrete angles this idea could use to stand apart
- **Competitive Moat Assessment:** what would prevent competitors from copying this idea in 6 months?

**Research requirement:** All competitor data must be searched and cited. Funding figures from Crunchbase, PitchBook, or press releases. Do not estimate funding from memory.

---

### SECTION 4: Target Customer Analysis

**Purpose:** Define exactly who will pay for this and why.

**What to produce:**
- **Primary Persona** (the person most likely to pay first):
  - Demographics: age range, role/occupation, income level
  - Psychographics: what they care about, what frustrates them
  - Current behavior: how they solve this problem today
  - Willingness to pay: what they currently spend on adjacent solutions
  - Where to find them: specific channels, communities, platforms

- **Secondary Persona** (if applicable): same structure, abbreviated

- **Pain Point Validation:** evidence that this problem is real and painful — search for forum posts, Reddit threads, existing customer reviews of competitor products, job postings, survey data

- **Customer Acquisition Channels:** top 3 channels ranked by estimated cost and fit, with rough CAC estimates

---

### SECTION 5: Revenue Model Options

**Purpose:** Define how this idea makes money — realistically.

**What to produce:**
- **3–5 viable revenue models** for this idea, each with:
  - Model name (SaaS, marketplace, transactional, freemium, etc.)
  - How it works in context of this specific idea
  - Pros and cons
  - Realistic price points based on comparable products
  - Who pays (B2B vs B2C vs B2B2C)

- **Recommended Model:** pick the strongest one and explain why

- **Unit Economics Estimate** for recommended model:
  - Estimated LTV (Lifetime Value)
  - Estimated CAC (Customer Acquisition Cost)
  - LTV:CAC ratio
  - Payback period

- **Path to First $1,000 in Revenue:** specific, actionable steps — not theoretical
- **Path to $10,000 MRR:** milestone map

---

### SECTION 6: Risk Assessment

**Purpose:** Surface the threats before they become surprises.

**What to produce:**
- **Top 5 Critical Risks**, each with:
  - Risk description (specific, not generic)
  - Probability: High / Medium / Low
  - Impact if it materializes: High / Medium / Low
  - Risk Score: Probability × Impact matrix
  - Mitigation strategy: specific, actionable

**Required risk categories to cover** (select the 5 most relevant):
- Market risk (demand doesn't materialize, market shifts)
- Competitive risk (existing player copies or acquires)
- Regulatory/legal risk (USA federal + state-specific by default)
- Technology risk (key tech doesn't work, dependency risk)
- Financial risk (runway, unit economics don't work)
- Execution risk (team gaps, timing)
- Customer adoption risk (behavior change required)

**Format:**
```
| Risk | Probability | Impact | Score | Mitigation |
|------|-------------|--------|-------|------------|
```

---

### SECTION 7: Feasibility Scores & Final Verdict

**Purpose:** Synthesize all research into a clear, honest overall assessment.

**Scores (each 0–100):**

**Technical Feasibility**
- Can this be built with available technology?
- What's the hardest technical problem to solve?
- What existing tools/APIs/infrastructure reduce build complexity?

**Financial Feasibility**
- Is this fundable or bootstrappable?
- Do the unit economics make sense?
- What's the minimum capital needed to reach profitability?

**Market Feasibility**
- Is there enough demand to build a real business?
- Is the market accessible given the team's likely resources?
- Is the timing right?

**Overall Cockroach Score**
Weighted average: Market Feasibility (40%) + Financial Feasibility (35%) + Technical Feasibility (25%)

**Display format:**
```
Technical Feasibility:  ████████░░  78/100
Financial Feasibility:  ██████░░░░  61/100
Market Feasibility:     █████████░  87/100
─────────────────────────────────────────
Overall Cockroach Score: ███████░░░  74/100
```

**Final Verdict — one of three, displayed prominently:**

> 🪲 **KILL IT**
> [2-3 sentence explanation of why — specific, not generic]

> 🔄 **PIVOT IT**
> [2-3 sentences on what the core valuable thing is + what specifically needs to change]

> 🚀 **BUILD IT**
> [2-3 sentences on why this clears the bar + what the single most important first move is]

---

### SECTION 8: Funding, Grants & Smart Moves

**Purpose:** Surface every relevant funding opportunity and strategic advantage the user may not know about. This is a key differentiator — most tools don't do this.

**Default geography: USA.** Recalibrate entirely if user specifies a different location.

**Structure:**

**Federal Programs** — search and list relevant programs:
- SBA loan programs (7a, 504, Microloan) with relevance to this idea
- SBIR/STTR grants if the idea has a tech/research component
- Any relevant DOE, NIH, NSF, USDA programs
- IRS Section 1202 QSBS — note eligibility if applicable

**State Programs** — if user has specified a state:
- State economic development grants
- Angel investor tax credit programs
- Enterprise/opportunity zone benefits

**Private Programs:**
- Accelerators currently accepting applications relevant to this space
- Vertical-specific programs (fintech, healthtech, edtech, etc.)
- Crowdfunding platforms best suited to this idea

**Certification-Based Smart Moves** — research which apply:
- **WOSB** (Women-Owned Small Business): federal set-asides, SBA programs
- **MBE** (Minority Business Enterprise): corporate supplier pipelines, MBDA
- **VOSB/SDVOSB** (Veteran-Owned): VA contracting, Boots to Business
- **HUBZone**: 10% price preference on federal contracts
- **DBE** (Disadvantaged Business Enterprise): DOT opportunities
- **B Corp**: access to impact investor networks

**Strategic Moves** — proactively recommend non-obvious advantages:
Example format: *"If you have a qualifying co-founder, WOSB certification opens federal contract set-asides legally ring-fenced from larger competitors — a moat most founders ignore entirely."*

**Table format for each program:**
```
| Program | Benefit | Eligibility | How to Apply | Link |
|---------|---------|-------------|--------------|------|
```

---

### SECTION 9: Next Steps Roadmap

**Purpose:** Turn analysis into action. Make it feel achievable.

**What to produce:**

**MVP Definition**
- What to build first (specific feature list)
- What to explicitly cut from v1 (equally important)
- Definition of "done" for MVP: what does success look like?
- Estimated build time and cost (with team assumptions stated)

**30-Day Action Plan** (numbered, specific, assigned to founder):
1. [Specific task] — [why this week] — [expected output]
2. ...continue to ~10-15 tasks

**90-Day Milestone Map:**
- Week 1-2: [milestone]
- Week 3-4: [milestone]
- Month 2: [milestone]
- Month 3: [milestone]

**Resources Required:**
- Team: what roles are needed (hire vs. found vs. outsource)
- Capital: minimum to reach MVP + first revenue
- Time: realistic hours per week commitment
- Tools/Infrastructure: key tools needed, estimated monthly cost

**Build vs. Buy vs. Partner:**
For each major component of the idea, recommend:
- Build it (if it's core differentiation)
- Buy/use existing tool (if commodity)
- Partner (if another company already does it well)

---

### SECTION 10: Sources & Research Trail

**Purpose:** Full transparency on where the data came from.

**What to produce:**
- Complete list of all sources used, formatted as:
  ```
  [#] Source Name — "Article or data title" — URL — [Date accessed or published]
  ```
- **Data freshness summary:** how recent is the research overall?
- **Confidence summary:**
  - High confidence items (multiple recent sources): [count]
  - Medium confidence items (single source or older data): [count]
  - Low confidence / estimated items: [count]
- **Research gaps:** what couldn't be found and should be independently verified

---

## 4. QUALITY BAR

Before outputting a report, self-check against this:

- [ ] Every market figure has a source
- [ ] Every competitor has real data (not guessed)
- [ ] The funding section has at least 5 specific programs listed
- [ ] The roadmap has specific tasks, not generic advice
- [ ] The verdict is honest — not inflated to make the user feel good
- [ ] Total report length: substantial (aim for 2,000–4,000 words depending on idea complexity)
- [ ] Cockroach personality is present throughout — not sterile and corporate

If any item fails this check, do not output the report. Fix it first.
