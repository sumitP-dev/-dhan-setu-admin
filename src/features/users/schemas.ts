import { z } from 'zod';

import { kycStatusSchema, pageSchema, userRoleSchema, userStatusSchema } from '../../api/schemas';
import { cardSchema } from '../cards/schemas';

export const userItemSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  email: z.string(),
  phone: z.string(),
  role: userRoleSchema,
  status: userStatusSchema,
  kyc_status: kycStatusSchema,
  active_cards: z.number(),
  created_at: z.string(),
  last_login_at: z.string().nullable(),
});
export type UserItem = z.infer<typeof userItemSchema>;

export const userPageSchema = pageSchema(userItemSchema);

export const userDetailSchema = userItemSchema.extend({
  kyc: z.object({
    status: kycStatusSchema,
    submitted_at: z.string().nullable(),
    decided_at: z.string().nullable(),
    decided_by: z.string().nullable(),
    rejection_reason: z.string().nullable(),
    rejection_note: z.string().nullable(),
  }),
  cards: z.array(cardSchema),
});
export type UserDetail = z.infer<typeof userDetailSchema>;

export interface UserListParams {
  q?: string;
  kyc_status?: string;
  status?: string;
  limit: number;
  offset: number;
}
