import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const loginData = {
              uid: firebaseUser.uid,
              username: userData.username,
              name: userData.name,
              email: firebaseUser.email,
              role: userData.role,
              companyId: userData.companyId,
              loginTime: new Date().toISOString()
            };
            setUser(loginData);
          } else {
            // User exists in Firebase Auth but not in Firestore
            console.warn('User profile not found in Firestore');
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser(null);
        }
      } else {
        // Check for existing login in storage (for demo compatibility)
        checkExistingLogin();
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
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
    }
  };

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      // Sign out from Firebase Auth
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
    
    // Clear local storage
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
