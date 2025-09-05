import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Download, Calculator, Users, FileText } from 'lucide-react';

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
  const [payrollData, setPayrollData] = useState({
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Employees</p>
              <p className="text-2xl font-bold text-blue-900">{employees.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center">
            <Calculator className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Total Monthly Payroll</p>
              <p className="text-2xl font-bold text-green-900">
                ZMW {employees.reduce((sum, emp) => sum + calculatePayslip(emp).netPay, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Pay Period</p>
              <p className="text-2xl font-bold text-purple-900">{payrollData.payPeriod}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Employee List</h2>
            <button
              onClick={() => setCurrentView('addEmployee')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Pay</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => {
                const payslip = calculatePayslip(employee);
                return (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.designation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">ZMW {employee.basicPay.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">ZMW {payslip.netPay.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => generatePayslip(employee)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        Payslip
                      </button>
                      <button
                        onClick={() => deleteEmployee(employee.id)}
                        className="text-red-600 hover:text-red-900 flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
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
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Add New Employee</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
          <input
            type="text"
            value={newEmployee.id}
            onChange={(e) => setNewEmployee({...newEmployee, id: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., EMP001"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={newEmployee.name}
            onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter full name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NRC</label>
          <input
            type="text"
            value={newEmployee.nrc}
            onChange={(e) => setNewEmployee({...newEmployee, nrc: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="National Registration Card"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SSN</label>
          <input
            type="text"
            value={newEmployee.ssn}
            onChange={(e) => setNewEmployee({...newEmployee, ssn: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Social Security Number"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select
            value={newEmployee.gender}
            onChange={(e) => setNewEmployee({...newEmployee, gender: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
          <input
            type="text"
            value={newEmployee.designation}
            onChange={(e) => setNewEmployee({...newEmployee, designation: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Job title"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
          <input
            type="date"
            value={newEmployee.dateOfJoining}
            onChange={(e) => setNewEmployee({...newEmployee, dateOfJoining: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Basic Pay (ZMW)</label>
          <input
            type="number"
            step="0.01"
            value={newEmployee.basicPay}
            onChange={(e) => setNewEmployee({...newEmployee, basicPay: parseFloat(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transport Allowance (ZMW)</label>
          <input
            type="number"
            step="0.01"
            value={newEmployee.transportAllowance}
            onChange={(e) => setNewEmployee({...newEmployee, transportAllowance: parseFloat(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">House Rent Allowance (ZMW)</label>
          <input
            type="number"
            step="0.01"
            value={newEmployee.houseRentAllowance}
            onChange={(e) => setNewEmployee({...newEmployee, houseRentAllowance: parseFloat(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meal Allowance (ZMW)</label>
          <input
            type="number"
            step="0.01"
            value={newEmployee.mealAllowance}
            onChange={(e) => setNewEmployee({...newEmployee, mealAllowance: parseFloat(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>
      </div>
      
      <div className="flex gap-4 mt-6">
        <button
          onClick={addEmployee}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Employee
        </button>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderPayslip = () => {
    if (!selectedEmployee) return null;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Print Payslip
          </button>
        </div>

        <div className="bg-white p-8 shadow-lg border" id="payslip">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold">Payslip</h1>
            <h2 className="text-lg font-semibold">SPF & CM ENTERPRISES LIMITED</h2>
            <p className="text-sm">2670 Town Area, Senanga Rd.</p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <p><span className="font-medium">Employee Number:</span> {selectedEmployee.id}</p>
              <p><span className="font-medium">Date of Joining:</span> {selectedEmployee.dateOfJoining}</p>
              <p><span className="font-medium">Pay Period:</span> {payrollData.payPeriod}</p>
              <p><span className="font-medium">Worked Days:</span> {payrollData.workedDays}</p>
            </div>
            <div>
              <p><span className="font-medium">Employee Name:</span> {selectedEmployee.name}</p>
              <p><span className="font-medium">Gender:</span> {selectedEmployee.gender}</p>
              <p><span className="font-medium">NRC:</span> {selectedEmployee.nrc}</p>
              <p><span className="font-medium">SSN:</span> {selectedEmployee.ssn}</p>
            </div>
          </div>

          <p className="mb-4"><span className="font-medium">Designation:</span> {selectedEmployee.designation}</p>

          <table className="w-full border border-black mb-6">
            <thead>
              <tr className="border-b border-black">
                <th className="border-r border-black p-2 text-left">Earnings</th>
                <th className="border-r border-black p-2 text-left">Amount</th>
                <th className="border-r border-black p-2 text-left">Deductions</th>
                <th className="p-2 text-left">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black">
                <td className="border-r border-black p-2">Basic</td>
                <td className="border-r border-black p-2">ZMW {selectedEmployee.basicPay.toFixed(2)}</td>
                <td className="border-r border-black p-2">NAPSA</td>
                <td className="p-2">ZMW {selectedEmployee.deductions.napsa.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-2">Transport Allowance</td>
                <td className="border-r border-black p-2">ZMW {selectedEmployee.transportAllowance.toFixed(2)}</td>
                <td className="border-r border-black p-2">NHIMA</td>
                <td className="p-2">ZMW {selectedEmployee.deductions.nhima.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-2">House Rent Allowance</td>
                <td className="border-r border-black p-2">ZMW {selectedEmployee.houseRentAllowance.toFixed(2)}</td>
                <td className="border-r border-black p-2">Loan</td>
                <td className="p-2">ZMW {selectedEmployee.deductions.loan.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-2">Meal Allowance</td>
                <td className="border-r border-black p-2">ZMW {selectedEmployee.mealAllowance > 0 ? selectedEmployee.mealAllowance.toFixed(2) : '-'}</td>
                <td className="border-r border-black p-2"></td>
                <td className="p-2"></td>
              </tr>
              <tr className="border-b border-black font-bold">
                <td className="border-r border-black p-2">Total Earnings</td>
                <td className="border-r border-black p-2">ZMW {selectedEmployee.totalEarnings.toFixed(2)}</td>
                <td className="border-r border-black p-2">Total Deductions</td>
                <td className="p-2">ZMW {selectedEmployee.totalDeductions.toFixed(2)}</td>
              </tr>
              <tr className="font-bold">
                <td className="border-r border-black p-2"></td>
                <td className="border-r border-black p-2"></td>
                <td className="border-r border-black p-2">Net Pay</td>
                <td className="p-2">ZMW {selectedEmployee.netPay.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div className="text-center mb-6">
            <p className="text-lg font-bold">ZMW {selectedEmployee.netPay.toFixed(2)}</p>
            <p className="text-sm italic">{numberToWords(selectedEmployee.netPay)}</p>
          </div>

          <div className="flex justify-between mb-6">
            <div className="text-center">
              <div className="border-b border-black w-48 mb-2"></div>
              <p>Employer Signature</p>
            </div>
            <div className="text-center">
              <div className="border-b border-black w-48 mb-2"></div>
              <p>Employee Signature</p>
            </div>
          </div>

          <p className="text-center text-sm">This is system generated payslip</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Payroll Management System</h1>
            <nav className="flex space-x-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'dashboard' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'addEmployee' && renderAddEmployee()}
        {currentView === 'payslip' && renderPayslip()}
      </div>
    </div>
  );
};

export default PayrollGenerator;