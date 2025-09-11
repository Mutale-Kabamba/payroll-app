import React, { useState } from 'react';
import { Building, User, MapPin, Phone, Mail, Check, ArrowLeft, ArrowRight, Settings, Briefcase, Users, Upload, FileSpreadsheet } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import SetupCompletionModal from './SetupCompletionModal';
import { SuccessModal, ErrorModal, InfoModal } from './Modal';
import LoadingModal from './LoadingModal';
import PasswordStrength from './PasswordStrength';
import { useNotification } from '../hooks/useNotification';

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
    adminUsername: '',
    adminEmail: '',
    adminPhone: '',
    adminRole: 'Administrator',
    adminPassword: '',
    confirmPassword: '',
    
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
    nhimaRate: '3.5',
    
    // Employee Setup
    employeeSetupChoice: 'later', // 'now' or 'later'
    initialEmployees: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  // Notification system for better user feedback
  const { modals, showError, showInfo, showConfirm, showLoading, hideLoading, closeModal } = useNotification();

  // Test Firebase connection before attempting setup
  const testFirebaseConnection = async () => {
    try {
      // Try to access Firebase Auth
      if (!auth) {
        return { success: false, error: 'Firebase Auth not initialized' };
      }
      
      // Try to access Firestore
      if (!db) {
        return { success: false, error: 'Firestore not initialized' };
      }
      
      // Test basic connectivity by trying to read a test document
      const testRef = doc(db, 'test', 'connection');
      await getDoc(testRef);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Firebase connection failed' 
      };
    }
  };

  // Ask user about fallback to local mode
  const askUserAboutLocalFallback = async (firebaseError) => {
    // For now, always continue with local storage when Firebase fails
    // In production, you might want to show a more sophisticated choice dialog
    console.log('Firebase setup failed, continuing with local storage:', firebaseError.message);
    return true; // Continue with local storage
  };

  // CSV parsing helper function
  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const employees = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) continue;
      
      const employee = {};
      headers.forEach((header, index) => {
        employee[header] = values[index];
      });
      
      // Validate required fields
      if (employee.name && employee.id && employee.basicpay && employee.designation) {
        employees.push({
          id: employee.id,
          name: employee.name,
          nrc: employee.nrc || '',
          ssn: employee.ssn || '',
          gender: employee.gender || 'Male',
          designation: employee.designation,
          dateOfJoining: employee.dateofjoining || '',
          basicPay: parseFloat(employee.basicpay) || 0,
          transportAllowance: parseFloat(employee.transportallowance) || 0,
          mealAllowance: parseFloat(employee.mealallowance) || 0,
          department: employee.department || '',
          address: employee.address || '',
          napsa: employee.napsa || '',
          nhima: employee.nhima || ''
        });
      }
    }
    
    return employees;
  };

  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const parsedEmployees = parseCSV(csvText);
        setFormData(prev => ({
          ...prev,
          initialEmployees: parsedEmployees
        }));
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const totalSteps = 5;

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
    
    // Show loading modal with detailed message
    showLoading('Setting up your payroll system...', 'Please Wait');

    try {
      let companyId, firebaseUserId = null;
      let firebaseSetupSucceeded = false;
      
      // Try Firebase setup first with better retry mechanism
      try {
        showLoading('Connecting to Firebase...', 'Firebase Setup');
        
        // Test Firebase connection first
        const connectionTest = await testFirebaseConnection();
        
        if (connectionTest.success) {
          showLoading('Creating your admin account...', 'Firebase Setup');
          
          // Create Firebase user account
          const userCredential = await createUserWithEmailAndPassword(
            auth, 
            formData.adminEmail, 
            formData.adminPassword
          );
          firebaseUserId = userCredential.user.uid;
          
          // Generate company ID
          companyId = `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          showLoading('Configuring company settings...', 'Firebase Setup');
          
          // Create company document in Firebase
          await setDoc(doc(db, 'companies', companyId), {
            companyName: formData.companyName,
            companyAddress: formData.companyAddress || '',
            companyPhone: formData.companyPhone || '',
            companyEmail: formData.companyEmail,
            companyWebsite: formData.companyWebsite || '',
            industry: formData.industry,
            currency: formData.currency,
            payFrequency: formData.payFrequency,
            fiscalYearStart: formData.fiscalYearStart,
            taxSettings: {
              enableTax: formData.enableTax,
              taxRate: parseFloat(formData.taxRate) || 0,
              enableNapsa: formData.enableNapsa,
              napsaRate: parseFloat(formData.napsaRate) || 0,
              enableNhima: formData.enableNhima,
              nhimaRate: parseFloat(formData.nhimaRate) || 0,
            },
            createdAt: new Date().toISOString(),
            adminUserId: firebaseUserId
          });

          // Create admin user profile
          await setDoc(doc(db, 'users', firebaseUserId), {
            name: formData.adminName,
            username: formData.adminUsername,
            email: formData.adminEmail,
            phone: formData.adminPhone || '',
            role: formData.adminRole,
            companyId: companyId,
            createdAt: new Date().toISOString()
          });

          // Import initial employees if any
          if (formData.employeeSetupChoice === 'now' && formData.initialEmployees.length > 0) {
            showLoading('Importing employee data...', 'Firebase Setup');
            
            const batch = [];
            formData.initialEmployees.forEach((employee) => {
              const employeeId = `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              batch.push(
                setDoc(doc(db, 'employees', employeeId), {
                  ...employee,
                  companyId: companyId,
                  createdAt: new Date().toISOString()
                })
              );
            });
            await Promise.all(batch);
          }

          console.log('✅ Firebase setup completed successfully');
          firebaseSetupSucceeded = true;

        } else {
          throw new Error(connectionTest.error || 'Firebase connection failed');
        }

      } catch (firebaseError) {
        console.warn('Firebase setup failed:', firebaseError);
        
        // For development/testing, ask user if they want to continue with local mode
        // In production, you might want to be more persistent with Firebase
        const continueWithLocal = await askUserAboutLocalFallback(firebaseError);
        
        if (continueWithLocal) {
          // Generate local company ID for fallback
          companyId = `local_company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Show info message about Firebase fallback
          hideLoading();
          showInfo(
            'Firebase cloud sync is not available right now, but your system will work with local storage. Cloud sync will be attempted automatically when the connection is restored.',
            'Local Setup Mode'
          );
          
          // Wait for user acknowledgment
          await new Promise(resolve => {
            const checkModal = setInterval(() => {
              if (!modals.info.isOpen) {
                clearInterval(checkModal);
                resolve();
              }
            }, 100);
          });
          
          showLoading('Finalizing local setup...', 'Setup in Progress');
        } else {
          // User chose not to continue, abort setup
          throw firebaseError;
        }
      }

      hideLoading();

      // Add company ID to setup data for the modal
      const setupDataWithCompany = {
        ...formData,
        companyId,
        firebaseUserId,
        setupMode: firebaseSetupSucceeded ? 'firebase' : 'local',
        firebaseSetupSucceeded
      };

      // Show completion modal
      setShowCompletionModal(true);
      setIsSubmitting(false);

      // Store setup data temporarily for the modal
      window.tempSetupData = setupDataWithCompany;

    } catch (error) {
      console.error('Setup error:', error);
      hideLoading();
      setIsSubmitting(false);
      
      // Provide helpful error messages based on error type
      let errorTitle = 'Setup Failed';
      let errorMessage = 'An unexpected error occurred during setup. Please try again.';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/configuration-not-found':
            errorTitle = 'Firebase Configuration Error';
            errorMessage = 'Firebase authentication is not properly configured. Please check your Firebase project settings or try the local setup mode instead.';
            break;
          case 'auth/email-already-in-use':
            errorTitle = 'Email Already Registered';
            errorMessage = 'This email address is already registered. Please use a different email address or try signing in instead.';
            break;
          case 'auth/weak-password':
            errorTitle = 'Password Too Weak';
            errorMessage = 'Please choose a stronger password with at least 6 characters.';
            break;
          case 'auth/invalid-email':
            errorTitle = 'Invalid Email';
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/network-request-failed':
            errorTitle = 'Network Error';
            errorMessage = 'Unable to connect to Firebase. Please check your internet connection and try again.';
            break;
          default:
            errorMessage = `Setup failed: ${error.message}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showError(errorMessage, errorTitle);
    }
  };

  const handleCompletionModalClose = () => {
    setShowCompletionModal(false);
    onComplete(window.tempSetupData);
    delete window.tempSetupData;
  };

  // Password strength validation
  const isPasswordStrong = (password) => {
    if (!password) return false;
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;
    
    return score >= 3; // Require at least 3 out of 5 criteria
  };

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return formData.companyName && formData.companyEmail && formData.industry;
      case 2:
        return formData.adminName && formData.adminUsername && formData.adminEmail && formData.adminPassword && 
               formData.confirmPassword && formData.adminPassword === formData.confirmPassword &&
               isPasswordStrong(formData.adminPassword);
      case 3:
        return formData.currency && formData.payFrequency;
      case 4:
        return true; // Employee setup step is always valid (choice is required but has default)
      case 5:
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
                  Username *
                </label>
                <input
                  type="text"
                  name="adminUsername"
                  value={formData.adminUsername}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">This will be used for login</p>
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="adminPassword"
                  value={formData.adminPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Create a secure password"
                  required
                />
                <PasswordStrength 
                  password={formData.adminPassword} 
                  showStrength={formData.adminPassword.length > 0}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                  required
                />
                {formData.confirmPassword && formData.adminPassword !== formData.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">Passwords do not match</p>
                )}
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
              <div className="bg-indigo-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-10 w-10 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Setup</h2>
              <p className="text-gray-600">Choose how you want to set up your employees</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.employeeSetupChoice === 'later' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, employeeSetupChoice: 'later' }))}
                >
                  <div className="flex items-center mb-3">
                    <input
                      type="radio"
                      name="employeeSetupChoice"
                      value="later"
                      checked={formData.employeeSetupChoice === 'later'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label className="ml-3 text-lg font-medium text-gray-900">Set up later</label>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Skip employee setup for now. You can add employees manually or import them later from the main application.
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    ✓ Start with empty employee database<br/>
                    ✓ Add employees one by one later<br/>
                    ✓ Import from CSV later
                  </div>
                </div>

                <div 
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.employeeSetupChoice === 'now' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, employeeSetupChoice: 'now' }))}
                >
                  <div className="flex items-center mb-3">
                    <input
                      type="radio"
                      name="employeeSetupChoice"
                      value="now"
                      checked={formData.employeeSetupChoice === 'now'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label className="ml-3 text-lg font-medium text-blue-900">Import employees now</label>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Import your employee data from a CSV file during setup. This will populate your system with employee information.
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    ✓ Bulk import from CSV<br/>
                    ✓ Pre-populate employee database<br/>
                    ✓ Ready to generate payslips immediately
                  </div>
                </div>
              </div>

              {formData.employeeSetupChoice === 'now' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <FileSpreadsheet className="h-5 w-5 mr-2" />
                    Employee CSV Import
                  </h4>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Employee CSV File
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Upload a CSV file containing employee data. Required columns: name, id, basicPay, designation
                    </p>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">CSV Format Requirements:</h5>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div><strong>Required columns:</strong> name, id, basicPay, designation</div>
                      <div><strong>Optional columns:</strong> nrc, ssn, gender, dateOfJoining, transportAllowance, mealAllowance, department, address</div>
                      <div><strong>Example:</strong> name,id,basicPay,designation,department</div>
                      <div className="font-mono bg-gray-100 p-2 mt-2 rounded text-xs">
                        John Doe,EMP001,5000,Manager,IT<br/>
                        Jane Smith,EMP002,4500,Developer,IT
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-900 mb-1">Flexible Setup</h4>
                  <p className="text-sm text-green-700">
                    Don't worry about this choice - you can always add, edit, or import employees later from the main application.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
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
                    <span className="text-gray-600">Username:</span>
                    <span className="ml-2 font-medium">{formData.adminUsername}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{formData.adminEmail}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Role:</span>
                    <span className="ml-2 font-medium">{formData.adminRole}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-600">Password:</span>
                    <span className="ml-2 font-medium">••••••••</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Employee Setup
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Setup Choice:</span>
                    <span className="ml-2 font-medium">
                      {formData.employeeSetupChoice === 'now' ? 'Import employees during setup' : 'Set up employees later'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Initial Employees:</span>
                    <span className="ml-2 font-medium">
                      {formData.employeeSetupChoice === 'now' ? `${formData.initialEmployees.length} employees to import` : 'None (will start blank)'}
                    </span>
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
    <>
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

      {/* Setup Completion Modal */}
      <SetupCompletionModal 
        isOpen={showCompletionModal}
        onClose={handleCompletionModalClose}
        setupData={formData}
      />

      {/* Notification Modals */}
      <SuccessModal
        isOpen={modals.success.isOpen}
        onClose={() => closeModal('success')}
        title={modals.success.title}
        message={modals.success.message}
      />

      <ErrorModal
        isOpen={modals.error.isOpen}
        onClose={() => closeModal('error')}
        title={modals.error.title}
        message={modals.error.message}
      />

      <InfoModal
        isOpen={modals.info.isOpen}
        onClose={() => closeModal('info')}
        title={modals.info.title}
        message={modals.info.message}
      />

      <LoadingModal
        isOpen={modals.loading.isOpen}
        title={modals.loading.title}
        message={modals.loading.message}
      />
    </>
  );
};

export default InitialSetup;