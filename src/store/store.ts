import { configureStore } from '@reduxjs/toolkit';

import { configureSession } from '../api/client';
import * as authApi from '../features/auth/api';
import { endLocally, startSession } from './authSlice';
import { rootReducer, type RootState } from './rootReducer';

export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({ reducer: rootReducer, preloadedState });
}

export const store = setupStore();

export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];

// The API client refreshes through the store and signs out through it when the
// session can't be refreshed (expired, revoked, admin role removed).
configureSession({
  refresh: async () => {
    const session = await authApi.refreshSession();
    await store.dispatch(startSession(session)).unwrap();
    return session.access_token;
  },
  ended: () => {
    if (store.getState().auth.status === 'signedIn') {
      endLocally(store.dispatch, 'expired');
    }
  },
});
