import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Download, Calculator, Users, FileText, Menu, X, BarChart3, TrendingUp, DollarSign, Calendar, LogOut, User, Wifi, WifiOff, Cloud, CloudOff, Search, Upload, Check, AlertCircle, PlusCircle, Database, Settings, HelpCircle, Eye } from 'lucide-react';
import syncDatabaseService from '../services/SyncDatabaseService';
import { SuccessModal, ErrorModal, ConfirmModal, InfoModal } from './Modal';
import LoadingModal from './LoadingModal';
import { useNotification } from '../hooks/useNotification';

const PayrollGenerator = ({ user, onLogout, setupData }) => {
// Get currency info from setup data
const getCurrencyInfo = () => {
  const currency = setupData?.currency || 'USD';
  const currencyMap = {
    'USD': { symbol: '$', code: 'USD' },
    'ZMW': { symbol: 'K', code: 'ZMW' },
    'EUR': { symbol: '€', code: 'EUR' },
    'GBP': { symbol: '£', code: 'GBP' },
    'ZAR': { symbol: 'R', code: 'ZAR' }
  };
  return currencyMap[currency] || currencyMap['USD'];
};

const formatCurrency = (amount) => {
  const { symbol } = getCurrencyInfo();
  return `${symbol} ${parseFloat(amount || 0).toFixed(2)}`;
};

// Employee Database - loaded from persistent storage
const [employeeDatabase, setEmployeeDatabase] = useState([]);
const [isOnline, setIsOnline] = useState(navigator.onLine);
const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, error

// Payslips - loaded from persistent storage
const [payslips, setPayslips] = useState([]);

const [currentView, setCurrentView] = useState('dashboard');
const [selectedEmployee, setSelectedEmployee] = useState(null);
const [selectedEmployeeForPayslip, setSelectedEmployeeForPayslip] = useState('');
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const [showEmployeeForm, setShowEmployeeForm] = useState(false);
const [isCreatingPayslip, setIsCreatingPayslip] = useState(false);

// Search functionality
const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
const [dataManagementEmployeeSearch, setDataManagementEmployeeSearch] = useState('');
const [dataManagementPayslipSearch, setDataManagementPayslipSearch] = useState('');
const [newEmployee, setNewEmployee] = useState({
    id: '',
    name: '',
    nrc: '',
    ssn: '',
    gender: 'Male',
    designation: '',
    dateOfJoining: '',
    basicPay: '',
    transportAllowance: '',
    mealAllowance: '',
    address: '',
    department: '',
    napsa: '',
    nhima: ''
});
const [payrollData, setPayrollData] = useState({
    payPeriod: 'August 2024',
    workedDays: 26,
    totalDays: 30
});

// Payslip creation form state
const [payslipFormData, setPayslipFormData] = useState({
    payPeriod: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
    workedDays: 26,
    totalDays: 30
});

// Dashboard filter state
const [dashboardFilterPeriod, setDashboardFilterPeriod] = useState('');

// Notification hook for beautiful modals
const { modals, showSuccess, showError, showConfirm, showInfo, showLoading, hideLoading, closeModal } = useNotification();

// Load data from database on component mount
useEffect(() => {
    const loadData = async () => {
        setSyncStatus('syncing');
        try {
            console.log('🚀 INITIAL LOAD: Starting data load...');
            
            // Load employees from sync service
            const employees = await syncDatabaseService.getEmployees();
            console.log('👥 Loaded employees:', employees);
            setEmployeeDatabase(employees);

            // Load payslips from sync service
            console.log('📄 Loading payslips from sync service...');
            
            // Clean up any duplicate payslips first
            await syncDatabaseService.cleanupDuplicatePayslips();
            
            const savedPayslips = await syncDatabaseService.getPayslips();
            console.log('📊 Loaded payslips:', savedPayslips);
            console.log('📈 Payslips count:', savedPayslips.length);
            savedPayslips.forEach(payslip => {
                console.log('📋 Payslip:', payslip.id, 'for employee:', payslip.employeeName || payslip.employeeId);
            });
            setPayslips(savedPayslips);

            // Load payroll settings from sync service
            const settings = await syncDatabaseService.getPayrollSettings();
            setPayrollData(prevData => ({
                ...prevData,
                payPeriod: settings.payPeriod || prevData.payPeriod,
                workedDays: settings.workedDays || prevData.workedDays,
                totalDays: settings.totalDays || prevData.totalDays
            }));
            
            setSyncStatus('synced');
        } catch (error) {
            console.error('Error loading data from database:', error);
            setSyncStatus('error');
        }
    };

    loadData();

    // Listen for online/offline events
    const handleOnline = () => {
        setIsOnline(true);
        setSyncStatus('syncing');
        // Reload data when coming back online
        loadData();
    };

    const handleOffline = () => {
        setIsOnline(false);
        setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup listeners
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
}, []);

// Save payroll settings whenever they change
useEffect(() => {
    const saveSettings = async () => {
        try {
            await syncDatabaseService.setPayrollSettings(payrollData);
        } catch (error) {
            console.error('Error saving payroll settings:', error);
        }
    };
    
    saveSettings();
}, [payrollData]);

// Generate month options for current year automatically
const getCurrentYearMonths = () => {
    const currentYear = new Date().getFullYear();
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months.map(month => `${month} ${currentYear}`);
};

// Get unique periods from existing payslips for dashboard filter
const getAvailablePeriods = () => {
    const periods = [...new Set(payslips.map(p => p.payPeriod).filter(Boolean))];
    return periods.sort();
};

// Employee Management Functions
const handleAddEmployee = async () => {
    if (!newEmployee.id.trim()) {
        showError('Employee ID is required', 'Validation Error');
        return;
    }
    
    if (!newEmployee.name.trim()) {
        showError('Employee name is required', 'Validation Error');
        return;
    }

    if (!newEmployee.designation.trim()) {
        showError('Employee designation is required', 'Validation Error');
        return;
    }

    try {
        // Check if employee ID already exists
        const existingEmployee = employeeDatabase.find(emp => emp.id === newEmployee.id);
        if (existingEmployee) {
            showError(`Employee with ID ${newEmployee.id} already exists`, 'Duplicate ID');
            return;
        }

        // Prepare employee data
        const employeeData = {
            ...newEmployee,
            basicPay: parseFloat(newEmployee.basicPay) || 0,
            transportAllowance: parseFloat(newEmployee.transportAllowance) || 0,
            mealAllowance: parseFloat(newEmployee.mealAllowance) || 0,
            createdAt: new Date().toISOString()
        };

        showLoading('Adding employee...');

        // Add employee to database
        await syncDatabaseService.addEmployee(employeeData);
        
        // Update local state
        const updatedEmployees = await syncDatabaseService.getEmployees();
        setEmployeeDatabase(updatedEmployees);
        
        // Reset form
        setNewEmployee({
            id: '',
            name: '',
            nrc: '',
            ssn: '',
            gender: 'Male',
            designation: '',
            dateOfJoining: '',
            basicPay: '',
            transportAllowance: '',
            mealAllowance: '',
            address: '',
            department: '',
            napsa: '',
            nhima: ''
        });
        
        setShowEmployeeForm(false);
        hideLoading();
        showSuccess(`Employee ${employeeData.name} has been added successfully!`, 'Employee Added');
    } catch (error) {
        hideLoading();
        console.error('Error adding employee:', error);
        showError(error.message || 'Failed to add employee', 'Add Employee Failed');
    }
};

const handleDeleteEmployee = async (employeeId) => {
    const employee = employeeDatabase.find(emp => emp.id === employeeId);
    if (!employee) {
        return;
    }
    
    showConfirm(
        `Are you sure you want to delete employee ${employee.name} (${employee.id})? This action cannot be undone.`,
        async () => {
            try {
                showLoading('Deleting employee...');
                await syncDatabaseService.deleteEmployee(employeeId);
                
                // Update local state
                const updatedEmployees = await syncDatabaseService.getEmployees();
                setEmployeeDatabase(updatedEmployees);
                
                hideLoading();
                showSuccess(`Employee ${employee.name} has been deleted successfully.`, 'Employee Deleted');
                closeModal('confirm');
            } catch (error) {
                hideLoading();
                console.error('Error deleting employee:', error);
                showError(error.message || 'Failed to delete employee', 'Delete Employee Failed');
                closeModal('confirm');
            }
        },
        {
            title: 'Delete Employee',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            danger: true
        }
    );
};

const handleBulkImportEmployees = async (event) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate the JSON structure
            if (!data.employees || !Array.isArray(data.employees)) {
                showError('Invalid file format. Please ensure the JSON file has an "employees" array.', 'Invalid Format');
                return;
            }

            // Validate each employee object
            const requiredFields = ['id', 'name', 'designation'];
            const invalidEmployees = data.employees.filter(emp => 
                !requiredFields.every(field => emp[field] && emp[field].toString().trim())
            );

            if (invalidEmployees.length > 0) {
                showError(`Found ${invalidEmployees.length} employees with missing required fields (ID, Name, Designation). Please check your file.`, 'Validation Error');
                return;
            }

            // Check for duplicate IDs in the import file
            const ids = data.employees.map(emp => emp.id);
            const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
            if (duplicateIds.length > 0) {
                showError(`Duplicate employee IDs found in import file: ${duplicateIds.join(', ')}. Please fix these duplicates.`, 'Duplicate IDs');
                return;
            }

            // Check for conflicts with existing employees
            const existingIds = employeeDatabase.map(emp => emp.id);
            const conflictingIds = data.employees.filter(emp => existingIds.includes(emp.id)).map(emp => emp.id);
            
            const confirmMessage = conflictingIds.length > 0 
                ? `This will import ${data.employees.length} employees. ${conflictingIds.length} employees have IDs that already exist and will be updated: ${conflictingIds.join(', ')}. Do you want to continue?`
                : `This will import ${data.employees.length} new employees. Do you want to continue?`;

            showConfirm(
                confirmMessage,
                async () => {
                    try {
                        showLoading(`Importing ${data.employees.length} employees...`);
                        
                        let successCount = 0;
                        let errorCount = 0;
                        const errors = [];

                        for (const employeeData of data.employees) {
                            try {
                                // Ensure all required fields are present and valid
                                const processedEmployee = {
                                    id: employeeData.id.toString().trim(),
                                    name: employeeData.name.toString().trim(),
                                    nrc: employeeData.nrc ? employeeData.nrc.toString().trim() : '',
                                    ssn: employeeData.ssn ? employeeData.ssn.toString().trim() : '',
                                    gender: employeeData.gender || 'Male',
                                    designation: employeeData.designation.toString().trim(),
                                    dateOfJoining: employeeData.dateOfJoining || new Date().toISOString().split('T')[0],
                                    basicPay: parseFloat(employeeData.basicPay) || 0,
                                    transportAllowance: parseFloat(employeeData.transportAllowance) || 0,
                                    mealAllowance: parseFloat(employeeData.mealAllowance) || 0,
                                    department: employeeData.department ? employeeData.department.toString().trim() : '',
                                    address: employeeData.address ? employeeData.address.toString().trim() : '',
                                    createdAt: new Date().toISOString()
                                };

                                await syncDatabaseService.addEmployee(processedEmployee);
                                successCount++;
                            } catch (error) {
                                errorCount++;
                                errors.push(`${employeeData.id}: ${error.message}`);
                                console.error(`Error importing employee ${employeeData.id}:`, error);
                            }
                        }

                        // Refresh the employee list
                        const updatedEmployees = await syncDatabaseService.getEmployees();
                        setEmployeeDatabase(updatedEmployees);

                        hideLoading();
                        closeModal('confirm');

                        // Show comprehensive result message
                        if (errorCount === 0) {
                            showSuccess(`Successfully imported all ${successCount} employees!`, 'Bulk Import Complete');
                        } else if (successCount > 0) {
                            showInfo(`Import completed with mixed results:\n✅ ${successCount} employees imported successfully\n❌ ${errorCount} employees failed\n\nErrors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more' : ''}`, 'Import Results');
                        } else {
                            showError(`Failed to import any employees. Errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more' : ''}`, 'Import Failed');
                        }

                    } catch (error) {
                        hideLoading();
                        closeModal('confirm');
                        console.error('Error during bulk import:', error);
                        showError(`Bulk import failed: ${error.message}`, 'Import Error');
                    }
                },
                {
                    title: 'Confirm Bulk Import',
                    confirmText: 'Import Employees',
                    cancelText: 'Cancel',
                    danger: false
                }
            );

        } catch (error) {
            console.error('Error parsing employee file:', error);
            showError('The selected file is not a valid JSON file. Please check the file format and try again.', 'Invalid File');
        }
    };

    reader.readAsText(file);
    
    // Reset the file input
    event.target.value = '';
  };

  const [newPayslip, setNewPayslip] = useState({
    employeeId: '',
    otherEarnings: [],
    otherDeductions: []
  });const calculateDeductions = (basicPay, otherDeductions = []) => {
    const napsa = basicPay * 0.05; // 5% NAPSA
    const nhima = basicPay * 0.01; // 1% NHIMA
    const otherDeductionsTotal = otherDeductions.reduce((sum, deduction) => sum + deduction.amount, 0);
    return { napsa, nhima, loan: 0, otherDeductions: otherDeductionsTotal };
};

