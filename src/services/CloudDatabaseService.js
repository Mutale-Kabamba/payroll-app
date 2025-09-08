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
  where,
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

  // Test Firebase connection and permissions
  async testFirebaseConnection() {
    try {
      console.log('Testing Firebase connection and permissions...');
      const testDoc = doc(db, this.getCompanyDocPath('test'), 'connection-test');
      
      // Try to write a test document
      await setDoc(testDoc, { 
        test: true, 
        timestamp: new Date().toISOString(),
        operation: 'connection-test'
      });
      console.log('✓ Firebase write permission verified');
      
      // Try to read the test document
      const readSnapshot = await getDoc(testDoc);
      if (readSnapshot.exists()) {
        console.log('✓ Firebase read permission verified');
      } else {
        throw new Error('Failed to read test document');
      }
      
      // Try to delete the test document
      await deleteDoc(testDoc);
      console.log('✓ Firebase delete permission verified');
      
      // Verify deletion
      const verifySnapshot = await getDoc(testDoc);
      if (!verifySnapshot.exists()) {
        console.log('✓ Firebase delete operation verified');
      } else {
        throw new Error('Test document still exists after deletion');
      }
      
      console.log('✓ All Firebase operations working correctly');
      return true;
    } catch (error) {
      console.error('❌ Firebase connection/permission test failed:', error);
      return false;
    }
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
      console.log(`Attempting to delete employee from Firebase: ${employeeId}`);
      const docPath = this.getCompanyDocPath('employees');
      console.log(`Employee collection path: ${docPath}`);
      const employeeRef = doc(db, docPath, employeeId);
      console.log(`Full employee document path: ${docPath}/${employeeId}`);
      
      // Verify document exists before deletion
      const docSnapshot = await getDoc(employeeRef);
      if (!docSnapshot.exists()) {
        console.log(`Employee ${employeeId} does not exist in Firebase, skipping deletion`);
        this.deleteLocalEmployee(employeeId);
        return true;
      }
      
      console.log(`Employee ${employeeId} exists in Firebase, proceeding with deletion`);
      await deleteDoc(employeeRef);
      console.log(`Successfully deleted employee from Firebase: ${employeeId}`);
      
      // Verify deletion by checking if document still exists
      const verifySnapshot = await getDoc(employeeRef);
      if (verifySnapshot.exists()) {
        throw new Error(`Employee ${employeeId} still exists after deletion attempt`);
      }
      console.log(`Verified: Employee ${employeeId} successfully removed from Firebase`);
      
      // Also delete from localStorage
      this.deleteLocalEmployee(employeeId);
      return true;
    } catch (error) {
      console.error('Error deleting employee from Firebase:', error);
      console.error('Falling back to local delete only');
      return this.deleteLocalEmployee(employeeId);
    }
  }

  // Batch delete employees
  async deleteEmployeesBatch(employeeIds) {
    const results = [];
    console.log(`Starting batch deletion of ${employeeIds.length} employees`);
    
    for (const employeeId of employeeIds) {
      try {
        const result = await this.deleteEmployee(employeeId);
        results.push({ id: employeeId, success: result });
      } catch (error) {
        console.error(`Failed to delete employee ${employeeId}:`, error);
        results.push({ id: employeeId, success: false, error: error.message });
      }
    }
    
    console.log(`Batch deletion completed. Results:`, results);
    return results;
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
      console.log(`Attempting to delete payslip from Firebase: ${payslipId}`);
      const docPath = this.getCompanyDocPath('payslips');
      console.log(`Payslip collection path: ${docPath}`);
      const payslipRef = doc(db, docPath, payslipId);
      console.log(`Full payslip document path: ${docPath}/${payslipId}`);
      
      // Verify document exists before deletion
      const docSnapshot = await getDoc(payslipRef);
      if (!docSnapshot.exists()) {
        console.log(`Payslip ${payslipId} does not exist in Firebase, skipping deletion`);
        this.deleteLocalPayslip(payslipId);
        return true;
      }
      
      console.log(`Payslip ${payslipId} exists in Firebase, proceeding with deletion`);
      await deleteDoc(payslipRef);
      console.log(`Successfully deleted payslip from Firebase: ${payslipId}`);
      
      // Verify deletion by checking if document still exists
      const verifySnapshot = await getDoc(payslipRef);
      if (verifySnapshot.exists()) {
        throw new Error(`Payslip ${payslipId} still exists after deletion attempt`);
      }
      console.log(`Verified: Payslip ${payslipId} successfully removed from Firebase`);
      
      // Also delete from localStorage
      this.deleteLocalPayslip(payslipId);
      return true;
    } catch (error) {
      console.error('Error deleting payslip from Firebase:', error);
      console.error('Falling back to local delete only');
      return this.deleteLocalPayslip(payslipId);
    }
  }

  // Batch delete payslips
  async deletePayslipsBatch(payslipIds) {
    const results = [];
    console.log(`Starting batch deletion of ${payslipIds.length} payslips`);
    
    for (const payslipId of payslipIds) {
      try {
        const result = await this.deletePayslip(payslipId);
        results.push({ id: payslipId, success: result });
      } catch (error) {
        console.error(`Failed to delete payslip ${payslipId}:`, error);
        results.push({ id: payslipId, success: false, error: error.message });
      }
    }
    
    console.log(`Batch deletion completed. Results:`, results);
    return results;
  }

  // SETTINGS MANAGEMENT
  async getPayrollSettings() {
    try {
      const settingsRef = doc(db, this.getCompanyDocPath('settings'), 'payroll');
      const snapshot = await getDoc(settingsRef);
      
      if (snapshot.exists()) {
        return snapshot.data();
      } else {
        // Return default settings
        const defaultSettings = {
          payPeriod: 'August 2024',
          workedDays: 26,
          totalDays: 30
        };
        await this.setPayrollSettings(defaultSettings);
        return defaultSettings;
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
      console.log('Starting sync from local to cloud...');
      
      // Sync employees
      const localEmployees = this.getLocalEmployees();
      console.log(`Syncing ${localEmployees.length} employees to cloud`);
      for (const employee of localEmployees) {
        try {
          await this.addEmployee(employee);
        } catch (error) {
          console.log(`Failed to sync employee ${employee.id}:`, error.message);
        }
      }

      // Sync payslips - but first check what's already in cloud to avoid duplicates
      const localPayslips = this.getLocalPayslips();
      console.log(`Syncing ${localPayslips.length} payslips to cloud`);
      
      let cloudPayslips = [];
      try {
        cloudPayslips = await this.getPayslips();
      } catch (error) {
        console.log('Could not fetch cloud payslips for comparison:', error.message);
      }
      
      const cloudPayslipIds = new Set(cloudPayslips.map(p => p.id));
      
      for (const payslip of localPayslips) {
        try {
          if (!cloudPayslipIds.has(payslip.id)) {
            await this.addPayslip(payslip);
            console.log(`Synced payslip ${payslip.id} to cloud`);
          } else {
            console.log(`Payslip ${payslip.id} already exists in cloud, skipping`);
          }
        } catch (error) {
          console.log(`Failed to sync payslip ${payslip.id}:`, error.message);
        }
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
    } catch (error) {
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
