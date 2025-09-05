import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Download, Calculator, Users, FileText, Menu, X } from 'lucide-react';

const PayrollGenerator = () => {
  const [employees, setEmployees] = useState([
    {
      id: 'LEW001',
      name: 'LESA LEWIS',
      nrc: '217589/68/1',
      ssn: '911834888',
      gender: 'Male',
      designation: 'DRIVER',
      dateOfJoining: '2018-06-23',
      basicPay: 2119.23,
      transportAllowance: 200.00,
      houseRentAllowance: 635.77,
      mealAllowance: 0
    },
    {
      id: 'WIN002',
      name: 'KASENGA WINTER',
      nrc: '633347/11/1',
      ssn: '208975378',
      gender: 'Male',
      designation: 'DRIVER',
      dateOfJoining: '2018-06-23',
      basicPay: 2119.23,
      transportAllowance: 200.00,
      houseRentAllowance: 635.77,
      mealAllowance: 0
    }
  ]);

  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [payrollData, _setPayrollData] = useState({
    payPeriod: 'August 2024',
    workedDays: 26,
    totalDays: 30
  });

  const [newEmployee, setNewEmployee] = useState({
    id: '',
    name: '',
    nrc: '',
    ssn: '',
    gender: 'Male',
    designation: '',
    dateOfJoining: '',
    basicPay: 0,
    transportAllowance: 0,
    houseRentAllowance: 0,
    mealAllowance: 0
  });

  const calculateDeductions = (basicPay) => {
    const napsa = basicPay * 0.05; // 5% NAPSA
    const nhima = basicPay * 0.01; // 1% NHIMA
    return { napsa, nhima, loan: 0 };
  };

  const calculatePayslip = (employee) => {
    const totalEarnings = employee.basicPay + employee.transportAllowance + 
                         employee.houseRentAllowance + employee.mealAllowance;
    const deductions = calculateDeductions(employee.basicPay);
    const totalDeductions = deductions.napsa + deductions.nhima + deductions.loan;
    const netPay = totalEarnings - totalDeductions;

    return {
      ...employee,
      totalEarnings,
      deductions,
      totalDeductions,
      netPay
    };
  };

  const addEmployee = () => {
    if (newEmployee.name && newEmployee.id) {
      setEmployees([...employees, { ...newEmployee }]);
      setNewEmployee({
        id: '',
        name: '',
        nrc: '',
        ssn: '',
        gender: 'Male',
        designation: '',
        dateOfJoining: '',
        basicPay: 0,
        transportAllowance: 0,
        houseRentAllowance: 0,
        mealAllowance: 0
      });
      setCurrentView('dashboard');
    }
  };

  const deleteEmployee = (id) => {
    setEmployees(employees.filter(emp => emp.id !== id));
  };

  const generatePayslip = (employee) => {
    const payslip = calculatePayslip(employee);
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
    <div className="space-y-8 animate-fade-in">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="stat-card-users">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-xl shadow-md">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-700">Total Employees</p>
              <p className="text-3xl font-bold text-blue-900">{employees.length}</p>
            </div>
          </div>
        </div>
        
        <div className="stat-card-payroll">
          <div className="flex items-center">
            <div className="p-3 bg-green-500 rounded-xl shadow-md">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-700">Total Monthly Payroll</p>
              <p className="text-2xl lg:text-3xl font-bold text-green-900">
                ZMW {employees.reduce((sum, emp) => sum + calculatePayslip(emp).netPay, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="stat-card-period sm:col-span-2 lg:col-span-1">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500 rounded-xl shadow-md">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-700">Pay Period</p>
              <p className="text-3xl font-bold text-purple-900">{payrollData.payPeriod}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Section */}
      <div className="card-gradient">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Employee Management</h2>
              <p className="text-sm text-gray-600 mt-1">Manage your team and generate payslips</p>
            </div>
            <button
              onClick={() => setCurrentView('addEmployee')}
              className="btn-primary flex items-center gap-2 justify-center"
            >
              <Plus className="h-5 w-5" />
              Add Employee
            </button>
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Basic Pay</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Net Pay</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {employees.map((employee, index) => {
                const payslip = calculatePayslip(employee);
                return (
                  <tr key={employee.id} className={`hover:bg-secondary-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-secondary-25'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-secondary-900">{employee.name}</div>
                        <div className="text-sm text-secondary-500">{employee.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                        {employee.designation}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">ZMW {employee.basicPay.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-success-600">ZMW {payslip.netPay.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generatePayslip(employee)}
                          className="text-primary-600 hover:text-primary-700 p-2 hover:bg-primary-50 rounded-lg transition-all duration-200 flex items-center gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="hidden xl:inline">Payslip</span>
                        </button>
                        <button
                          onClick={() => deleteEmployee(employee.id)}
                          className="text-danger-600 hover:text-danger-700 p-2 hover:bg-danger-50 rounded-lg transition-all duration-200 flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden xl:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-secondary-100">
          {employees.map((employee) => {
            const payslip = calculatePayslip(employee);
            return (
              <div key={employee.id} className="p-6 hover:bg-secondary-50 transition-colors duration-150">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900">{employee.name}</h3>
                    <p className="text-sm text-secondary-500">{employee.id}</p>
                    <span className="inline-flex px-3 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full mt-2">
                      {employee.designation}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium text-secondary-500 uppercase tracking-wider">Basic Pay</p>
                    <p className="text-lg font-semibold text-secondary-900 mt-1">ZMW {employee.basicPay.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-secondary-500 uppercase tracking-wider">Net Pay</p>
                    <p className="text-lg font-bold text-success-600 mt-1">ZMW {payslip.netPay.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => generatePayslip(employee)}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-primary-700 hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View Payslip
                  </button>
                  <button
                    onClick={() => deleteEmployee(employee.id)}
                    className="btn-danger flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {employees.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No employees found</h3>
            <p className="text-secondary-500 mb-6">Get started by adding your first employee to the system.</p>
            <button
              onClick={() => setCurrentView('addEmployee')}
              className="btn-primary"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Employee
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderAddEmployee = () => (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="card p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-secondary-900">Add New Employee</h2>
          <p className="text-secondary-600 mt-2">Fill in the employee details to add them to your payroll system.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Employee ID *</label>
            <input
              type="text"
              value={newEmployee.id}
              onChange={(e) => setNewEmployee({...newEmployee, id: e.target.value})}
              className="input-modern"
              placeholder="e.g., EMP001"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Full Name *</label>
            <input
              type="text"
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
              className="input-modern"
              placeholder="Enter full name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">NRC</label>
            <input
              type="text"
              value={newEmployee.nrc}
              onChange={(e) => setNewEmployee({...newEmployee, nrc: e.target.value})}
              className="input-modern"
              placeholder="National Registration Card"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">SSN</label>
            <input
              type="text"
              value={newEmployee.ssn}
              onChange={(e) => setNewEmployee({...newEmployee, ssn: e.target.value})}
              className="input-modern"
              placeholder="Social Security Number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Gender</label>
            <select
              value={newEmployee.gender}
              onChange={(e) => setNewEmployee({...newEmployee, gender: e.target.value})}
              className="input-modern"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Designation *</label>
            <input
              type="text"
              value={newEmployee.designation}
              onChange={(e) => setNewEmployee({...newEmployee, designation: e.target.value})}
              className="input-modern"
              placeholder="Job title"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Date of Joining</label>
            <input
              type="date"
              value={newEmployee.dateOfJoining}
              onChange={(e) => setNewEmployee({...newEmployee, dateOfJoining: e.target.value})}
              className="input-modern"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Basic Pay (ZMW) *</label>
            <input
              type="number"
              step="0.01"
              value={newEmployee.basicPay}
              onChange={(e) => setNewEmployee({...newEmployee, basicPay: parseFloat(e.target.value) || 0})}
              className="input-modern"
              placeholder="0.00"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Transport Allowance (ZMW)</label>
            <input
              type="number"
              step="0.01"
              value={newEmployee.transportAllowance}
              onChange={(e) => setNewEmployee({...newEmployee, transportAllowance: parseFloat(e.target.value) || 0})}
              className="input-modern"
              placeholder="0.00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">House Rent Allowance (ZMW)</label>
            <input
              type="number"
              step="0.01"
              value={newEmployee.houseRentAllowance}
              onChange={(e) => setNewEmployee({...newEmployee, houseRentAllowance: parseFloat(e.target.value) || 0})}
              className="input-modern"
              placeholder="0.00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Meal Allowance (ZMW)</label>
            <input
              type="number"
              step="0.01"
              value={newEmployee.mealAllowance}
              onChange={(e) => setNewEmployee({...newEmployee, mealAllowance: parseFloat(e.target.value) || 0})}
              className="input-modern"
              placeholder="0.00"
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-secondary-200">
          <button
            onClick={addEmployee}
            className="btn-primary flex-1 sm:flex-none"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Employee
          </button>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="btn-secondary flex-1 sm:flex-none"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Payroll Management</h1>
                  <p className="text-sm text-gray-500 hidden sm:block">Modern HR Solution</p>
                </div>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  currentView === 'dashboard' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('addEmployee')}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  currentView === 'addEmployee' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Add Employee
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-600" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 animate-slide-down">
              <nav className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-xl font-medium text-left transition-all duration-200 ${
                    currentView === 'dashboard' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setCurrentView('addEmployee');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-xl font-medium text-left transition-all duration-200 ${
                    currentView === 'addEmployee' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Add Employee
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'addEmployee' && renderAddEmployee()}
        {currentView === 'payslip' && renderPayslip()}
      </div>
    </div>
  );
};

export default PayrollGenerator;