# ai-interviewers.github.io — Build Plan

A living index of research on using AI to conduct qualitative interviews, plus a home for the
benchmark. Hosted at `https://ai-interviewers.github.io` from the `ai-interviewers` org.

---

## 1. Decisions locked

| Area | Decision |
|---|---|
| Framework | **Astro 5 + Tailwind 4**, static output |
| Hosting | GitHub Pages, built by GitHub Actions, repo `ai-interviewers/ai-interviewers.github.io` |
| Paper storage | **One Markdown file per paper**, YAML frontmatter + abstract in body, Zod-validated |
| Seed metadata | I research **factual fields only** (link, date, venue, abstract); classification fields left blank for you |
| `domains` field | **Free-text tags**, multiple per paper |
| Submissions | **GitHub issue template** (structured form) + `CONTRIBUTING.md` |
| Visualization | **Papers-per-year stacked bars**, segmented by category, clicking a segment filters the list |
| Benchmark page | Full structure now, clearly marked TODO placeholders for citation/links/results |
| Style choice | **4 mockups of the papers page, local preview**, you pick, I apply site-wide |
| Extras in v1 | Google Analytics (GA4, `G-0NM3FBW1SV`), copyable BibTeX per paper, per-paper detail pages |
| Explicitly out of v1 | Dark mode, custom domain |
| Paper images | **Top of page 1 of the PDF**, rendered to WebP — the huggingface.co/papers approach. No custom artwork |
| Launch | **Not public yet.** Repo is public; the site is not served. `noindex` + `robots.txt` disallow + deploy gated on a `PUBLISH` variable |
| Leaderboard results | Submitted via **Google Form**, added manually |
| Freshness | "Last built" date in the footer. No automated arXiv sweep |
| Benchmark name | **InterviewBench** — "A benchmark for AI Interviewers that predicts real-world performance with simulated participants." |
| Credit | "Maintained by Jonathan Ivey", linking to jonathanivey.github.io |

Notes on the two exclusions: dark mode is cheapest to build in from the start, so the mockups will
use CSS custom properties for color rather than hardcoded Tailwind color classes — that keeps the
door open without doing the work now. A custom domain later needs only a `CNAME` file plus DNS
records; nothing in the build blocks it.

---

## 2. Architecture

### Why Astro here
Papers are content, and content collections give a typed schema with build-time failure on bad data
— a malformed date or an unknown `paper_type` breaks CI instead of silently rendering wrong. Astro
also ships zero JavaScript by default, which matters because the papers page is the one page that
needs real interactivity.

### The interactivity approach (important)
Rather than hydrating a React/Svelte island, **all paper cards and rows are rendered server-side**,
with metadata mirrored into `data-*` attributes. A single small vanilla TS script does filtering,
sorting, search, and the tile/list toggle by showing and hiding pre-rendered DOM nodes.

Consequences:
- Every paper is in the HTML, so Google indexes the full list and it works with JS disabled.
- No framework runtime — the page ships a few KB of script.
- Substring matching over title/authors/abstract/tags is plenty at this scale. If the collection
  passes ~300 papers, revisit with a prebuilt index (Fuse.js or Pagefind).

Filter state is written to the URL query string (`?view=list&type=benchmark&modality=voice`) so
filtered views are linkable and the back button behaves.

### Chart approach
The stacked bar chart is generated as **inline SVG at build time** from the collection — no charting
library, no client-side data fetch. A few lines of script add hover tooltips and click-to-filter.

### Repository layout

