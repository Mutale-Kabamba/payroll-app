import React, { useState } from 'react';
import { Building, User, MapPin, Phone, Mail, Check, ArrowLeft, ArrowRight, Settings, Briefcase } from 'lucide-react';

const InitialSetup = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Company Information
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    industry: '',
    
    // Admin User
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    adminRole: 'Administrator',
    
    // Payroll Settings
    currency: 'USD',
    payFrequency: 'Monthly',
    fiscalYearStart: 'January',
    
    // Tax Settings
    enableTax: true,
    taxRate: '15',
    enableNapsa: true,
    napsaRate: '5',
    enableNhima: true,
    nhimaRate: '3.5'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 4;

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 
    'Education', 'Construction', 'Hospitality', 'Transportation', 'Other'
  ];

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'K' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' }
  ];

  const payFrequencies = ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate setup process
    await new Promise(resolve => setTimeout(resolve, 2000));

    onComplete(formData);
    setIsSubmitting(false);
  };

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return formData.companyName && formData.companyEmail && formData.industry;
      case 2:
        return formData.adminName && formData.adminEmail;
      case 3:
        return formData.currency && formData.payFrequency;
      case 4:
        return true; // Review step is always valid
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Building className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Information</h2>
              <p className="text-gray-600">Tell us about your organization</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your company name"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Address
                </label>
                <textarea
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your company address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="company@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="companyPhone"
                  value={formData.companyPhone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="companyWebsite"
                  value={formData.companyWebsite}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry *
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select an industry</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <User className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Administrator Account</h2>
              <p className="text-gray-600">Create your admin user account</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="adminPhone"
                  value={formData.adminPhone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  name="adminRole"
                  value={formData.adminRole}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  readOnly
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-blue-600 p-1 rounded-full mr-3 mt-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Admin Access</h4>
                  <p className="text-sm text-blue-700">
                    This account will have full administrative access to the payroll system, including employee management, 
                    payroll processing, and system settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="bg-purple-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Settings className="h-10 w-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payroll Settings</h2>
              <p className="text-gray-600">Configure your payroll preferences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pay Frequency *
                </label>
                <select
                  name="payFrequency"
                  value={formData.payFrequency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {payFrequencies.map(frequency => (
                    <option key={frequency} value={frequency}>{frequency}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fiscal Year Start
                </label>
                <select
                  name="fiscalYearStart"
                  value={formData.fiscalYearStart}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tax & Deduction Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enableTax"
                      name="enableTax"
                      checked={formData.enableTax}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="enableTax" className="ml-3 text-sm text-gray-700">
                      Enable Income Tax (PAYE)
                    </label>
                  </div>
                  {formData.enableTax && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        name="taxRate"
                        value={formData.taxRate}
                        onChange={handleInputChange}
                        className="w-20 px-3 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enableNapsa"
                      name="enableNapsa"
                      checked={formData.enableNapsa}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="enableNapsa" className="ml-3 text-sm text-gray-700">
                      Enable NAPSA (National Pension Scheme)
                    </label>
                  </div>
                  {formData.enableNapsa && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        name="napsaRate"
                        value={formData.napsaRate}
                        onChange={handleInputChange}
                        className="w-20 px-3 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enableNhima"
                      name="enableNhima"
                      checked={formData.enableNhima}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="enableNhima" className="ml-3 text-sm text-gray-700">
                      Enable NHIMA (National Health Insurance)
                    </label>
                  </div>
                  {formData.enableNhima && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        name="nhimaRate"
                        value={formData.nhimaRate}
                        onChange={handleInputChange}
                        className="w-20 px-3 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="bg-orange-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Check className="h-10 w-10 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Complete</h2>
              <p className="text-gray-600">Review your setup configuration</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Company Name:</span>
                    <span className="ml-2 font-medium">{formData.companyName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Industry:</span>
                    <span className="ml-2 font-medium">{formData.industry}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{formData.companyEmail}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium">{formData.companyPhone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Administrator
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{formData.adminName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{formData.adminEmail}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Role:</span>
                    <span className="ml-2 font-medium">{formData.adminRole}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Payroll Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Currency:</span>
                    <span className="ml-2 font-medium">{formData.currency}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Pay Frequency:</span>
                    <span className="ml-2 font-medium">{formData.payFrequency}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fiscal Year:</span>
                    <span className="ml-2 font-medium">Starts in {formData.fiscalYearStart}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tax Settings:</span>
                    <span className="ml-2 font-medium">
                      {[
                        formData.enableTax && `PAYE: ${formData.taxRate}%`,
                        formData.enableNapsa && `NAPSA: ${formData.napsaRate}%`,
                        formData.enableNhima && `NHIMA: ${formData.nhimaRate}%`
                      ].filter(Boolean).join(', ') || 'None configured'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-900 mb-1">Ready to Setup</h4>
                  <p className="text-sm text-green-700">
                    Your payroll system will be configured with the settings above. You can modify these settings 
                    later from the system administration panel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">PayrollPro Setup</h1>
                <p className="text-blue-100 text-sm">Initial system configuration</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="text-white hover:text-blue-200 transition-colors flex items-center"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-8 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Setup Progress</span>
            <span className="text-sm text-gray-500">{currentStep} of {totalSteps}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              currentStep === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </button>

          <div className="flex space-x-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i + 1 === currentStep
                    ? 'bg-blue-600'
                    : i + 1 < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid(currentStep)}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                isStepValid(currentStep)
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                isSubmitting
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Setting up...
                </>
              ) : (
                <>
                  Complete Setup
                  <Check className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InitialSetup;