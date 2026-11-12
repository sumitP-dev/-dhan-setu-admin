import { Navigate, Outlet, useLocation } from 'react-router';

import { FullPageLoader } from '../components/FullPageLoader';
import { useAppSelector } from '../store';

/** Every page except sign-in: only for a signed-in admin. */
export function RequireAdmin() {
  const status = useAppSelector(state => state.auth.status);
  const location = useLocation();
  if (status === 'checking') {
    return <FullPageLoader />;
  }
  if (status !== 'signedIn') {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}
