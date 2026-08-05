import { getCollection, type CollectionEntry } from 'astro:content';

export type Paper = CollectionEntry<'papers'>;

/** Human-facing labels for the controlled vocabularies. */
export const LABELS: Record<string, string> = {
  autonomous: 'Autonomous',
  'ai-assisted': 'AI-assisted',
  both: 'Both',
  'not-applicable': 'N/A',
  text: 'Text',
  voice: 'Voice',
  multimodal: 'Multimodal',
  'new-system': 'New system',
  'exploratory-position': 'Exploratory / position',
  'evaluation-benchmark': 'Evaluation / benchmark',
  survey: 'Survey',
  dataset: 'Dataset',
  conference: 'Conference',
  journal: 'Journal',
  workshop: 'Workshop',
  preprint: 'Preprint',
  thesis: 'Thesis',
  'tech-report': 'Tech report',
};

export const label = (v: string) => LABELS[v] ?? v;

export async function getPapers() {
  const papers = await getCollection('papers', ({ data }) => !data.draft);
  return papers.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export const year = (p: Paper) => p.data.date.getUTCFullYear();

export function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' });
}

/**
 * Venue shown compactly — full proceedings names are far too long for a card.
 * Matched longest-form-first and returned immediately, because chained `.replace()`
 * calls double-apply: stripping the prefix off "…the 2026 CHI Conference on Human
 * Factors…" and then rewriting the tail produced "2026 CHI CHI".
 */
export function shortVenue(p: Paper): string {
  const v = p.data.venue?.replace(/\s+/g, ' ').trim();
  if (!v) return p.data.venueType === 'preprint' ? 'Preprint' : label(p.data.venueType);

  const yearIn = v.match(/\b(19|20)\d{2}\b/)?.[0] ?? String(year(p));

  if (/Human Factors in Computing Systems/i.test(v)) {
    return /Extended Abstracts/i.test(v) ? `CHI EA ${yearIn}` : `CHI ${yearIn}`;
  }
  if (/Empirical Methods in Natural Language Processing/i.test(v)) {
    return /Demonstrations/i.test(v) ? `EMNLP ${yearIn} Demo` : `EMNLP ${yearIn}`;
  }
  if (/ACM on Human-Computer Interaction/i.test(v)) return 'PACM HCI';

  return v.replace(/^Proceedings of the (Extended Abstracts of the )?/i, '');
}

export const firstAuthor = (p: Paper) =>
  p.data.authors.length > 1 ? `${p.data.authors[0]} et al.` : p.data.authors[0];

/** Unconfirmed fields render differently — the dataset's provenance is visible, not hidden. */
export const isUnconfirmed = (p: Paper, field: string) => p.data.needsReview.includes(field);

/*
 * Highlighter colour per domain tag. Curated for the domains currently in the
 * collection, with a deterministic hash fallback so a newly added domain gets a stable
 * colour without anyone editing this file. All values are pale enough to carry the
 * body ink on top, and the tag always shows its name in text — the colour is a second
 * channel, never the only one.
 */
const DOMAIN_COLORS: Record<string, string> = {
  hci: '#ffe066',
  'qualitative research': '#a8ecd0',
  surveys: '#b8e0ff',
  'social science': '#ffc2d4',
  'nlp methods': '#d9f18f',
  psychology: '#e0c3fc',
  'ux research': '#ffd0a1',
  education: '#9be7de',
  health: '#ffb3b3',
  'political science': '#c9d6ff',
  'public policy': '#ffe0b3',
  'public opinion': '#d4f0a0',
  'communication research': '#f0c2e8',
  'forensic interviewing': '#cfdce4',
  hiring: '#ffdf9e',
  autobiography: '#e8d5b7',
};

export function domainColor(domain: string): string {
  const known = DOMAIN_COLORS[domain];
  if (known) return known;

  // FNV-1a, so the colour is stable across builds rather than depending on insertion order.
  let hash = 0x811c9dc5;
  for (let i = 0; i < domain.length; i++) {
    hash ^= domain.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `hsl(${hash % 360} 85% 80%)`;
}

export interface Facet {
  key: string;
  legend: string;
  options: { value: string; count: number }[];
}

/**
 * Builds facets from the data, and drops any with fewer than two distinct values.
 * With no voice papers in the collection yet, a modality filter would be a control
 * that cannot change the result set — worse than no control at all.
 */
export function buildFacets(papers: Paper[]): Facet[] {
  const tally = (values: (p: Paper) => string[]) => {
    const counts = new Map<string, number>();
    for (const p of papers) for (const v of values(p)) counts.set(v, (counts.get(v) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([value, count]) => ({ value, count }));
  };

  const candidates: Facet[] = [
    { key: 'autonomy', legend: 'Autonomy', options: tally((p) => (p.data.autonomy ? [p.data.autonomy] : [])) },
    { key: 'modality', legend: 'Modality', options: tally((p) => (p.data.modality ? [p.data.modality] : [])) },
    { key: 'type', legend: 'Paper type', options: tally((p) => p.data.paperType) },
    { key: 'venuetype', legend: 'Venue', options: tally((p) => [p.data.venueType]) },
    { key: 'domain', legend: 'Domain', options: tally((p) => p.data.domains) },
  ];

  return candidates.filter((f) => f.options.length > 1);
}

/** Flat attribute payload the client-side filter reads. Identical across all mockups. */
export function dataAttrs(p: Paper) {
  return {
    'data-paper': p.id,
    'data-year': String(year(p)),
    'data-date': p.data.date.toISOString().slice(0, 10),
    'data-title': p.data.title.toLowerCase(),
    'data-autonomy': p.data.autonomy ?? '',
    'data-modality': p.data.modality ?? '',
    'data-type': p.data.paperType.join(' '),
    'data-venuetype': p.data.venueType,
    'data-domain': p.data.domains.join('|'),
    'data-search': [
      p.data.title,
      p.data.authors.join(' '),
      p.data.venue ?? '',
      p.data.domains.join(' '),
      p.body ?? '',
    ]
      .join(' ')
      .toLowerCase(),
  };
}

export function papersByYear(papers: Paper[], segmentBy: 'autonomy' | 'type') {
  /*
   * The year axis must be continuous. Listing only years that have papers silently
   * closes the 2021-2022 gap in this collection and overstates how steady the growth
   * was — an empty column is information.
   */
  const present = papers.map(year);
  const first = Math.min(...present);
  const last = Math.max(...present);
  const years = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const segments =
    segmentBy === 'autonomy'
      ? ['autonomous', 'ai-assisted', 'both', 'not-applicable']
      : ['new-system', 'evaluation-benchmark', 'exploratory-position', 'survey', 'dataset'];

  const rows = years.map((y) => {
    const inYear = papers.filter((p) => year(p) === y);
    const counts = segments.map((s) => ({
      segment: s,
      count: inYear.filter((p) =>
        segmentBy === 'autonomy' ? p.data.autonomy === s : p.data.paperType.includes(s),
      ).length,
    }));
    return { year: y, total: inYear.length, counts };
  });

  const usedSegments = segments.filter((s) =>
    rows.some((r) => (r.counts.find((c) => c.segment === s)?.count ?? 0) > 0),
  );

  return { rows, segments: usedSegments, max: Math.max(...rows.map((r) => r.total), 1) };
}
