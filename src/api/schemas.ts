import { z } from 'zod';

// Shared response pieces (checked, so a wrong shape fails loudly instead of half-working).

export const kycStatusSchema = z.enum([
  'not_submitted',
  'in_progress',
  'pending_review',
  'verified',
  'rejected',
]);
export type KycStatus = z.infer<typeof kycStatusSchema>;

export const userStatusSchema = z.enum(['pending_verification', 'active', 'blocked']);
export type UserStatus = z.infer<typeof userStatusSchema>;

export const userRoleSchema = z.enum(['customer', 'merchant', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const cardNetworkSchema = z.enum([
  'visa',
  'mastercard',
  'rupay',
  'amex',
  'diners',
  'maestro',
  'jcb',
  'unknown',
]);
export type CardNetwork = z.infer<typeof cardNetworkSchema>;

export const cardTypeSchema = z.enum(['credit', 'debit', 'prepaid', 'unknown']);
export type CardType = z.infer<typeof cardTypeSchema>;

export const cardStatusSchema = z.enum(['active', 'removed']);
export type CardStatus = z.infer<typeof cardStatusSchema>;

export const rejectionReasonSchema = z.enum([
  'name_mismatch',
  'photo_mismatch',
  'document_issue',
  'other',
]);
export type RejectionReason = z.infer<typeof rejectionReasonSchema>;

export function pageSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  });
}
export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/** Rows per page in every list. */
export const PAGE_SIZE = 25;

/** Query params without the empty ones, so the URL and cache keys stay tidy. */
export function compactParams<T extends Record<string, string | number | null | undefined>>(
  params: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== null && value !== undefined && value !== '',
    ),
  ) as Partial<T>;
}
