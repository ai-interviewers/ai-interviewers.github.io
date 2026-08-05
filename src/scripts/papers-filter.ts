/**
 * Filter / sort / search over server-rendered paper nodes.
 *
 * Every paper is already in the HTML; this only shows and hides. That keeps the full
 * list indexable and working without JS, and means one script serves every visual
 * direction — the markup differs, the data attributes do not.
 *
 * State lives in the URL so a filtered view is linkable and Back behaves.
 */

type Sort = 'date-desc' | 'date-asc' | 'title-asc' | 'venue-asc';

const root = document.querySelector<HTMLElement>('[data-explorer]');
if (root) init(root);

function init(root: HTMLElement) {
  const papers = [...root.querySelectorAll<HTMLElement>('[data-paper]')];
  const searchInput = root.querySelector<HTMLInputElement>('[data-search-input]');
  const sortSelect = root.querySelector<HTMLSelectElement>('[data-sort]');
  const checkboxes = [...root.querySelectorAll<HTMLInputElement>('input[data-filter]')];
  const countEl = root.querySelector<HTMLElement>('[data-count]');
  const emptyEl = root.querySelector<HTMLElement>('[data-empty]');
  const clearBtn = root.querySelector<HTMLElement>('[data-clear]');
  const viewButtons = [...root.querySelectorAll<HTMLElement>('[data-view-btn]')];

  // Containers are re-ordered in place, so sorting works in whichever view is visible.
  const lists = [...root.querySelectorAll<HTMLElement>('[data-paper-list]')];

  const VIEW_KEY = 'ai-interviewers:view';

  function readUrl() {
    const q = new URLSearchParams(location.search);
    if (searchInput) searchInput.value = q.get('q') ?? '';
    if (sortSelect) sortSelect.value = q.get('sort') ?? 'date-desc';
    for (const cb of checkboxes) {
      const selected = (q.get(cb.dataset.filter!) ?? '').split(',').filter(Boolean);
      cb.checked = selected.includes(cb.value);
    }
    const view = q.get('view') ?? localStorage.getItem(VIEW_KEY) ?? 'tile';
    setView(view, false);
  }

  function writeUrl() {
    const q = new URLSearchParams();
    if (searchInput?.value.trim()) q.set('q', searchInput.value.trim());
    if (sortSelect && sortSelect.value !== 'date-desc') q.set('sort', sortSelect.value);
    for (const key of new Set(checkboxes.map((c) => c.dataset.filter!))) {
      const on = checkboxes.filter((c) => c.dataset.filter === key && c.checked).map((c) => c.value);
      if (on.length) q.set(key, on.join(','));
    }
    const view = root.dataset.view;
    if (view && view !== 'tile') q.set('view', view);
    const qs = q.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }

  function setView(view: string, persist = true) {
    root.dataset.view = view;
    for (const btn of viewButtons) {
      const active = btn.dataset.viewBtn === view;
      btn.setAttribute('aria-pressed', String(active));
    }
    if (persist) {
      localStorage.setItem(VIEW_KEY, view);
      writeUrl();
    }
  }

  function activeFilters() {
    const groups = new Map<string, string[]>();
    for (const cb of checkboxes) {
      if (!cb.checked) continue;
      const key = cb.dataset.filter!;
      groups.set(key, [...(groups.get(key) ?? []), cb.value]);
    }
    return groups;
  }

  function matches(el: HTMLElement, query: string, groups: Map<string, string[]>) {
    if (query && !(el.dataset.search ?? '').includes(query)) return false;

    for (const [key, values] of groups) {
      // Multi-value fields (type, domain) are OR within a group, AND across groups.
      const raw = el.dataset[key] ?? '';
      const owned = key === 'domain' ? raw.split('|') : raw.split(' ');
      if (!values.some((v) => owned.includes(v))) return false;
    }
    return true;
  }

  function apply() {
    const query = (searchInput?.value ?? '').trim().toLowerCase();
    const groups = activeFilters();

    let visible = 0;
    const seen = new Set<string>();
    for (const el of papers) {
      const ok = matches(el, query, groups);
      el.hidden = !ok;
      if (ok && !seen.has(el.dataset.paper!)) {
        seen.add(el.dataset.paper!);
        visible++;
      }
    }

    if (countEl) countEl.textContent = String(visible);
    if (emptyEl) emptyEl.hidden = visible > 0;
    if (clearBtn) clearBtn.hidden = !query && groups.size === 0;

    sort();
    writeUrl();
  }

  function sort() {
    const mode = (sortSelect?.value ?? 'date-desc') as Sort;
    for (const list of lists) {
      const items = [...list.querySelectorAll<HTMLElement>('[data-paper]')];
      items.sort((a, b) => {
        switch (mode) {
          case 'date-asc':
            return (a.dataset.date ?? '').localeCompare(b.dataset.date ?? '');
          case 'title-asc':
            return (a.dataset.title ?? '').localeCompare(b.dataset.title ?? '');
          case 'venue-asc':
            return (a.dataset.venuetype ?? '').localeCompare(b.dataset.venuetype ?? '');
          default:
            return (b.dataset.date ?? '').localeCompare(a.dataset.date ?? '');
        }
      });
      for (const item of items) list.appendChild(item);
    }
  }

  searchInput?.addEventListener('input', apply);
  sortSelect?.addEventListener('change', apply);
  for (const cb of checkboxes) cb.addEventListener('change', apply);
  for (const btn of viewButtons) {
    btn.addEventListener('click', () => {
      setView(btn.dataset.viewBtn!);
      apply();
    });
  }
  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    for (const cb of checkboxes) cb.checked = false;
    apply();
  });

  // Mobile filter drawer. Desktop hides the toggle entirely and shows the controls.
  const drawer = root.querySelector<HTMLElement>('[data-explorer] .filter-drawer, .filter-drawer');
  const drawerToggle = root.querySelector<HTMLElement>('[data-drawer-toggle]');
  drawerToggle?.addEventListener('click', () => {
    const open = drawer?.hasAttribute('data-open');
    if (open) drawer?.removeAttribute('data-open');
    else drawer?.setAttribute('data-open', '');
    drawerToggle.setAttribute('aria-expanded', String(!open));
  });

  // Chart segments double as filter controls.
  for (const seg of root.querySelectorAll<HTMLElement>('[data-chart-filter]')) {
    seg.addEventListener('click', () => {
      const [key, value] = seg.dataset.chartFilter!.split(':');
      const cb = checkboxes.find((c) => c.dataset.filter === key && c.value === value);
      if (!cb) return;
      cb.checked = !cb.checked;
      apply();
      root.querySelector('[data-results]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  readUrl();
  apply();
}
