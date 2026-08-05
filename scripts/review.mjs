#!/usr/bin/env node
/**
 * Lists what is still unverified across the collection, so the classification
 * backlog can be worked through without opening every file.
 *
 *   npm run review
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const PAPERS_DIR = 'src/content/papers';
const CLASSIFICATION = ['autonomy', 'modality', 'paperType', 'domains'];

const isBlank = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

const files = (await readdir(PAPERS_DIR)).filter((f) => f.endsWith('.md'));

if (files.length === 0) {
  console.log('No papers yet.');
  process.exit(0);
}

const rows = [];
const counts = Object.fromEntries(CLASSIFICATION.map((f) => [f, 0]));

for (const file of files) {
  const { data } = matter(await readFile(path.join(PAPERS_DIR, file), 'utf8'));
  const missing = CLASSIFICATION.filter((f) => isBlank(data[f]));
  const flagged = data.needsReview ?? [];
  missing.forEach((f) => counts[f]++);
  if (missing.length || flagged.length) {
    rows.push({ id: file.replace(/\.md$/, ''), title: data.title, missing, flagged });
  }
}

console.log(`${files.length} paper(s); ${rows.length} need attention.\n`);

for (const r of rows) {
  console.log(`${r.id}`);
  console.log(`  ${r.title}`);
  if (r.missing.length) console.log(`  missing:  ${r.missing.join(', ')}`);
  const unverified = r.flagged.filter((f) => !r.missing.includes(f));
  if (unverified.length) console.log(`  unverified: ${unverified.join(', ')}`);
  console.log();
}

console.log('Missing by field:');
for (const [field, n] of Object.entries(counts)) {
  console.log(`  ${field.padEnd(12)} ${n}/${files.length}`);
}
