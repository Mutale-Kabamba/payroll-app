// DatabaseService.js - Local Storage based database for payroll app
class DatabaseService {
  constructor() {
    this.storagePrefix = 'payroll_app_';
    this.initializeDatabase();
  }

  // Initialize database with empty state - no auto data creation
  initializeDatabase() {
    // No automatic data initialization
    // The system will only show data from Firebase
    console.log('Database service initialized - no default data will be created');
  }

  // Helper method to get storage key
  getStorageKey(table) {
    return `${this.storagePrefix}${table}`;
  }

  // Helper method to get data from localStorage
  getData(table) {
    try {
      const data = localStorage.getItem(this.getStorageKey(table));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error getting ${table} data:`, error);
      return [];
    }
  }

  // Helper method to set data in localStorage
  setData(table, data) {
    try {
      localStorage.setItem(this.getStorageKey(table), JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error setting ${table} data:`, error);
      return false;
    }
  }

  // Employee CRUD operations
  getEmployees() {
    return this.getData('employees');
  }

  setEmployees(employees) {
    return this.setData('employees', employees);
  }

  addEmployee(employee) {
    const employees = this.getEmployees();
    // Check if employee ID already exists
    if (employees.find(emp => emp.id === employee.id)) {
      throw new Error(`Employee with ID ${employee.id} already exists`);
    }
    employees.push(employee);
    return this.setEmployees(employees);
  }

  updateEmployee(employeeId, updatedEmployee) {
    const employees = this.getEmployees();
    const index = employees.findIndex(emp => emp.id === employeeId);
    if (index === -1) {
      throw new Error(`Employee with ID ${employeeId} not found`);
    }
    employees[index] = { ...employees[index], ...updatedEmployee };
    return this.setEmployees(employees);
  }

  deleteEmployee(employeeId) {
    const employees = this.getEmployees();
    const filteredEmployees = employees.filter(emp => emp.id !== employeeId);
    if (filteredEmployees.length === employees.length) {
      throw new Error(`Employee with ID ${employeeId} not found`);
    }
    return this.setEmployees(filteredEmployees);
  }

  getEmployeeById(employeeId) {
    const employees = this.getEmployees();
    return employees.find(emp => emp.id === employeeId) || null;
  }

  // Payslip CRUD operations
  getPayslips() {
    return this.getData('payslips');
  }

  setPayslips(payslips) {
    return this.setData('payslips', payslips);
  }

  addPayslip(payslip) {
    const payslips = this.getPayslips();
    // Add timestamp and preserve existing ID if provided
    const payslipWithMeta = {
      ...payslip,
      id: payslip.id || this.generateId(),
      createdAt: payslip.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    payslips.push(payslipWithMeta);
    return this.setPayslips(payslips);
  }

  updatePayslip(payslipId, updatedPayslip) {
    const payslips = this.getPayslips();
    const index = payslips.findIndex(payslip => payslip.id === payslipId);
    if (index === -1) {
      throw new Error(`Payslip with ID ${payslipId} not found`);
    }
    payslips[index] = { 
      ...payslips[index], 
      ...updatedPayslip, 
      updatedAt: new Date().toISOString() 
    };
    return this.setPayslips(payslips);
  }

  deletePayslip(payslipId) {
    const payslips = this.getPayslips();
    const filteredPayslips = payslips.filter(payslip => payslip.id !== payslipId);
    if (filteredPayslips.length === payslips.length) {
      throw new Error(`Payslip with ID ${payslipId} not found`);
    }
    return this.setPayslips(filteredPayslips);
  }

  getPayslipById(payslipId) {
    const payslips = this.getPayslips();
    return payslips.find(payslip => payslip.id === payslipId) || null;
  }

  // Get payslips by employee ID
  getPayslipsByEmployee(employeeId) {
    const payslips = this.getPayslips();
    return payslips.filter(payslip => payslip.employeeId === employeeId);
  }

  // Get payslips by pay period
  getPayslipsByPeriod(payPeriod) {
    const payslips = this.getPayslips();
    return payslips.filter(payslip => payslip.payPeriod === payPeriod);
  }

  // Payroll settings CRUD operations
  getPayrollSettings() {
    const defaultSettings = {
      payPeriod: 'August 2024',
      workedDays: 26,
      totalDays: 30,
      napsaRate: 0.05,
      nhimaRate: 0.01,
      houseRentRate: 0.30
    };
    const settings = this.getData('payroll_settings');
    return settings.length > 0 ? settings[0] : defaultSettings;
  }

  setPayrollSettings(settings) {
    return this.setData('payroll_settings', [settings]);
  }

  // Utility methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Export all data for backup
  exportAllData() {
    return {
      employees: this.getEmployees(),
      payslips: this.getPayslips(),
      payrollSettings: this.getPayrollSettings(),
      exportedAt: new Date().toISOString()
    };
  }

  // Import data from backup
  importAllData(data) {
    try {
      if (data.employees) {
        this.setEmployees(data.employees);
      }
      if (data.payslips) {
        this.setPayslips(data.payslips);
      }
      if (data.payrollSettings) {
        this.setPayrollSettings(data.payrollSettings);
      }
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Clear all data (use with caution)
  clearAllData() {
    localStorage.removeItem(this.getStorageKey('employees'));
    localStorage.removeItem(this.getStorageKey('payslips'));
    localStorage.removeItem(this.getStorageKey('payroll_settings'));
  }

  // Get storage usage information
  getStorageInfo() {
    const employees = this.getEmployees();
    const payslips = this.getPayslips();
    
    return {
      employeeCount: employees.length,
      payslipCount: payslips.length,
      storageUsed: new Blob([JSON.stringify(this.exportAllData())]).size,
      lastUpdated: new Date().toISOString()
    };
  }

  // Search functionality
  searchEmployees(query) {
    const employees = this.getEmployees();
    const searchTerm = query.toLowerCase();
    
    return employees.filter(employee => 
      employee.name.toLowerCase().includes(searchTerm) ||
      employee.id.toLowerCase().includes(searchTerm) ||
      employee.designation.toLowerCase().includes(searchTerm) ||
      employee.department.toLowerCase().includes(searchTerm)
    );
  }

  searchPayslips(query) {
    const payslips = this.getPayslips();
    const searchTerm = query.toLowerCase();
    
    return payslips.filter(payslip => 
      payslip.name.toLowerCase().includes(searchTerm) ||
      payslip.employeeId.toLowerCase().includes(searchTerm) ||
      payslip.payPeriod.toLowerCase().includes(searchTerm)
    );
  }

  // Analytics methods
  getWageBillAnalytics() {
    const payslips = this.getPayslips();
    
    if (payslips.length === 0) {
      return {
        totalPayslips: 0,
        totalWageBill: 0,
        averageWage: 0,
        totalEarnings: 0,
        totalDeductions: 0,
        byPeriod: {},
        byDepartment: {},
        byDesignation: {}
      };
    }

    let totalWageBill = 0;
    let totalEarnings = 0;
    let totalDeductions = 0;
    const byPeriod = {};
    const byDepartment = {};
    const byDesignation = {};

    payslips.forEach(payslip => {
      const netPay = payslip.netPay || 0;
      const earnings = payslip.totalEarnings || 0;
      const deductions = payslip.totalDeductions || 0;

      totalWageBill += netPay;
      totalEarnings += earnings;
      totalDeductions += deductions;

      // By period
      const period = payslip.payPeriod || 'Unknown';
      byPeriod[period] = (byPeriod[period] || 0) + netPay;

      // By department
      const department = payslip.department || 'Unknown';
      byDepartment[department] = (byDepartment[department] || 0) + netPay;

      // By designation
      const designation = payslip.designation || 'Unknown';
      byDesignation[designation] = (byDesignation[designation] || 0) + netPay;
    });

    return {
      totalPayslips: payslips.length,
      totalWageBill,
      averageWage: totalWageBill / payslips.length,
      totalEarnings,
      totalDeductions,
      byPeriod,
      byDepartment,
      byDesignation
    };
  }
}

// Create and export a singleton instance
const databaseService = new DatabaseService();
export default databaseService;
