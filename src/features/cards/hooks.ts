import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { fetchCards } from './api';
import type { CardListParams } from './schemas';

export function useCards(params: CardListParams) {
  return useQuery({
    queryKey: ['admin', 'cards', params],
    queryFn: () => fetchCards(params),
    placeholderData: keepPreviousData,
    // Searches are audited: refetch on navigation, not on every window focus.
    refetchOnWindowFocus: false,
  });
}
