#!/usr/bin/env node
/**
 * Generate paper thumbnails from the top of page 1 of each PDF, in the style of
 * huggingface.co/papers.
 *
 * Requires poppler (`pdftoppm`, `pdfinfo`) and `cwebp` — both from Homebrew:
 *   brew install poppler webp
 *
 * Run:  npm run thumbs          (skips papers that already have a thumbnail)
 *       npm run thumbs -- --force
 *
 * Only papers with an `arxiv` id or an explicit `pdfUrl` can be processed. Paywalled
 * venues are reported as skipped rather than failing the run; those entries fall back
 * to the typographic card in the UI.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const run = promisify(execFile);

const PAPERS_DIR = 'src/content/papers';
const OUT_DIR = 'public/thumbnails';
const CACHE_DIR = '.cache/pdfs';

const DPI = 150;
const TOP_FRACTION = 0.42; // How much of page 1 to keep — title block plus abstract head.
const WEBP_QUALITY = 78;
const WEBP_WIDTH = 800;

const force = process.argv.includes('--force');

const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  );

function pdfUrlFor(data) {
  if (data.pdfUrl) return data.pdfUrl;
  if (data.arxiv) return `https://arxiv.org/pdf/${data.arxiv}`;
  return null;
}

async function download(url, dest) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'ai-interviewers.github.io thumbnailer' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

/** Page 1 dimensions in points, so the crop is resolution independent. */
async function pageSize(pdf) {
  const { stdout } = await run('pdfinfo', [pdf]);
  const m = stdout.match(/Page size:\s+([\d.]+) x ([\d.]+)/);
  if (!m) throw new Error('could not read page size');
  return { width: Number(m[1]), height: Number(m[2]) };
}

async function renderTop(pdf, outBase) {
  const { width, height } = await pageSize(pdf);
  const pxWidth = Math.round((width * DPI) / 72);
  const pxHeight = Math.round(((height * DPI) / 72) * TOP_FRACTION);

  await run('pdftoppm', [
    '-f', '1', '-l', '1',
    '-r', String(DPI),
    '-png',
    '-x', '0', '-y', '0',
    '-W', String(pxWidth),
    '-H', String(pxHeight),
    '-singlefile',
    pdf,
    outBase,
  ]);
  return `${outBase}.png`;
}

/**
 * Record the generated path on the entry. Edits the `thumbnail:` line in place with a
 * regex rather than re-serialising via gray-matter, which would drop the comments and
 * field order that make these files pleasant to hand-edit.
 */
async function recordThumbnail(file, value) {
  const raw = await readFile(file, 'utf8');
  const end = raw.indexOf('\n---', 3);
  if (!raw.startsWith('---') || end === -1) return;

  const head = raw.slice(0, end);
  const tail = raw.slice(end);
  const line = `thumbnail: "${value}"`;

  const updated = /^thumbnail:.*$/m.test(head)
    ? head.replace(/^thumbnail:.*$/m, line)
    : `${head}\n${line}`;

  await writeFile(file, updated + tail);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });

  const files = (await readdir(PAPERS_DIR)).filter((f) => f.endsWith('.md'));
  if (files.length === 0) {
    console.log('No papers yet — nothing to do.');
    return;
  }

  const skipped = [];
  const failed = [];
  let made = 0;

  for (const file of files) {
    const id = file.replace(/\.md$/, '');
    const { data } = matter(await readFile(path.join(PAPERS_DIR, file), 'utf8'));
    const out = path.join(OUT_DIR, `${id}.webp`);

    if (!force && (await exists(out))) continue;

    const url = pdfUrlFor(data);
    if (!url) {
      skipped.push(id);
      continue;
    }

    try {
      const pdf = path.join(CACHE_DIR, `${id}.pdf`);
      if (!(await exists(pdf))) await download(url, pdf);

      const png = await renderTop(pdf, path.join(CACHE_DIR, id));
      await run('cwebp', ['-q', String(WEBP_QUALITY), '-resize', String(WEBP_WIDTH), '0', png, '-o', out]);
      await recordThumbnail(path.join(PAPERS_DIR, file), `/thumbnails/${id}.webp`);

      console.log(`✔ ${id}`);
      made++;
    } catch (err) {
      failed.push(`${id}: ${err.message}`);
    }
  }

  console.log(`\n${made} thumbnail(s) generated.`);
  if (skipped.length) {
    console.log(`\n${skipped.length} skipped (no arxiv id or pdfUrl — will use a typographic card):`);
    skipped.forEach((s) => console.log(`  · ${s}`));
  }
  if (failed.length) {
    console.log(`\n${failed.length} failed:`);
    failed.forEach((f) => console.log(`  ✗ ${f}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
