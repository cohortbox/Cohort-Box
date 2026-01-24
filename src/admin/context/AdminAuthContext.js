import { createContext, useContext, useEffect, useState } from 'react';
import adminAPI from '../api/adminAPI';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check admin session on app load / refresh
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await adminAPI.get('/auth/me'); 
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    await adminAPI.post(
      '/auth/login',
      { email, password },
      { withCredentials: true }
    );

    setIsAuthenticated(true);
  };

  const logout = async () => {
    await adminAPI.post('/auth/logout', {}, { withCredentials: true });
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider
      value={{ isAuthenticated, login, logout, loading }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