```
.
├── .github/
│   ├── workflows/deploy.yml            # build + deploy to Pages
│   └── ISSUE_TEMPLATE/
│       ├── paper-submission.yml        # structured metadata form
│       └── correction.yml              # fix wrong metadata on an existing entry
├── src/
│   ├── content.config.ts               # Zod schema — the single source of truth
│   ├── content/papers/
│   │   └── <year>-<first-author>-<slug>.md
│   ├── components/
│   │   ├── Nav.astro  Footer.astro  Analytics.astro
│   │   ├── PaperCard.astro             # tile view
│   │   ├── PaperRow.astro              # compact list view
│   │   ├── FilterBar.astro             # search + facets + sort + view toggle
│   │   ├── YearChart.astro             # build-time SVG
│   │   ├── MetadataBadge.astro         # autonomy / modality / type pills
│   │   └── CiteButton.astro            # BibTeX copy
│   ├── layouts/BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro                 # landing
│   │   ├── papers/index.astro          # the index
│   │   ├── papers/[...slug].astro      # detail pages
│   │   ├── benchmark.astro
│   │   ├── contribute.astro
│   │   └── 404.astro
│   ├── scripts/papers-filter.ts
│   ├── lib/bibtex.ts                   # generate BibTeX from frontmatter
│   └── styles/global.css               # Tailwind + design tokens as CSS variables
├── public/papers/                      # optional per-paper images
├── CONTRIBUTING.md  README.md  PLAN.md
└── astro.config.mjs  package.json  tsconfig.json
```

Because this is an **org root site**, the repo must be named exactly
`ai-interviewers.github.io` and `base` stays `/` — no path-prefix headaches.

---

## 3. Paper schema

```yaml
---
title: "Can Large Language Models Conduct Qualitative Interviews?"
authors: ["Jane Doe", "Rakesh Kumar"]
date: 2024-11-03            # publication or preprint date; YYYY-MM-DD (YYYY-MM ok)
url: "https://arxiv.org/abs/2411.01234"   # primary link — required
arxiv: "2411.01234"         # optional
doi: "10.1145/..."          # optional
venue: "CHI 2025"           # omit if unpublished preprint
venue_type: conference      # conference | journal | workshop | preprint | thesis | tech-report

# --- classification: left blank on seed, you fill in ---
autonomy:                   # autonomous | ai-assisted | both | not-applicable
modality:                   # text | voice | multimodal | not-applicable
paper_type: []              # array — a paper can be more than one:
                            #   new-system | exploratory-position | evaluation-benchmark
                            #   | survey | dataset
domains: []                 # free tags: ["health", "HCI", "market research"]

# --- optional ---
image: "/papers/doe-2024.png"
code_url:
dataset_url:
bibtex: |
  @inproceedings{doe2024,
    ...
  }
needs_review: ["autonomy", "modality", "paper_type", "domains"]
draft: false
---

Abstract text goes here as the body of the file.
```

Design points worth flagging:

- **`paper_type` is an array**, not a single value — a paper that introduces an interviewer *and*
  evaluates it against baselines is genuinely both, and forcing a choice would lose information.
- **`autonomy` and `modality` need a `not-applicable` value** — a position paper or a benchmark of
  other people's systems often has neither.
- **`needs_review` lists unverified field names.** Since the seed pass leaves classification blank,
  this starts as a to-do list per paper. I'll add a `?review` mode to the papers page that surfaces
  exactly what's missing, so you can work through the backlog without opening 25 files.
- **Blank classification is a first-class UI state.** Filters get an "unclassified" option and cards
  show a muted "unclassified" pill rather than an empty gap. The site has to look finished while the
  dataset is still half-filled — this is the main design constraint the mockups must handle.
- **Free-text `domains` gets a normalization guard**: the build lowercases and trims tags, and a
  script (`npm run tags`) lists all tags with counts so near-duplicates ("health" vs "healthcare")
  are easy to spot and merge. Free tags without that check drift within a dozen entries.

---

## 4. Phases

### Phase 0 — Scaffold and deployment plumbing ✅ **done**

Repo: <https://github.com/ai-interviewers/ai-interviewers.github.io> — public, site not served.

Built: Astro 7 + Tailwind 4, base layout with nav/footer/skip-link, schema-validated papers
collection, stub pages for every nav entry, Actions workflow, issue templates, seed tooling.

Verified rather than assumed:
- Build passes; the schema gate correctly rejects an out-of-vocabulary value
  (`autonomy: semi-autonomous` fails the build with a readable error).
- The `deploy` job is **skipped** while `PUBLISH` is unset; `build` still runs on every push,
  so breakage is caught without publishing.
- `https://ai-interviewers.github.io/` returns **404** — nothing is served.
- GA4 compiles into production builds only, so dev and mockup review don't pollute the property.
- The arXiv → Markdown → thumbnail → build path works end to end on a real paper.

Two things worth recording, because both were surprises:

