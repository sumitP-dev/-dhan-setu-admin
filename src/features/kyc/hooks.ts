import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toApiError } from '../../api/errors';
import type { KycStatus, RejectionReason } from '../../api/schemas';
import { approveKyc, fetchQueue, fetchReview, rejectKyc } from './api';
import type { ReviewDetail } from './schemas';

export function useKycQueue(status: KycStatus, limit: number, offset: number) {
  return useQuery({
    queryKey: ['kyc', 'queue', status, limit, offset],
    queryFn: () => fetchQueue(status, limit, offset),
    placeholderData: keepPreviousData,
  });
}

/** How many submissions are waiting, for the sidebar. */
export function usePendingKycCount() {
  return useQuery({
    queryKey: ['kyc', 'queue', 'pending_review', 1, 0],
    queryFn: () => fetchQueue('pending_review', 1, 0),
    select: page => page.total,
    staleTime: 60_000,
  });
}

export function useKycReview(userId: string) {
  return useQuery({
    queryKey: ['kyc', 'review', userId],
    queryFn: () => fetchReview(userId),
    // Each opening is recorded: don't refetch just because the window got focus.
    refetchOnWindowFocus: false,
  });
}

type Decision =
  { kind: 'approve' } | { kind: 'reject'; reason: RejectionReason; note: string | null };

export function useKycDecision(userId: string) {
  const queryClient = useQueryClient();
  const refreshLists = () => {
    void queryClient.invalidateQueries({ queryKey: ['kyc', 'queue'] });
    void queryClient.invalidateQueries({ queryKey: ['admin'] });
  };
  return useMutation({
    mutationFn: (decision: Decision): Promise<ReviewDetail> =>
      decision.kind === 'approve'
        ? approveKyc(userId)
        : rejectKyc(userId, decision.reason, decision.note),
    onSuccess: detail => {
      queryClient.setQueryData(['kyc', 'review', userId], detail);
      refreshLists();
    },
    onError: error => {
      // Someone else decided first, or the KYC changed: show what it is now.
      if (toApiError(error).status === 409) {
        void queryClient.invalidateQueries({ queryKey: ['kyc', 'review', userId] });
        refreshLists();
      }
    },
  });
}
