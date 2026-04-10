
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserRole } from '../context/UserRoleContext';
import { UserRole } from '../types';

interface RouteGuardProps {
  /** Roles that are permitted to access this route. */
  allowedRoles: UserRole[];
  children: React.ReactNode;
  /** Where to redirect when access is denied. Defaults to '/'. */
  redirectTo?: string;
}

/**
 * Wraps a route element and redirects unauthenticated or unauthorized users.
 * The original location is passed in router state so a future login flow
 * can return the user to the page they tried to reach.
 *
 * Usage:
 *   <Route path="/dashboard" element={
 *     <RouteGuard allowedRoles={[UserRole.PARTICIPANT, UserRole.RESEARCHER]}>
 *       <DashboardPage />
 *     </RouteGuard>
 *   } />
 */
const RouteGuard: React.FC<RouteGuardProps> = ({
  allowedRoles,
  children,
  redirectTo = '/',
}) => {
  const { role } = useUserRole();
  const location = useLocation();

  if (!allowedRoles.includes(role)) {
    // Preserve the attempted location so a login page can redirect back after auth.
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default RouteGuard;
