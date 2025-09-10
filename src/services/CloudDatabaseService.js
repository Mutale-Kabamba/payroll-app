// CloudDatabaseService.js - Firebase Firestore based database for cross-device sync
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  deleteDoc, 
  addDoc,
  updateDoc,
  query,
  // where, // Commented out unused import
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebaseConfig';

class CloudDatabaseService {
  constructor() {
    this.collections = {
      employees: 'employees',
      payslips: 'payslips',
      settings: 'settings',
      companies: 'companies'
    };
    this.companyId = 'spf-cm-enterprises'; // Your company ID
  }

  // Get company-specific document path
  getCompanyDocPath(collection, docId = null) {
    const basePath = `companies/${this.companyId}/${collection}`;
    return docId ? `${basePath}/${docId}` : basePath;
  }

  // EMPLOYEE MANAGEMENT
  async getEmployees() {
    try {
      const employeesRef = collection(db, this.getCompanyDocPath('employees'));
      const snapshot = await getDocs(employeesRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting employees:', error);
      // Fallback to localStorage if Firebase fails
      return this.getLocalEmployees();
    }
  }

  async addEmployee(employee) {
    try {
      const employeeRef = doc(db, this.getCompanyDocPath('employees'), employee.id);
      await setDoc(employeeRef, {
        ...employee,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Also save to localStorage as backup
      this.saveLocalEmployee(employee);
      return true;
    } catch (error) {
      console.error('Error adding employee:', error);
      // Fallback to localStorage
      return this.saveLocalEmployee(employee);
    }
  }

  async updateEmployee(employeeId, updatedEmployee) {
    try {
      const employeeRef = doc(db, this.getCompanyDocPath('employees'), employeeId);
      await updateDoc(employeeRef, {
        ...updatedEmployee,
        updatedAt: serverTimestamp()
      });
      
      // Also update localStorage
      this.updateLocalEmployee(employeeId, updatedEmployee);
      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      return this.updateLocalEmployee(employeeId, updatedEmployee);
    }
  }

  async deleteEmployee(employeeId) {
    try {
      const employeeRef = doc(db, this.getCompanyDocPath('employees'), employeeId);
      await deleteDoc(employeeRef);
      
      // Also delete from localStorage
      this.deleteLocalEmployee(employeeId);
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      return this.deleteLocalEmployee(employeeId);
    }
  }

  // PAYSLIP MANAGEMENT
  async getPayslips() {
    try {
      const payslipsRef = collection(db, this.getCompanyDocPath('payslips'));
      const q = query(payslipsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting payslips:', error);
      return this.getLocalPayslips();
    }
  }

  async addPayslip(payslip) {
    try {
      const payslipsRef = collection(db, this.getCompanyDocPath('payslips'));
      const docRef = await addDoc(payslipsRef, {
        ...payslip,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Also save to localStorage
      this.saveLocalPayslip({ ...payslip, id: docRef.id });
      return docRef.id;
    } catch (error) {
      console.error('Error adding payslip:', error);
      return this.saveLocalPayslip(payslip);
    }
  }

  async deletePayslip(payslipId) {
    try {
      const payslipRef = doc(db, this.getCompanyDocPath('payslips'), payslipId);
      await deleteDoc(payslipRef);
      
      // Also delete from localStorage
      this.deleteLocalPayslip(payslipId);
      return true;
    } catch (error) {
      console.error('Error deleting payslip:', error);
      return this.deleteLocalPayslip(payslipId);
    }
  }

  // SETTINGS MANAGEMENT
  async getPayrollSettings() {
    try {
      const settingsRef = doc(db, this.getCompanyDocPath('settings'), 'payroll');
      const snapshot = await getDoc(settingsRef);
      
      if (snapshot.exists()) {
        return snapshot.data();
      } else {
        // Return null if no settings exist - don't auto-create
        console.log('No payroll settings found in Firebase');
        return null;
      }
    } catch (error) {
      console.error('Error getting payroll settings:', error);
      return this.getLocalPayrollSettings();
    }
  }

  async setPayrollSettings(settings) {
    try {
      const settingsRef = doc(db, this.getCompanyDocPath('settings'), 'payroll');
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp()
      });
      
      // Also save to localStorage
      this.saveLocalPayrollSettings(settings);
      return true;
    } catch (error) {
      console.error('Error saving payroll settings:', error);
      return this.saveLocalPayrollSettings(settings);
    }
  }

  // REAL-TIME LISTENERS
  subscribeToEmployees(callback) {
    try {
      const employeesRef = collection(db, this.getCompanyDocPath('employees'));
      return onSnapshot(employeesRef, (snapshot) => {
        const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(employees);
      });
    } catch (error) {
      console.error('Error subscribing to employees:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  subscribeToPayslips(callback) {
    try {
      const payslipsRef = collection(db, this.getCompanyDocPath('payslips'));
      const q = query(payslipsRef, orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const payslips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(payslips);
      });
    } catch (error) {
      console.error('Error subscribing to payslips:', error);
      return () => {};
    }
  }

  // FALLBACK LOCALSTORAGE METHODS
  getLocalEmployees() {
    const stored = localStorage.getItem('payroll_app_employees');
    return stored ? JSON.parse(stored) : [];
  }

  saveLocalEmployee(employee) {
    const employees = this.getLocalEmployees();
    const existingIndex = employees.findIndex(emp => emp.id === employee.id);
    
    if (existingIndex >= 0) {
      employees[existingIndex] = employee;
    } else {
      employees.push(employee);
    }
    
    localStorage.setItem('payroll_app_employees', JSON.stringify(employees));
    return true;
  }

  updateLocalEmployee(employeeId, updatedEmployee) {
    const employees = this.getLocalEmployees();
    const index = employees.findIndex(emp => emp.id === employeeId);
    
    if (index >= 0) {
      employees[index] = { ...employees[index], ...updatedEmployee };
      localStorage.setItem('payroll_app_employees', JSON.stringify(employees));
      return true;
    }
    return false;
  }

  deleteLocalEmployee(employeeId) {
    const employees = this.getLocalEmployees();
    const filtered = employees.filter(emp => emp.id !== employeeId);
    localStorage.setItem('payroll_app_employees', JSON.stringify(filtered));
    return true;
  }

  getLocalPayslips() {
    const stored = localStorage.getItem('payroll_app_payslips');
    return stored ? JSON.parse(stored) : [];
  }

  saveLocalPayslip(payslip) {
    const payslips = this.getLocalPayslips();
    payslips.push(payslip);
    localStorage.setItem('payroll_app_payslips', JSON.stringify(payslips));
    return true;
  }

  deleteLocalPayslip(payslipId) {
    const payslips = this.getLocalPayslips();
    const filtered = payslips.filter(p => p.id !== payslipId);
    localStorage.setItem('payroll_app_payslips', JSON.stringify(filtered));
    return true;
  }

  getLocalPayrollSettings() {
    const stored = localStorage.getItem('payroll_app_settings');
    return stored ? JSON.parse(stored) : {
      payPeriod: 'August 2024',
      workedDays: 26,
      totalDays: 30
    };
  }

  saveLocalPayrollSettings(settings) {
    localStorage.setItem('payroll_app_settings', JSON.stringify(settings));
    return true;
  }

  // SYNC METHODS
  async syncLocalToCloud() {
    try {
      // Sync employees
      const localEmployees = this.getLocalEmployees();
      for (const employee of localEmployees) {
        await this.addEmployee(employee);
      }

      // Sync payslips
      const localPayslips = this.getLocalPayslips();
      for (const payslip of localPayslips) {
        await this.addPayslip(payslip);
      }

      // Sync settings
      const localSettings = this.getLocalPayrollSettings();
      await this.setPayrollSettings(localSettings);

      console.log('Local data synced to cloud successfully');
      return true;
    } catch (error) {
      console.error('Error syncing local data to cloud:', error);
      return false;
    }
  }

  async syncCloudToLocal() {
    try {
      // Sync employees
      const cloudEmployees = await this.getEmployees();
      localStorage.setItem('payroll_app_employees', JSON.stringify(cloudEmployees));

      // Sync payslips
      const cloudPayslips = await this.getPayslips();
      localStorage.setItem('payroll_app_payslips', JSON.stringify(cloudPayslips));

      // Sync settings
      const cloudSettings = await this.getPayrollSettings();
      localStorage.setItem('payroll_app_settings', JSON.stringify(cloudSettings));

      console.log('Cloud data synced to local successfully');
      return true;
    } catch (error) {
      console.error('Error syncing cloud data to local:', error);
      return false;
    }
  }

  // Check connection status
  async isOnline() {
    try {
      // Try to read a simple document to check connection
      const testRef = doc(db, 'test', 'connection');
      await getDoc(testRef);
      return true;
    } catch {
      // Error handled silently
      return false;
    }
  }

  // EXPORT/IMPORT for backup compatibility
  async exportAllData() {
    try {
      const employees = await this.getEmployees();
      const payslips = await this.getPayslips();
      const settings = await this.getPayrollSettings();
      
      return {
        employees,
        payslips,
        settings,
        exportDate: new Date().toISOString(),
        version: '2.0'
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async importAllData(data) {
    try {
      // Import employees
      if (data.employees) {
        for (const employee of data.employees) {
          await this.addEmployee(employee);
        }
      }

      // Import payslips
      if (data.payslips) {
        for (const payslip of data.payslips) {
          await this.addPayslip(payslip);
        }
      }

      // Import settings
      if (data.settings) {
        await this.setPayrollSettings(data.settings);
      }

      console.log('Data imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const cloudDatabaseService = new CloudDatabaseService();
export default cloudDatabaseService;
