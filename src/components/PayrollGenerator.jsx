import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Download, Calculator, Users, FileText, Menu, X, BarChart3, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import databaseService from '../services/DatabaseService';

const PayrollGenerator = () => {
// Database and state management
const [employeeDatabase, setEmployeeDatabase] = useState([]);
const [payslips, setPayslips] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [dbError, setDbError] = useState(null);

const [currentView, setCurrentView] = useState('dashboard');
const [selectedEmployee, setSelectedEmployee] = useState(null);
const [selectedEmployeeForPayslip, setSelectedEmployeeForPayslip] = useState('');
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const [payrollData, setPayrollData] = useState({
    payPeriod: 'August 2024',
    workedDays: 26,
    totalDays: 30
});

const payPeriodOptions = [
    'January 2024', 'February 2024', 'March 2024', 'April 2024', 'May 2024', 'June 2024',
    'July 2024', 'August 2024', 'September 2024', 'October 2024', 'November 2024', 'December 2024',
    'January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025',
    'July 2025', 'August 2025', 'September 2025', 'October 2025', 'November 2025', 'December 2025'
];

  const [newPayslip, setNewPayslip] = useState({
    employeeId: '',
    otherEarnings: [],
    otherDeductions: []
  });

  // Initialize database on component mount
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setIsLoading(true);
        setDbError(null);
        
        await databaseService.initialize();
        
        // Load employees and payslips from database
        const employees = await databaseService.getAllEmployees();
        const payslipData = await databaseService.getAllPayslips();
        
        setEmployeeDatabase(employees);
        setPayslips(payslipData);
        
        console.log('Database initialized successfully');
        console.log('Loaded employees:', employees.length);
        console.log('Loaded payslips:', payslipData.length);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setDbError('Failed to load database. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeDatabase();
  }, []);

  // Function to refresh data from database
  const refreshData = async () => {
    try {
      const employees = await databaseService.getAllEmployees();
      const payslipData = await databaseService.getAllPayslips();
      
      setEmployeeDatabase(employees);
      setPayslips(payslipData);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setDbError('Failed to refresh data from database.');
    }
  };const calculateDeductions = (basicPay, otherDeductions = []) => {
    const napsa = basicPay * 0.05; // 5% NAPSA
    const nhima = basicPay * 0.01; // 1% NHIMA
    const otherDeductionsTotal = otherDeductions.reduce((sum, deduction) => sum + deduction.amount, 0);
    return { napsa, nhima, loan: 0, otherDeductions: otherDeductionsTotal };
};

