# Contributing

## Suggesting a paper

Open a [paper suggestion issue](../../issues/new?template=paper-submission.yml). Only the title and
a link are required — leave anything you are unsure about blank rather than guessing.

Spotted wrong metadata on an entry? Use the [correction template](../../issues/new?template=correction.yml).

## Adding a paper directly

1. Copy `docs/paper-template.md` into `src/content/papers/`.
2. Name it `<year>-<first-author-surname>-<short-slug>.md`. The filename becomes the URL.
3. Fill in what you can verify. **Leave classification fields blank rather than guessing** — a blank
   field renders as an unfilled form field, which is intended; a wrong value is worse than none.
4. Run `npm run build`. The schema will reject malformed dates, bad URLs, and any value outside the
   controlled vocabularies.

For papers on arXiv, most of this is automated:

```bash
node scripts/fetch-arxiv.mjs --id 2607.20310 --write
```

That fills title, authors, date, url, arXiv id, and the abstract, and leaves every classification
field blank. It also works from a file of titles (`--titles titles.txt`) and reports low-confidence
matches for you to verify by hand.

## ⚠️ Classification is currently unconfirmed

Every paper's `autonomy`, `modality`, `paperType`, and `domains` were assigned by a model from the
paper's abstract, not by a human reading the paper. Each file carries a `MODEL-ASSIGNED and
UNCONFIRMED` comment above those fields, and all four remain listed in `needsReview`.

Treat them as a starting point. When you verify a field against the paper itself, remove that field
name from `needsReview` — that is the signal a human has confirmed it. `npm run review` reports what
is still outstanding. Several files also carry a `# NOTE:` line explaining a debatable call.

This should be worked through before `PUBLISH=true`.

## Vocabularies

Defined in `src/content.config.ts`. The build fails on unlisted values, which is deliberate — it
keeps filters clean. Adding a category is a one-line edit there.

| Field | Values |
|---|---|
| `autonomy` | `autonomous`, `ai-assisted`, `both`, `not-applicable` |
| `modality` | `text`, `voice`, `multimodal`, `not-applicable` |
| `paperType` | `new-system`, `exploratory-position`, `evaluation-benchmark`, `survey`, `dataset` — an array, since many papers are more than one |
| `venueType` | `conference`, `journal`, `workshop`, `preprint`, `thesis`, `tech-report` |
| `domains` | free text, lowercased automatically |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Build, and validate every paper against the schema |
| `npm run review` | List papers with missing or unverified fields |
| `npm run tags` | List domain tags with counts, and flag likely duplicates |
| `npm run thumbs` | Generate thumbnails from page 1 of each PDF |

`npm run thumbs` needs poppler and webp:

```bash
brew install poppler webp
```

## Leaderboard results

InterviewBench results are submitted through the Google Form linked on the
[benchmark page](https://ai-interviewers.github.io/benchmark) and added manually.
