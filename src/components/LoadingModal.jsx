import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingModal = ({ isOpen, message = 'Loading...', title = 'Please Wait' }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Content */}
        <div className="p-8 text-center">
          <div className="mb-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;