const calculatePayslip = (payslipOrEmployee) => {
    // Handle both payslip objects from database and employee objects
    const isPayslip = payslipOrEmployee.hasOwnProperty('payrollPeriod') || payslipOrEmployee.hasOwnProperty('id') && typeof payslipOrEmployee.id === 'number';
    
    let employee, otherEarnings, otherDeductions;
    
    if (isPayslip) {
      // It's a payslip from database
      employee = {
        id: payslipOrEmployee.employeeId || payslipOrEmployee.id,
        name: payslipOrEmployee.name,
        nrc: payslipOrEmployee.nrc,
        ssn: payslipOrEmployee.ssn,
        gender: payslipOrEmployee.gender,
        designation: payslipOrEmployee.designation,
        dateOfJoining: payslipOrEmployee.dateOfJoining,
        basicPay: payslipOrEmployee.basicPay,
        transportAllowance: payslipOrEmployee.transportAllowance,
        mealAllowance: payslipOrEmployee.mealAllowance,
        address: payslipOrEmployee.address,
        department: payslipOrEmployee.department,
        napsa: payslipOrEmployee.employeeNapsa || payslipOrEmployee.napsa,
        nhima: payslipOrEmployee.employeeNhima || payslipOrEmployee.nhima
      };
      otherEarnings = payslipOrEmployee.otherEarnings || [];
      otherDeductions = payslipOrEmployee.otherDeductions || [];
    } else {
      // It's an employee object
      employee = payslipOrEmployee;
      otherEarnings = payslipOrEmployee.otherEarnings || [];
      otherDeductions = payslipOrEmployee.otherDeductions || [];
    }

    // Auto-calculate house rent allowance as 30% of basic pay
    const calculatedHouseRent = employee.basicPay * 0.30;
    const otherEarningsTotal = otherEarnings.reduce((sum, earning) => sum + (earning.amount || 0), 0);
    
    const totalEarnings = employee.basicPay + employee.transportAllowance + 
      calculatedHouseRent + employee.mealAllowance + otherEarningsTotal;
    
    const deductions = calculateDeductions(employee.basicPay, otherDeductions);
    const totalDeductions = deductions.napsa + deductions.nhima + deductions.loan + deductions.otherDeductions;
    const netPay = totalEarnings - totalDeductions;

    return {
      ...employee,
      houseRentAllowance: calculatedHouseRent,
      otherEarnings,
      otherDeductions,
      otherEarningsTotal,
      totalEarnings,
      deductions,
      totalDeductions,
      netPay,
      // Include payslip-specific data if available
      ...(isPayslip && {
        payrollPeriod: payslipOrEmployee.payrollPeriod,
        workedDays: payslipOrEmployee.workedDays,
        totalDays: payslipOrEmployee.totalDays,
        createdAt: payslipOrEmployee.createdAt
      })
    };
  };

  const addPayslip = async () => {
    if (newPayslip.employeeId) {
      try {
        const employee = employeeDatabase.find(emp => emp.id === newPayslip.employeeId);
        if (employee) {
          // Calculate payslip data
          const calculatedHouseRent = employee.basicPay * 0.30;
          const otherEarningsTotal = (newPayslip.otherEarnings || []).reduce((sum, earning) => sum + earning.amount, 0);
          
          const totalEarnings = employee.basicPay + employee.transportAllowance + 
            calculatedHouseRent + employee.mealAllowance + otherEarningsTotal;
          
          const deductions = calculateDeductions(employee.basicPay, newPayslip.otherDeductions || []);
          const totalDeductions = deductions.napsa + deductions.nhima + deductions.loan + deductions.otherDeductions;
          const netPay = totalEarnings - totalDeductions;

          // Prepare payslip data for database
          const payslipData = {
            employeeId: employee.id,
            payrollPeriod: payrollData.payPeriod,
            workedDays: payrollData.workedDays,
            totalDays: payrollData.totalDays,
            basicPay: employee.basicPay,
            transportAllowance: employee.transportAllowance,
            houseRentAllowance: calculatedHouseRent,
            mealAllowance: employee.mealAllowance,
            otherEarnings: newPayslip.otherEarnings,
            totalEarnings: totalEarnings,
            napsa: deductions.napsa,
            nhima: deductions.nhima,
            loan: deductions.loan,
            otherDeductions: newPayslip.otherDeductions,
            totalDeductions: totalDeductions,
            netPay: netPay
          };

          // Save to database
          await databaseService.createPayslip(payslipData);
          
          // Refresh data from database
          await refreshData();
          
          // Reset form
          setNewPayslip({
            employeeId: '',
            otherEarnings: [],
            otherDeductions: []
          });
          
          setCurrentView('dashboard');
          console.log('Payslip created and saved to database successfully');
        }
      } catch (error) {
        console.error('Error creating payslip:', error);
        setDbError('Failed to create payslip. Please try again.');
      }
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

  const deletePayslip = async (payslipId) => {
    try {
      await databaseService.deletePayslip(payslipId);
      await refreshData();
      console.log('Payslip deleted successfully');
    } catch (error) {
      console.error('Error deleting payslip:', error);
      setDbError('Failed to delete payslip. Please try again.');
    }
  };

  const generatePayslip = (payslipData) => {
    const payslip = calculatePayslip(payslipData);
    setSelectedEmployee(payslip);
    setCurrentView('payslip');
  };

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Million', 'Billion'];

    if (num === 0) return 'Zero Kwacha';

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

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Pay Period Selector */}
      <div className="bg-white rounded border border-gray-300 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Pay Period:</label>
          <select
            value={payrollData.payPeriod}
            onChange={(e) => setPayrollData({ ...payrollData, payPeriod: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {payPeriodOptions.map(period => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Worked Days:</label>
              <input
                type="number"
                min="1"
                max="31"
                value={payrollData.workedDays}
                onChange={(e) => setPayrollData({ ...payrollData, workedDays: parseInt(e.target.value) || 0 })}
                className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Total Days:</label>
              <input
                type="number"
                min="1"
                max="31"
                value={payrollData.totalDays}
                onChange={(e) => setPayrollData({ ...payrollData, totalDays: parseInt(e.target.value) || 0 })}
                className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="space-y-4">
        <div className="stat-card-users">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employeeDatabase.length}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="stat-card-payroll">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded">
                <Calculator className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Payslips Created</p>
                <p className="text-xl font-bold text-gray-900">{payslips.length}</p>
              </div>
            </div>
          </div>
          
          <div className="stat-card-payroll">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded">
                <Calculator className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Wage Bill</p>
                <p className="text-xl font-bold text-gray-900">
                  ZMW {payslips.reduce((sum, payslip) => {
                    const calculatedPayslip = calculatePayslip(payslip);
                    return sum + calculatedPayslip.netPay;
                  }, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="stat-card-period">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pay Period</p>
              <p className="text-xl font-bold text-gray-900">{payrollData.payPeriod}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payslips Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Generated Payslips</h2>
              <p className="text-xs text-gray-600 mt-1">
                {payrollData.payPeriod} • {payslips.length} payslip{payslips.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent w-40"
                />
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button
                onClick={() => {
                  if (payslips.length === 0) {
                    alert('No payslips to export');
                    return;
                  }
                  // Generate and export all payslips as PDF
                  const exportAllPayslips = () => {
                    const printWindow = window.open('', '_blank');
                    let htmlContent = `
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>All Payslips - ${payrollData.payPeriod}</title>
                        <style>
                          @page {
                            size: A4;
                            margin: 15mm 15mm 15mm 15mm;
                          }
                          body { 
                            font-family: Arial, sans-serif; 
                            margin: 0; 
                            padding: 0; 
                            font-size: 12px;
                            line-height: 1.4;
                            color: #000;
                          }
                          .payslip { 
                            page-break-after: always; 
                            width: 100%;
                            height: 100vh;
                            display: flex;
                            flex-direction: column;
                            justify-content: space-between;
                            padding: 10mm 0;
                          }
                          .payslip:last-child { page-break-after: auto; }
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
                            display: flex; 
                            justify-content: space-between; 
                            margin-bottom: 20px;
                            border: 1px solid #ccc;
                            padding: 10px;
                            background-color: #f9f9f9;
                          }
                          .info-section { width: 48%; }
                          .info-row { 
                            display: flex; 
                            justify-content: space-between; 
                            margin-bottom: 4px;
                            font-size: 11px;
                          }
                          .label { 
                            font-weight: bold; 
                            width: 45%;
                          }
                          .value {
                            width: 55%;
                            text-align: left;
                          }
                          .earnings-deductions { 
                            display: flex; 
                            justify-content: space-between; 
                            margin-top: 15px;
                            flex: 1;
                          }
                          .earnings, .deductions { 
                            width: 48%; 
                            border: 1px solid #333;
                            padding: 10px;
                          }
                          .section-title { 
                            font-weight: bold; 
                            font-size: 14px; 
                            margin-bottom: 8px;
                            text-align: center;
                            background-color: #e0e0e0;
                            padding: 5px;
                            margin: -10px -10px 10px -10px;
                          }
                          .amount-row { 
                            display: flex; 
                            justify-content: space-between; 
                            margin-bottom: 3px;
                            font-size: 11px;
                            padding: 2px 0;
                          }
                          .total-row { 
                            border-top: 2px solid #000; 
                            padding-top: 5px; 
                            margin-top: 8px; 
                            font-weight: bold;
                            font-size: 12px;
                          }
                          .net-pay { 
                            text-align: center; 
                            margin-top: 15px; 
                            padding: 8px; 
                            background-color: #f0f0f0; 
                            font-size: 16px; 
                            font-weight: bold;
                            border: 2px solid #000;
                          }
                          .amount-words { 
                            margin-top: 10px; 
                            font-style: italic;
                            font-size: 11px;
                            text-align: center;
                            padding: 5px;
                            border: 1px dashed #666;
                          }
                          .footer {
                            margin-top: 15px;
                            text-align: center;
                            font-size: 10px;
                            color: #666;
                            border-top: 1px solid #ccc;
                            padding-top: 5px;
                          }
                          @media print {
                            body { 
                              margin: 0;
                              -webkit-print-color-adjust: exact;
                              print-color-adjust: exact;
                            }
                            .payslip { 
                              page-break-after: always;
                              height: auto;
                              min-height: 90vh;
                            }
                            .payslip:last-child {
                              page-break-after: auto;
                            }
                          }
                        </style>
                      </head>
                      <body>
                    `;

                    payslips.forEach((payslip, index) => {
                      const calculatedPayslip = calculatePayslip(payslip);
                      htmlContent += `
                        <div class="payslip">
                          <div class="header">
                            <div class="company-name">SPF & CM ENTERPRISES LIMITED</div>
                            <div class="company-address">2670 Town Area, Senanga Rd.</div>
                          </div>
                          
                          <div class="payslip-title">Payslip</div>
                          
                          <div class="employee-info">
                            <div class="info-section">
                              <div class="info-row"><span class="label">Employee Number:</span> <span class="value">${payslip.id}</span></div>
                              <div class="info-row"><span class="label">Date of Joining:</span> <span class="value">${payslip.dateOfJoining}</span></div>
                              <div class="info-row"><span class="label">Pay Period:</span> <span class="value">${payslip.payrollPeriod}</span></div>
                              <div class="info-row"><span class="label">Worked Days:</span> <span class="value">${payslip.workedDays || payrollData.workedDays}</span></div>
                              <div class="info-row"><span class="label">Designation:</span> <span class="value">${payslip.designation}</span></div>
                            </div>
                            <div class="info-section">
                              <div class="info-row"><span class="label">Employee Name:</span> <span class="value">${payslip.name}</span></div>
                              <div class="info-row"><span class="label">Gender:</span> <span class="value">${payslip.gender}</span></div>
                              <div class="info-row"><span class="label">NRC:</span> <span class="value">${payslip.nrc}</span></div>
                              <div class="info-row"><span class="label">SSN:</span> <span class="value">${payslip.ssn}</span></div>
                            </div>
                          </div>
                          
                          <div class="earnings-deductions">
                            <div class="earnings">
                              <div class="section-title">Earnings</div>
                              <div class="amount-row"><span>Basic</span> <span>ZMW ${payslip.basicPay.toFixed(2)}</span></div>
                              <div class="amount-row"><span>Transport Allowance</span> <span>ZMW ${payslip.transportAllowance.toFixed(2)}</span></div>
                              <div class="amount-row"><span>House Rent Allowance</span> <span>ZMW ${calculatedPayslip.houseRentAllowance.toFixed(2)}</span></div>
                              <div class="amount-row"><span>Meal Allowance</span> <span>ZMW ${payslip.mealAllowance.toFixed(2)}</span></div>
                              ${(payslip.otherEarnings || []).map(earning => 
                                `<div class="amount-row"><span>${earning.name}</span> <span>ZMW ${earning.amount.toFixed(2)}</span></div>`
                              ).join('')}
                              <div class="amount-row total-row"><span>Total Earnings</span> <span>ZMW ${calculatedPayslip.totalEarnings.toFixed(2)}</span></div>
                            </div>
                            
                            <div class="deductions">
                              <div class="section-title">Deductions</div>
                              <div class="amount-row"><span>NAPSA</span> <span>ZMW ${calculatedPayslip.deductions.napsa.toFixed(2)}</span></div>
                              <div class="amount-row"><span>NHIMA</span> <span>ZMW ${calculatedPayslip.deductions.nhima.toFixed(2)}</span></div>
                              <div class="amount-row"><span>Loan</span> <span>ZMW ${calculatedPayslip.deductions.loan.toFixed(2)}</span></div>
                              ${(payslip.otherDeductions || []).map(deduction => 
                                `<div class="amount-row"><span>${deduction.name}</span> <span>ZMW ${deduction.amount.toFixed(2)}</span></div>`
                              ).join('')}
                              <div class="amount-row total-row"><span>Total Deductions</span> <span>ZMW ${calculatedPayslip.totalDeductions.toFixed(2)}</span></div>
                            </div>
                          </div>
                          
                          <div class="net-pay">
                            Net Pay: ZMW ${calculatedPayslip.netPay.toFixed(2)}
                          </div>
                          
                          <div class="amount-words">
                            Amount in words: ${numberToWords(calculatedPayslip.netPay)}
                          </div>
                          
                          <div class="footer">
                            Generated on ${new Date().toLocaleDateString()} | Page ${index + 1} of ${payslips.length}
                          </div>
                        </div>
                      `;
                    });

                    htmlContent += `
                      </body>
                      </html>
                    `;

                    printWindow.document.write(htmlContent);
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                      printWindow.print();
                    }, 500);
                  };
                  exportAllPayslips();
                }}
                disabled={payslips.length === 0}
                className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors ${
                  payslips.length === 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <Download className="h-3 w-3" />
                Export All PDF
              </button>
              <button
                onClick={() => setCurrentView('addPayslip')}
                className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add Payslip
              </button>
            </div>
          </div>
        </div>
        
        {/* Compact Table View */}
        <div className="overflow-x-auto">
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
              {payslips.map((payslip, index) => {
                const calculatedPayslip = calculatePayslip(payslip);
                return (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-gray-700">
                            {payslip.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </span>
                        </div>
                        <div className="ml-2 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{payslip.name}</div>
                          <div className="text-xs text-gray-500">{payslip.id}</div>
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
                          onClick={() => deletePayslip(payslip.id)}
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
              {payslips.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-3 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <svg className="h-10 w-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

        {/* Compact Table Footer with Summary */}
        {payslips.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs">
              <div className="text-gray-600">
                {payslips.length} payslip{payslips.length !== 1 ? 's' : ''} • {payrollData.payPeriod}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-gray-600">
                <div className="flex items-center gap-4">
                  <span>Total: <span className="font-semibold text-gray-900">
                    {payslips.reduce((sum, payslip) => {
                      const calculatedPayslip = calculatePayslip(payslip);
                      return sum + calculatedPayslip.totalEarnings;
                    }, 0).toFixed(0)}
                  </span></span>
                  <span>Deductions: <span className="font-semibold text-red-600">
                    {payslips.reduce((sum, payslip) => {
                      const calculatedPayslip = calculatePayslip(payslip);
                      return sum + calculatedPayslip.totalDeductions;
                    }, 0).toFixed(0)}
                  </span></span>
                  <span>Net: <span className="font-semibold text-green-600">
                    {payslips.reduce((sum, payslip) => {
                      const calculatedPayslip = calculatePayslip(payslip);
                      return sum + calculatedPayslip.netPay;
                    }, 0).toFixed(0)}
                  </span></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderAddPayslip = () => {
    const selectedEmployeeData = employeeDatabase.find(emp => emp.id === newPayslip.employeeId);

    return (
      <div className="max-w-4xl mx-auto bg-white rounded border border-gray-300 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Create New Payslip</h2>
        
        {/* Employee Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
          <select
            value={newPayslip.employeeId}
            onChange={(e) => setNewPayslip({...newPayslip, employeeId: e.target.value})}
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
            disabled={!newPayslip.employeeId}
            className={`px-6 py-2 rounded font-medium transition-colors ${
              newPayslip.employeeId 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Create Payslip
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
            onClick={() => window.print()}
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
                <span className="text-secondary-900">{selectedEmployee.id}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-semibold text-secondary-700 w-40">Date of Joining:</span>
                <span className="text-secondary-900">{selectedEmployee.dateOfJoining}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-semibold text-secondary-700 w-40">Pay Period:</span>
                <span className="text-secondary-900">{payrollData.payPeriod}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-semibold text-secondary-700 w-40">Worked Days:</span>
                <span className="text-secondary-900">{payrollData.workedDays}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-semibold text-secondary-700 w-40">Employee Name:</span>
                <span className="text-secondary-900">{selectedEmployee.name}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-semibold text-secondary-700 w-40">Gender:</span>
                <span className="text-secondary-900">{selectedEmployee.gender}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-semibold text-secondary-700 w-40">NRC:</span>
                <span className="text-secondary-900">{selectedEmployee.nrc}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-semibold text-secondary-700 w-40">SSN:</span>
                <span className="text-secondary-900">{selectedEmployee.ssn}</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="font-semibold text-secondary-700 w-32">Designation:</span>
              <span className="inline-flex px-3 py-1 text-sm font-medium bg-primary-100 text-primary-800 rounded-full">
                {selectedEmployee.designation}
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
                  <td className="border-r border-secondary-300 p-4 font-medium">ZMW {selectedEmployee.basicPay.toFixed(2)}</td>
                  <td className="border-r border-secondary-300 p-4">NAPSA</td>
                  <td className="p-4 font-medium">ZMW {selectedEmployee.deductions.napsa.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-secondary-300 hover:bg-secondary-50">
                  <td className="border-r border-secondary-300 p-4">Transport Allowance</td>
                  <td className="border-r border-secondary-300 p-4 font-medium">ZMW {selectedEmployee.transportAllowance.toFixed(2)}</td>
                  <td className="border-r border-secondary-300 p-4">NHIMA</td>
                  <td className="p-4 font-medium">ZMW {selectedEmployee.deductions.nhima.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-secondary-300 hover:bg-secondary-50">
                  <td className="border-r border-secondary-300 p-4">House Rent Allowance</td>
                  <td className="border-r border-secondary-300 p-4 font-medium">ZMW {selectedEmployee.houseRentAllowance.toFixed(2)}</td>
                  <td className="border-r border-secondary-300 p-4">Loan</td>
                  <td className="p-4 font-medium">ZMW {selectedEmployee.deductions.loan.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-secondary-300 hover:bg-secondary-50">
                  <td className="border-r border-secondary-300 p-4">Meal Allowance</td>
                  <td className="border-r border-secondary-300 p-4 font-medium">ZMW {selectedEmployee.mealAllowance > 0 ? selectedEmployee.mealAllowance.toFixed(2) : '-'}</td>
                  <td className="border-r border-secondary-300 p-4"></td>
                  <td className="p-4"></td>
                </tr>
                {/* Other Earnings */}
                {selectedEmployee.otherEarnings && selectedEmployee.otherEarnings.map((earning, index) => (
                  <tr key={`earning-${index}`} className="border-b border-secondary-300 hover:bg-secondary-50">
                    <td className="border-r border-secondary-300 p-4">{earning.name}</td>
                    <td className="border-r border-secondary-300 p-4 font-medium">ZMW {earning.amount.toFixed(2)}</td>
                    <td className="border-r border-secondary-300 p-4"></td>
                    <td className="p-4"></td>
                  </tr>
                ))}
                {/* Other Deductions */}
                {selectedEmployee.otherDeductions && selectedEmployee.otherDeductions.map((deduction, index) => (
                  <tr key={`deduction-${index}`} className="border-b border-secondary-300 hover:bg-secondary-50">
                    <td className="border-r border-secondary-300 p-4"></td>
                    <td className="border-r border-secondary-300 p-4"></td>
                    <td className="border-r border-secondary-300 p-4">{deduction.name}</td>
                    <td className="p-4 font-medium">ZMW {deduction.amount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="border-b-2 border-secondary-800 font-bold bg-secondary-100">
                  <td className="border-r border-secondary-800 p-4">Total Earnings</td>
                  <td className="border-r border-secondary-800 p-4">ZMW {selectedEmployee.totalEarnings.toFixed(2)}</td>
                  <td className="border-r border-secondary-800 p-4">Total Deductions</td>
                  <td className="p-4">ZMW {selectedEmployee.totalDeductions.toFixed(2)}</td>
                </tr>
                <tr className="font-bold bg-success-50">
                  <td className="border-r border-secondary-800 p-4"></td>
                  <td className="border-r border-secondary-800 p-4"></td>
                  <td className="border-r border-secondary-800 p-4 text-success-700">Net Pay</td>
                  <td className="p-4 text-success-700 text-lg">ZMW {selectedEmployee.netPay.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-center mb-8 p-6 bg-gradient-to-r from-success-50 to-success-100 rounded-2xl border border-success-200">
            <p className="text-2xl lg:text-3xl font-bold text-success-700 mb-2">ZMW {selectedEmployee.netPay.toFixed(2)}</p>
            <p className="text-sm text-secondary-600 italic">{numberToWords(selectedEmployee.netPay)}</p>
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
        const period = payslip.payrollPeriod;
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
                  alert('No payroll data available to preview. Please create some payslips first.');
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
                              <td>${payslip.payrollPeriod || 'N/A'}</td>
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
                      <p>This is a system generated report - SPF & CM Enterprises Limited</p>
                      <p>Report generated on ${new Date().toLocaleString()}</p>
                    </div>
                  </body>
                  </html>
                `;
                
                printWindow.document.write(reportHTML);
                printWindow.document.close();
              }}
              className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Print Preview
            </button>
            <button
              onClick={() => {
                // Check if there's data to print
                if (payslips.length === 0) {
                  alert('No payroll data available to print. Please create some payslips first.');
                  return;
                }
                
                // Prepare simplified report data
                const calculatedPayslips = payslips.map(payslip => calculatePayslip(payslip));
                const totalWageBill = calculatedPayslips.reduce((sum, p) => sum + p.netPay, 0);
                const totalGrossWages = calculatedPayslips.reduce((sum, p) => sum + p.totalEarnings, 0);
                
                // Create a temporary window for printing
                const printWindow = window.open('', '_blank', 'width=1000,height=700');
                
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
                      
                      @media print {
                        body {
                          margin: 0;
                        }
                        
                        @page {
                          margin: 0.5in;
                          size: A4;
                        }
                      }
                    </style>
                  </head>
                  <body>
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
                              <td>${payslip.payrollPeriod || 'N/A'}</td>
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
                      <p>This is a system generated report - SPF & CM Enterprises Limited</p>
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

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Payroll System</h2>
          <p className="text-gray-600">Initializing SQLite database...</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (dbError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Database Error</h2>
          <p className="text-gray-600 mb-4">{dbError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Payroll Management System</h1>
            <nav className="flex space-x-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  currentView === 'dashboard' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('reports')}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  currentView === 'reports' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Wage Bill Reports
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'addPayslip' && renderAddPayslip()}
        {currentView === 'payslip' && renderPayslip()}
        {currentView === 'reports' && renderReports()}
      </div>
    </div>
  );
};

export default PayrollGenerator;