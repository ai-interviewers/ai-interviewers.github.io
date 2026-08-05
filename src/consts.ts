export const SITE = {
  title: 'AI Interviewers',
  tagline: 'Research on using AI to conduct qualitative interviews',
  description:
    'A curated index of research papers on AI-conducted and AI-assisted qualitative interviews, plus InterviewBench.',
  url: 'https://ai-interviewers.github.io',
};

export const MAINTAINER = {
  name: 'Jonathan Ivey',
  url: 'https://jonathanivey.github.io/',
};

export const BENCHMARK = {
  name: 'InterviewBench',
  description:
    'A benchmark for AI Interviewers that predicts real-world performance with simulated participants.',
  /** TODO: fill in once the package has a home (PyPI name and/or GitHub repo). */
  packageUrl: null as string | null,
  githubUrl: null as string | null,
  /** TODO: fill in once the preprint is up. Page renders a "coming soon" state without it. */
  paperUrl: null as string | null,
  /** TODO: fill in once the citation is final — venue/year placeholders below. */
  bibtex: `@misc{interviewbench,
  title  = {InterviewBench: A Benchmark for AI Interviewers},
  author = {Ivey, Jonathan},
  year   = {2026},
  note   = {Preprint forthcoming}
}`,
};

/**
 * TODO: set once the leaderboard submission form exists. Left null rather than a
 * placeholder URL so the benchmark page can render an honest "coming soon" state
 * instead of a dead link.
 */
export const LEADERBOARD_FORM_URL: string | null = null;

export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/papers', label: 'Papers' },
  { href: '/benchmark', label: 'InterviewBench' },
  { href: '/contribute', label: 'Contribute' },
];

export const REPO = 'https://github.com/ai-interviewers/ai-interviewers.github.io';
