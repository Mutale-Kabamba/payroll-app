import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing login on app start
    checkExistingLogin();
  }, []);

  const checkExistingLogin = () => {
    try {
      // Check localStorage first (remember me)
      let loginData = localStorage.getItem('payroll_login');
      
      // If not found in localStorage, check sessionStorage
      if (!loginData) {
        loginData = sessionStorage.getItem('payroll_login');
      }

      if (loginData) {
        const userData = JSON.parse(loginData);
        // Check if login is still valid (optional: add expiration logic here)
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking existing login:', error);
      // Clear invalid data
      localStorage.removeItem('payroll_login');
      sessionStorage.removeItem('payroll_login');
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('payroll_login');
    sessionStorage.removeItem('payroll_login');
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
