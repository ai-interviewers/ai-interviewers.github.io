#!/usr/bin/env node
/**
 * Companion to fetch-arxiv.mjs for papers published at ACM/IEEE/journal venues, which
 * arXiv does not index. Crossref has excellent venue and DOI coverage and no rate limit
 * worth worrying about, but deposits abstracts only sometimes — when it doesn't, the
 * body is left empty and `abstract` is added to needsReview rather than invented.
 *
 *   node scripts/fetch-crossref.mjs --titles titles.txt
 *   node scripts/fetch-crossref.mjs --doi 10.1145/3313831.3376131
 *
 * Add --write to create files; without it, prints what it would do.
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const PAPERS_DIR = 'src/content/papers';
const API = 'https://api.crossref.org/works';
const UA = 'ai-interviewers.github.io/0.1 (https://github.com/ai-interviewers)';
const REQUEST_DELAY_MS = 1200;

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? null : argv[i + 1];
};
const write = argv.includes('--write');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (p) => access(p).then(() => true, () => false);

/** Crossref maps onto our venueType; PACMHCI-style hybrids get flagged for a human. */
const VENUE_TYPE = {
  'proceedings-article': 'conference',
  'journal-article': 'journal',
  'posted-content': 'preprint',
  'report': 'tech-report',
  'dissertation': 'thesis',
  'book-chapter': 'journal',
};

async function api(params, attempt = 1) {
  const res = await fetch(`${API}?${params}`, { headers: { 'User-Agent': UA } });
  if (res.status === 429 || res.status >= 500) {
    if (attempt > 4) throw new Error(`Crossref returned ${res.status} after 4 attempts`);
    const wait = 4000 * 2 ** (attempt - 1);
    console.log(`      rate limited (${res.status}), waiting ${wait / 1000}s…`);
    await sleep(wait);
    return api(params, attempt + 1);
  }
  if (!res.ok) throw new Error(`Crossref returned ${res.status}`);
  return res.json();
}

const SELECT = 'title,author,issued,container-title,DOI,type,abstract,URL,event';

const norm = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

function similarity(a, b) {
  const A = new Set(norm(a).split(' '));
  const B = new Set(norm(b).split(' '));
  const shared = [...A].filter((w) => B.has(w)).length;
  return shared / Math.max(A.size, B.size);
}

