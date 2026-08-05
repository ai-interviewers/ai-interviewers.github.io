import type { Paper } from './papers';

/**
 * Generate a BibTeX entry from frontmatter. None of the 23 seeded papers have a
 * hand-written `bibtex` field — that was left blank deliberately during ingestion — so
 * this derives a reasonable entry from data already verified (title, authors, date,
 * venue, arXiv id), rather than leaving the "copy BibTeX" feature with nothing to copy.
 *
 * A hand-written `bibtex` field in the paper's frontmatter always wins, since a human
 * citation is more trustworthy than a generated one.
 */
export function toBibtex(paper: Paper): string {
  if (paper.data.bibtex) return paper.data.bibtex;

  const d = paper.data;
  const key = paper.id.replace(/[^a-zA-Z0-9]/g, '');
  const authors = d.authors.join(' and ');
  const year = d.date.getUTCFullYear();

  const isArxivOnly = Boolean(d.arxiv) && d.venueType === 'preprint';

  if (isArxivOnly) {
    return [
      `@misc{${key},`,
      `  title         = {${d.title}},`,
      `  author        = {${authors}},`,
      `  year          = {${year}},`,
      `  eprint        = {${d.arxiv}},`,
      `  archivePrefix = {arXiv},`,
      `  url           = {${d.url}}`,
      `}`,
    ].join('\n');
  }

  const entryType = d.venueType === 'journal' ? 'article' : 'inproceedings';
  const venueField = d.venueType === 'journal' ? 'journal' : 'booktitle';
  const lines = [
    `@${entryType}{${key},`,
    `  title    = {${d.title}},`,
    `  author   = {${authors}},`,
    `  year     = {${year}},`,
  ];
  if (d.venue) lines.push(`  ${venueField.padEnd(9)}= {${d.venue}},`);
  if (d.doi) lines.push(`  doi      = {${d.doi}},`);
  lines.push(`  url      = {${d.url}}`, `}`);
  return lines.join('\n');
}
