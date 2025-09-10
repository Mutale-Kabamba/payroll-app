import { useContext } from 'react';
import SetupContext from '../contexts/SetupContext';

export const useSetup = () => {
  const context = useContext(SetupContext);
  if (!context) {
    throw new Error('useSetup must be used within a SetupProvider');
  }
  return context;
};

export default useSetup;