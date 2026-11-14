import { z } from 'zod';

import {
  cardNetworkSchema,
  cardStatusSchema,
  cardTypeSchema,
  kycStatusSchema,
  pageSchema,
} from '../../api/schemas';

/** A saved card: only what is safe to show (never the gateway token). */
export const cardSchema = z.object({
  id: z.string(),
  last4: z.string(),
  network: cardNetworkSchema,
  card_type: cardTypeSchema,
  issuer: z.string().nullable(),
  expiry_month: z.number(),
  expiry_year: z.number(),
  expired: z.boolean(),
  is_default: z.boolean(),
  status: cardStatusSchema,
  created_at: z.string(),
  removed_at: z.string().nullable(),
});
export type Card = z.infer<typeof cardSchema>;

export const cardWithOwnerSchema = cardSchema.extend({
  owner: z.object({
    id: z.string(),
    full_name: z.string(),
    phone: z.string(),
    kyc_status: kycStatusSchema,
  }),
});
export type CardWithOwner = z.infer<typeof cardWithOwnerSchema>;

export const cardPageSchema = pageSchema(cardWithOwnerSchema);

export interface CardListParams {
  q?: string;
  status?: string;
  network?: string;
  card_type?: string;
  limit: number;
  offset: number;
}
