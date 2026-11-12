import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { env } from '../config/env';
import { getAccessToken, setAccessToken } from './session';
import { toApiError } from './errors';

export const ADMIN_CLIENT_HEADER = { 'X-Admin-Client': 'dhan-setu-admin' } as const;

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  // Sends the session cookie to /admin/auth/*. The cookie is httpOnly: scripts never see it.
  withCredentials: true,
  headers: { ...ADMIN_CLIENT_HEADER },
});

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

// ---- Session refresh

type RefreshFn = () => Promise<string>;
type EndedFn = () => void;

let refreshSession: RefreshFn | null = null;
let onSessionEnded: EndedFn | null = null;
let refreshing: Promise<string> | null = null;

/** Wired by the store: how to get a new access token, and what to do when the session ends. */
export function configureSession(handlers: { refresh: RefreshFn; ended: EndedFn }): void {
  refreshSession = handlers.refresh;
  onSessionEnded = handlers.ended;
}

/** One refresh at a time: requests that fail together wait for the same refresh. */
export function refreshOnce(): Promise<string> {
  if (!refreshSession) {
    return Promise.reject(new Error('Session not configured'));
  }
  refreshing ??= refreshSession().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

const isAuthCall = (url: string | undefined) => (url ?? '').startsWith('/admin/auth/');

api.interceptors.request.use(config => {
  const token = getAccessToken();
  if (token && !isAuthCall(config.url)) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetryableConfig | undefined;
  const apiError = toApiError(error);
  if (apiError.status !== 401 || !config || isAuthCall(config.url)) {
    throw apiError;
  }
  if (apiError.code === 'token_expired' && !config._retried) {
    config._retried = true;
    try {
      await refreshOnce();
    } catch {
      setAccessToken(null);
      onSessionEnded?.();
      throw apiError;
    }
    return api.request(config);
  }
  // Session ended, revoked or the token is unusable: sign out.
  setAccessToken(null);
  onSessionEnded?.();
  throw apiError;
});
