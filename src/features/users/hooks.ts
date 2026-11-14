import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { fetchUser, fetchUsers } from './api';
import type { UserListParams } from './schemas';

// Searches and user views are audited: refetch on navigation, not on window focus.

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => fetchUsers(params),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => fetchUser(userId),
    refetchOnWindowFocus: false,
  });
}
