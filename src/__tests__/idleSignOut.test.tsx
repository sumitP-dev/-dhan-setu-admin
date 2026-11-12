import { act, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as authApi from '../features/auth/api';
import { useIdleSignOut } from '../hooks/useIdleSignOut';
import { setupStore } from '../store';
import { signedInState } from '../testing/renderWithProviders';

function Probe() {
  useIdleSignOut(1000);
  return null;
}

describe('idle sign-out', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(authApi, 'logout').mockResolvedValue();
  });
  afterEach(() => vi.useRealTimers());

  it('signs out after the idle time without input', async () => {
    const store = setupStore(signedInState);
    render(
      <Provider store={store}>
        <Probe />
      </Provider>,
    );

    await act(async () => {
      vi.advanceTimersByTime(600);
      document.dispatchEvent(new KeyboardEvent('keydown'));
      vi.advanceTimersByTime(600);
    });
    expect(store.getState().auth.status).toBe('signedIn'); // input reset the timer

    await act(async () => {
      vi.advanceTimersByTime(1100);
    });
    expect(store.getState().auth).toMatchObject({ status: 'signedOut', signOutReason: 'idle' });
  });
});
