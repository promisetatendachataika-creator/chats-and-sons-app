import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PageLoader } from '../components/ui/Loader';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'client' | 'admin';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-dvh grid place-items-center bg-paper">
        <PageLoader />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && profile.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
