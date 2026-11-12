export const env = {
  // Relative by default: in development Vite forwards /api to the backend.
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  isDev: import.meta.env.DEV,
} as const;

// Sign out after this long without any mouse, keyboard or touch input.
export const IDLE_SIGN_OUT_MS = 15 * 60 * 1000;
