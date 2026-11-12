import { api } from '../../api/client';
import { toApiError } from '../../api/errors';
import {
  adminSchema,
  challengeSchema,
  sessionSchema,
  type Admin,
  type AdminSession,
  type Challenge,
  type Credentials,
} from './schemas';

const RETRY_DELAY_MS = 400;

export async function login(credentials: Credentials): Promise<Challenge> {
  const { data } = await api.post('/admin/auth/login', credentials);
  return challengeSchema.parse(data);
}

export async function verifyCode(challengeToken: string, code: string): Promise<AdminSession> {
  const { data } = await api.post('/admin/auth/verify', { challenge_token: challengeToken, code });
  return sessionSchema.parse(data);
}

/** A new access token from the session cookie. If another tab refreshed at the same
 * moment (409), the browser already holds the new cookie, so one retry succeeds. */
export async function refreshSession(): Promise<AdminSession> {
  try {
    const { data } = await api.post('/admin/auth/refresh');
    return sessionSchema.parse(data);
  } catch (error) {
    if (toApiError(error).code !== 'refresh_in_progress') {
      throw error;
    }
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    const { data } = await api.post('/admin/auth/refresh');
    return sessionSchema.parse(data);
  }
}

export async function logout(): Promise<void> {
  await api.post('/admin/auth/logout');
}

export async function fetchMe(): Promise<Admin> {
  const { data } = await api.get('/admin/auth/me');
  return adminSchema.parse(data);
}
