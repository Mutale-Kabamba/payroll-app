import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Download, Calculator, Users, FileText, Menu, X, BarChart3, TrendingUp, DollarSign, Calendar } from 'lucide-react';

const PayrollGenerator = () => {
// Employee Database - This would typically come from a backend
const [employeeDatabase, setEmployeeDatabase] = useState([
    {
        id: 'LEW001',
        name: 'LESA LEWIS',
        nrc: '217589/68/1',
        ssn: '911834888',
        gender: 'Male',
        designation: 'DRIVER',
        dateOfJoining: '1973-12-05',
        basicPay: 3000.00,
        transportAllowance: 200.00,
        mealAllowance: 0,
        address: 'C153 Linda - Livingstone',
        department: 'OPERATIONS & LOGISTICS',
        napsa: '911834888',
        nhima: '233266971110112'
    },
    {
        id: 'WIN002',
        name: 'KASENGA WINTER',
        nrc: '633347/11/1',
        ssn: '208975378',
        gender: 'Male',
        designation: 'DRIVER',
        dateOfJoining: '1976-05-20',
        basicPay: 3000.00,
        transportAllowance: 200.00,
        mealAllowance: 0,
        address: '121 Dambwa North - Livingstone',
        department: 'OPERATIONS & LOGISTICS',
        napsa: '208975378',
        nhima: '233282691110119'
    },
    {
        id: 'HAR003',
        name: 'NDHLOVU HARRISON',
        nrc: '231690/7/1',
        ssn: '905369104',
        gender: 'Male',
        designation: 'GENERAL WORKER',
        dateOfJoining: '1986-03-05',
        basicPay: 1500.00,
        transportAllowance: 150.00,
        mealAllowance: 0,
        address: 'C31 Linda - Livingstone',
        department: 'OPERATIONS & LOGISTICS',
        napsa: '905369104',
        nhima: '233282601110116'
    },
    {
        id: 'CHI004',
        name: 'KANEKWA CHIMBUNYA ISAAC',
        nrc: '328165/71/1',
        ssn: '941778636',
        gender: 'Male',
        designation: 'GENERAL WORKER',
        dateOfJoining: '1998-12-10',
        basicPay: 1500.00,
        transportAllowance: 150.00,
        mealAllowance: 0,
        address: 'C75 Maramba - Livingstone',
        department: 'OPERATIONS & LOGISTICS',
        napsa: '941778636',
        nhima: '233296321110141'
    },
    {
        id: 'ABR005',
        name: 'KANG\'OTI BYEMBA ABRAHAM',
        nrc: '198290/84/1',
        ssn: '',
        gender: 'Male',
        designation: 'GENERAL WORKER',
        dateOfJoining: '1969-08-18',
        basicPay: 700.00,
        transportAllowance: 100.00,
        mealAllowance: 0,
        address: '2670 Senanga Rd - Livingstone',
        department: 'OPERATIONS & LOGISTICS',
        napsa: '',
        nhima: ''
    },
    {
        id: 'KAB006',
        name: 'MUTALE KABAMBA',
        nrc: '317029/68/1',
        ssn: '320434124',
        gender: 'Male',
        designation: 'MANAGER',
        dateOfJoining: '1998-04-03',
        basicPay: 4000.00,
        transportAllowance: 300.00,
        mealAllowance: 200.00,
        address: '10A Off Natwange Road - Livingstone',
        department: 'IT & ACCOUNTS',
        napsa: '320434124',
        nhima: '322002911110110'
    },
    {
        id: 'DAN007',
        name: 'MWAANGA MWALE M. DANIEL',
        nrc: '510487/71/1',
        ssn: '912775251',
        gender: 'Male',
        designation: 'DRIVER',
        dateOfJoining: '',
        basicPay: 1500.00,
        transportAllowance: 200.00,
        mealAllowance: 0,
        address: '',
        department: 'OPERATIONS & LOGISTICS',
        napsa: '912775251',
        nhima: '219861681110117'
    }
]);

// Payslips - tracks created payslips
const [payslips, setPayslips] = useState([]);

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

  const addPayslip = () => {
    if (newPayslip.employeeId) {
      const employee = employeeDatabase.find(emp => emp.id === newPayslip.employeeId);
      if (employee) {
        const payslipData = {
          ...employee,
          payrollPeriod: payrollData.payPeriod,
          workedDays: payrollData.workedDays,
          totalDays: payrollData.totalDays,
          otherEarnings: newPayslip.otherEarnings,
          otherDeductions: newPayslip.otherDeductions,
          createdAt: new Date().toISOString()
        };
        setPayslips([...payslips, payslipData]);
        setNewPayslip({
          employeeId: '',
          otherEarnings: [],
          otherDeductions: []
        });
        setCurrentView('dashboard');
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

  const deletePayslip = (index) => {
    setPayslips(payslips.filter((_, i) => i !== index));
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
      <div className="card-gradient">
        <div className="px-6 py-4 border-b border-gray-300">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Generated Payslips</h2>
            <button
              onClick={() => setCurrentView('addPayslip')}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              Add Payslip
            </button>
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">Designation</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">Pay Period</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">Net Pay</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {payslips.map((payslip, index) => {
                const calculatedPayslip = calculatePayslip(payslip);
                return (
                  <tr key={index} className={`${index !== payslips.length - 1 ? 'border-b border-gray-300' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 uppercase">{payslip.name}</div>
                        <div className="text-sm text-gray-600">{payslip.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 uppercase">{payslip.designation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payslip.payrollPeriod}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">ZMW {calculatedPayslip.netPay.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generatePayslip(payslip)}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded border border-gray-300 flex items-center gap-1 hover:bg-gray-200 transition-colors text-xs"
                        >
                          <FileText className="h-3 w-3" />
                          View Payslip
                        </button>
                        <button
                          onClick={() => deletePayslip(index)}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded border border-gray-300 flex items-center gap-1 hover:bg-gray-200 transition-colors text-xs"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {payslips.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No payslips created yet. Click "Add Payslip" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
    if (!selectedEmployee) return null;

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
                
                // Create print preview window
                const reportElement = document.getElementById('wage-bill-report');
                if (reportElement) {
                  const printWindow = window.open('', '_blank', 'width=800,height=600');
                  const reportHTML = reportElement.outerHTML;
                  
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>Wage Bill Report Preview - ${new Date().toLocaleDateString()}</title>
                      <script src="https://cdn.tailwindcss.com"></script>
                      <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
                        body { font-family: 'Inter', sans-serif; margin: 20px; }
                        .no-print { display: none !important; }
                        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                        th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
                        th { background-color: #f5f5f5; }
                        .bg-blue-600, .bg-blue-800 { background-color: #1e40af !important; color: white !important; }
                        .text-white { color: white !important; }
                        .rounded-lg { border-radius: 8px; }
                        .p-6 { padding: 24px; }
                        .mb-2 { margin-bottom: 8px; }
                        .mb-4 { margin-bottom: 16px; }
                        .mb-6 { margin-bottom: 24px; }
                        .text-2xl { font-size: 24px; }
                        .text-lg { font-size: 18px; }
                        .text-sm { font-size: 14px; }
                        .font-bold { font-weight: bold; }
                        .font-semibold { font-weight: 600; }
                        .grid { display: grid; }
                        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
                        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                        .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
                        .gap-4 { gap: 16px; }
                        .gap-6 { gap: 24px; }
                        .space-y-6 > * + * { margin-top: 24px; }
                        .space-y-3 > * + * { margin-top: 12px; }
                        .border { border: 1px solid #d1d5db; }
                        .border-gray-300 { border-color: #d1d5db; }
                        .bg-white { background-color: white; }
                        .bg-gray-50 { background-color: #f9fafb; }
                        .text-gray-900 { color: #111827; }
                        .text-gray-600 { color: #4b5563; }
                        .text-green-600 { color: #059669; }
                        .text-red-600 { color: #dc2626; }
                        .text-blue-600 { color: #2563eb; }
                        .overflow-x-auto { overflow-x: auto; }
                        .px-4 { padding-left: 16px; padding-right: 16px; }
                        .py-3 { padding-top: 12px; padding-bottom: 12px; }
                        .px-6 { padding-left: 24px; padding-right: 24px; }
                        .py-4 { padding-top: 16px; padding-bottom: 16px; }
                        .flex { display: flex; }
                        .items-center { align-items: center; }
                        .justify-between { justify-content: space-between; }
                        .text-right { text-align: right; }
                        .hover\\:bg-gray-50:hover { background-color: #f9fafb; }
                        .divide-y > * + * { border-top: 1px solid #e5e7eb; }
                        @media print {
                          body { margin: 0; }
                          .no-print { display: none !important; }
                        }
                      </style>
                    </head>
                    <body>
                      <div style="text-align: center; margin-bottom: 20px;">
                        <button onclick="window.print()" style="background: #1e40af; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                          🖨️ Print This Report
                        </button>
                        <button onclick="window.close()" style="background: #6b7280; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">
                          ✕ Close Preview
                        </button>
                      </div>
                      ${reportHTML}
                    </body>
                    </html>
                  `);
                  printWindow.document.close();
                } else {
                  alert('Report content not found. Please refresh and try again.');
                }
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
                
                // Ensure the report content is visible before printing
                const reportElement = document.getElementById('wage-bill-report');
                if (reportElement) {
                  // Set document title for print
                  const originalTitle = document.title;
                  document.title = `Wage Bill Report - ${new Date().toLocaleDateString()}`;
                  
                  // Add a small delay to ensure styles are applied
                  setTimeout(() => {
                    window.print();
                    // Restore original title after printing
                    setTimeout(() => {
                      document.title = originalTitle;
                    }, 1000);
                  }, 100);
                } else {
                  alert('Report content not found. Please refresh and try again.');
                }
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