import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api, configureSession } from '../api/client';
import { ApiError } from '../api/errors';
import { getAccessToken, setAccessToken } from '../api/session';

type Reply = { status: number; data?: unknown };

function reply(config: InternalAxiosRequestConfig, { status, data }: Reply) {
  const response = { status, data, statusText: '', headers: {}, config };
  if (status >= 400) {
    return Promise.reject(new AxiosError('fail', undefined, config, undefined, response));
  }
  return Promise.resolve(response);
}

const expired = { error: { code: 'token_expired', message: 'Access token expired' } };
const ended = { error: { code: 'session_expired', message: 'Your session has ended.' } };

describe('api client', () => {
  const refresh = vi.fn<() => Promise<string>>();
  const sessionEnded = vi.fn();
  let seen: InternalAxiosRequestConfig[];

  function respondWith(handler: (config: InternalAxiosRequestConfig) => Reply) {
    api.defaults.adapter = (config => {
      seen.push(config);
      return reply(config, handler(config));
    }) as AxiosAdapter;
  }

  beforeEach(() => {
    seen = [];
    refresh.mockReset();
    sessionEnded.mockReset();
    configureSession({ refresh, ended: sessionEnded });
  });

  it('sends the admin client header, cookies, and the token from memory', async () => {
    setAccessToken('tok-1');
    respondWith(() => ({ status: 200, data: [] }));

    await api.get('/admin/kyc');

    const sent = seen[0]!;
    expect(sent.headers['X-Admin-Client']).toBe('dhan-setu-admin');
    expect(sent.headers.Authorization).toBe('Bearer tok-1');
    expect(sent.withCredentials).toBe(true);
  });

  it('never sends the access token to the sign-in endpoints', async () => {
    setAccessToken('tok-1');
    respondWith(() => ({ status: 200, data: {} }));

    await api.post('/admin/auth/refresh');

    expect(seen[0]!.headers.Authorization).toBeUndefined();
  });

  it('refreshes an expired token once and retries', async () => {
    setAccessToken('old');
    refresh.mockImplementation(async () => {
      setAccessToken('new');
      return 'new';
    });
    respondWith(config =>
      config.headers.Authorization === 'Bearer old'
        ? { status: 401, data: expired }
        : { status: 200, data: { ok: true } },
    );

    const response = await api.get('/admin/kyc');

    expect(response.data).toEqual({ ok: true });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(seen.at(-1)!.headers.Authorization).toBe('Bearer new');
  });

  it('shares one refresh between requests that expire together', async () => {
    setAccessToken('old');
    refresh.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      setAccessToken('new');
      return 'new';
    });
    respondWith(config =>
      config.headers.Authorization === 'Bearer old'
        ? { status: 401, data: expired }
        : { status: 200, data: {} },
    );

    await Promise.all([api.get('/admin/kyc'), api.get('/admin/kyc/1'), api.get('/admin/kyc/2')]);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('signs out when the refresh fails', async () => {
    setAccessToken('old');
    refresh.mockRejectedValue(new Error('no session'));
    respondWith(() => ({ status: 401, data: expired }));

    await expect(api.get('/admin/kyc')).rejects.toBeInstanceOf(ApiError);
    expect(sessionEnded).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
  });

  it('signs out at once when the session has ended', async () => {
    setAccessToken('tok');
    respondWith(() => ({ status: 401, data: ended }));

    await expect(api.get('/admin/kyc')).rejects.toMatchObject({ code: 'session_expired' });
    expect(refresh).not.toHaveBeenCalled();
    expect(sessionEnded).toHaveBeenCalledTimes(1);
  });

  it('turns errors into ApiError with the backend code and message', async () => {
    respondWith(() => ({
      status: 409,
      data: { error: { code: 'kyc_not_pending_review', message: 'Already decided' } },
    }));

    await expect(api.post('/admin/kyc/1/approve')).rejects.toMatchObject({
      status: 409,
      code: 'kyc_not_pending_review',
      message: 'Already decided',
    });
    expect(sessionEnded).not.toHaveBeenCalled();
  });
});
