import React, { createContext, useState, useEffect } from 'react';

const SetupContext = createContext();

export const SetupProvider = ({ children }) => {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if setup is complete on app start
    checkSetupStatus();
  }, []);

  const checkSetupStatus = () => {
    try {
      const savedSetup = localStorage.getItem('payroll_setup');
      if (savedSetup) {
        const setup = JSON.parse(savedSetup);
        setSetupData(setup);
        setIsSetupComplete(true);
      }
    } catch (error) {
      console.error('Error checking setup status:', error);
      // Clear invalid data
      localStorage.removeItem('payroll_setup');
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = (setupInfo) => {
    const setupWithTimestamp = {
      ...setupInfo,
      createdAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    localStorage.setItem('payroll_setup', JSON.stringify(setupWithTimestamp));
    setSetupData(setupWithTimestamp);
    setIsSetupComplete(true);
  };

  const resetSetup = () => {
    localStorage.removeItem('payroll_setup');
    setSetupData(null);
    setIsSetupComplete(false);
  };

  const value = {
    isSetupComplete,
    setupData,
    isLoading,
    completeSetup,
    resetSetup,
    checkSetupStatus
  };

  return (
    <SetupContext.Provider value={value}>
      {children}
    </SetupContext.Provider>
  );
};

export default SetupContext;