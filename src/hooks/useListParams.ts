import { useDebouncedCallback } from '@mantine/hooks';
import { useState } from 'react';
import { useSearchParams } from 'react-router';

const SEARCH_DELAY_MS = 350;
// The backend needs at least 2 characters to search.
const MIN_SEARCH_LENGTH = 2;

/**
 * A list's search, filters and page, kept in the URL so reloads, the back button
 * and shared links show the same list. The search box updates the URL after a
 * short pause, so each keystroke isn't a request (searches are audited).
 */
export function useListParams<F extends string>(filterNames: readonly F[]) {
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get('q') ?? '');

  const page = Math.max(1, Number(params.get('page')) || 1);
  const query = params.get('q') ?? '';
  const filters = Object.fromEntries(
    filterNames.map(name => [name, params.get(name) ?? null]),
  ) as Record<F, string | null>;

  const update = (changes: Record<string, string | null>, resetPage = true) => {
    setParams(
      current => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
        }
        if (resetPage) {
          next.delete('page');
        }
        return next;
      },
      { replace: true },
    );
  };

  const commitSearch = useDebouncedCallback((value: string) => {
    const trimmed = value.trim();
    update({ q: trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : null });
  }, SEARCH_DELAY_MS);

  return {
    page,
    query,
    filters,
    searchInput,
    setSearch: (value: string) => {
      setSearchInput(value);
      commitSearch(value);
    },
    setFilter: (name: F, value: string | null) => update({ [name]: value }),
    setPage: (next: number) => update({ page: next > 1 ? String(next) : null }, false),
    clear: () => {
      commitSearch.cancel();
      setSearchInput('');
      update({ q: null, ...Object.fromEntries(filterNames.map(name => [name, null])) });
    },
    hasFilters: Boolean(query) || filterNames.some(name => params.get(name)),
  };
}