1. **A bare `key:` in YAML parses as `null`, not `undefined`**, so `.optional()` rejected every
   deliberately-blank field. Since "leave it blank rather than guess" is the editing convention the
   whole collection is built around, optional fields use a `blankable()` helper that accepts null and
   normalises it to `undefined`. Without this the seed workflow could not have worked at all.
2. **Naming a repo `*.github.io` makes GitHub auto-enable Pages with its legacy Jekyll builder**,
   which would have published the site immediately, bypassing the `PUBLISH` gate. Pages is now set to
   `build_type: workflow`, so only the gated workflow can deploy. Worth knowing that creating this
   repo at all was very nearly a publish event.

### Phase 1 — Data model and seed ✅ **done**

**22 papers** seeded, spanning 2019-05 to 2026-08. 15 preprints, 5 journal, 2 conference.
15 thumbnails generated (540 KB total).

Two sources were needed, not one:

- **arXiv** (15 papers) — has abstracts, but only indexes preprints.
- **Crossref** (7 papers) — covers the ACM/CHI/CSCW and journal venues arXiv does not, with
  excellent venue and DOI data and no meaningful rate limit. Deposits abstracts only sometimes.

Semantic Scholar and OpenAlex were both tried first and rejected: S2's unauthenticated tier
rate-limits almost immediately, and OpenAlex anonymous search was returning
`"Search temporarily unavailable"` — which my throwaway test script initially misread as
"no such paper", the same trap described below.

**A defect worth recording.** The first real run of `fetch-arxiv.mjs` reported 8 papers as
"not on arXiv". They were actually HTTP 429s. Re-running after adding backoff found **5 of those 8
on arXiv after all** — so the original output would have sent five papers to manual entry
unnecessarily, and nothing in the summary would have hinted at it. Rate-limit and transport failures
are now tracked separately from genuine absence, retried with exponential backoff, and the script
exits non-zero so a partial run cannot be mistaken for a complete one.

Fuzzy-match confidence scoring also earned its keep: one title matched an unrelated paper
("Pallvi Arora Discusses and Defines Thematic Analysis…") at 0.27 and was correctly withheld.

#### Phase 1b — classification and abstract recovery ✅ **done**

**23 papers** (InterPilot added at your request). Every abstract recovered, every classification field
filled — but **all classification is model-assigned and unconfirmed**, and marked as such in three
places: a `MODEL-ASSIGNED and UNCONFIRMED` comment in each file, all four fields retained in
`needsReview`, and a warning section in `CONTRIBUTING.md`. Files with debatable calls carry a
`# NOTE:` line giving the reasoning.

Abstract recovery, since Crossref had 5 missing:

- **2 had arXiv versions** Crossref didn't link — *If I Hear You Correctly* (2002.01862) and
  *InterPilot* (2602.20891). Adding the arXiv ids also unlocked their thumbnails.
- **1 came from the ACL Anthology** — LM-Interview (open access).
- **1 was pointing at the wrong version entirely.** Crossref matched the *CrimRxiv preprint* of the
  child-interviewing study; the version of record is **PLOS ONE** (CC BY, 2025-02-28), with a fuller
  author list. Entry rewritten to the published version. Worth remembering that Crossref's best match
  is not always the version of record.
- **1 was left as our own summary** — the Zarouali paper is Taylor & Francis, which restricts abstract
  reuse, so `abstractIsSummary: true` and the body is a paraphrase. This is the copyright posture
  described in §6 actually being exercised.

Current distributions:

| Field | Values |
|---|---|
| `autonomy` | 19 autonomous, 4 ai-assisted |
| `modality` | 19 text, 4 not-applicable |
| `paperType` | 16 new-system, 5 evaluation-benchmark, 2 exploratory-position |
| `domains` | 16 tags; top: hci (10), qualitative research (9), surveys (6) |

**Two things this reveals about the metadata design**, both worth deciding on before Phase 3:

1. **No paper in the collection is voice or multimodal.** The `modality` facet you specified —
   text / voice / both — currently has exactly one populated value. As a filter it does nothing yet.
2. **`modality` is currently redundant with `autonomy`**: all 4 `not-applicable` modalities are
   exactly the 4 `ai-assisted` papers, because a tool that assists a human interviewer has no
   modality of its own. The two facets carry the same information at present.

