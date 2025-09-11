import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Building, Shield, Mail } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';

const Login = ({ onLogin, setupData }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  // Demo credentials for fallback authentication when Firebase is unavailable
  const demoCredentials = [
    { username: 'admin', password: 'admin123', role: 'Administrator', email: 'admin@demo.com' },
    { username: 'hr', password: 'hr123', role: 'HR Manager', email: 'hr@demo.com' },
    { username: 'manager', password: 'manager123', role: 'Manager', email: 'manager@demo.com' },
    { username: 'demo', password: 'demo', role: 'Demo User', email: 'demo@demo.com' }
  ];

  // Fallback authentication when Firebase is unavailable
  const tryFallbackAuth = async () => {
    console.log('Attempting fallback authentication...');
    
    // Check if credentials match demo accounts or setup admin account
    let user = null;
    
    // Check demo credentials
    user = demoCredentials.find(
      cred => (cred.username === formData.username || cred.email === formData.username) 
               && cred.password === formData.password
    );
    
    // Check setup admin account if exists
    if (!user && setupData?.adminUsername === formData.username && setupData?.adminPassword === formData.password) {
      user = {
        username: setupData.adminUsername,
        email: setupData.adminEmail,
        role: 'Administrator',
        name: setupData.adminName || 'Administrator'
      };
    }
    
    if (user) {
      const loginData = {
        uid: `local_${user.username}`,
        username: user.username,
        name: user.name || user.username,
        email: user.email,
        role: user.role,
        companyId: setupData?.companyName || 'demo-company',
        loginTime: new Date().toISOString(),
        rememberMe: formData.rememberMe,
        authMode: 'local' // Indicate this is local authentication
      };

      if (formData.rememberMe) {
        localStorage.setItem('payroll_login', JSON.stringify(loginData));
      } else {
        sessionStorage.setItem('payroll_login', JSON.stringify(loginData));
      }

      return loginData;
    } else {
      throw new Error('Invalid username or password. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // First, try Firebase authentication
      try {
        let email = formData.username;
        
        // If username is not an email, try to find the user by username in setup data
        if (!formData.username.includes('@')) {
          // Check setup data first for the admin user
          if (setupData?.adminUsername === formData.username) {
            email = setupData.adminEmail;
          } else {
            // Try fallback authentication for username-based login
            const fallbackUser = await tryFallbackAuth();
            onLogin(fallbackUser);
            return;
          }
        }

        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, formData.password);
        const firebaseUser = userCredential.user;

        // Get user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (!userDoc.exists()) {
          throw new Error('User profile not found');
        }

        const userData = userDoc.data();
        
        // Store login state
        const loginData = {
          uid: firebaseUser.uid,
          username: userData.username,
          name: userData.name,
          email: firebaseUser.email,
          role: userData.role,
          companyId: userData.companyId,
          loginTime: new Date().toISOString(),
          rememberMe: formData.rememberMe,
          authMode: 'firebase'
        };

        if (formData.rememberMe) {
          localStorage.setItem('payroll_login', JSON.stringify(loginData));
        } else {
          sessionStorage.setItem('payroll_login', JSON.stringify(loginData));
        }

        onLogin(loginData);
        
      } catch (firebaseError) {
        console.log('Firebase authentication failed, trying fallback...', firebaseError.code);
        
        // Check if it's a network or configuration error that suggests Firebase is unavailable
        const isFirebaseUnavailable = 
          firebaseError.code === 'auth/network-request-failed' ||
          firebaseError.code === 'auth/configuration-not-found' ||
          firebaseError.code === 'auth/internal-error' ||
          firebaseError.message?.includes('network') ||
          firebaseError.message?.includes('configuration');
        
        if (isFirebaseUnavailable) {
          // Try fallback authentication
          const fallbackUser = await tryFallbackAuth();
          onLogin(fallbackUser);
        } else {
          // Re-throw Firebase auth errors that are not network/config related (like wrong password)
          throw firebaseError;
        }
      }
      
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = error.message || 'Login failed. Please check your credentials.';
      
      // Provide more helpful error messages
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMessage);
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Please enter your email address');
      return;
    }

    setIsSubmittingForgot(true);
    setError('');
    setForgotMessage('');

    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setForgotMessage('Password reset email sent! Please check your inbox.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail('');
        setForgotMessage('');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to send password reset email');
    }

    setIsSubmittingForgot(false);
  };

  // Removed unused handleDemoLogin function

  // Get company info from setup data or use default
  const companyName = setupData?.companyName || 'PayrollPro';
  const companyDisplayName = setupData?.companyName || 'Your Company';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-3 sm:p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <Building className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
              <span className="block sm:hidden">{companyName}</span>
              <span className="hidden sm:block">{companyName}</span>
            </h1>
            <p className="text-blue-100 text-sm">{companyDisplayName}</p>
          </div>

          {/* Login Form */}
          <div className="px-6 sm:px-8 py-6">
            <div className="text-center mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Welcome Back</h2>
              <p className="text-gray-600 text-sm">Please sign in to access {companyName.toLowerCase()}</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-red-600 mr-2" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center min-w-touch"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg text-white font-medium transition-all duration-200 min-h-touch ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Demo Credentials - Hidden */}
            {/* 
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">Demo Accounts</h3>
              <div className="grid grid-cols-2 gap-2">
                {demoCredentials.map((cred, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDemoLogin(cred.username, cred.password)}
                    className="p-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                  >
                    <div className="font-medium text-gray-800">{cred.username}</div>
                    <div className="text-gray-500">{cred.role}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Click any demo account to auto-fill credentials
              </p>
            </div>
            */}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 sm:px-8 py-4 text-center">
            <p className="text-xs text-gray-500">
              © 2025 {companyDisplayName}. All rights reserved.
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center mt-4 text-white text-opacity-80">
          <Shield className="h-4 w-4 mr-2" />
          <span className="text-sm">Secure Login Protected</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-blue-600" />
                Reset Password
              </h3>
              
              {forgotMessage ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-green-700 text-sm">{forgotMessage}</p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotEmail('');
                        setError('');
                      }}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingForgot}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isSubmittingForgot ? 'Sending...' : 'Send Reset Email'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
