import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'client' | 'admin';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  const isProfileLoading = user && !profile;

  if (loading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-dark-bg)]">
        <div className="w-16 h-16 border-4 border-[var(--color-neon-blue)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !profile) {
    // Redirect them to the login page, but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && profile.role !== requiredRole) {
    // Redirect to a generic dashboard or unauthorized page if role doesn't match
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
