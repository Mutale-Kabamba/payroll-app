import React, { useState } from 'react';
import { X, CheckCircle, Copy, User, Mail, Key, Building, Check } from 'lucide-react';

const SetupCompletionModal = ({ isOpen, onClose, setupData }) => {
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen || !setupData) {
    return null;
  }

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const accountDetails = [
    {
      label: 'Company',
      value: setupData.companyName,
      icon: <Building className="h-4 w-4" />,
      field: 'company'
    },
    {
      label: 'Admin Name',
      value: setupData.adminName,
      icon: <User className="h-4 w-4" />,
      field: 'name'
    },
    {
      label: 'Username',
      value: setupData.adminUsername,
      icon: <User className="h-4 w-4" />,
      field: 'username'
    },
    {
      label: 'Email',
      value: setupData.adminEmail,
      icon: <Mail className="h-4 w-4" />,
      field: 'email'
    },
    {
      label: 'Password',
      value: setupData.adminPassword,
      icon: <Key className="h-4 w-4" />,
      field: 'password',
      sensitive: true
    }
  ];

  const copyAllDetails = () => {
    const allDetails = `
Company: ${setupData.companyName}
Admin Name: ${setupData.adminName}
Username: ${setupData.adminUsername}
Email: ${setupData.adminEmail}
Password: ${setupData.adminPassword}
    `.trim();
    
    copyToClipboard(allDetails, 'all');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8 text-center rounded-t-2xl">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-full">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Setup Complete!</h2>
          <p className="text-green-100">Your account has been created successfully</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="bg-blue-600 p-1 rounded-full mr-3 mt-1">
                <Check className="h-3 w-3 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Important</h4>
                <p className="text-sm text-blue-700">
                  Please save these login credentials in a secure location. You'll need them to access your payroll system.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
              <button
                onClick={copyAllDetails}
                className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {copiedField === 'all' ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy All
                  </>
                )}
              </button>
            </div>

            {accountDetails.map((detail) => (
              <div key={detail.field} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="text-gray-400 mr-3">
                    {detail.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-600">{detail.label}</div>
                    <div className="font-medium text-gray-900 truncate">
                      {detail.sensitive ? '••••••••' : detail.value}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(detail.value, detail.field)}
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  title={`Copy ${detail.label.toLowerCase()}`}
                >
                  {copiedField === detail.field ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium"
          >
            Continue to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupCompletionModal;