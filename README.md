# ai-interviewers.github.io

An index of research on using AI to conduct qualitative interviews, plus a home for
**InterviewBench** — a benchmark for AI Interviewers that predicts real-world performance with
simulated participants.

Maintained by [Jonathan Ivey](https://jonathanivey.github.io/).

> **Pre-launch.** The site is not published yet. Every page carries `noindex`, `robots.txt`
> disallows all crawlers, and the deploy step is gated behind a `PUBLISH` repository variable.
> See [Going live](#going-live).

## Stack

Astro 7 + Tailwind 4, static output, deployed to GitHub Pages by Actions. Papers are Markdown files
with schema-validated frontmatter — a malformed entry fails the build rather than rendering wrong.

## Local development

```bash
npm install
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run build` | Build, and validate every paper against the schema |
| `npm run review` | List papers with missing or unverified fields |
| `npm run tags` | List domain tags with counts, and flag likely duplicates |
| `npm run thumbs` | Generate thumbnails from page 1 of each PDF (needs `brew install poppler webp`) |
| `node scripts/fetch-arxiv.mjs --titles titles.txt` | Pull factual metadata from arXiv for a list of titles |

See [CONTRIBUTING.md](CONTRIBUTING.md) for the paper schema and vocabularies.

## Going live

Three changes, in this order:

1. Set `PUBLISH=true` in **Settings → Secrets and variables → Actions → Variables**.
2. Set `noindex = false` as the default in `src/layouts/BaseLayout.astro`.
3. Replace `public/robots.txt` with the allow-all block commented at the bottom of that file.

Note that GitHub Pages cannot serve a private repository on a free organisation plan, so the repo
must be public for the site to be reachable at all.
