#!/usr/bin/env node
/**
 * Lists every domain tag with its count, plus pairs that look like near-duplicates.
 * Free-text tags drift within a dozen entries; this is the guard against that.
 *
 *   npm run tags
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const PAPERS_DIR = 'src/content/papers';

const files = (await readdir(PAPERS_DIR)).filter((f) => f.endsWith('.md'));
const counts = new Map();

for (const file of files) {
  const { data } = matter(await readFile(path.join(PAPERS_DIR, file), 'utf8'));
  for (const raw of data.domains ?? []) {
    const tag = String(raw).trim().toLowerCase();
    if (tag) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
}

if (counts.size === 0) {
  console.log('No domain tags yet.');
  process.exit(0);
}

const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
console.log(`${counts.size} distinct tag(s) across ${files.length} paper(s):\n`);
for (const [tag, n] of sorted) console.log(`  ${String(n).padStart(3)}  ${tag}`);

/** Levenshtein, capped — only used to nominate candidates for a human to judge. */
function near(a, b) {
  if (Math.abs(a.length - b.length) > 3) return false;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return d[a.length][b.length] <= 2;
}

const tags = sorted.map(([t]) => t);
const suspects = [];
for (let i = 0; i < tags.length; i++) {
  for (let j = i + 1; j < tags.length; j++) {
    if (near(tags[i], tags[j]) || tags[i].startsWith(tags[j]) || tags[j].startsWith(tags[i])) {
      suspects.push([tags[i], tags[j]]);
    }
  }
}

if (suspects.length) {
  console.log('\nPossible duplicates — merge if they mean the same thing:');
  for (const [a, b] of suspects) console.log(`  "${a}"  ↔  "${b}"`);
}
