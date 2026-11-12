import { MantineProvider } from '@mantine/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router';

import { queryClient } from '../api/queryClient';
import { routes } from '../navigation/routes';
import { setupStore, type RootState } from '../store';
import { theme } from '../theme/theme';

/** The whole app (real routes) at `path`, with its own store. */
export function renderApp(path: string, preloadedState?: Partial<RootState>) {
  const store = setupStore(preloadedState);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme}>
          <RouterProvider router={router} />
        </MantineProvider>
      </QueryClientProvider>
    </Provider>,
  );
  return { ...view, store, router };
}

export const ADMIN = { id: 'a1', full_name: 'Meera Admin', email: 'admin@example.com' };

export const signedInState: Partial<RootState> = {
  auth: {
    status: 'signedIn',
    admin: ADMIN,
    sessionExpiresAt: '2030-01-01T00:00:00Z',
    signOutReason: null,
  },
};

export const signedOutState = (
  signOutReason: RootState['auth']['signOutReason'] = null,
): Partial<RootState> => ({
  auth: { status: 'signedOut', admin: null, sessionExpiresAt: null, signOutReason },
});
