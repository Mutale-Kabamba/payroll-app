import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ 
  type = 'info', 
  message, 
  isVisible, 
  onClose, 
  duration = 4000,
  position = 'top-right' 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800'
        };
      case 'error':
        return {
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800'
        };
      default:
        return {
          icon: <Info className="h-5 w-5 text-blue-600" />,
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800'
        };
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (!isVisible) {
    return null;
  }

  const { icon, bgColor, textColor } = getTypeStyles();

  return (
    <div 
      className={`
        fixed z-50 ${getPositionClasses()}
        transform transition-all duration-300 ease-in-out
        ${isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className={`
        flex items-center gap-3 p-4 rounded-lg border shadow-lg max-w-sm
        ${bgColor}
      `}>
        {icon}
        <p className={`flex-1 text-sm font-medium ${textColor}`}>
          {message}
        </p>
        <button
          onClick={handleClose}
          className={`ml-2 ${textColor} hover:opacity-70 transition-opacity`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
