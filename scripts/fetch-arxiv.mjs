#!/usr/bin/env node
/**
 * Turn paper titles into draft entries by pulling factual metadata from the arXiv API.
 * Fills title, authors, date, url, arxiv id, and abstract. Deliberately leaves every
 * classification field blank — those are judgement calls for a human.
 *
 *   node scripts/fetch-arxiv.mjs --titles titles.txt
 *   node scripts/fetch-arxiv.mjs --id 2607.20310
 *   node scripts/fetch-arxiv.mjs --title "Capturing Inner Experience At Scale"
 *
 * Add --write to create files under src/content/papers/; without it, prints what it
 * would do. Matches are fuzzy, so review the reported confidence before writing.
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const PAPERS_DIR = 'src/content/papers';
const API = 'https://export.arxiv.org/api/query';

/** Each title costs up to two queries, so this is the per-title pause, not per-request. */
const REQUEST_DELAY_MS = 6000;

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? null : argv[i + 1];
};
const write = argv.includes('--write');

const exists = (p) => access(p).then(() => true, () => false);
const text = (el) => (el ? el.replace(/\s+/g, ' ').trim() : '');

/** arXiv's Atom feed is simple enough that a regex reader beats adding an XML dep. */
function parseEntries(xml) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    id: text((e.match(/<id>(.*?)<\/id>/) || [])[1]),
    title: text((e.match(/<title>([\s\S]*?)<\/title>/) || [])[1]),
    summary: text((e.match(/<summary>([\s\S]*?)<\/summary>/) || [])[1]),
    published: text((e.match(/<published>(.*?)<\/published>/) || [])[1]),
    authors: [...e.matchAll(/<author>\s*<name>(.*?)<\/name>/g)].map((m) => text(m[1])),
    comment: text((e.match(/<arxiv:comment>([\s\S]*?)<\/arxiv:comment>/) || [])[1]),
    doi: text((e.match(/<arxiv:doi>(.*?)<\/arxiv:doi>/) || [])[1]),
    journalRef: text((e.match(/<arxiv:journal_ref>([\s\S]*?)<\/arxiv:journal_ref>/) || [])[1]),
  }));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * arXiv rate-limits well before its documented ~3s/request suggests, and a 429 must
 * never be confused with "this paper isn't on arXiv" — that would silently divert
 * papers to manual entry. Retries with backoff, and throws if it still can't get through.
 */
