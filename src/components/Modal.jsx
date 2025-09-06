import React from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', 
  onConfirm, 
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
  children 
}) => {
  if (!isOpen) {
    return null;
  }

  const getIconAndColors = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-600" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        };
      case 'error':
        return {
          icon: <XCircle className="h-8 w-8 text-red-600" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-8 w-8 text-yellow-600" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'confirm':
        return {
          icon: <AlertTriangle className="h-8 w-8 text-orange-600" />,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          buttonColor: 'bg-orange-600 hover:bg-orange-700'
        };
      default:
        return {
          icon: <Info className="h-8 w-8 text-blue-600" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const { icon, bgColor, borderColor, buttonColor } = getIconAndColors();

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !showCancel) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100 ${bgColor} border-2 ${borderColor}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {icon}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          {!showCancel && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {children || (
            <p className="text-gray-700 leading-relaxed">{message}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          {showCancel && (
            <button
              onClick={onCancel || onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm || onClose}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${buttonColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Success Modal
export const SuccessModal = ({ isOpen, onClose, title, message }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title || 'Success'}
    message={message}
    type="success"
    confirmText="Great!"
  />
);

// Error Modal
export const ErrorModal = ({ isOpen, onClose, title, message }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title || 'Error'}
    message={message}
    type="error"
    confirmText="OK"
  />
);

// Confirmation Modal
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, danger = false }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    onCancel={onClose}
    title={title || 'Confirm Action'}
    message={message}
    type={danger ? 'error' : 'confirm'}
    confirmText={confirmText || 'Confirm'}
    cancelText={cancelText || 'Cancel'}
    showCancel={true}
  />
);

// Info Modal
export const InfoModal = ({ isOpen, onClose, title, message }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title || 'Information'}
    message={message}
    type="info"
    confirmText="OK"
  />
);

export default Modal;
