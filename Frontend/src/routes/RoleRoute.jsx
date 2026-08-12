import { Navigate, Outlet } from 'react-router-dom';

import useAuth from '../hooks/useAuth';
import homeFor from './homeFor';

/**
 * Wraps a role's route subtree. Wrong role → bounced to their own dashboard
 * rather than to login, which would look like a session failure.
 *
 * Note: this is UX, not security. The API enforces the same rules server-side.
 */
const RoleRoute = ({ allow }) => {
  const { user } = useAuth();

  const allowed = Array.isArray(allow) ? allow : [allow];

  if (!allowed.includes(user?.role)) {
    return <Navigate to={homeFor(user)} replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
