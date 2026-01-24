import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminRoute({ children }) {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) return null; // or a spinner

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}