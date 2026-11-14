import { z } from 'zod';

import { kycStatusSchema, pageSchema, rejectionReasonSchema } from '../../api/schemas';

export const queueItemSchema = z.object({
  user_id: z.string(),
  full_name: z.string(),
  phone: z.string(),
  kyc_status: kycStatusSchema,
  submitted_at: z.string().nullable(),
  aadhaar: z.string().nullable(),
  pan: z.string().nullable(),
  selfie_match_score: z.number().nullable(),
});
export type QueueItem = z.infer<typeof queueItemSchema>;

export const queuePageSchema = pageSchema(queueItemSchema);

export const reviewDetailSchema = z.object({
  account: z.object({
    id: z.string(),
    full_name: z.string(),
    email: z.string(),
    phone: z.string(),
    created_at: z.string(),
  }),
  kyc_status: kycStatusSchema,
  submitted_at: z.string().nullable(),
  details: z
    .object({
      name: z.string(),
      date_of_birth: z.string().nullable(),
      birth_year: z.number(),
      gender: z.string(),
      address: z.string().nullable(),
      aadhaar: z.string(),
      pan: z.string().nullable(),
      pan_verified: z.boolean(),
      pan_issue: z.string().nullable(),
      pan_issue_message: z.string().nullable(),
      selfie_verified: z.boolean(),
      fetched_at: z.string(),
    })
    .nullable(),
  account_name_matches: z.boolean().nullable(),
  pan_source: z.string().nullable(),
  selfie: z
    .object({
      is_live: z.boolean().nullable(),
      match_score: z.number().nullable(),
      min_match_score: z.number(),
      completed_at: z.string().nullable(),
    })
    .nullable(),
  can_decide: z.boolean(),
  events: z.array(
    z.object({
      from_status: kycStatusSchema,
      to_status: kycStatusSchema,
      reason: z.string(),
      note: z.string().nullable(),
      actor_id: z.string().nullable(),
      created_at: z.string(),
    }),
  ),
});
export type ReviewDetail = z.infer<typeof reviewDetailSchema>;

// ---- Forms

export const rejectSchema = z
  .object({
    reason: rejectionReasonSchema,
    note: z.string().trim().max(500, 'Keep the note under 500 characters'),
  })
  .superRefine((value, ctx) => {
    if (value.reason === 'other' && value.note.length < 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['note'],
        message: 'Add a note when the reason is “Other”',
      });
    } else if (value.note.length > 0 && value.note.length < 3) {
      ctx.addIssue({ code: 'custom', path: ['note'], message: 'Write at least 3 characters' });
    }
  });
export type RejectForm = z.input<typeof rejectSchema>;