Neither is a reason to drop the field — voice interviewers plainly exist and will appear as the list
grows — but the papers page should probably hide a facet that has only one distinct value rather than
render a dead control.

#### Outstanding data work

| Item | Count | Notes |
|---|---|---|
| Classification unconfirmed | 23/23 | Model-assigned; verify and prune `needsReview` |
| Thumbnail missing | 5 | No openly reachable PDF; typographic-card fallback |
| Venue unverified | 15 | arXiv entries default to `preprint`; several are published (e.g. InterFlow is CHI 2026) |
| Abstract is a paraphrase | 1 | Zarouali — publisher restricts abstract reuse |

Dropped at your direction: *Designing Real-Time AI Assistance for Semi-Structured Interviews:
Navigating Cognitive Load and Interviewer Agency*. It appears nowhere in arXiv, Crossref, or web
search, and its subtitle terms are drawn from InterFlow's own abstract — likely a working title for
that paper, which is already indexed here.

### Phase 2 — Style exploration ← *your decision point*
Build the papers page four ways against the real data, all locally previewable at once:

- **`/mockups/a` — Academic archive.** Serif headings, warm off-white paper tone, hairline rules,
  dense typography. Reads like a well-kept annotated bibliography; signals scholarly credibility.
- **`/mockups/b` — Modern research lab.** Clean geometric sans, generous whitespace, soft-shadowed
  cards, single strong accent, pill filter chips. The familiar arXiv-adjacent tool-site look;
  friendliest to non-academic visitors.
- **`/mockups/c` — Data-forward.** Compact grid, chart promoted to the top as the primary
  navigation device, monospace metadata, high contrast. Feels like a dataset explorer or
  leaderboard; leans into the benchmark half of the site's identity.
- **`/mockups/d` — Transcript / stationery.** See below. The Greptile-derived direction.

All four are Tailwind, differing mainly in a **token layer** (fonts, spacing scale, radii, color
variables) plus card composition. So "I want B's layout with D's typography" is a cheap request, and
the winner propagates to every page by swapping tokens rather than rewriting markup.

You review at `npm run dev`, on desktop and with the browser in mobile width. Mockup routes are
deleted once you choose.

#### Round 3 — consolidated candidate ✅ **built**

E's structure on lighter (H-like) stock, texture dropped. Content changes, all applied to the
shared card so they hold in every direction:

- Abstracts sit behind a `+ ABSTRACT` expander instead of showing by default, and the expanded
  version is the **full** abstract rather than a truncation.
- **All** authors listed, not just the first; ellipsised with a full-text tooltip in list view.
- The **whole card** opens the paper in a new tab, via a stretched link. The abstract expander is
  lifted above it so it stays independently clickable.
- Venue casing follows the data: `CHI EA 2026` and `EMNLP 2024 Demo` keep their capitals, while
  `Preprint` no longer shouts. The forced `text-transform: uppercase` is gone.

Two themes:

- **I · Light index card** — Inter + Space Mono, warm-white, highlighter on the year.
- **J · Personal site** — matched to jonathanivey.github.io, read off the live site rather than
  guessed: Roboto, `#ffffff` ground, `#000` ink, `#0076df` links, `#828282` muted, and the
  light-weight (300) display headings the site uses.

**Year-highlight schemes**, switchable on both pages: `amber` (one hue, pale→saturated),
`spectrum` (cool→warm), `marker` (a box of highlighters), `single` (control). The first two encode
recency, so the colour carries information; `marker` is livelier but arbitrary. Since the year is
also written as text, none of them rely on colour alone.

Three bugs worth recording:

1. **The `<details>` filter drawer never painted on desktop.** A closed `<details>` gets
   `content-visibility: hidden` from the UA on its content slot, which cannot be overridden from a
   descendant — so the "force open with CSS" rule left the sidebar laid out at full height but
   invisible. Replaced with an explicit attribute toggle, which is predictable in both directions.
2. **Expanding one abstract stretched every other card in its grid row.** Fixed with
   `align-items: start` on the tile grid.
