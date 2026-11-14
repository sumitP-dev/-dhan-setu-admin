import { api } from '../../api/client';
import type { KycStatus, Page, RejectionReason } from '../../api/schemas';
import { queuePageSchema, reviewDetailSchema, type QueueItem, type ReviewDetail } from './schemas';

export async function fetchQueue(
  status: KycStatus,
  limit: number,
  offset: number,
): Promise<Page<QueueItem>> {
  const { data } = await api.get('/admin/kyc', { params: { status, limit, offset } });
  return queuePageSchema.parse(data);
}

export async function fetchReview(userId: string): Promise<ReviewDetail> {
  const { data } = await api.get(`/admin/kyc/${encodeURIComponent(userId)}`);
  return reviewDetailSchema.parse(data);
}

export async function approveKyc(userId: string): Promise<ReviewDetail> {
  const { data } = await api.post(`/admin/kyc/${encodeURIComponent(userId)}/approve`);
  return reviewDetailSchema.parse(data);
}

export async function rejectKyc(
  userId: string,
  reason: RejectionReason,
  note: string | null,
): Promise<ReviewDetail> {
  const { data } = await api.post(`/admin/kyc/${encodeURIComponent(userId)}/reject`, {
    reason,
    note,
  });
  return reviewDetailSchema.parse(data);
}