async function query(params, attempt = 1) {
  const res = await fetch(`${API}?${params}`, {
    headers: { 'User-Agent': 'ai-interviewers.github.io metadata fetcher' },
  });

  if (res.status === 429 || res.status >= 500) {
    if (attempt > 5) throw new Error(`arXiv API returned ${res.status} after 5 attempts`);
    const retryAfter = Number(res.headers.get('retry-after')) || 0;
    const wait = Math.max(retryAfter * 1000, 5000 * 2 ** (attempt - 1));
    console.log(`      rate limited (${res.status}), waiting ${Math.round(wait / 1000)}s…`);
    await sleep(wait);
    return query(params, attempt + 1);
  }

  if (!res.ok) throw new Error(`arXiv API returned ${res.status}`);
  return parseEntries(await res.text());
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

/** Word-overlap ratio against the query title — cheap and good enough to flag bad matches. */
function similarity(a, b) {
  const A = new Set(norm(a).split(' '));
  const B = new Set(norm(b).split(' '));
  const shared = [...A].filter((w) => B.has(w)).length;
  return shared / Math.max(A.size, B.size);
}

function slugify(entry) {
  const year = entry.published.slice(0, 4);
  const surname = (entry.authors[0] || 'unknown').split(' ').pop().toLowerCase().replace(/[^a-z]/g, '');
  const words = norm(entry.title).split(' ').filter((w) => w.length > 3).slice(0, 3).join('-');
  return `${year}-${surname}-${words}`;
}

const yaml = (v) => `"${String(v).replace(/"/g, '\\"')}"`;

function toMarkdown(entry) {
  const arxivId = entry.id.match(/abs\/([^v]+)/)?.[1] ?? '';
  const venueGuess = entry.journalRef || entry.comment;
  return `---
title: ${yaml(entry.title)}
authors: [${entry.authors.map(yaml).join(', ')}]
date: ${entry.published.slice(0, 10)}
url: "https://arxiv.org/abs/${arxivId}"
arxiv: "${arxivId}"
${entry.doi ? `doi: ${yaml(entry.doi)}\n` : ''}${venueGuess ? `# arXiv comment/journal-ref, needs a human read:\n# ${venueGuess}\n` : ''}venue:
venueType: preprint

# Classification left blank on purpose — see \`npm run review\`.
autonomy:
modality:
paperType: []
domains: []

code_url:
dataset_url:
thumbnail:
bibtex:

needsReview: ["autonomy", "modality", "paperType", "domains", "venue"]
abstractIsSummary: false
draft: false
---

${entry.summary}
`;
}

async function resolve(spec) {
  if (/^\d{4}\.\d{4,5}$/.test(spec)) {
    const [entry] = await query(`id_list=${spec}`);
    return entry ? { entry, score: 1 } : null;
  }
  const results = await query(
    `search_query=ti:${encodeURIComponent(`"${spec}"`)}&start=0&max_results=5`,
  );
  const pool = results.length
    ? results
    : await query(`search_query=all:${encodeURIComponent(`"${spec}"`)}&start=0&max_results=5`);
  if (!pool.length) return null;
  const ranked = pool
    .map((entry) => ({ entry, score: similarity(spec, entry.title) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0];
}

const specs = [];
const titlesFile = flag('--titles');
if (titlesFile) {
  const raw = await readFile(titlesFile, 'utf8');
  specs.push(
    ...raw
      .split('\n')
      .map((l) => l.replace(/^\s*(?:[-*\d.]+\s*)/, '').trim())
      .filter((l) => l && !l.startsWith('#')),
  );
}
if (flag('--id')) specs.push(flag('--id'));
if (flag('--title')) specs.push(flag('--title'));

if (!specs.length) {
  console.error('Nothing to do. Pass --titles <file>, --id <arxiv id>, or --title "<title>".');
  process.exit(1);
}

await mkdir(PAPERS_DIR, { recursive: true });

const notFound = [];
const errored = [];
const lowConfidence = [];

for (const spec of specs) {
  let match;
  try {
    match = await resolve(spec);
  } catch (err) {
    // Kept apart from notFound: a transport failure says nothing about whether the
    // paper is on arXiv, and conflating the two sends papers to manual entry wrongly.
    console.log(`! ${spec}\n    lookup failed: ${err.message}`);
    errored.push(`${spec} — ${err.message}`);
    continue;
  }

  if (!match) {
    console.log(`✗ not on arXiv: ${spec}`);
    notFound.push(spec);
    continue;
  }

  const { entry, score } = match;
  const id = slugify(entry);
  const file = path.join(PAPERS_DIR, `${id}.md`);
  const confidence = score >= 0.75 ? 'high' : score >= 0.45 ? 'MEDIUM' : 'LOW';
  if (confidence !== 'high') lowConfidence.push({ spec, got: entry.title, score });

  console.log(`${confidence === 'high' ? '✔' : '?'} ${spec}`);
  console.log(`    → ${entry.title}`);
  console.log(`      ${id}  (match ${confidence}, ${score.toFixed(2)})`);

  if (write) {
    if (await exists(file)) {
      console.log('      already exists, skipped');
    } else {
      await writeFile(file, toMarkdown(entry));
    }
  }

  await sleep(REQUEST_DELAY_MS);
}

console.log(write ? '\nFiles written.' : '\nDry run — re-run with --write to create files.');

if (lowConfidence.length) {
  console.log('\nVerify these matches by hand:');
  lowConfidence.forEach((m) => console.log(`  · "${m.spec}"\n    got "${m.got}" (${m.score.toFixed(2)})`));
}
if (notFound.length) {
  console.log('\nNot on arXiv — needs manual entry (likely an ACM/IEEE/journal venue):');
  notFound.forEach((s) => console.log(`  · ${s}`));
}
if (errored.length) {
  console.log('\nLookup FAILED — status unknown, re-run these before assuming anything:');
  errored.forEach((s) => console.log(`  ! ${s}`));
  process.exitCode = 1;
}
