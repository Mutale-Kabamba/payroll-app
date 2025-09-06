import { useState } from 'react';

export const useNotification = () => {
  const [modals, setModals] = useState({
    success: { isOpen: false, title: '', message: '' },
    error: { isOpen: false, title: '', message: '' },
    confirm: { isOpen: false, title: '', message: '', onConfirm: null, confirmText: '', cancelText: '', danger: false },
    info: { isOpen: false, title: '', message: '' },
    loading: { isOpen: false, title: 'Please Wait', message: 'Loading...' }
  });

  const showSuccess = (message, title = 'Success') => {
    setModals(prev => ({
      ...prev,
      success: { isOpen: true, title, message }
    }));
  };

  const showError = (message, title = 'Error') => {
    setModals(prev => ({
      ...prev,
      error: { isOpen: true, title, message }
    }));
  };

  const showConfirm = (message, onConfirm, options = {}) => {
    const {
      title = 'Confirm Action',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      danger = false
    } = options;

    setModals(prev => ({
      ...prev,
      confirm: { 
        isOpen: true, 
        title, 
        message, 
        onConfirm, 
        confirmText, 
        cancelText, 
        danger 
      }
    }));
  };

  const showInfo = (message, title = 'Information') => {
    setModals(prev => ({
      ...prev,
      info: { isOpen: true, title, message }
    }));
  };

  const showLoading = (message = 'Loading...', title = 'Please Wait') => {
    setModals(prev => ({
      ...prev,
      loading: { isOpen: true, title, message }
    }));
  };

  const hideLoading = () => {
    setModals(prev => ({
      ...prev,
      loading: { isOpen: false, title: 'Please Wait', message: 'Loading...' }
    }));
  };

  const closeModal = (type) => {
    setModals(prev => ({
      ...prev,
      [type]: { ...prev[type], isOpen: false }
    }));
  };

  const closeAllModals = () => {
    setModals({
      success: { isOpen: false, title: '', message: '' },
      error: { isOpen: false, title: '', message: '' },
      confirm: { isOpen: false, title: '', message: '', onConfirm: null, confirmText: '', cancelText: '', danger: false },
      info: { isOpen: false, title: '', message: '' },
      loading: { isOpen: false, title: 'Please Wait', message: 'Loading...' }
    });
  };

  return {
    modals,
    showSuccess,
    showError,
    showConfirm,
    showInfo,
    showLoading,
    hideLoading,
    closeModal,
    closeAllModals
  };
};

export default useNotification;
