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
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="space-y-4">
        <div className="stat-card-users">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
          </div>
        </div>
        
        <div className="stat-card-payroll">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded">
              <Calculator className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Monthly Payroll</p>
              <p className="text-xl font-bold text-gray-900">
                ZMW {employees.reduce((sum, emp) => sum + calculatePayslip(emp).netPay, 0).toFixed(2)}
              </p>
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

      {/* Employee Section */}
      <div className="card-gradient">
        <div className="px-6 py-4 border-b border-gray-300">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Employee List</h2>
            <button
              onClick={() => setCurrentView('addEmployee')}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              Add Employee
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
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">Basic Pay</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">Net Pay</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {employees.map((employee, index) => {
                const payslip = calculatePayslip(employee);
                return (
                  <tr key={employee.id} className={`${index !== employees.length - 1 ? 'border-b border-gray-300' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 uppercase">{employee.name}</div>
                        <div className="text-sm text-gray-600">{employee.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 uppercase">{employee.designation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">ZMW {employee.basicPay.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">ZMW {payslip.netPay.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generatePayslip(employee)}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded border border-gray-300 flex items-center gap-1 hover:bg-gray-200 transition-colors text-xs"
                        >
                          <FileText className="h-3 w-3" />
                          Payslip
                        </button>
                        <button
                          onClick={() => deleteEmployee(employee.id)}
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAddEmployee = () => (
    <div className="max-w-2xl mx-auto bg-white rounded border border-gray-300 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Add New Employee</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
          <input
            type="text"
            value={newEmployee.id}
            onChange={(e) => setNewEmployee({...newEmployee, id: e.target.value})}
            className="input-modern"
            placeholder="e.g., EMP001"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={newEmployee.name}
            onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
            className="input-modern"
            placeholder="Enter full name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
          <input
            type="text"
            value={newEmployee.designation}
            onChange={(e) => setNewEmployee({...newEmployee, designation: e.target.value})}
            className="input-modern"
            placeholder="Job title"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Basic Pay (ZMW)</label>
          <input
            type="number"
            step="0.01"
            value={newEmployee.basicPay}
            onChange={(e) => setNewEmployee({...newEmployee, basicPay: parseFloat(e.target.value) || 0})}
            className="input-modern"
            placeholder="0.00"
          />
        </div>
      </div>
      
      <div className="flex space-x-4 mt-6">
        <button
          onClick={addEmployee}
          className="btn-primary"
        >
          Add Employee
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
            </nav>
          </div>
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