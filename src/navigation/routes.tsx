import { Navigate, type RouteObject } from 'react-router';

import { AppLayout } from '../components/AppLayout';
import { NotFoundPage, RouteError } from '../components/RouteError';
import { SignInPage } from '../features/auth/screens/SignInPage';
import { KycQueuePage } from '../features/kyc/screens/KycQueuePage';
import { RequireAdmin } from './RequireAdmin';

export const routes: RouteObject[] = [
  { path: '/sign-in', element: <SignInPage />, errorElement: <RouteError /> },
  {
    element: <RequireAdmin />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/kyc" replace /> },
          { path: '/kyc', element: <KycQueuePage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