3. The dev server served stale component CSS through several HMR cycles, which made a working rule
   look broken. Diagnosed by grepping the production bundle, then confirmed after clearing
   `.astro` and `node_modules/.vite`. Worth reaching for a clean rebuild before believing a
   dev-only symptom.

#### Round 2 — the hybrid ✅ **built**

Round 1 established that C's compact base was right and that D's transcript idea was appealing but
too tech-forward. Round 2 fixes the structure and varies only ornament, so the remaining choice is
about feel rather than layout.

Fixed across E–H, per your notes:

- **No tags or classification badges on cards.** They exist only as `data-*` attributes driving the
  filters. Verified: a card's visible text is exactly `year · venue · title · author`.
- **Title, author, year, and venue always present**, in tile *and* list view.
- **Venue top-right**, carried over from D's slug line.
- **Thumbnails in tile view.**
- **No papers-per-year chart** on the papers page. `YearChart` still exists for the landing page.
- Built on **C's compact base**; D's graph-paper ground and neon palette are gone.

| | Texture | Highlighter | Type |
|---|---|---|---|
| **E · Index card** | Fine paper fibre | On the year | Inter + Space Mono |
| **F · Ledger** | Legal-pad ruling + fibre | On the venue | DM Sans + Space Mono |
| **G · Manuscript** | Coarse grain | Sweeps the title on hover | Source Serif + Space Mono |
| **H · Warm minimal** | None (adjustable) | Marker underline | Inter + JetBrains Mono |

Every Round 2 page carries a **texture strength control** (none / subtle / medium / strong) that
scales that direction's own base. Texture amount is the one variable that cannot sensibly be chosen
in the abstract, so it is dialled on real content rather than guessed. H starts at `none` as a genuine
control for whether the stationery treatment earns its keep.

Textures are generated — an SVG `feTurbulence` data URI for fibre, gradients for ruling — so nothing
extra downloads.

One implementation note worth keeping: Astro's scoped component styles
(`.card-h[data-astro-cid-…]`) tie with `[data-variant='x'] .card-h` on specificity and win on source
order, so any Round 2 rule overriding a property the component also sets is prefixed with `body` for
the extra point. F's dashed borders silently stayed solid until this was found.

#### Direction D in detail — transcript / stationery

Derived from greptile.com's design language, which I inspected directly. The reusable recipe:

| Element | Greptile's implementation |
|---|---|
| Ground | `#E9E9E9` cool gray; panels `#EEEEEE` |
| Ink | `#3D3B4F` slate-purple — **never pure black**; rules at `rgba(85,83,104,0.3)` |
| Dominant divider | **dashed 1px** — the single strongest stationery cue |
| Texture: graph paper | `linear-gradient(90deg, rgba(128,128,128,.07) 1px, transparent 1px)` × both axes |
| Texture: dot grid | `radial-gradient(circle, rgba(0,0,0,.12) 1px, transparent 1px)` |
| Texture: hatching | `repeating-linear-gradient(-55deg, …0 1px, transparent 1px 4px)` |
| Texture: ruling | `repeating-linear-gradient(… 0 1px, transparent 1px 5px)` — lined paper |
| Display type | `Anybody` — heavy, wide grotesque |
| Body type | `DM Sans` |
| Label type | `Space Mono`, uppercase, letterspaced — the `[AGENT]` bracket tags |
| Buttons | chamfered corners via `clip-path` polygon |
| Section corners | crop / registration marks |

The reason this fits our subject matter: each motif has a direct transcript analogue, so the styling
carries meaning rather than being decoration.

| Motif | Becomes |
|---|---|
| Mono bracket labels | Speaker tags — `[INTERVIEWER]`, `[P07]` — and timecodes `00:14:32` |
| Horizontal ruling | Legal pad / interview notes |
| Diagonal hatching | Redaction bar, or highlighter over a pulled quote |
| Graph / dot grid | The coding grid of qualitative analysis |
| Dashed rules | Form fields and cut lines on a release form |
| Crop marks | A printed, filed document |

Applied to our components:

- **Paper card = transcript excerpt slip.** Mono header line carrying the metadata like a transcript
  header (`AUTONOMOUS · VOICE · CHI '25`), title in the display face, abstract as body text,
  dashed rule above a footer of tags, crop marks at the corners.
