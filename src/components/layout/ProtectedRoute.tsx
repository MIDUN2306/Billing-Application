import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { hasPermission } from '../../lib/auth';

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'manager' | 'staff';
}

export function ProtectedRoute({ requiredRole = 'staff' }: ProtectedRouteProps) {
  const { user, profile, loading, initialized } = useAuthStore();

  // Wait for auth to initialize
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (!hasPermission(profile, requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-2">Access Denied</h1>
          <p className="text-secondary-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
