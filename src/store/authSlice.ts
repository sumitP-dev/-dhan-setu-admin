import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { setAccessToken } from '../api/session';
import { queryClient } from '../api/queryClient';
import * as authApi from '../features/auth/api';
import type { Admin, AdminSession } from '../features/auth/schemas';

export type AuthStatus = 'checking' | 'signedOut' | 'signedIn';
// Why the admin was signed out, to explain it on the sign-in page.
export type SignOutReason = 'signed_out' | 'idle' | 'expired';

export interface AuthState {
  status: AuthStatus;
  admin: Admin | null;
  sessionExpiresAt: string | null;
  signOutReason: SignOutReason | null;
}

const initialState: AuthState = {
  status: 'checking',
  admin: null,
  sessionExpiresAt: null,
  signOutReason: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signedIn(state, action: PayloadAction<{ admin: Admin; sessionExpiresAt: string }>) {
      state.status = 'signedIn';
      state.admin = action.payload.admin;
      state.sessionExpiresAt = action.payload.sessionExpiresAt;
      state.signOutReason = null;
    },
    signedOut(state, action: PayloadAction<SignOutReason | null>) {
      state.status = 'signedOut';
      state.admin = null;
      state.sessionExpiresAt = null;
      state.signOutReason = action.payload;
    },
  },
});

export const { signedIn, signedOut } = authSlice.actions;
export const authReducer = authSlice.reducer;

/** Keeps the token in memory and the admin in the store. */
export const startSession = createAsyncThunk(
  'auth/startSession',
  async (session: AdminSession, { dispatch }) => {
    setAccessToken(session.access_token);
    dispatch(signedIn({ admin: session.admin, sessionExpiresAt: session.session_expires_at }));
  },
);

/** On page load: the access token is gone, but the cookie may still hold a session. */
export const restoreSession = createAsyncThunk('auth/restore', async (_, { dispatch }) => {
  try {
    await dispatch(startSession(await authApi.refreshSession())).unwrap();
  } catch {
    setAccessToken(null);
    dispatch(signedOut(null));
  }
});

/** Ends the session on the server too, then forgets everything held for it. */
export const signOut = createAsyncThunk(
  'auth/signOut',
  async (reason: SignOutReason, { dispatch }) => {
    try {
      await authApi.logout();
    } catch {
      // The session ends locally regardless; the server ends it at its own expiry.
    }
    endLocally(dispatch, reason);
  },
);

export function endLocally(
  dispatch: (action: PayloadAction<SignOutReason | null>) => unknown,
  reason: SignOutReason | null,
): void {
  setAccessToken(null);
  queryClient.clear();
  dispatch(signedOut(reason));
}