/** Crossref abstracts are JATS XML fragments. */
function cleanAbstract(raw) {
  if (!raw) return '';
  return raw
    .replace(/<jats:title>.*?<\/jats:title>/gs, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function dateOf(item) {
  const parts = item.issued?.['date-parts']?.[0] ?? [];
  const [y, m, d] = parts;
  if (!y) return null;
  return `${y}-${String(m ?? 1).padStart(2, '0')}-${String(d ?? 1).padStart(2, '0')}`;
}

function authorsOf(item) {
  return (item.author ?? [])
    .map((a) => [a.given, a.family].filter(Boolean).join(' ').trim())
    .filter(Boolean);
}

function slugify(title, authors, date) {
  const year = (date ?? '').slice(0, 4) || 'undated';
  const surname = (authors[0] ?? 'unknown').split(' ').pop().toLowerCase().replace(/[^a-z]/g, '');
  const words = norm(title).split(' ').filter((w) => w.length > 3).slice(0, 3).join('-');
  return `${year}-${surname}-${words}`;
}

const yaml = (v) => `"${String(v).replace(/"/g, '\\"')}"`;

function toMarkdown(item) {
  const title = (item.title ?? [''])[0].replace(/\s+/g, ' ').trim();
  const authors = authorsOf(item);
  const date = dateOf(item);
  const venue = (item['container-title'] ?? [])[0] ?? item.event?.name ?? '';
  const abstract = cleanAbstract(item.abstract);
  const venueType = VENUE_TYPE[item.type] ?? 'preprint';

  const review = ['autonomy', 'modality', 'paperType', 'domains'];
  if (!abstract) review.push('abstract');
  // PACMHCI and similar publish conference tracks as journal articles; the mapping is
  // defensible either way, so it is always a human's call.
  if (venueType === 'journal') review.push('venueType');

  return `---
title: ${yaml(title)}
authors: [${authors.map(yaml).join(', ')}]
date: ${date}
url: ${yaml(item.URL ?? `https://doi.org/${item.DOI}`)}
arxiv:
doi: ${yaml(item.DOI)}
pdfUrl:

venue: ${yaml(venue.replace(/\s+/g, ' ').trim())}
venueType: ${venueType}

# Classification left blank on purpose — see \`npm run review\`.
autonomy:
modality:
paperType: []
domains: []

code_url:
dataset_url:
thumbnail:
bibtex:

needsReview: [${review.map(yaml).join(', ')}]
abstractIsSummary: false
draft: false
---

${abstract || '<!-- Crossref has no abstract on deposit for this paper. Add it by hand from the publisher page, or write a summary and set abstractIsSummary: true. -->'}
`;
}

async function resolve(spec) {
  if (spec.startsWith('10.')) {
    const data = await api(`filter=doi:${encodeURIComponent(spec)}&select=${SELECT}&rows=1`);
    const item = data.message?.items?.[0];
    return item ? { item, score: 1 } : null;
  }
  const data = await api(
    `query.bibliographic=${encodeURIComponent(spec)}&select=${SELECT}&rows=5`,
  );
  const items = data.message?.items ?? [];
  if (!items.length) return null;
  return items
    .map((item) => ({ item, score: similarity(spec, (item.title ?? [''])[0]) }))
    .sort((a, b) => b.score - a.score)[0];
}

const specs = [];
if (flag('--titles')) {
  const raw = await readFile(flag('--titles'), 'utf8');
  specs.push(
    ...raw
      .split('\n')
      .map((l) => l.replace(/^\s*(?:[-*\d.]+\s*)/, '').trim())
      .filter((l) => l && !l.startsWith('#')),
  );
}
if (flag('--doi')) specs.push(flag('--doi'));
if (flag('--title')) specs.push(flag('--title'));

if (!specs.length) {
  console.error('Nothing to do. Pass --titles <file>, --doi <doi>, or --title "<title>".');
  process.exit(1);
}

await mkdir(PAPERS_DIR, { recursive: true });

const notFound = [];
const errored = [];
const lowConfidence = [];
const noAbstract = [];

for (const spec of specs) {
  let match;
  try {
    match = await resolve(spec);
  } catch (err) {
    console.log(`! ${spec}\n    lookup failed: ${err.message}`);
    errored.push(`${spec} — ${err.message}`);
    continue;
  }

  if (!match) {
    console.log(`✗ not in Crossref: ${spec}`);
    notFound.push(spec);
    continue;
  }

  const { item, score } = match;
  const title = (item.title ?? [''])[0].replace(/\s+/g, ' ').trim();
  const authors = authorsOf(item);
  const date = dateOf(item);
  const id = slugify(title, authors, date);
  const confidence = score >= 0.75 ? 'high' : score >= 0.45 ? 'MEDIUM' : 'LOW';
  if (confidence !== 'high') lowConfidence.push({ spec, got: title, score });
  if (!item.abstract) noAbstract.push(id);

  const venue = ((item['container-title'] ?? [])[0] ?? '').replace(/\s+/g, ' ').trim();
  console.log(`${confidence === 'high' ? '✔' : '?'} ${spec}`);
  console.log(`    → ${title}`);
  console.log(`      ${id}  ${date}  ${venue.slice(0, 55)}`);
  console.log(`      match ${confidence} (${score.toFixed(2)})${item.abstract ? '' : '  · NO ABSTRACT'}`);

  if (!date) {
    console.log('      no usable date — skipped, the schema requires one');
    notFound.push(`${spec} (no date in Crossref)`);
    continue;
  }

  if (write) {
    const file = path.join(PAPERS_DIR, `${id}.md`);
    if (await exists(file)) console.log('      already exists, skipped');
    else await writeFile(file, toMarkdown(item));
  }

  await sleep(REQUEST_DELAY_MS);
}

console.log(write ? '\nFiles written.' : '\nDry run — re-run with --write to create files.');

if (lowConfidence.length) {
  console.log('\nVerify these matches by hand:');
  lowConfidence.forEach((m) => console.log(`  · "${m.spec}"\n    got "${m.got}" (${m.score.toFixed(2)})`));
}
if (noAbstract.length) {
  console.log(`\nNo abstract on deposit (${noAbstract.length}) — add by hand from the publisher page:`);
  noAbstract.forEach((s) => console.log(`  · ${s}`));
}
if (notFound.length) {
  console.log('\nNot found in Crossref — fully manual entry:');
  notFound.forEach((s) => console.log(`  · ${s}`));
}
if (errored.length) {
  console.log('\nLookup FAILED — status unknown, re-run before assuming anything:');
  errored.forEach((s) => console.log(`  ! ${s}`));
  process.exitCode = 1;
}
