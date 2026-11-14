import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../api/errors';
import { getAccessToken } from '../api/session';
import * as authApi from '../features/auth/api';
import { mockAdminApi } from '../testing/adminApi';
import { ADMIN, renderApp, signedInState, signedOutState } from '../testing/renderWithProviders';

const challenge = {
  challenge_token: 'challenge-1',
  phone_hint: '+91 XXXXXX0009',
  expires_in: 300,
  resend_after: 30,
};
const session = {
  admin: ADMIN,
  access_token: 'tok-1',
  token_type: 'bearer' as const,
  expires_in: 600,
  session_expires_at: '2030-01-01T00:00:00Z',
};

async function enterCredentials(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Email'), 'admin@example.com');
  await user.type(screen.getByLabelText('Password'), 'Secret123');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
}

describe('sign-in', () => {
  beforeEach(() => {
    mockAdminApi();
    vi.spyOn(authApi, 'login').mockResolvedValue(challenge);
    vi.spyOn(authApi, 'verifyCode').mockResolvedValue(session);
  });

  it('pages need a signed-in admin', async () => {
    const { router } = renderApp('/kyc', signedOutState());
    await waitFor(() => expect(router.state.location.pathname).toBe('/sign-in'));
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('password, then code, then the page that was asked for', async () => {
    const user = userEvent.setup();
    const { router, store } = renderApp('/kyc', signedOutState());

    await enterCredentials(user);
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'Secret123',
    });
    expect(await screen.findByText('+91 XXXXXX0009')).toBeInTheDocument();

    await user.keyboard('123456'); // the code field has focus; completing it submits

    await waitFor(() => expect(router.state.location.pathname).toBe('/kyc'));
    expect(authApi.verifyCode).toHaveBeenCalledWith('challenge-1', '123456');
    expect(store.getState().auth.admin).toEqual(ADMIN);
    expect(getAccessToken()).toBe('tok-1');
    expect(await screen.findByRole('heading', { name: 'KYC review' })).toBeInTheDocument();
  });

  it('checks the form before calling the server', async () => {
    const user = userEvent.setup();
    renderApp('/sign-in', signedOutState());

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Enter your email')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('shows the server’s message for wrong credentials', async () => {
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiError(401, 'invalid_credentials', 'Invalid email or password', null),
    );
    const user = userEvent.setup();
    renderApp('/sign-in', signedOutState());

    await enterCredentials(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('a wrong code clears the field and says so', async () => {
    vi.mocked(authApi.verifyCode).mockRejectedValue(
      new ApiError(400, 'invalid_otp', 'Invalid or expired code', null),
    );
    const user = userEvent.setup();
    renderApp('/sign-in', signedOutState());
    await enterCredentials(user);
    await screen.findByText('+91 XXXXXX0009');

    await user.keyboard('000000');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid or expired code');
    expect(screen.getByRole('button', { name: /resend code in/i })).toBeDisabled();
  });

  it('can go back to use a different account', async () => {
    const user = userEvent.setup();
    renderApp('/sign-in', signedOutState());
    await enterCredentials(user);
    await screen.findByText('+91 XXXXXX0009');

    await user.click(screen.getByRole('button', { name: 'Use a different account' }));

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('explains an automatic sign-out', () => {
    renderApp('/sign-in', signedOutState('idle'));
    expect(screen.getByText(/signed out after 15 minutes/)).toBeInTheDocument();
  });
});

describe('signed in', () => {
  beforeEach(() => {
    mockAdminApi();
  });

  it('shows the layout with the admin’s name, and signs out from the menu', async () => {
    const logout = vi.spyOn(authApi, 'logout').mockResolvedValue();
    const user = userEvent.setup();
    const { router, store } = renderApp('/', signedInState);

    await waitFor(() => expect(router.state.location.pathname).toBe('/users'));
    await user.click(screen.getByRole('button', { name: 'Account' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/sign-in'));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(store.getState().auth.signOutReason).toBe('signed_out');
  });

  it('unknown pages say so', async () => {
    renderApp('/nope', signedInState);
    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });
});
