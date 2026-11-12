import { MantineProvider } from '@mantine/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { queryClient } from './api/queryClient';
import { routes } from './navigation/routes';
import { restoreSession, store } from './store';
import { theme } from './theme/theme';

// Once per page load, even when React runs effects twice in development.
let restoreStarted = false;

export function App() {
  const [router] = useState(() => createBrowserRouter(routes));

  useEffect(() => {
    if (!restoreStarted) {
      restoreStarted = true;
      void store.dispatch(restoreSession());
    }
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <RouterProvider router={router} />
        </MantineProvider>
      </QueryClientProvider>
    </Provider>
  );
}