const calculatePayslip = (employee) => {
    // Auto-calculate house rent allowance as 30% of basic pay
    const calculatedHouseRent = employee.basicPay * 0.30;
    const otherEarningsTotal = (employee.otherEarnings || []).reduce((sum, earning) => sum + earning.amount, 0);
    
    const totalEarnings = employee.basicPay + employee.transportAllowance + 
calculatedHouseRent + employee.mealAllowance + otherEarningsTotal;
    
    const deductions = calculateDeductions(employee.basicPay, employee.otherDeductions || []);
    const totalDeductions = deductions.napsa + deductions.nhima + deductions.loan + deductions.otherDeductions;
    const netPay = totalEarnings - totalDeductions;

    return {
      ...employee,
      houseRentAllowance: calculatedHouseRent, // Override with calculated value
      otherEarningsTotal,
      totalEarnings,
      deductions,
      totalDeductions,
      netPay
    };
  };

  const addPayslip = async () => {
    if (!selectedEmployeeForPayslip) {
      showError('Please select an employee');
      return;
    }

    if (isCreatingPayslip) {
      return; // Prevent double clicks
    }

    setIsCreatingPayslip(true);

    try {
      const employee = employeeDatabase.find(emp => emp.id === selectedEmployeeForPayslip);
      if (!employee) {
        showError('Selected employee not found');
        setIsCreatingPayslip(false);
        return;
      }

      // Check if payslip already exists for this employee and pay period
      const existingPayslip = payslips.find(p => 
        p.employeeId === employee.id && p.payPeriod === payslipFormData.payPeriod
      );
      if (existingPayslip) {
        showError(`Payslip already exists for ${employee.name} for ${payslipFormData.payPeriod}`);
        setIsCreatingPayslip(false);
        return;
      }

      showLoading('Generating payslip...');

      // Generate payslip with proper ID and flatten employee data for easier access
      const payslipId = `PS_${employee.id}_${Date.now()}`;
      const newPayslip = {
        id: payslipId,
        // Employee info flattened for easier access in table
        employeeId: employee.id,
        name: employee.name,
        designation: employee.designation,
        nrc: employee.nrc,
        dateOfJoining: employee.dateOfJoining,
        gender: employee.gender,
        ssn: employee.ssn,
        // Payroll data
        payPeriod: payslipFormData.payPeriod,
        workedDays: payslipFormData.workedDays,
        totalDays: payslipFormData.totalDays,
        basicPay: parseFloat(employee.basicPay) || 0,
        transportAllowance: parseFloat(employee.transportAllowance) || 0,
        mealAllowance: parseFloat(employee.mealAllowance) || 0,
        department: employee.department || '',
        address: employee.address || '',
        // Keep full employee object for backward compatibility
        employee: employee,
        createdAt: new Date().toISOString(),
        // Initialize other earnings and deductions as empty arrays
        otherEarnings: [],
        otherDeductions: []
      };

      // Save to database
      await syncDatabaseService.addPayslip(newPayslip);
      
      // Clean up any duplicates immediately after adding
      await syncDatabaseService.cleanupDuplicatePayslips();
      
      // Update local state with cleaned data
      const updatedPayslips = await syncDatabaseService.getPayslips();
      setPayslips(updatedPayslips);

      hideLoading();
      showSuccess(`Payslip generated successfully for ${employee.name}!`);
      setSelectedEmployeeForPayslip('');
      
      // Reset payslip form
      setNewPayslip({
        employeeId: '',
        otherEarnings: [],
        otherDeductions: []
      });
      
      setIsCreatingPayslip(false);
    } catch (error) {
      console.error('Error generating payslip:', error);
      hideLoading();
      showError('Failed to generate payslip');
      setIsCreatingPayslip(false);
    }
  };

  const addOtherEarning = () => {
    setNewPayslip({
      ...newPayslip,
      otherEarnings: [...newPayslip.otherEarnings, { name: '', amount: 0 }]
    });
  };

  const removeOtherEarning = (index) => {
    const updatedEarnings = newPayslip.otherEarnings.filter((_, i) => i !== index);
    setNewPayslip({ ...newPayslip, otherEarnings: updatedEarnings });
  };

  const updateOtherEarning = (index, field, value) => {
    const updatedEarnings = newPayslip.otherEarnings.map((earning, i) => 
      i === index ? { ...earning, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : earning
    );
    setNewPayslip({ ...newPayslip, otherEarnings: updatedEarnings });
  };

  const addOtherDeduction = () => {
    setNewPayslip({
      ...newPayslip,
      otherDeductions: [...newPayslip.otherDeductions, { name: '', amount: 0 }]
    });
  };

  const removeOtherDeduction = (index) => {
    const updatedDeductions = newPayslip.otherDeductions.filter((_, i) => i !== index);
    setNewPayslip({ ...newPayslip, otherDeductions: updatedDeductions });
  };

  const updateOtherDeduction = (index, field, value) => {
    const updatedDeductions = newPayslip.otherDeductions.map((deduction, i) => 
      i === index ? { ...deduction, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : deduction
    );
    setNewPayslip({ ...newPayslip, otherDeductions: updatedDeductions });
  };

  const deletePayslip = (payslipId) => {
    console.log('🗑️ Delete payslip called with ID:', payslipId);
    console.log('📊 Current payslips:', payslips);
    
    const payslip = payslips.find(p => p.id === payslipId);
    console.log('🔍 Found payslip to delete:', payslip);
    
    if (!payslip) {
      console.error('❌ Payslip not found with ID:', payslipId);
      showError('Payslip not found');
      return;
    }
    
    showConfirm(
      'Are you sure you want to delete this payslip? This action cannot be undone.',
      async () => {
        try {
          console.log('🚀 Starting delete operation for payslip ID:', payslipId);
          showLoading('Deleting payslip...');
          
          // Delete from database
          await syncDatabaseService.deletePayslip(payslipId);
          
          // Update local state with fresh data
          const updatedPayslips = await syncDatabaseService.getPayslips();
          setPayslips(updatedPayslips);
          
          hideLoading();
          closeModal('confirm');
          showSuccess('Payslip deleted successfully!');
        } catch (error) {
          console.error('Error deleting payslip:', error);
          hideLoading();
          closeModal('confirm');
          showError('Failed to delete payslip. Please try again.');
        }
      },
      {
        title: 'Delete Payslip',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        danger: true
      }
    );
  };

  const generatePayslip = (payslipData) => {
    const payslip = calculatePayslip(payslipData);
    setSelectedEmployee(payslip);
    setCurrentView('payslip');
  };

  const printSinglePayslip = (payslipData) => {
    const calculatedPayslip = calculatePayslip(payslipData);
    
    // Create a temporary print-specific element
    const printElement = document.createElement('div');
    printElement.id = 'print-payslip';
    // Hide the element immediately to prevent it from showing on screen
    printElement.style.display = 'none';
    printElement.innerHTML = `
      <div class="payslip-print">
        <div class="header">
          <div class="company-name">SPF & CM ENTERPRISES LIMITED</div>
          <div class="company-address">2670 Town Area, Senanga Rd.</div>
        </div>
        
        <div class="payslip-title">Payslip</div>
        
        <table class="employee-info">
          <tr>
            <td class="info-section">
              <div class="info-row">
                <span class="label">Employee Number:</span>
                <span class="value">${payslipData.employeeId || payslipData.id || payslipData.employee?.id || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Date of Joining:</span>
                <span class="value">${payslipData.dateOfJoining || payslipData.employee?.dateOfJoining || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Pay Period:</span>
                <span class="value">${payslipData.payPeriod || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Worked Days:</span>
                <span class="value">${payslipData.workedDays || payslipData.totalDays || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Total Days:</span>
                <span class="value">${payslipData.totalDays || 'N/A'}</span>
              </div>
            </td>
            <td class="info-section">
              <div class="info-row">
                <span class="label">Employee Name:</span>
                <span class="value">${payslipData.name || payslipData.employee?.name || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Gender:</span>
                <span class="value">${payslipData.gender || payslipData.employee?.gender || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">NRC:</span>
                <span class="value">${payslipData.nrc || payslipData.employee?.nrc || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">SSN:</span>
                <span class="value">${payslipData.ssn || payslipData.employee?.ssn || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Department:</span>
                <span class="value">${payslipData.department || payslipData.employee?.department || 'N/A'}</span>
              </div>
            </td>
          </tr>
        </table>
        
        <div class="designation-section">
          <strong>Designation:</strong> ${payslipData.designation || payslipData.employee?.designation || 'N/A'}
        </div>
        
        <table class="earnings-deductions">
          <tr>
            <th class="section-title">Earnings</th>
            <th class="section-title">Amount</th>
            <th class="section-title">Deductions</th>
            <th class="section-title">Amount</th>
          </tr>
          <tr>
            <td>Basic</td>
            <td>ZMW ${(payslipData.basicPay || payslipData.employee?.basicPay || 0).toFixed(2)}</td>
            <td>NAPSA</td>
            <td>ZMW ${(calculatedPayslip.deductions?.napsa || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Transport Allowance</td>
            <td>ZMW ${(payslipData.transportAllowance || payslipData.employee?.transportAllowance || 0).toFixed(2)}</td>
            <td>NHIMA</td>
            <td>ZMW ${(calculatedPayslip.deductions?.nhima || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>House Rent Allowance</td>
            <td>ZMW ${(calculatedPayslip.houseRentAllowance || 0).toFixed(2)}</td>
            <td>Loan</td>
            <td>ZMW ${(calculatedPayslip.deductions?.loan || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Meal Allowance</td>
            <td>ZMW ${(payslipData.mealAllowance || payslipData.employee?.mealAllowance || 0).toFixed(2)}</td>
            <td></td>
            <td></td>
          </tr>
          ${(payslipData.otherEarnings || []).map(earning => 
            `<tr><td>${earning.name || 'Other Earning'}</td><td>ZMW ${(earning.amount || 0).toFixed(2)}</td><td></td><td></td></tr>`
          ).join('')}
          ${(payslipData.otherDeductions || []).map(deduction => 
            `<tr><td></td><td></td><td>${deduction.name || 'Other Deduction'}</td><td>ZMW ${(deduction.amount || 0).toFixed(2)}</td></tr>`
          ).join('')}
          <tr class="total-row">
            <td><strong>Total Earnings</strong></td>
            <td><strong>ZMW ${(calculatedPayslip.totalEarnings || 0).toFixed(2)}</strong></td>
            <td><strong>Total Deductions</strong></td>
            <td><strong>ZMW ${(calculatedPayslip.totalDeductions || 0).toFixed(2)}</strong></td>
          </tr>
        </table>
        
        <div class="net-pay">
          <strong>Net Pay: ZMW ${(calculatedPayslip.netPay || 0).toFixed(2)}</strong>
        </div>
        
        <div class="amount-words">
          Amount in words: ${numberToWords(calculatedPayslip.netPay || 0)}
        </div>
        
        <table class="signatures">
          <tr>
            <td class="signature">
              <div class="signature-line"></div>
              <div>Employer Signature</div>
            </td>
            <td class="signature">
              <div class="signature-line"></div>
              <div>Employee Signature</div>
            </td>
          </tr>
        </table>
        
        <div class="footer">
          Generated on ${new Date().toLocaleDateString()} | This is system generated payslip
        </div>
      </div>
    `;

    // Add print-specific styles
    const printStyles = document.createElement('style');
    printStyles.id = 'print-styles';
    printStyles.innerHTML = `
      @media print {
        @page {
          size: A4;
          margin: 15mm;
        }
        
        body * {
          visibility: hidden;
        }
        #print-payslip, #print-payslip * {
          visibility: visible;
        }
        #print-payslip {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          display: block !important; /* Override the display: none */
        }
        
        .payslip-print {
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: black !important;
          width: 100%;
          max-width: 210mm;
          margin: 0 auto;
          background: white !important;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid black !important;
          padding-bottom: 10px;
        }
        
        .company-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
          letter-spacing: 1px;
          color: black !important;
        }
        
        .company-address {
          font-size: 12px;
          color: black !important;
          margin-bottom: 5px;
        }
        
        .payslip-title {
          font-size: 16px;
          font-weight: bold;
          margin: 15px 0;
          text-align: center;
          text-decoration: underline;
          color: black !important;
        }
        
        .employee-info {
          width: 100% !important;
          margin-bottom: 20px !important;
          border: 2px solid black !important;
          border-collapse: collapse !important;
          background-color: #f8f9fa !important;
          table-layout: fixed !important;
        }
        
        .employee-info td {
          padding: 12px !important;
          vertical-align: top !important;
          width: 50% !important;
          border-right: 1px solid black !important;
          border-bottom: none !important;
          font-size: 11px !important;
          line-height: 1.3 !important;
        }
        
        .employee-info td:last-child {
          border-right: none !important;
        }
        
        .info-row {
          margin-bottom: 8px !important;
          font-size: 11px !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: flex-start !important;
          clear: both !important;
          width: 100% !important;
        }
        
        .info-row:last-child {
          margin-bottom: 0 !important;
        }
        
        .label {
          font-weight: bold !important;
          color: black !important;
          width: 48% !important;
          text-align: left !important;
          display: inline-block !important;
          margin-right: 4px !important;
        }
        
        .value {
          color: black !important;
          width: 48% !important;
          text-align: left !important;
          display: inline-block !important;
          word-wrap: break-word !important;
        }
        
        .designation-section {
          text-align: center;
          margin-bottom: 20px;
          padding: 8px;
          background-color: #f0f0f0 !important;
          border: 1px solid black !important;
          font-size: 12px;
          color: black !important;
        }
        
        .earnings-deductions {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          border: 1px solid black !important;
        }
        
        .earnings-deductions th,
        .earnings-deductions td {
          border: 1px solid black !important;
          padding: 6px 8px;
          text-align: left;
          font-size: 11px;
          color: black !important;
        }
        
        .section-title {
          font-weight: bold;
          text-align: center;
          background-color: #e0e0e0 !important;
          color: black !important;
        }
        
        .earnings-deductions td:nth-child(2),
        .earnings-deductions td:nth-child(4) {
          text-align: right;
        }
        
        .total-row {
          background-color: #f0f0f0 !important;
        }
        
        .total-row td {
          font-weight: bold !important;
          border-top: 2px solid black !important;
          color: black !important;
        }
        
        .net-pay {
          text-align: center;
          margin: 20px 0;
          padding: 12px;
          background-color: #f0f0f0 !important;
          font-size: 16px;
          font-weight: bold;
          border: 2px solid black !important;
          color: black !important;
        }
        
        .amount-words {
          margin: 15px 0;
          font-style: italic;
          font-size: 11px;
          text-align: center;
          padding: 8px;
          border: 1px dashed black !important;
          color: black !important;
        }
        
        .signatures {
          width: 100%;
          margin-top: 30px;
          border-collapse: collapse;
        }
        
        .signature {
          width: 50%;
          text-align: center;
          padding: 20px 10px;
          font-size: 11px;
          color: black !important;
        }
        
        .signature-line {
          border-bottom: 1px solid black !important;
          height: 40px;
          margin-bottom: 8px;
        }
        
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 10px;
          color: black !important;
          border-top: 1px solid black !important;
          padding-top: 8px;
        }
      }
    `;

    // Add elements to the page
    document.head.appendChild(printStyles);
    document.body.appendChild(printElement);

    // Trigger print
    window.print();

    // Clean up after printing
    const cleanup = () => {
      if (printStyles && document.head.contains(printStyles)) {
        document.head.removeChild(printStyles);
      }
      if (printElement && document.body.contains(printElement)) {
        document.body.removeChild(printElement);
      }
      window.removeEventListener('afterprint', cleanup);
      window.removeEventListener('beforeunload', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    window.addEventListener('beforeunload', cleanup);
  };

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Million', 'Billion'];

    if (num === 0) {
      return 'Zero Kwacha';
    }

    const convertHundreds = (n) => {
      let result = '';
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n >= 10) {
        result += teens[n - 10] + ' ';
        return result;
      }
      if (n > 0) {
        result += ones[n] + ' ';
      }
      return result;
    };

    const wholeNumber = Math.floor(num);
    const decimal = Math.round((num - wholeNumber) * 100);

    let result = '';
    let thousandIndex = 0;
    let temp = wholeNumber;

    while (temp > 0) {
      const chunk = temp % 1000;
      if (chunk !== 0) {
        result = convertHundreds(chunk) + thousands[thousandIndex] + ' ' + result;
      }
      temp = Math.floor(temp / 1000);
      thousandIndex++;
    }

    result = result.trim() + ' Kwacha';
    if (decimal > 0) {
      result += ' ' + convertHundreds(decimal).trim() + ' Ngwee';
    }

    return result;
  };

  // Search and period filtering functions
  const filterPayslipsByPeriod = (payslips, selectedPeriod) => {
    return payslips.filter(payslip => payslip.payPeriod === selectedPeriod);
  };

  const filterPayslips = (payslips, searchQuery, selectedPeriod = null) => {
    // First filter by period if specified
    let filteredPayslips = selectedPeriod ? filterPayslipsByPeriod(payslips, selectedPeriod) : payslips;
    
    // Then filter by search query if provided
    if (!searchQuery.trim()) {
      return filteredPayslips;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return filteredPayslips.filter(payslip => {
      return (
        payslip.name?.toLowerCase().includes(query) ||
        payslip.id?.toLowerCase().includes(query) ||
        payslip.employeeId?.toLowerCase().includes(query) ||
        payslip.designation?.toLowerCase().includes(query) ||
        payslip.department?.toLowerCase().includes(query)
      );
    });
  };

  const filterEmployees = (employees, searchQuery) => {
    if (!searchQuery.trim()) {
      return employees;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return employees.filter(employee => {
      return (
        employee.name?.toLowerCase().includes(query) ||
        employee.id?.toLowerCase().includes(query) ||
        employee.designation?.toLowerCase().includes(query) ||
        employee.department?.toLowerCase().includes(query) ||
        employee.nrc?.toLowerCase().includes(query)
      );
    });
  };

  const renderDashboard = () => {
    const availablePeriods = getAvailablePeriods();
    // Use dashboardFilterPeriod directly, don't auto-select if empty (empty means "All Periods")
    const currentFilterPeriod = dashboardFilterPeriod;
    
    return (
    <div className="space-y-4 sm:space-y-6">
      {/* Pay Period Filter */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          <div className="flex-shrink-0">
            <label className="text-sm font-medium text-gray-700">Filter by Pay Period:</label>
          </div>
          <div className="flex-1">
            <select
              value={currentFilterPeriod || ""}
              onChange={(e) => setDashboardFilterPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Periods</option>
              {availablePeriods.map(period => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="space-y-3 sm:space-y-4">
        <div className="stat-card-users">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{employeeDatabase.length}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="stat-card-payroll">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
                <Calculator className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm text-gray-600">Total Payslips Created</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{payslips.length}</p>
              </div>
            </div>
          </div>
          
          <div className="stat-card-payroll">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg flex-shrink-0">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm text-gray-600">Total Wage Bill</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {formatCurrency(payslips.reduce((sum, payslip) => {
                    const calculatedPayslip = calculatePayslip(payslip);
                    return sum + calculatedPayslip.netPay;
                  }, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="stat-card-period">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm text-gray-600">Viewing Period</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{currentFilterPeriod || 'All Periods'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payslips Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-3 sm:px-4 py-3 border-b border-gray-200">
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Generated Payslips</h2>
              <p className="text-xs text-gray-600 mt-1">
                {currentFilterPeriod || 'All Periods'} • {filterPayslips(payslips, dashboardSearchQuery, currentFilterPeriod).length} payslip{filterPayslips(payslips, dashboardSearchQuery, currentFilterPeriod).length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, ID, designation..."
                value={dashboardSearchQuery}
                onChange={(e) => setDashboardSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="flex flex-col xs:flex-row gap-2">
              <button
                onClick={() => {
                  const filteredPayslips = filterPayslips(payslips, dashboardSearchQuery, currentFilterPeriod);
                  if (filteredPayslips.length === 0) {
                    showInfo('No payslips found matching your search criteria. Please try a different search term or create some payslips first.', 'No Payslips Found');
                    return;
                  }
                  // Generate and export filtered payslips as PDF
                  const exportFilteredPayslips = () => {
                    // Create a temporary print-specific element
                    const printElement = document.createElement('div');
                    printElement.id = 'print-all-payslips';
                    // Hide the element immediately to prevent it from showing on screen
                    printElement.style.display = 'none';
                    
                    let payslipsHtml = '';
                    filteredPayslips.forEach((payslip, index) => {
                      const calculatedPayslip = calculatePayslip(payslip);
                      payslipsHtml += `
                        <div class="payslip${index < filteredPayslips.length - 1 ? ' page-break' : ''}">
                          <div class="header">
                            <div class="company-name">SPF & CM ENTERPRISES LIMITED</div>
                            <div class="company-address">2670 Town Area, Senanga Rd.</div>
                          </div>
                          
                          <div class="payslip-title">Payslip</div>
                          
                          <table class="employee-info">
                            <tr>
                              <td class="info-section">
                                <div class="info-row">
                                  <span class="label">Employee Number:</span>
                                  <span class="value">${payslip.employeeId || payslip.id || payslip.employee?.id || 'N/A'}</span>
                                </div>
                                <div class="info-row">
                                  <span class="label">Date of Joining:</span>
                                  <span class="value">${payslip.dateOfJoining || payslip.employee?.dateOfJoining || 'N/A'}</span>
                                </div>
                                <div class="info-row">
                                  <span class="label">Pay Period:</span>
                                  <span class="value">${payslip.payPeriod || 'N/A'}</span>
                                </div>
                                <div class="info-row">
                                  <span class="label">Worked Days:</span>
                                  <span class="value">${payslip.workedDays || payslip.totalDays || 'N/A'}</span>
                                </div>
                                <div class="info-row">
                                  <span class="label">Total Days:</span>
                                  <span class="value">${payslip.totalDays || 'N/A'}</span>
                                </div>
                              </td>
                              <td class="info-section">
                                <div class="info-row">
                                  <span class="label">Employee Name:</span>
                                  <span class="value">${payslip.name || payslip.employee?.name || 'N/A'}</span>
                                </div>
                                <div class="info-row">
                                  <span class="label">Gender:</span>
                                  <span class="value">${payslip.gender || payslip.employee?.gender || 'N/A'}</span>
                                </div>
                                <div class="info-row">
                                  <span class="label">NRC:</span>
                                  <span class="value">${payslip.nrc || payslip.employee?.nrc || 'N/A'}</span>
                                </div>
                                <div class="info-row">
                                  <span class="label">SSN:</span>
                                  <span class="value">${payslip.ssn || payslip.employee?.ssn || 'N/A'}</span>
                                </div>
                                <div class="info-row">
                                  <span class="label">Department:</span>
                                  <span class="value">${payslip.department || payslip.employee?.department || 'N/A'}</span>
                                </div>
                              </td>
                            </tr>
                          </table>
                          
                          <div class="designation-section">
                            <strong>Designation:</strong> ${payslip.designation || payslip.employee?.designation || 'N/A'}
                          </div>
                          
                          <table class="earnings-deductions">
                            <tr>
                              <th class="section-title">Earnings</th>
                              <th class="section-title">Amount</th>
                              <th class="section-title">Deductions</th>
                              <th class="section-title">Amount</th>
                            </tr>
                            <tr>
                              <td>Basic</td>
                              <td>ZMW ${(payslip.basicPay || payslip.employee?.basicPay || 0).toFixed(2)}</td>
                              <td>NAPSA</td>
                              <td>ZMW ${(calculatedPayslip.deductions?.napsa || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td>Transport Allowance</td>
                              <td>ZMW ${(payslip.transportAllowance || payslip.employee?.transportAllowance || 0).toFixed(2)}</td>
                              <td>NHIMA</td>
                              <td>ZMW ${(calculatedPayslip.deductions?.nhima || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td>House Rent Allowance</td>
                              <td>ZMW ${(calculatedPayslip.houseRentAllowance || 0).toFixed(2)}</td>
                              <td>Loan</td>
                              <td>ZMW ${(calculatedPayslip.deductions?.loan || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td>Meal Allowance</td>
                              <td>ZMW ${(payslip.mealAllowance || payslip.employee?.mealAllowance || 0).toFixed(2)}</td>
                              <td></td>
                              <td></td>
                            </tr>
                            ${(payslip.otherEarnings || []).map(earning => 
                              `<tr><td>${earning.name || 'Other Earning'}</td><td>ZMW ${(earning.amount || 0).toFixed(2)}</td><td></td><td></td></tr>`
                            ).join('')}
                            ${(payslip.otherDeductions || []).map(deduction => 
                              `<tr><td></td><td></td><td>${deduction.name || 'Other Deduction'}</td><td>ZMW ${(deduction.amount || 0).toFixed(2)}</td></tr>`
                            ).join('')}
                            <tr class="total-row">
                              <td><strong>Total Earnings</strong></td>
                              <td><strong>ZMW ${(calculatedPayslip.totalEarnings || 0).toFixed(2)}</strong></td>
                              <td><strong>Total Deductions</strong></td>
                              <td><strong>ZMW ${(calculatedPayslip.totalDeductions || 0).toFixed(2)}</strong></td>
                            </tr>
                          </table>
                          
                          <div class="net-pay">
                            <strong>Net Pay: ZMW ${(calculatedPayslip.netPay || 0).toFixed(2)}</strong>
                          </div>
                          
                          <div class="amount-words">
                            Amount in words: ${numberToWords(calculatedPayslip.netPay || 0)}
                          </div>
                          
                          <table class="signatures">
                            <tr>
                              <td class="signature">
                                <div class="signature-line"></div>
                                <div>Employer Signature</div>
                              </td>
                              <td class="signature">
                                <div class="signature-line"></div>
                                <div>Employee Signature</div>
                              </td>
                            </tr>
                          </table>
                          
                          <div class="footer">
                            Generated on ${new Date().toLocaleDateString()} | Page ${index + 1} of ${filteredPayslips.length}
                          </div>
                        </div>
                      `;
                    });
                    
                    printElement.innerHTML = payslipsHtml;

                    // Add print-specific styles
                    const printStyles = document.createElement('style');
                    printStyles.id = 'print-all-styles';
                    printStyles.innerHTML = `
                      @media print {
                        @page {
                          size: A4;
                          margin: 15mm;
                        }
                        
                        body * {
                          visibility: hidden;
                        }
                        #print-all-payslips, #print-all-payslips * {
                          visibility: visible;
                        }
                        #print-all-payslips {
                          position: absolute;
                          left: 0;
                          top: 0;
                          width: 100%;
                          display: block !important; /* Override the display: none */
                        }
                        
                        .payslip {
                          font-family: Arial, sans-serif;
                          font-size: 12px;
                          line-height: 1.4;
                          color: #000;
                          width: 100%;
                          padding: 10mm 0;
                        }
                        
                        .page-break {
                          page-break-after: always;
                        }
                        
                        .header {
                          text-align: center;
                          margin-bottom: 20px;
                          border-bottom: 2px solid #000;
                          padding-bottom: 10px;
                        }
                        
                        .company-name {
                          font-size: 18px;
                          font-weight: bold;
                          margin-bottom: 3px;
                          letter-spacing: 1px;
                        }
                        
                        .company-address {
                          font-size: 11px;
                          color: #333;
                          margin-bottom: 5px;
                        }
                        
                        .payslip-title {
                          font-size: 16px;
                          font-weight: bold;
                          margin: 15px 0;
                          text-align: center;
                          text-decoration: underline;
                        }
                        
                        .employee-info {
                          width: 100% !important;
                          margin-bottom: 20px !important;
                          border: 2px solid black !important;
                          border-collapse: collapse !important;
                          background-color: #f8f9fa !important;
                          table-layout: fixed !important;
                        }
                        
                        .employee-info td {
                          padding: 12px !important;
                          vertical-align: top !important;
                          width: 50% !important;
                          border-right: 1px solid black !important;
                          border-bottom: none !important;
                          font-size: 11px !important;
                          line-height: 1.3 !important;
                        }
                        
                        .employee-info td:last-child {
                          border-right: none !important;
                        }
                        
                        .info-row {
                          margin-bottom: 8px !important;
                          font-size: 11px !important;
                          display: flex !important;
                          justify-content: space-between !important;
                          align-items: flex-start !important;
                          clear: both !important;
                          width: 100% !important;
                        }
                        
                        .info-row:last-child {
                          margin-bottom: 0 !important;
                        }
                        
                        .label {
                          font-weight: bold !important;
                          color: black !important;
                          width: 48% !important;
                          text-align: left !important;
                          display: inline-block !important;
                          margin-right: 4px !important;
                        }
                        
                        .designation-section {
                          text-align: center !important;
                          margin-bottom: 20px !important;
                          padding: 8px !important;
                          background-color: #f0f0f0 !important;
                          border: 1px solid black !important;
                          font-size: 12px !important;
                          color: black !important;
                        }
                        
                        .value {
                          color: black !important;
                          width: 48% !important;
                          text-align: left !important;
                          display: inline-block !important;
                          word-wrap: break-word !important;
                        }
                        
                        .earnings-deductions {
                          width: 100% !important;
                          border-collapse: collapse !important;
                          margin-bottom: 20px !important;
                          border: 1px solid black !important;
                        }
                        
                        .earnings-deductions th,
                        .earnings-deductions td {
                          border: 1px solid black !important;
                          padding: 6px 8px !important;
                          text-align: left !important;
                          font-size: 11px !important;
                          color: black !important;
                        }
                        
                        .section-title {
                          font-weight: bold !important;
                          text-align: center !important;
                          background-color: #e0e0e0 !important;
                          color: black !important;
                        }
                        
                        .earnings-deductions td:nth-child(2),
                        .earnings-deductions td:nth-child(4) {
                          text-align: right !important;
                        }
                        
                        .total-row {
                          background-color: #f0f0f0 !important;
                        }
                        
                        .total-row td {
                          font-weight: bold !important;
                          border-top: 2px solid black !important;
                          color: black !important;
                        }
                        
                        .net-pay {
                          text-align: center !important;
                          margin: 20px 0 !important;
                          padding: 12px !important;
                          background-color: #f0f0f0 !important;
                          font-size: 16px !important;
                          font-weight: bold !important;
                          border: 2px solid black !important;
                          color: black !important;
                        }
                        
                        .amount-words {
                          margin: 15px 0 !important;
                          font-style: italic !important;
                          font-size: 11px !important;
                          text-align: center !important;
                          padding: 8px !important;
                          border: 1px dashed black !important;
                          color: black !important;
                        }
                        
                        .signatures {
                          width: 100% !important;
                          margin-top: 30px !important;
                          border-collapse: collapse !important;
                        }
                        
                        .signature {
                          width: 50% !important;
                          text-align: center !important;
                          padding: 20px 10px !important;
                          font-size: 11px !important;
                          color: black !important;
                        }
                        
                        .signature-line {
                          border-bottom: 1px solid black !important;
                          height: 40px !important;
                          margin-bottom: 8px !important;
                        }
                        
                        .footer {
                          margin-top: 20px !important;
                          text-align: center !important;
                          font-size: 10px !important;
                          color: black !important;
                          border-top: 1px solid black !important;
                          padding-top: 8px !important;
                        }
                      }
                    `;

                    // Add elements to the page
                    document.head.appendChild(printStyles);
                    document.body.appendChild(printElement);

                    // Trigger print
                    window.print();

                    // Clean up after printing
                    const cleanup = () => {
                      if (printStyles && document.head.contains(printStyles)) {
                        document.head.removeChild(printStyles);
                      }
                      if (printElement && document.body.contains(printElement)) {
                        document.body.removeChild(printElement);
                      }
                      window.removeEventListener('afterprint', cleanup);
                      window.removeEventListener('beforeunload', cleanup);
                    };

                    window.addEventListener('afterprint', cleanup);
                    window.addEventListener('beforeunload', cleanup);
                  };
                  exportFilteredPayslips();
                }}
                disabled={filterPayslips(payslips, dashboardSearchQuery, currentFilterPeriod).length === 0}
                className={`px-3 py-2 rounded text-sm flex items-center gap-1 transition-colors min-h-touch ${
                  filterPayslips(payslips, dashboardSearchQuery, currentFilterPeriod).length === 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <Download className="h-4 w-4" />
                <span className="hidden xs:inline">Export {dashboardSearchQuery ? 'Filtered ' : 'Period '}PDF</span>
                <span className="xs:hidden">Export</span>
              </button>
              <button
                onClick={() => setCurrentView('addPayslip')}
                className="bg-blue-600 text-white px-3 py-2 rounded text-sm flex items-center gap-1 hover:bg-blue-700 transition-colors min-h-touch"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline">Add Payslip</span>
                <span className="xs:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Cards View (hidden on md and up) */}
        <div className="md:hidden">
          {filterPayslips(payslips, dashboardSearchQuery, currentFilterPeriod).map((payslip) => {
            const calculatedPayslip = calculatePayslip(payslip);
            return (
              <div key={payslip.id} className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-blue-700">
                        {payslip.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </span>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{payslip.name}</div>
                      <div className="text-xs text-gray-500">{payslip.employeeId}</div>
                    </div>
                  </div>
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 flex-shrink-0">
                    {payslip.designation}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Basic Pay</div>
                    <div className="font-medium">{payslip.basicPay.toFixed(0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Earnings</div>
                    <div className="font-medium">{calculatedPayslip.totalEarnings.toFixed(0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Net Pay</div>
                    <div className="font-semibold text-green-600">{calculatedPayslip.netPay.toFixed(0)}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                    Ready
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => generatePayslip(payslip)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors min-h-touch"
                      title="View Payslip"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => {
                        generatePayslip(payslip);
                        setTimeout(() => window.print(), 100);
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors min-h-touch"
                      title="Print Payslip"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print
                    </button>
                    <button
                      onClick={() => deletePayslip(payslip.id)}
                      className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors min-h-touch"
                      title="Delete Payslip"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filterPayslips(payslips, dashboardSearchQuery, currentFilterPeriod).length === 0 && payslips.length > 0 && dashboardSearchQuery && (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center">
                <Search className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-base font-medium text-gray-900 mb-2">No payslips found</h3>
                <p className="text-sm text-gray-500 mb-4">No payslips match your search criteria "{dashboardSearchQuery}"</p>
                <button
                  onClick={() => setDashboardSearchQuery('')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-touch"
                >
                  Clear Search
                </button>
              </div>
            </div>
          )}
          {payslips.length === 0 && (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center">
                <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2m-2 4H9a2 2 0 01-2-2v-4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-base font-medium text-gray-900 mb-2">No payslips created</h3>
                <p className="text-sm text-gray-500 mb-4">Get started by creating your first payslip</p>
                <button
                  onClick={() => setCurrentView('addPayslip')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-touch"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Payslip
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table View (hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <span>Employee</span>
                    <svg className="h-3 w-3 text-gray-400 cursor-pointer hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <span>Basic Pay</span>
                    <svg className="h-3 w-3 text-gray-400 cursor-pointer hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Earnings
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <span>Net Pay</span>
                    <svg className="h-3 w-3 text-gray-400 cursor-pointer hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-3 py-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filterPayslips(payslips, dashboardSearchQuery, currentFilterPeriod).map((payslip) => {
                const calculatedPayslip = calculatePayslip(payslip);
                return (
                  <tr key={payslip.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-gray-700">
                            {payslip.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </span>
                        </div>
                        <div className="ml-2 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{payslip.name}</div>
                          <div className="text-xs text-gray-500">{payslip.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                        {payslip.designation}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {payslip.basicPay.toFixed(0)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {calculatedPayslip.totalEarnings.toFixed(0)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-red-600">
                      {calculatedPayslip.totalDeductions.toFixed(0)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-green-600">
                      {calculatedPayslip.netPay.toFixed(0)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                        Ready
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => generatePayslip(payslip)}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 transition-colors"
                          title="View Payslip"
                        >
                          <FileText className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            generatePayslip(payslip);
                            setTimeout(() => window.print(), 100);
                          }}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-green-500 transition-colors"
                          title="Print Payslip"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deletePayslip(payslip.id)} // Ensure this uses payslip.id
                          className="inline-flex items-center px-2 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-red-500 transition-colors"
                          title="Delete Payslip"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filterPayslips(payslips, dashboardSearchQuery, currentFilterPeriod).length === 0 && payslips.length > 0 && dashboardSearchQuery && (
                <tr>
                  <td colSpan="8" className="px-3 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <Search className="h-10 w-10 text-gray-400 mb-3" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No payslips found</h3>
                      <p className="text-xs text-gray-500 mb-3">No payslips match your search criteria "{dashboardSearchQuery}"</p>
                      <button
                        onClick={() => setDashboardSearchQuery('')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Clear Search
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {payslips.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-3 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <svg className="h-10 w-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2m-2 4H9a2 2 0 01-2-2v-4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No payslips created</h3>
                      <p className="text-xs text-gray-500 mb-3">Get started by creating your first payslip</p>
                      <button
                        onClick={() => setCurrentView('addPayslip')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Create Payslip
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary */}
        {filterPayslips(payslips, dashboardSearchQuery, currentFilterPeriod).length > 0 && (
          <div className="px-3 sm:px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center text-xs">
              <div className="text-gray-600">
                {dashboardSearchQuery && filterPayslips(payslips, dashboardSearchQuery, currentFilterPeriod).length !== (currentFilterPeriod ? filterPayslipsByPeriod(payslips, currentFilterPeriod).length : payslips.length) ? (
                  <span>{filterPayslips(payslips, dashboardSearchQuery, currentFilterPeriod).length} of {currentFilterPeriod ? filterPayslipsByPeriod(payslips, currentFilterPeriod).length : payslips.length} payslip{(currentFilterPeriod ? filterPayslipsByPeriod(payslips, currentFilterPeriod).length : payslips.length) !== 1 ? 's' : ''} • {currentFilterPeriod || 'All Periods'}</span>
                ) : (
                  <span>{filterPayslips(payslips, dashboardSearchQuery, currentFilterPeriod).length} payslip{filterPayslips(payslips, dashboardSearchQuery, currentFilterPeriod).length !== 1 ? 's' : ''} • {currentFilterPeriod || 'All Periods'}</span>
                )}
              </div>
              <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4 text-gray-600">
                <span>Total: <span className="font-semibold text-gray-900">
                  {filterPayslips(payslips, dashboardSearchQuery, currentFilterPeriod).reduce((sum, payslip) => {
                    const calculatedPayslip = calculatePayslip(payslip);
                    return sum + calculatedPayslip.totalEarnings;
                  }, 0).toFixed(0)}
                </span></span>
                <span>Deductions: <span className="font-semibold text-red-600">
                  {filterPayslips(payslips, dashboardSearchQuery, currentFilterPeriod).reduce((sum, payslip) => {
                    const calculatedPayslip = calculatePayslip(payslip);
                    return sum + calculatedPayslip.totalDeductions;
                  }, 0).toFixed(0)}
                </span></span>
                <span>Net: <span className="font-semibold text-green-600">
                  {filterPayslips(payslips, dashboardSearchQuery, currentFilterPeriod).reduce((sum, payslip) => {
                    const calculatedPayslip = calculatePayslip(payslip);
                    return sum + calculatedPayslip.netPay;
                  }, 0).toFixed(0)}
                </span></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    );
  };

  const renderAddPayslip = () => {
    const selectedEmployeeData = employeeDatabase.find(emp => emp.id === selectedEmployeeForPayslip);

    return (
      <div className="max-w-4xl mx-auto bg-white rounded border border-gray-300 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Create New Payslip</h2>
        
        {/* Employee Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
          <select
            value={selectedEmployeeForPayslip}
            onChange={(e) => setSelectedEmployeeForPayslip(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose an employee...</option>
            {employeeDatabase.map(employee => (
              <option key={employee.id} value={employee.id}>
                {employee.id} - {employee.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pay Period Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Pay Period</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Month & Year</label>
              <select
                value={payslipFormData.payPeriod}
                onChange={(e) => setPayslipFormData({ ...payslipFormData, payPeriod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {getCurrentYearMonths().map(period => (
                  <option key={period} value={period}>{period}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Worked Days</label>
              <input
                type="number"
                min="1"
                max="31"
                value={payslipFormData.workedDays}
                onChange={(e) => setPayslipFormData({ ...payslipFormData, workedDays: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Total Days</label>
              <input
                type="number"
                min="1"
                max="31"
                value={payslipFormData.totalDays}
                onChange={(e) => setPayslipFormData({ ...payslipFormData, totalDays: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Employee Information Display */}
        {selectedEmployeeData && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Employee Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={selectedEmployeeData.id}
                  readOnly
                  className="input-modern bg-gray-100 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={selectedEmployeeData.name}
                  readOnly
                  className="input-modern bg-gray-100 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NRC</label>
                <input
                  type="text"
                  value={selectedEmployeeData.nrc}
                  readOnly
                  className="input-modern bg-gray-100 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SSN</label>
                <input
                  type="text"
                  value={selectedEmployeeData.ssn}
                  readOnly
                  className="input-modern bg-gray-100 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <input
                  type="text"
                  value={selectedEmployeeData.gender}
                  readOnly
                  className="input-modern bg-gray-100 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={selectedEmployeeData.designation}
                  readOnly
                  className="input-modern bg-gray-100 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                <input
                  type="text"
                  value={selectedEmployeeData.dateOfJoining}
                  readOnly
                  className="input-modern bg-gray-100 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Basic Pay (ZMW)</label>
                <input
                  type="text"
                  value={selectedEmployeeData.basicPay.toFixed(2)}
                  readOnly
                  className="input-modern bg-gray-100 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House Rent Allowance (Auto: 30% of Basic Pay)</label>
                <input
                  type="text"
                  value={(selectedEmployeeData.basicPay * 0.30).toFixed(2)}
                  readOnly
                  className="input-modern bg-gray-100 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transport Allowance (ZMW)</label>
                <input
                  type="text"
                  value={selectedEmployeeData.transportAllowance.toFixed(2)}
                  readOnly
                  className="input-modern bg-gray-100 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meal Allowance (ZMW)</label>
                <input
                  type="text"
                  value={selectedEmployeeData.mealAllowance.toFixed(2)}
                  readOnly
                  className="input-modern bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Other Earnings Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold text-gray-900">Other Earnings</h3>
            <button
              type="button"
              onClick={addOtherEarning}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Add Earning
            </button>
          </div>
          {newPayslip.otherEarnings.map((earning, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Earning name"
                value={earning.name}
                onChange={(e) => updateOtherEarning(index, 'name', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={earning.amount}
                onChange={(e) => updateOtherEarning(index, 'amount', e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => removeOtherEarning(index)}
                className="bg-red-500 text-white px-2 py-2 rounded hover:bg-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Other Deductions Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold text-gray-900">Other Deductions</h3>
            <button
              type="button"
              onClick={addOtherDeduction}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 hover:bg-red-700"
            >
              <Plus className="h-4 w-4" />
              Add Deduction
            </button>
          </div>
          {newPayslip.otherDeductions.map((deduction, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Deduction name"
                value={deduction.name}
                onChange={(e) => updateOtherDeduction(index, 'name', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={deduction.amount}
                onChange={(e) => updateOtherDeduction(index, 'amount', e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => removeOtherDeduction(index)}
                className="bg-red-500 text-white px-2 py-2 rounded hover:bg-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex space-x-4 mt-6">
          <button
            onClick={addPayslip}
            disabled={!selectedEmployeeForPayslip || isCreatingPayslip}
            className={`px-6 py-2 rounded font-medium transition-colors ${
              selectedEmployeeForPayslip && !isCreatingPayslip
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isCreatingPayslip ? 'Creating...' : 'Create Payslip'}
          </button>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderPayslip = () => {
    if (!selectedEmployee) {
      return null;
    }

    return (
    
      <div className="max-w-5xl mx-auto animate-fade-in">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="btn-secondary"
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={() => printSinglePayslip(selectedEmployee)}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="h-5 w-5" />
            Print Payslip
          </button>
        </div>

        <div className="bg-white p-8 lg:p-12 shadow-large rounded-2xl border border-secondary-200" id="payslip">
          <div className="text-center mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-secondary-900 mb-2">Payslip</h1>
            <h2 className="text-xl lg:text-2xl font-semibold text-primary-700 mb-2">SPF & CM ENTERPRISES LIMITED</h2>
            <p className="text-secondary-600">2670 Town Area, Senanga Rd.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-semibold text-secondary-700 w-40">Employee Number:</span>
                <span className="text-secondary-900">{selectedEmployee.employeeId || selectedEmployee.id || selectedEmployee.employee?.id || 'N/A'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-semibold text-secondary-700 w-40">Date of Joining:</span>
                <span className="text-secondary-900">{selectedEmployee.dateOfJoining || selectedEmployee.employee?.dateOfJoining || 'N/A'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-semibold text-secondary-700 w-40">Pay Period:</span>
                <span className="text-secondary-900">{selectedEmployee.payPeriod || 'N/A'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-semibold text-secondary-700 w-40">Worked Days:</span>
                <span className="text-secondary-900">{selectedEmployee.workedDays || selectedEmployee.totalDays || 'N/A'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-semibold text-secondary-700 w-40">Total Days:</span>
                <span className="text-secondary-900">{selectedEmployee.totalDays || 'N/A'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-semibold text-secondary-700 w-40">Employee Name:</span>
                <span className="text-secondary-900">{selectedEmployee.name || selectedEmployee.employee?.name || 'N/A'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-semibold text-secondary-700 w-40">Gender:</span>
                <span className="text-secondary-900">{selectedEmployee.gender || selectedEmployee.employee?.gender || 'N/A'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-semibold text-secondary-700 w-40">NRC:</span>
                <span className="text-secondary-900">{selectedEmployee.nrc || selectedEmployee.employee?.nrc || 'N/A'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-semibold text-secondary-700 w-40">SSN:</span>
                <span className="text-secondary-900">{selectedEmployee.ssn || selectedEmployee.employee?.ssn || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="font-semibold text-secondary-700 w-32">Designation:</span>
              <span className="inline-flex px-3 py-1 text-sm font-medium bg-primary-100 text-primary-800 rounded-full">
                {selectedEmployee.designation || selectedEmployee.employee?.designation || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="font-semibold text-secondary-700 w-32">Department:</span>
              <span className="inline-flex px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                {selectedEmployee.department || selectedEmployee.employee?.department || 'N/A'}
              </span>
            </div>
          </div>

          {/* Responsive Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-2 border-secondary-800 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-secondary-100 border-b-2 border-secondary-800">
                  <th className="border-r border-secondary-800 p-4 text-left font-semibold text-secondary-900">Earnings</th>
                  <th className="border-r border-secondary-800 p-4 text-left font-semibold text-secondary-900">Amount</th>
                  <th className="border-r border-secondary-800 p-4 text-left font-semibold text-secondary-900">Deductions</th>
                  <th className="p-4 text-left font-semibold text-secondary-900">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-secondary-300 hover:bg-secondary-50">
                  <td className="border-r border-secondary-300 p-4">Basic</td>
                  <td className="border-r border-secondary-300 p-4 font-medium">ZMW {(selectedEmployee.basicPay || selectedEmployee.employee?.basicPay || 0).toFixed(2)}</td>
                  <td className="border-r border-secondary-300 p-4">NAPSA</td>
                  <td className="p-4 font-medium">ZMW {(selectedEmployee.deductions?.napsa || 0).toFixed(2)}</td>
                </tr>
                <tr className="border-b border-secondary-300 hover:bg-secondary-50">
                  <td className="border-r border-secondary-300 p-4">Transport Allowance</td>
                  <td className="border-r border-secondary-300 p-4 font-medium">ZMW {(selectedEmployee.transportAllowance || selectedEmployee.employee?.transportAllowance || 0).toFixed(2)}</td>
                  <td className="border-r border-secondary-300 p-4">NHIMA</td>
                  <td className="p-4 font-medium">ZMW {(selectedEmployee.deductions?.nhima || 0).toFixed(2)}</td>
                </tr>
                <tr className="border-b border-secondary-300 hover:bg-secondary-50">
                  <td className="border-r border-secondary-300 p-4">House Rent Allowance</td>
                  <td className="border-r border-secondary-300 p-4 font-medium">ZMW {(selectedEmployee.houseRentAllowance || 0).toFixed(2)}</td>
                  <td className="border-r border-secondary-300 p-4">Loan</td>
                  <td className="p-4 font-medium">ZMW {(selectedEmployee.deductions?.loan || 0).toFixed(2)}</td>
                </tr>
                <tr className="border-b border-secondary-300 hover:bg-secondary-50">
                  <td className="border-r border-secondary-300 p-4">Meal Allowance</td>
                  <td className="border-r border-secondary-300 p-4 font-medium">ZMW {((selectedEmployee.mealAllowance || selectedEmployee.employee?.mealAllowance || 0) > 0 ? (selectedEmployee.mealAllowance || selectedEmployee.employee?.mealAllowance || 0).toFixed(2) : '0.00')}</td>
                  <td className="border-r border-secondary-300 p-4"></td>
                  <td className="p-4"></td>
                </tr>
                {/* Other Earnings */}
                {selectedEmployee.otherEarnings && selectedEmployee.otherEarnings.length > 0 && selectedEmployee.otherEarnings.map((earning, index) => (
                  <tr key={`earning-${index}`} className="border-b border-secondary-300 hover:bg-secondary-50">
                    <td className="border-r border-secondary-300 p-4">{earning.name || 'Other Earning'}</td>
                    <td className="border-r border-secondary-300 p-4 font-medium">ZMW {(earning.amount || 0).toFixed(2)}</td>
                    <td className="border-r border-secondary-300 p-4"></td>
                    <td className="p-4"></td>
                  </tr>
                ))}
                {/* Other Deductions */}
                {selectedEmployee.otherDeductions && selectedEmployee.otherDeductions.length > 0 && selectedEmployee.otherDeductions.map((deduction, index) => (
                  <tr key={`deduction-${index}`} className="border-b border-secondary-300 hover:bg-secondary-50">
                    <td className="border-r border-secondary-300 p-4"></td>
                    <td className="border-r border-secondary-300 p-4"></td>
                    <td className="border-r border-secondary-300 p-4">{deduction.name || 'Other Deduction'}</td>
                    <td className="p-4 font-medium">ZMW {(deduction.amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="border-b-2 border-secondary-800 font-bold bg-secondary-100">
                  <td className="border-r border-secondary-800 p-4">Total Earnings</td>
                  <td className="border-r border-secondary-800 p-4">ZMW {(selectedEmployee.totalEarnings || 0).toFixed(2)}</td>
                  <td className="border-r border-secondary-800 p-4">Total Deductions</td>
                  <td className="p-4">ZMW {(selectedEmployee.totalDeductions || 0).toFixed(2)}</td>
                </tr>
                <tr className="font-bold bg-success-50">
                  <td className="border-r border-secondary-800 p-4"></td>
                  <td className="border-r border-secondary-800 p-4"></td>
                  <td className="border-r border-secondary-800 p-4 text-success-700">Net Pay</td>
                  <td className="p-4 text-success-700 text-lg">ZMW {(selectedEmployee.netPay || 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-center mb-8 p-6 bg-gradient-to-r from-success-50 to-success-100 rounded-2xl border border-success-200">
            <p className="text-2xl lg:text-3xl font-bold text-success-700 mb-2">ZMW {(selectedEmployee.netPay || 0).toFixed(2)}</p>
            <p className="text-sm text-secondary-600 italic">{numberToWords(selectedEmployee.netPay || 0)}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
            <div className="text-center">
              <div className="border-b-2 border-secondary-800 w-full mb-3 h-16"></div>
              <p className="font-semibold text-secondary-700">Employer Signature</p>
            </div>
            <div className="text-center">
              <div className="border-b-2 border-secondary-800 w-full mb-3 h-16"></div>
              <p className="font-semibold text-secondary-700">Employee Signature</p>
            </div>
          </div>

          <p className="text-center text-sm text-secondary-500 italic">This is system generated payslip</p>
        </div>
      </div>
    );
  };

  const renderReports = () => {
    // Calculate comprehensive wage bill analytics
    const wageBillAnalytics = () => {
      const payslipsByPeriod = payslips.reduce((acc, payslip) => {
        const period = payslip.payPeriod;
        if (!acc[period]) {
          acc[period] = [];
        }
        acc[period].push(payslip);
        return acc;
      }, {});

      const periodSummaries = Object.entries(payslipsByPeriod).map(([period, periodPayslips]) => {
        const calculatedPayslips = periodPayslips.map(payslip => calculatePayslip(payslip));
        
        const totalBasicPay = calculatedPayslips.reduce((sum, p) => sum + p.basicPay, 0);
        const totalAllowances = calculatedPayslips.reduce((sum, p) => 
          sum + p.transportAllowance + p.houseRentAllowance + p.mealAllowance, 0);
        const totalOtherEarnings = calculatedPayslips.reduce((sum, p) => sum + (p.otherEarningsTotal || 0), 0);
        const totalGrossPay = calculatedPayslips.reduce((sum, p) => sum + p.totalEarnings, 0);
        const totalDeductions = calculatedPayslips.reduce((sum, p) => sum + p.totalDeductions, 0);
        const totalNetPay = calculatedPayslips.reduce((sum, p) => sum + p.netPay, 0);
        const totalNAPSA = calculatedPayslips.reduce((sum, p) => sum + p.deductions.napsa, 0);
        const totalNHIMA = calculatedPayslips.reduce((sum, p) => sum + p.deductions.nhima, 0);
        
        // Department breakdown
        const departmentBreakdown = calculatedPayslips.reduce((acc, p) => {
          const dept = p.department || 'Unknown';
          if (!acc[dept]) {
            acc[dept] = { employees: 0, totalPay: 0, avgPay: 0 };
          }
          acc[dept].employees += 1;
          acc[dept].totalPay += p.netPay;
          acc[dept].avgPay = acc[dept].totalPay / acc[dept].employees;
          return acc;
        }, {});

        // Designation breakdown
        const designationBreakdown = calculatedPayslips.reduce((acc, p) => {
          const designation = p.designation || 'Unknown';
          if (!acc[designation]) {
            acc[designation] = { employees: 0, totalPay: 0, avgPay: 0 };
          }
          acc[designation].employees += 1;
          acc[designation].totalPay += p.netPay;
          acc[designation].avgPay = acc[designation].totalPay / acc[designation].employees;
          return acc;
        }, {});

        return {
          period,
          employeeCount: calculatedPayslips.length,
          totalBasicPay,
          totalAllowances,
          totalOtherEarnings,
          totalGrossPay,
          totalDeductions,
          totalNetPay,
          totalNAPSA,
          totalNHIMA,
          avgNetPay: totalNetPay / calculatedPayslips.length || 0,
          departmentBreakdown,
          designationBreakdown,
          payslips: calculatedPayslips
        };
      });

      // Overall summary across all periods
      const overallSummary = {
        totalPeriods: periodSummaries.length,
        totalPayslips: payslips.length,
        totalWageBill: periodSummaries.reduce((sum, p) => sum + p.totalNetPay, 0),
        totalGrossWages: periodSummaries.reduce((sum, p) => sum + p.totalGrossPay, 0),
        totalDeductions: periodSummaries.reduce((sum, p) => sum + p.totalDeductions, 0),
        avgWageBillPerPeriod: periodSummaries.length > 0 ? 
          periodSummaries.reduce((sum, p) => sum + p.totalNetPay, 0) / periodSummaries.length : 0
      };

      return { periodSummaries, overallSummary };
    };

    const analytics = wageBillAnalytics();

    return (
      <div id="wage-bill-report" className="space-y-6">
        {/* Report Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Wage Bill Reports</h2>
              <p className="text-blue-100">Comprehensive payroll analytics and insights</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Generated on</p>
              <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Overall Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-300 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Wage Bill</p>
                <p className="text-2xl font-bold text-gray-900">
                  ZMW {analytics.overallSummary.totalWageBill.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-300 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Gross Wages</p>
                <p className="text-2xl font-bold text-gray-900">
                  ZMW {analytics.overallSummary.totalGrossWages.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-300 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calculator className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Deductions</p>
                <p className="text-2xl font-bold text-gray-900">
                  ZMW {analytics.overallSummary.totalDeductions.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-300 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pay Periods</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.overallSummary.totalPeriods}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Period-wise Breakdown */}
        {analytics.periodSummaries.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Period-wise Wage Bill Analysis
              </h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Pay Period</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Employees</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Basic Pay</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Allowances</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Gross Pay</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Deductions</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Net Pay</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Avg Net Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.periodSummaries.map((summary, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{summary.period}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{summary.employeeCount}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">ZMW {summary.totalBasicPay.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">ZMW {summary.totalAllowances.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">ZMW {summary.totalGrossPay.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-red-600">ZMW {summary.totalDeductions.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-green-600 font-semibold">ZMW {summary.totalNetPay.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">ZMW {summary.avgNetPay.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Department & Designation Analysis */}
        {analytics.periodSummaries.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Breakdown */}
            <div className="bg-white rounded-lg border border-gray-300">
              <div className="px-6 py-4 border-b border-gray-300">
                <h3 className="text-lg font-semibold text-gray-900">Department Analysis</h3>
                <p className="text-sm text-gray-600">Latest pay period breakdown</p>
              </div>
              <div className="p-6">
                {analytics.periodSummaries[analytics.periodSummaries.length - 1] && (
                  <div className="space-y-3">
                    {Object.entries(analytics.periodSummaries[analytics.periodSummaries.length - 1].departmentBreakdown)
                      .map(([dept, data]) => (
                      <div key={dept} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-gray-900">{dept}</p>
                          <p className="text-sm text-gray-600">{data.employees} employees</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">ZMW {data.totalPay.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">Avg: ZMW {data.avgPay.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Designation Breakdown */}
            <div className="bg-white rounded-lg border border-gray-300">
              <div className="px-6 py-4 border-b border-gray-300">
                <h3 className="text-lg font-semibold text-gray-900">Designation Analysis</h3>
                <p className="text-sm text-gray-600">Latest pay period breakdown</p>
              </div>
              <div className="p-6">
                {analytics.periodSummaries[analytics.periodSummaries.length - 1] && (
                  <div className="space-y-3">
                    {Object.entries(analytics.periodSummaries[analytics.periodSummaries.length - 1].designationBreakdown)
                      .map(([designation, data]) => (
                      <div key={designation} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-gray-900">{designation}</p>
                          <p className="text-sm text-gray-600">{data.employees} employees</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">ZMW {data.totalPay.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">Avg: ZMW {data.avgPay.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Statutory Contributions Summary */}
        {analytics.periodSummaries.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900">Statutory Contributions Summary</h3>
              <p className="text-sm text-gray-600">NAPSA and NHIMA contributions by period</p>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Pay Period</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">NAPSA (5%)</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">NHIMA (1%)</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Total Statutory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.periodSummaries.map((summary, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{summary.period}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">ZMW {summary.totalNAPSA.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">ZMW {summary.totalNHIMA.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-blue-600 font-semibold">
                          ZMW {(summary.totalNAPSA + summary.totalNHIMA).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="bg-white rounded-lg border border-gray-300 p-6 no-print">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                // Check if there's data to print
                if (payslips.length === 0) {
                  showInfo('No payroll data is available to preview. Please create some payslips first before generating reports.', 'No Data Available');
                  return;
                }
                
                // Create simplified print preview window
                const printWindow = window.open('', '_blank', 'width=1000,height=700');
                
                // Prepare simplified report data
                const calculatedPayslips = payslips.map(payslip => calculatePayslip(payslip));
                const totalWageBill = calculatedPayslips.reduce((sum, p) => sum + p.netPay, 0);
                const totalGrossWages = calculatedPayslips.reduce((sum, p) => sum + p.totalEarnings, 0);
                
                const reportHTML = `
                  <!DOCTYPE html>
                  <html lang="en">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Wage Bill Report - ${new Date().toLocaleDateString()}</title>
                    <style>
                      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                      
                      * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                      }
                      
                      body {
                        font-family: 'Inter', sans-serif;
                        line-height: 1.5;
                        color: #111827;
                        background: white;
                        margin: 20px;
                      }
                      
                      .header {
                        text-align: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #1e40af;
                      }
                      
                      .company-title {
                        font-size: 28px;
                        font-weight: 700;
                        color: #1e40af;
                        margin-bottom: 8px;
                      }
                      
                      .report-title {
                        font-size: 20px;
                        font-weight: 600;
                        color: #374151;
                        margin-bottom: 5px;
                      }
                      
                      .report-date {
                        font-size: 14px;
                        color: #6b7280;
                      }
                      
                      .summary-section {
                        display: flex;
                        justify-content: center;
                        gap: 50px;
                        margin-bottom: 30px;
                        padding: 20px;
                        background-color: #f9fafb;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                      }
                      
                      .summary-card {
                        text-align: center;
                        padding: 15px;
                      }
                      
                      .summary-label {
                        font-size: 14px;
                        font-weight: 500;
                        color: #6b7280;
                        margin-bottom: 5px;
                      }
                      
                      .summary-amount {
                        font-size: 24px;
                        font-weight: 700;
                        color: #059669;
                      }
                      
                      .table-section {
                        margin-bottom: 30px;
                      }
                      
                      .table-title {
                        font-size: 18px;
                        font-weight: 600;
                        color: #374151;
                        margin-bottom: 15px;
                      }
                      
                      table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                        border: 2px solid #d1d5db;
                      }
                      
                      th {
                        background-color: #f3f4f6;
                        padding: 12px 8px;
                        text-align: left;
                        font-weight: 600;
                        font-size: 12px;
                        color: #374151;
                        border: 1px solid #d1d5db;
                        text-transform: uppercase;
                      }
                      
                      td {
                        padding: 10px 8px;
                        border: 1px solid #d1d5db;
                        font-size: 12px;
                        color: #374151;
                      }
                      
                      tr:nth-child(even) {
                        background-color: #f9fafb;
                      }
                      
                      tr:hover {
                        background-color: #f3f4f6;
                      }
                      
                      .amount {
                        text-align: right;
                        font-weight: 500;
                      }
                      
                      .net-pay {
                        color: #059669;
                        font-weight: 600;
                      }
                      
                      .gross-pay {
                        color: #2563eb;
                        font-weight: 500;
                      }
                      
                      .deductions {
                        color: #dc2626;
                        font-weight: 500;
                      }
                      
                      .employee-name {
                        font-weight: 500;
                        text-transform: uppercase;
                      }
                      
                      .approval-section {
                        margin: 40px 0;
                        padding: 30px;
                        background-color: #f8fffe;
                        border: 2px solid #059669;
                        border-radius: 12px;
                      }
                      
                      .total-amount-card {
                        text-align: center;
                        margin-bottom: 30px;
                        padding: 25px;
                        background: linear-gradient(135deg, #059669, #047857);
                        color: white;
                        border-radius: 10px;
                        box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
                      }
                      
                      .total-label {
                        font-size: 16px;
                        font-weight: 600;
                        margin-bottom: 10px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                      }
                      
                      .total-value {
                        font-size: 32px;
                        font-weight: 800;
                        margin-bottom: 8px;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                      }
                      
                      .approval-note {
                        font-size: 13px;
                        font-weight: 400;
                        opacity: 0.9;
                        font-style: italic;
                      }
                      
                      .signature-section {
                        display: flex;
                        justify-content: space-between;
                        gap: 40px;
                        margin-top: 30px;
                      }
                      
                      .signature-box {
                        flex: 1;
                        text-align: center;
                      }
                      
                      .signature-line {
                        width: 100%;
                        height: 50px;
                        border-bottom: 2px solid #374151;
                        margin-bottom: 10px;
                      }
                      
                      .signature-label {
                        font-size: 14px;
                        font-weight: 600;
                        color: #374151;
                        margin-bottom: 8px;
                      }
                      
                      .signature-date {
                        font-size: 12px;
                        color: #6b7280;
                        font-style: italic;
                      }

                      .footer {
                        text-align: center;
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #e5e7eb;
                        font-size: 12px;
                        color: #6b7280;
                      }
                      
                      .print-controls {
                        text-align: center;
                        margin-bottom: 30px;
                        padding: 15px;
                        background-color: #eff6ff;
                        border-radius: 8px;
                        border: 1px solid #bfdbfe;
                      }
                      
                      .print-btn {
                        background: #1e40af;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        margin: 0 5px;
                        font-weight: 500;
                        font-size: 14px;
                      }
                      
                      .print-btn:hover {
                        background: #1d4ed8;
                      }
                      
                      .close-btn {
                        background: #6b7280;
                      }
                      
                      .close-btn:hover {
                        background: #4b5563;
                      }
                      
                      @media print {
                        body {
                          margin: 0;
                        }
                        
                        .print-controls {
                          display: none !important;
                        }
                        
                        .summary-section {
                          break-inside: avoid;
                        }
                        
                        table {
                          break-inside: avoid;
                        }
                        
                        @page {
                          margin: 0.5in;
                          size: A4;
                        }
                      }
                    </style>
                  </head>
                  <body>
                    <div class="print-controls">
                      <button class="print-btn" onclick="window.print()">
                        🖨️ Print Report
                      </button>
                      <button class="print-btn close-btn" onclick="window.close()">
                        ✕ Close Preview
                      </button>
                    </div>
                    
                    <div class="header">
                      <div class="company-title">SPF & CM ENTERPRISES LIMITED</div>
                      <div class="report-title">Wage Bill Report</div>
                      <div class="report-date">Generated on ${new Date().toLocaleDateString()}</div>
                    </div>
                    
                    <div class="summary-section">
                      <div class="summary-card">
                        <div class="summary-label">Total Wage Bill</div>
                        <div class="summary-amount">ZMW ${totalWageBill.toFixed(2)}</div>
                      </div>
                      <div class="summary-card">
                        <div class="summary-label">Total Gross Wages</div>
                        <div class="summary-amount">ZMW ${totalGrossWages.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div class="table-section">
                      <div class="table-title">Employee Payroll Details</div>
                      <table>
                        <thead>
                          <tr>
                            <th>Pay Period</th>
                            <th>Employee Name</th>
                            <th>Basic Pay</th>
                            <th>Allowances</th>
                            <th>Gross Pay</th>
                            <th>Deductions</th>
                            <th>Net Pay</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${calculatedPayslips.map(payslip => `
                            <tr>
                              <td>${payslip.payPeriod || 'N/A'}</td>
                              <td class="employee-name">${payslip.name}</td>
                              <td class="amount">ZMW ${payslip.basicPay.toFixed(2)}</td>
                              <td class="amount">ZMW ${(payslip.transportAllowance + payslip.houseRentAllowance + payslip.mealAllowance + (payslip.otherEarningsTotal || 0)).toFixed(2)}</td>
                              <td class="amount gross-pay">ZMW ${payslip.totalEarnings.toFixed(2)}</td>
                              <td class="amount deductions">ZMW ${payslip.totalDeductions.toFixed(2)}</td>
                              <td class="amount net-pay">ZMW ${payslip.netPay.toFixed(2)}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>
                    
                    <div class="approval-section">
                      <div class="total-amount-card">
                        <div class="total-label">Total Amount to be Paid to Employees</div>
                        <div class="total-value">ZMW ${totalWageBill.toFixed(2)}</div>
                        <div class="approval-note">This amount requires management approval for payroll processing</div>
                      </div>
                      
                      <div class="signature-section">
                        <div class="signature-box">
                          <div class="signature-line"></div>
                          <div class="signature-label">Prepared By: ________________________</div>
                          <div class="signature-date">Date: ________________________</div>
                        </div>
                        
                        <div class="signature-box">
                          <div class="signature-line"></div>
                          <div class="signature-label">Approved By: ________________________</div>
                          <div class="signature-date">Date: ________________________</div>
                        </div>
                      </div>
                    </div>
                    
                    <div class="footer">
                      <p>This is a system generated report - ${setupData?.companyName || 'Payroll System'}</p>
                      <p>Report generated on ${new Date().toLocaleString()}</p>
                    </div>
                  </body>
                  </html>
                `;
                
                printWindow.document.write(reportHTML);
                printWindow.document.close();
                
                // Auto-trigger print dialog
                printWindow.onload = function() {
                  printWindow.print();
                  printWindow.close();
                };
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Print Report
            </button>
            <button
              onClick={() => {
                const reportData = JSON.stringify(analytics, null, 2);
                const blob = new Blob([reportData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `wage-bill-report-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
          </div>
        </div>

        {/* No Data Message */}
        {payslips.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-300 p-12 text-center no-print">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payroll Data Available</h3>
            <p className="text-gray-600 mb-6">Create some payslips to generate comprehensive wage bill reports.</p>
            <button
              onClick={() => setCurrentView('addPayslip')}
              className="bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="h-4 w-4" />
              Create First Payslip
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderDataManagement = () => {
    const handleExportData = async () => {
      try {
        const data = await syncDatabaseService.exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payroll_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showSuccess('Your payroll data has been exported successfully! The backup file has been downloaded.', 'Data Exported');
      } catch (error) {
        console.error('Error exporting data:', error);
        showError(`Failed to export data: ${error.message}`, 'Export Failed');
      }
    };

    const handleImportData = (event) => {
      const file = event.target.files[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          showConfirm(
            'This will replace all existing data with the data from the backup file. Your current employees, payslips, and settings will be permanently overwritten. Are you sure you want to continue?',
            async () => {
              try {
                await syncDatabaseService.importAllData(data);
                
                // Refresh local state
                setEmployeeDatabase(await syncDatabaseService.getEmployees());
                setPayslips(await syncDatabaseService.getPayslips());
                setPayrollData(await syncDatabaseService.getPayrollSettings());
                
                showSuccess('Your backup data has been imported successfully! All data has been restored.', 'Data Imported');
                closeModal('confirm');
              } catch (importError) {
                console.error('Error during import:', importError);
                showError(`Failed to import data: ${importError.message}`, 'Import Failed');
                closeModal('confirm');
              }
            },
            {
              title: 'Import Backup Data',
              confirmText: 'Replace All Data',
              cancelText: 'Cancel',
              danger: true
            }
          );
        } catch (error) {
          console.error('Error parsing backup file:', error);
          showError('The selected file is not a valid backup file. Please choose a valid JSON backup file.', 'Invalid Backup File');
        }
      };
      reader.readAsText(file);
      
      // Reset the file input
      event.target.value = '';
    };

    const handleClearData = () => {
      showConfirm(
        'This will permanently delete ALL your data including employees, payslips, and settings. This action cannot be undone and will reset the system to its default state. Are you absolutely sure you want to continue?',
        () => {
          showConfirm(
            'FINAL WARNING: You are about to delete everything. This is your last chance to cancel. Do you really want to delete all data?',
            async () => {
              try {
                await syncDatabaseService.clearAllData();
                
                // Reset to initial state
                syncDatabaseService.initializeDatabase();
                setEmployeeDatabase(await syncDatabaseService.getEmployees());
                setPayslips(await syncDatabaseService.getPayslips());
                setPayrollData(await syncDatabaseService.getPayrollSettings());
                
                showSuccess('All data has been cleared successfully. The system has been reset to its default state.', 'Data Cleared');
                closeModal('confirm');
              } catch (error) {
                console.error('Error clearing data:', error);
                showError(`Failed to clear data: ${error.message}`, 'Clear Failed');
                closeModal('confirm');
              }
            },
            {
              title: 'Final Confirmation',
              confirmText: 'Yes, Delete Everything',
              cancelText: 'Cancel',
              danger: true
            }
          );
          closeModal('confirm');
        },
        {
          title: 'Clear All Data',
          confirmText: 'Continue',
          cancelText: 'Cancel',
          danger: true
        }
      );
    };

    const storageInfo = syncDatabaseService.getStorageInfo();

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Data Management</h2>
        
        {/* Employee Management */}
        <div className="bg-white p-6 rounded border border-gray-200 shadow-sm">
          <div className="space-y-4 sm:space-y-0 sm:flex sm:justify-between sm:items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Users className="mr-2 text-blue-600" />
              Employee Management
            </h3>
            <div className="flex gap-3">
              <label className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex items-center gap-2 cursor-pointer">
                <Upload className="h-4 w-4" />
                Bulk Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleBulkImportEmployees}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => setShowEmployeeForm(!showEmployeeForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {showEmployeeForm ? 'Cancel' : 'Add Employee'}
              </button>
            </div>
          </div>

          {/* Add Employee Form */}
          {showEmployeeForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-4">Add New Employee</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    value={newEmployee.id}
                    onChange={(e) => setNewEmployee({...newEmployee, id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., EMP001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Employee full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NRC</label>
                  <input
                    type="text"
                    value={newEmployee.nrc}
                    onChange={(e) => setNewEmployee({...newEmployee, nrc: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="National Registration Card"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SSN</label>
                  <input
                    type="text"
                    value={newEmployee.ssn}
                    onChange={(e) => setNewEmployee({...newEmployee, ssn: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Social Security Number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={newEmployee.gender}
                    onChange={(e) => setNewEmployee({...newEmployee, gender: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                  <input
                    type="text"
                    value={newEmployee.designation}
                    onChange={(e) => setNewEmployee({...newEmployee, designation: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Job title/position"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                  <input
                    type="date"
                    value={newEmployee.dateOfJoining}
                    onChange={(e) => setNewEmployee({...newEmployee, dateOfJoining: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Basic Pay (ZMW)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newEmployee.basicPay}
                    onChange={(e) => setNewEmployee({...newEmployee, basicPay: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transport Allowance (ZMW)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newEmployee.transportAllowance}
                    onChange={(e) => setNewEmployee({...newEmployee, transportAllowance: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meal Allowance (ZMW)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newEmployee.mealAllowance}
                    onChange={(e) => setNewEmployee({...newEmployee, mealAllowance: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Department name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={newEmployee.address}
                    onChange={(e) => setNewEmployee({...newEmployee, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Employee address"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowEmployeeForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEmployee}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Employee
                </button>
              </div>
            </div>
          )}

          {/* Bulk Import Information */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <Database className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <strong>Bulk Import:</strong> Upload a JSON file to add multiple employees at once. 
                <a 
                  href="/sample-employees.json" 
                  download="sample-employees.json"
                  className="ml-1 underline hover:text-blue-900"
                >
                  Download sample file
                </a> to see the required format.
              </div>
            </div>
          </div>

          {/* Employee List */}
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Pay</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filterEmployees(employeeDatabase, dataManagementEmployeeSearch).map((employee) => (
                  <tr key={employee.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{employee.id}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{employee.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{employee.designation}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">ZMW {employee.basicPay.toFixed(2)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete Employee"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filterEmployees(employeeDatabase, dataManagementEmployeeSearch).length === 0 && employeeDatabase.length > 0 && dataManagementEmployeeSearch && (
                  <tr>
                    <td colSpan="5" className="px-3 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Search className="h-8 w-8 text-gray-400 mb-2" />
                        <p>No employees found matching "{dataManagementEmployeeSearch}"</p>
                        <button
                          onClick={() => setDataManagementEmployeeSearch('')}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Clear search
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {employeeDatabase.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-3 py-8 text-center text-gray-500">
                      No employees found. Add your first employee to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Storage Information */}
        <div className="bg-white p-6 rounded border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Storage Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Employees</p>
              <p className="text-xl font-bold text-blue-600">{storageInfo.employeeCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payslips</p>
              <p className="text-xl font-bold text-green-600">{storageInfo.payslipCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Storage Used</p>
              <p className="text-xl font-bold text-purple-600">{(storageInfo.storageUsed / 1024).toFixed(2)} KB</p>
            </div>
          </div>
        </div>

        {/* Data Operations */}
        <div className="bg-white p-6 rounded border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Operations</h3>
          <div className="space-y-4">
            
            {/* Export Data */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded border border-green-200">
              <div>
                <h4 className="font-semibold text-green-800">Export Data</h4>
                <p className="text-sm text-green-600">Download a backup of all your data</p>
              </div>
              <button
                onClick={handleExportData}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>

            {/* Import Data */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded border border-blue-200">
              <div>
                <h4 className="font-semibold text-blue-800">Import Data</h4>
                <p className="text-sm text-blue-600">Restore data from a backup file</p>
              </div>
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Import
                </label>
              </div>
            </div>

            {/* Clear Data */}
            <div className="flex items-center justify-between p-4 bg-red-50 rounded border border-red-200">
              <div>
                <h4 className="font-semibold text-red-800">Clear All Data</h4>
                <p className="text-sm text-red-600">Permanently delete all data and reset to defaults</p>
              </div>
              <button
                onClick={handleClearData}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Search & Analytics */}
        <div className="bg-white p-6 rounded border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Search</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Employees</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, ID, designation, or department..."
                  value={dataManagementEmployeeSearch}
                  onChange={(e) => setDataManagementEmployeeSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              {dataManagementEmployeeSearch && (
                <div className="mt-2 text-sm text-gray-600">
                  Found {filterEmployees(employeeDatabase, dataManagementEmployeeSearch).length} of {employeeDatabase.length} employees
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Payslips</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by employee name, ID, or pay period..."
                  value={dataManagementPayslipSearch}
                  onChange={(e) => setDataManagementPayslipSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              {dataManagementPayslipSearch && (
                <div className="mt-2 text-sm text-gray-600">
                  Found {filterPayslips(payslips, dataManagementPayslipSearch, null).length} of {payslips.length} payslips
                </div>
              )}
            </div>
            
            {/* Show search results */}
            {(dataManagementEmployeeSearch || dataManagementPayslipSearch) && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-800 mb-3">Search Results</h4>
                
                {dataManagementEmployeeSearch && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Employees ({filterEmployees(employeeDatabase, dataManagementEmployeeSearch).length})
                    </h5>
                    {filterEmployees(employeeDatabase, dataManagementEmployeeSearch).length > 0 ? (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {filterEmployees(employeeDatabase, dataManagementEmployeeSearch).slice(0, 5).map((employee) => (
                          <div key={employee.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                            <span className="font-medium">{employee.name}</span>
                            <span className="text-gray-500">{employee.id} • {employee.designation}</span>
                          </div>
                        ))}
                        {filterEmployees(employeeDatabase, dataManagementEmployeeSearch).length > 5 && (
                          <div className="text-xs text-gray-500 text-center pt-1">
                            ...and {filterEmployees(employeeDatabase, dataManagementEmployeeSearch).length - 5} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No employees found</p>
                    )}
                  </div>
                )}
                
                {dataManagementPayslipSearch && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Payslips ({filterPayslips(payslips, dataManagementPayslipSearch, null).length})
                    </h5>
                    {filterPayslips(payslips, dataManagementPayslipSearch, null).length > 0 ? (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {filterPayslips(payslips, dataManagementPayslipSearch, null).slice(0, 5).map((payslip) => (
                          <div key={payslip.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                            <span className="font-medium">{payslip.name}</span>
                            <span className="text-gray-500">{payslip.payPeriod || payslip.payrollPeriod} • {payslip.designation}</span>
                          </div>
                        ))}
                        {filterPayslips(payslips, dataManagementPayslipSearch, null).length > 5 && (
                          <div className="text-xs text-gray-500 text-center pt-1">
                            ...and {filterPayslips(payslips, dataManagementPayslipSearch, null).length - 5} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No payslips found</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4 lg:py-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                <span className="block sm:hidden">Payroll System</span>
                <span className="hidden sm:block lg:hidden">Payroll Management</span>
                <span className="hidden lg:block">Payroll Management System</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{setupData?.companyName || 'Payroll System'}</p>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-touch min-w-touch flex items-center justify-center"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {/* Navigation */}
              <nav className="hidden md:flex space-x-2 lg:space-x-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-2 lg:px-4 py-2 rounded font-medium transition-colors text-sm lg:text-base ${
                    currentView === 'dashboard' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="lg:hidden">Dashboard</span>
                  <span className="hidden lg:inline">Dashboard</span>
                </button>
                <button
                  onClick={() => setCurrentView('reports')}
                  className={`px-2 lg:px-4 py-2 rounded font-medium transition-colors text-sm lg:text-base ${
                    currentView === 'reports' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="lg:hidden">Reports</span>
                  <span className="hidden lg:inline">Wage Bill Reports</span>
                </button>
                <button
                  onClick={() => setCurrentView('dataManagement')}
                  className={`px-2 lg:px-4 py-2 rounded font-medium transition-colors text-sm lg:text-base ${
                    currentView === 'dataManagement' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="lg:hidden">Data</span>
                  <span className="hidden lg:inline">Data Management</span>
                </button>
              </nav>

              {/* Sync Status Indicator */}
              <div className="flex items-center">
                <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                  !isOnline 
                    ? 'bg-red-100 text-red-700' 
                    : syncStatus === 'synced' 
                    ? 'bg-green-100 text-green-700'
                    : syncStatus === 'syncing'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {!isOnline ? (
                    <>
                      <WifiOff className="h-3 w-3" />
                      <span className="hidden sm:inline">Offline</span>
                    </>
                  ) : syncStatus === 'synced' ? (
                    <>
                      <Cloud className="h-3 w-3" />
                      <span className="hidden sm:inline">Synced</span>
                    </>
                  ) : syncStatus === 'syncing' ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                      <span className="hidden sm:inline">Syncing</span>
                    </>
                  ) : (
                    <>
                      <CloudOff className="h-3 w-3" />
                      <span className="hidden sm:inline">Local</span>
                    </>
                  )}
                </div>
              </div>

              {/* User Menu */}
              <div className="relative group">
                <div className="flex items-center space-x-2 cursor-pointer p-1 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-touch">
                  <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-24 lg:max-w-none">{user?.username || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate max-w-24 lg:max-w-none">{user?.role || 'Role'}</p>
                  </div>
                </div>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                      <p className="text-xs text-gray-500">{user?.role}</p>
                    </div>
                    <button
                      onClick={() => {
                        showConfirm(
                          'Are you sure you want to log out?',
                          () => {
                            onLogout();
                            closeModal('confirm');
                          },
                          {
                            title: 'Confirm Logout',
                            confirmText: 'Logout',
                            cancelText: 'Cancel'
                          }
                        );
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded transition-colors mt-1"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <div className="px-3 py-3 space-y-1">
                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors min-h-touch flex items-center ${
                    currentView === 'dashboard' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="h-5 w-5 mr-3" />
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setCurrentView('reports');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors min-h-touch flex items-center ${
                    currentView === 'reports' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="h-5 w-5 mr-3" />
                  Wage Bill Reports
                </button>
                <button
                  onClick={() => {
                    setCurrentView('dataManagement');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors min-h-touch flex items-center ${
                    currentView === 'dataManagement' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Database className="h-5 w-5 mr-3" />
                  Data Management
                </button>
                
                {/* Mobile User Info */}
                <div className="pt-3 mt-3 border-t border-gray-200">
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                  <button
                    onClick={() => {
                      showConfirm(
                        'Are you sure you want to log out?',
                        () => {
                          onLogout();
                          closeModal('confirm');
                        },
                        {
                          title: 'Confirm Logout',
                          confirmText: 'Logout',
                          cancelText: 'Cancel'
                        }
                      );
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors min-h-touch"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'addPayslip' && renderAddPayslip()}
        {currentView === 'payslip' && renderPayslip()}
        {currentView === 'reports' && renderReports()}
        {currentView === 'dataManagement' && renderDataManagement()}
      </div>

      {/* Beautiful Notification Modals */}
      <SuccessModal
        isOpen={modals.success.isOpen}
        onClose={() => {
          closeModal('success');
          // Auto-navigate after certain successful operations
          if (currentView === 'addPayslip') {
            setCurrentView('dashboard');
          }
          // Navigate to dashboard after data export success
          if (currentView === 'dataManagement' && modals.success.title === 'Data Exported') {
            setCurrentView('dashboard');
          }
          // If employee form is open after successful creation, close it
          if (showEmployeeForm) {
            setShowEmployeeForm(false);
          }
        }}
        title={modals.success.title}
        message={modals.success.message}
      />

      <ErrorModal
        isOpen={modals.error.isOpen}
        onClose={() => closeModal('error')}
        title={modals.error.title}
        message={modals.error.message}
      />

      <ConfirmModal
        isOpen={modals.confirm.isOpen}
        onClose={() => closeModal('confirm')}
        onConfirm={() => {
          console.log('Confirm button clicked! onConfirm function:', modals.confirm.onConfirm);
          if (modals.confirm.onConfirm) {
            console.log('Executing onConfirm function...');
            modals.confirm.onConfirm();
          } else {
            console.log('No onConfirm function found!');
            closeModal('confirm');
          }
        }}
        title={modals.confirm.title}
        message={modals.confirm.message}
        confirmText={modals.confirm.confirmText}
        cancelText={modals.confirm.cancelText}
        danger={modals.confirm.danger}
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
    </div>
  );
};

export default PayrollGenerator;