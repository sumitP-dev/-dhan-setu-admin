import { z } from 'zod';

// ---- Forms

export const credentialsSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email').pipe(z.email('Enter a valid email')),
  password: z.string().min(1, 'Enter your password').max(128, 'Password is too long'),
});
export type Credentials = z.infer<typeof credentialsSchema>;

export const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});
export type CodeForm = z.infer<typeof codeSchema>;

// ---- API responses (checked, so a wrong shape fails loudly instead of half-working)

export const adminSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  email: z.string(),
});
export type Admin = z.infer<typeof adminSchema>;

export const challengeSchema = z.object({
  challenge_token: z.string().min(1),
  phone_hint: z.string(),
  expires_in: z.number(),
  resend_after: z.number(),
  dev_otp: z.string().optional(),
});
export type Challenge = z.infer<typeof challengeSchema>;

export const sessionSchema = z.object({
  admin: adminSchema,
  access_token: z.string().min(1),
  token_type: z.literal('bearer'),
  expires_in: z.number(),
  session_expires_at: z.string(),
});
export type AdminSession = z.infer<typeof sessionSchema>;