- **List view = ruled ledger.** Faint 5px ruling behind rows, a mono year column at the left edge,
  dashed row separators.
- **Tags** = highlighter-hatched pills; **active filters** get the accent hatch fill.
- **Landing page** can illustrate AI interviewing with actual styled transcript lines (`I:` / `P:`
  speaker prefixes), which makes the aesthetic do explanatory work.
- **Unclassified fields** render as a dashed empty form field — which turns the biggest weakness of
  the half-filled dataset into a coherent visual idea rather than a gap.

**Palette: built as swappable CSS variables with a live switcher.** Greptile's neon mint/lime/pink
reads startup-SaaS and would pull against a research index's credibility, but that's a judgment worth
seeing on real content rather than taking on faith. So mockup D ships a small control that flips the
accent layer between three options without a reload:

1. **Warm manila + ink + highlighter** — cream/manila ground, slate ink, highlighter yellow for
   active state, archival red for the redaction hatch. Archive rather than startup.
2. **Greptile-faithful** — `#E9E9E9` ground, `#3D3B4F` ink, `#28E99F` mint, neon secondaries.
3. **Cool paper, muted accent** — Greptile's cool gray and slate ink, accent swapped for a
   desaturated ink blue or teal.

Only the accent and ground variables change between them; structure, type, and texture stay fixed, so
you're judging one variable at a time. The switcher is a mockup-only control and does not ship.

### Phase 3 — Build out the chosen design ✅ **done**

J promoted from mockup to production theme. `global.css` now carries the real tokens (Roboto,
white, black ink, `#0076df` accent) instead of placeholders; `PaperCard`/`PaperExplorer` replaced
the `mock/` components; all ten mockup routes, `MockLayout.astro`, and the five unused Fontsource
packages (Anybody, DM Sans, Source Serif 4, JetBrains Mono, Space Mono) were deleted. Landing page
has real copy plus the year chart; papers page has the full explorer with no chart, per your Round 2
instruction. Footer credit was already in place from Phase 0.

One real bug caught here: `--seg-1..4` (the chart's segment colors) were declared inside Tailwind
4's `@theme` block and **silently never reached the compiled CSS at all** — the chart rendered with
transparent bars. Tailwind v4 tree-shakes any custom property shaped like a numbered scale
(`--name-1`, `--name-2`, …) that isn't also consumed as an actual utility class; `--radius` (no
numeric suffix) survived the same block, which is what made this non-obvious. Fixed by moving those
four variables to a plain `:root` block outside `@theme`, which Tailwind leaves alone entirely.

### Phase 4 — Interactivity ✅ **done**
Search, facets (autonomy, modality, paper type, venue type, domain — auto-hidden when a facet has
only one distinct value), sort, tile/list with `localStorage`, URL state, result count, empty state,
clear-filters. Verified: cross-facet AND, within-group OR, URL round-trip, mobile filter drawer.

### Phase 5 — Visualization ✅ **done, moved to the landing page**
Stacked bars, continuous year axis (no silently-dropped gap years), segmented by autonomy. Per your
Round 2 instruction the papers page carries no chart, so this ended up entirely on the landing page
instead — where there's no explorer to filter into, so `YearChart` gained a `linkTo` prop: segments
render as `<a href="/papers?autonomy=…">` rather than filter-toggle buttons. Verified the round trip:
clicking a segment lands on `/papers` with the right facet pre-checked and the count filtered.
Accessible fallback table retained from the original build.

### Phase 6 — Benchmark page ✅ **done**
Get it / Cite it / Leaderboard sections, each rendering an honest "coming soon" state instead of a
dead link wherever a `consts.ts` value (`packageUrl`, `githubUrl`, `paperUrl`,
`LEADERBOARD_FORM_URL`) is still `null` — all marked `TODO` at the source. BibTeX has a copy button
(see Phase 7 note on generation). Leaderboard table renders "No submissions yet" rather than an
empty void; a stored results format (`src/content/results/`) is deferred until there is a first
submission to store — building it now would be speculative.

### Phase 7 — Detail pages and extras ✅ **done, mostly**
Per-paper pages at `/papers/<slug>` — full abstract, all metadata, links, classification (with
unconfirmed fields shown in italics), BibTeX copy. Reachable via a small "Details" link on each card,
separate from the card's main stretched link, which opens the external paper per your instruction —
so the internal page needed its own way in rather than competing for the same click.

