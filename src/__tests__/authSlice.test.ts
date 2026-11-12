import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAccessToken, setAccessToken } from '../api/session';
import * as authApi from '../features/auth/api';
import { restoreSession, setupStore, signOut, startSession } from '../store';

const session = {
  admin: { id: 'a1', full_name: 'Meera Admin', email: 'admin@example.com' },
  access_token: 'tok-1',
  token_type: 'bearer' as const,
  expires_in: 600,
  session_expires_at: '2030-01-01T00:00:00Z',
};

describe('auth state', () => {
  beforeEach(() => {
    vi.spyOn(authApi, 'logout').mockResolvedValue();
  });

  it('starts checking, so nothing is shown before the session is known', () => {
    expect(setupStore().getState().auth.status).toBe('checking');
  });

  it('keeps the token in memory, not in the store', async () => {
    const store = setupStore();
    await store.dispatch(startSession(session));

    expect(store.getState().auth).toMatchObject({ status: 'signedIn', admin: session.admin });
    expect(JSON.stringify(store.getState())).not.toContain('tok-1');
    expect(getAccessToken()).toBe('tok-1');
  });

  it('restores a session from the cookie on page load', async () => {
    vi.spyOn(authApi, 'refreshSession').mockResolvedValue(session);
    const store = setupStore();

    await store.dispatch(restoreSession());

    expect(store.getState().auth.status).toBe('signedIn');
  });

  it('shows sign-in when there is no session to restore', async () => {
    vi.spyOn(authApi, 'refreshSession').mockRejectedValue(new Error('401'));
    const store = setupStore();

    await store.dispatch(restoreSession());

    expect(store.getState().auth).toMatchObject({ status: 'signedOut', signOutReason: null });
  });

  it('signs out on the server and forgets the token', async () => {
    const store = setupStore();
    await store.dispatch(startSession(session));

    await store.dispatch(signOut('idle'));

    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(store.getState().auth).toMatchObject({ status: 'signedOut', signOutReason: 'idle' });
    expect(getAccessToken()).toBeNull();
  });

  it('still signs out locally if the server call fails', async () => {
    vi.mocked(authApi.logout).mockRejectedValue(new Error('offline'));
    setAccessToken('tok-1');
    const store = setupStore();

    await store.dispatch(signOut('signed_out'));

    expect(store.getState().auth.status).toBe('signedOut');
    expect(getAccessToken()).toBeNull();
  });
});

describe('refreshSession', () => {
  it('retries once when another tab just refreshed', async () => {
    const { api } = await import('../api/client');
    const { ApiError } = await import('../api/errors');
    const post = vi
      .spyOn(api, 'post')
      .mockRejectedValueOnce(new ApiError(409, 'refresh_in_progress', 'retry', null))
      .mockResolvedValueOnce({ data: session });

    await expect(authApi.refreshSession()).resolves.toEqual(session);
    expect(post).toHaveBeenCalledTimes(2);
  });
});
