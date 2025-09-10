import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { SetupProvider } from './contexts/SetupContext';
import { useAuth } from './hooks/useAuth';
import { useSetup } from './hooks/useSetup';
import LandingPage from './components/LandingPage';
import InitialSetup from './components/InitialSetup';
import Login from './components/Login';
import PayrollGenerator from './components/PayrollGenerator';
import './index.css';

const AppContent = () => {
  const { user, login, logout, isLoading: authLoading } = useAuth();
  const { setupData, completeSetup, isLoading: setupLoading } = useSetup();
  
  const [currentView, setCurrentView] = React.useState('landing'); // landing, setup, login, app

  // Show loading spinner while checking authentication and setup
  if (authLoading || setupLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle different app states and routing
  const handleGetStarted = () => {
    // Always go to setup regardless of completion status
    setCurrentView('setup');
  };

  const handleSetupComplete = (setupInfo) => {
    completeSetup(setupInfo);
    setCurrentView('login');
  };

  const handleLogin = () => {
    setCurrentView('login');
  };

  const handleLoginSuccess = (userData) => {
    login(userData);
    setCurrentView('app');
  };

  const handleLogout = () => {
    logout();
    setCurrentView('landing');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  // If user is already authenticated, show the main app
  if (user && currentView === 'landing') {
    setCurrentView('app');
  }

  // Route to appropriate view based on current state
  switch (currentView) {
    case 'setup':
      return (
        <InitialSetup 
          onComplete={handleSetupComplete} 
          onBack={handleBackToLanding}
        />
      );
    
    case 'login':
      return (
        <Login 
          onLogin={handleLoginSuccess}
          setupData={setupData}
        />
      );
    
    case 'app':
      if (!user) {
        setCurrentView('login');
        return null;
      }
      return (
        <PayrollGenerator 
          user={user} 
          onLogout={handleLogout}
          setupData={setupData}
        />
      );
    
    default: // 'landing'
      return (
        <LandingPage 
          onGetStarted={handleGetStarted}
          onLogin={handleLogin}
          setupData={setupData}
        />
      );
  }
};

function App() {
  return (
    <AuthProvider>
      <SetupProvider>
        <AppContent />
      </SetupProvider>
    </AuthProvider>
  );
}

export default App;