**BibTeX had to be generated, not just copied**: none of the 23 seeded papers had a populated
`bibtex` frontmatter field — that was left blank by design during ingestion. `src/lib/bibtex.ts`
derives a reasonable entry from already-verified fields (title, authors, date, venue, arXiv id) and
only falls back to the frontmatter field when a human has actually filled one in.

GA4, sitemap, and `robots.txt` were already in place from Phase 0. Not done: per-page OpenGraph
images and an RSS feed — neither was asked for and both are easy to add later without touching
anything already built.

### Phase 8 — Contribution infrastructure
Issue templates for submission and correction. `CONTRIBUTING.md` documenting the schema and the
vocabularies. Optionally a GitHub Action that converts a well-formed submission issue into a draft
paper file as a PR — worth it around the point where submissions become regular, not before.

### Phase 9 — Polish
Keyboard navigation and focus states, color contrast, mobile at 375px, Lighthouse pass, `<noscript>`
behavior, 404 page.

---

## 5. Still needed

1. **The list of paper titles.** Blocks Phase 1 and nothing else. Bare titles are fine — the
   ingestion script handles fuzzy matching and flags anything it is unsure about.
2. **Google Form URLs** — one for leaderboard submissions (benchmark page). Not blocking; the
   contribute page uses GitHub issues, which are already live.
3. **InterviewBench package location** — PyPI name and/or GitHub repo, even provisional. Needed for
   Phase 6, not before.

Resolved: GA4 ID (`G-0NM3FBW1SV`), repo created, benchmark name and description, footer credit, and
no existing branding — visual identity is fully open, which is what Phase 2 explores.

### What only you can do on GitHub

Nothing is required right now — the current state is intentional. These are for later:

- **At launch**: set `PUBLISH=true` under Settings → Secrets and variables → Actions → Variables,
  then flip `noindex` in `BaseLayout.astro` and swap `public/robots.txt`. All three are listed in the
  README under "Going live".
- **Optional now**: turn on Issues if you want the submission templates usable before launch
  (they are committed and will work as soon as the repo is discoverable).

---

## 6. Open questions and risks

- **Abstract reproduction.** arXiv abstracts are fine to reproduce, and indexing abstracts with
  attribution and a link is standard practice. Some publishers (Elsevier, Springer) are more
  restrictive about their abstract text specifically. Suggestion: store the abstract where the source
  permits, and for restrictive venues store a 1-2 sentence summary of my own plus a prominent link.
  I'll flag any entry where this applies rather than deciding silently.
- **Per-paper images — resolved.** Thumbnails render from the top ~42% of page 1 of the PDF, converted
  to WebP at ~31 KB each, matching huggingface.co/papers. Only papers with an arXiv id or an openly
  reachable PDF can be processed; the rest are reported as skipped and fall back to a typographic
  card. This reproduces a title page rather than a figure, which is the same posture HF takes.
- **Classification backlog — mitigated.** `npm run review` lists every missing and unverified field
  with per-field totals. Since the site is not launching publicly yet, the backlog gates nothing; it
  just needs doing before `PUBLISH=true`.
- **Leaderboard integrity.** Self-reported numbers arriving by Google Form need a policy — do you
  verify submissions, require code, or mark entries unverified? Doesn't block the page, but the table
  should carry a verification column from the start rather than gaining one awkwardly later.
- **Fonts.** `Anybody`, `DM Sans`, and `Space Mono` are all open-licensed (SIL OFL) and on Google
  Fonts, so no licensing issue. I'll self-host subsetted `woff2` rather than hotlinking Google —
  faster, and avoids a third-party request on every page load. Three families is a lot of weight, so
  if direction D wins I'll subset aggressively and load only the weights actually used.
- **Update cadence — resolved.** The footer carries a build date, labelled "Last built" rather than
  "Last updated" because that is what it actually measures. No automated arXiv sweep, per your call.
  Worth noting the field is moving fast: the arXiv query I ran during Phase 0 returned 17 hits for
  `"AI interviewer"` alone, including work from July 2026 that postdates my training data.
