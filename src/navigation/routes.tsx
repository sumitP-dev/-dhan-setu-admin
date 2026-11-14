import { Navigate, type RouteObject } from 'react-router';

import { AppLayout } from '../components/AppLayout';
import { NotFoundPage, RouteError } from '../components/RouteError';
import { SignInPage } from '../features/auth/screens/SignInPage';
import { CardsPage } from '../features/cards/screens/CardsPage';
import { KycQueuePage } from '../features/kyc/screens/KycQueuePage';
import { KycReviewPage } from '../features/kyc/screens/KycReviewPage';
import { UserDetailPage } from '../features/users/screens/UserDetailPage';
import { UsersPage } from '../features/users/screens/UsersPage';
import { RequireAdmin } from './RequireAdmin';

export const HOME_PATH = '/users';

export const routes: RouteObject[] = [
  { path: '/sign-in', element: <SignInPage />, errorElement: <RouteError /> },
  {
    element: <RequireAdmin />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to={HOME_PATH} replace /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/users/:userId', element: <UserDetailPage /> },
          { path: '/cards', element: <CardsPage /> },
          { path: '/kyc', element: <KycQueuePage /> },
          { path: '/kyc/:userId', element: <KycReviewPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
