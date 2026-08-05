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
| Extras in v1 | Google Analytics (GA4), copyable BibTeX per paper, per-paper detail pages |
| Explicitly out of v1 | Dark mode, custom domain |

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

### Phase 0 — Scaffold and prove deployment
Astro + Tailwind project, base layout, nav, footer, one placeholder page. Actions workflow. Push and
confirm the live URL serves before building anything real. Deployment surprises are much cheaper to
find now than after the site exists.

Deliverable: `https://ai-interviewers.github.io` serving a styled placeholder.

### Phase 1 — Data model and seed
Write `content.config.ts`. Take your title list, research each paper, and produce one Markdown file
per paper with factual fields filled and classification fields blank plus `needs_review`. Add
`npm run tags` and a validation script.

Deliverable: populated `src/content/papers/`, build fails loudly on bad data.

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

### Phase 3 — Build out the chosen design
Apply tokens site-wide. Landing page: what AI interviewing is, why researchers are trying it, what
this site tracks, and clear paths to the papers index and the benchmark. Real papers page with tile
and list views. Footer crediting you with a link to your personal site.

### Phase 4 — Interactivity
Search, facet filters (autonomy, modality, paper type, domain tags, venue type, year), sort (date,
title, venue), tile/list toggle with the choice remembered in `localStorage`, URL state, result
count, empty state, "clear all filters".

### Phase 5 — Visualization
Build-time SVG stacked bars, papers per year. A control switches the segmentation between autonomy,
modality, and paper type. Clicking a segment applies the corresponding filter to the list below.
Accessible fallback: a visually-hidden data table so the chart isn't screen-reader-opaque.

### Phase 6 — Benchmark page
Sections: what the benchmark measures and why, how to get it (install/download), how to run it,
citation block with copy button, leaderboard table, submission instructions. Placeholders are marked
with a visible "coming soon" treatment rather than silently empty — an obviously-unfinished section
is better than one that looks broken.

The leaderboard needs a stored results format (`src/content/results/`) so adding a row is a data
edit, not a markup edit.

### Phase 7 — Detail pages and extras
Per-paper pages at `/papers/<slug>` with full abstract, all metadata, links, BibTeX copy button.
GA4 snippet. Sitemap, `robots.txt`, per-page OpenGraph tags, RSS feed of newly added papers.

### Phase 8 — Contribution infrastructure
Issue templates for submission and correction. `CONTRIBUTING.md` documenting the schema and the
vocabularies. Optionally a GitHub Action that converts a well-formed submission issue into a draft
paper file as a PR — worth it around the point where submissions become regular, not before.

### Phase 9 — Polish
Keyboard navigation and focus states, color contrast, mobile at 375px, Lighthouse pass, `<noscript>`
behavior, 404 page.

---

## 5. Things I need from you

1. **The list of paper titles.** Paste them however they are — bare titles are fine.
2. **GA4 measurement ID** (`G-XXXXXXX`). I'll wire the snippet with a placeholder if it's not ready.
3. **Confirm the repo**: does `ai-interviewers/ai-interviewers.github.io` exist yet, and do you want
   me to create it via `gh` or will you? Pages needs "Build and deployment → GitHub Actions" set in
   settings, which I can't do for you.
4. **Benchmark basics**: its name, a one-paragraph description, and where the package will live
   (PyPI name / GitHub repo), even if provisional.
5. **Footer wording** — how you want to be credited (name, affiliation, ORCID?).
6. **Any existing org branding** — logo, colors — or is the visual identity fully open?

---

## 6. Open questions and risks

- **Abstract reproduction.** arXiv abstracts are fine to reproduce, and indexing abstracts with
  attribution and a link is standard practice. Some publishers (Elsevier, Springer) are more
  restrictive about their abstract text specifically. Suggestion: store the abstract where the source
  permits, and for restrictive venues store a 1-2 sentence summary of my own plus a prominent link.
  I'll flag any entry where this applies rather than deciding silently.
- **Per-paper images.** Pulling a teaser figure out of a paper is a copyright question, and the
  answer varies by license. Recommendation: make `image` optional and default to a generated
  typographic card (title + venue on a tinted background) so the tile view looks consistent without
  reusing anyone's figures. Use real figures only for open-licensed papers.
- **Classification backlog.** With `autonomy`/`modality`/`paper_type`/`domains` blank at launch, the
  filters carry little signal until you work through them. The `?review` mode is the mitigation; the
  real question is whether you want to launch publicly before that pass is done, or keep the site
  unlisted until the dataset is classified. Worth deciding before Phase 3.
- **Leaderboard integrity.** Self-reported numbers need a policy — do you verify submissions, require
  code, or mark entries as unverified? Doesn't block the page, but the table should have a column
  for it from the start rather than gaining one awkwardly later.
- **Fonts.** `Anybody`, `DM Sans`, and `Space Mono` are all open-licensed (SIL OFL) and on Google
  Fonts, so no licensing issue. I'll self-host subsetted `woff2` rather than hotlinking Google —
  faster, and avoids a third-party request on every page load. Three families is a lot of weight, so
  if direction D wins I'll subset aggressively and load only the weights actually used.
- **Update cadence.** A tracker's value is being current. Consider a scheduled reminder to sweep
  arXiv for new work, and a "last updated" date in the footer so visitors can judge freshness.
