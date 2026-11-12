# Dhan Setu Admin

The web admin portal for Dhan Setu, for administrators only. It talks to the backend
(`dhan-setu-backend`) only through its REST API, under `/api/v1/admin/*`.

React + Vite + TypeScript, Mantine (UI), React Router, TanStack React Query (server data),
Redux Toolkit (app state), react-hook-form + zod, Vitest + Testing Library.

## Run it

Needs Node 20+ and the backend running on http://localhost:8000.

```bash
npm install
cp .env.example .env        # defaults work for local development
npm run dev                 # http://localhost:5173
```

Sign in with an admin account. Accounts get the admin role only on the server:

```bash
cd ../dhan-setu-backend
.venv/bin/python -m app.cli make-admin <email>   # the account must be active
```

With the backend's `DEBUG=true`, the sign-in code is shown under the code field
("Development code"), so no SMS is needed locally.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## How sign-in and sessions work

1. Email + password (`/admin/auth/login`), then the 6-digit code texted to the admin's phone
   (`/admin/auth/verify`).
2. The access token (10 minutes) is kept **only in memory** (`src/api/session.ts`): never in
   localStorage, sessionStorage or Redux. The refresh token is an httpOnly cookie set by the
   backend, which page scripts can't read.
3. When the access token expires, the API client refreshes once (shared by all requests that
   failed together) and retries. A page reload restores the session from the cookie.
4. The portal signs out after 15 minutes without input. The backend also ends sessions after
   30 minutes without a refresh, 8 hours in total, or when the admin role is removed.
5. Every request sends `X-Admin-Client: dhan-setu-admin`; the backend refuses cookie requests
   without it or from other origins (CSRF protection).

In development, Vite forwards `/api` to the backend (`vite.config.ts`), so the portal and the
API share one origin. In production, serve the portal over https on its own host (e.g.
`admin.dhansetu.in`), list that origin in the backend's `ADMIN_ORIGINS`, and set
`VITE_API_BASE_URL` to the API's https URL. Serve it with a strict Content-Security-Policy,
`X-Frame-Options: DENY` and `Referrer-Policy: no-referrer`.

## Structure

```
src/
  api/          axios client (token, refresh, errors), in-memory session, React Query client
  config/       environment values
  store/        Redux Toolkit: auth slice (status, admin, sign-out reason) and thunks
  navigation/   routes and the signed-in guard
  components/   layout (header, sidebar, account menu) and shared UI
  hooks/        idle sign-out
  features/
    auth/       sign-in: api.ts, hooks.ts, schemas.ts (zod), screens/, components/
    kyc/        KYC review (queue and decisions arrive in A3)
  theme/        Mantine theme: muted navy accent, neutral greys
  testing/      test setup and render helpers
```
