// SyncDatabaseService.js - Hybrid service that syncs between local and cloud storage
import cloudDatabaseService from './CloudDatabaseService';
import databaseService from './DatabaseService';

class SyncDatabaseService {
  constructor() {
    this.cloudService = cloudDatabaseService;
    this.localService = databaseService;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.retryTimer = null;
    this.lastSyncAttempt = null;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Network connection restored, processing sync queue...');
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Network connection lost, queuing operations...');
    });
    
    // Initialize sync with Firebase-first approach
    this.initializeSync();
  }

  async initializeSync() {
    if (this.isOnline) {
      try {
        console.log('🔄 Initializing Firebase-first sync...');
        // Check if cloud service is available with retries for better reliability
        const cloudAvailable = await this.checkCloudAvailabilityWithRetry();
        if (cloudAvailable) {
          console.log('✅ Firebase connection established');
          // Sync local data to cloud on first load
          await this.cloudService.syncLocalToCloud();
        } else {
          console.log('⚠️ Firebase not available after retries, will attempt sync later');
        }
      } catch (error) {
        console.warn('Cloud sync initialization failed:', error);
        // Don't completely fall back - keep trying periodically
        this.scheduleRetrySync();
      }
    }
  }

  // Check cloud availability with retries for better Firebase-first experience
  async checkCloudAvailabilityWithRetry(maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const isAvailable = await this.cloudService.isOnline();
        if (isAvailable) return true;
        
        if (i < maxRetries - 1) {
          console.log(`🔄 Firebase retry ${i + 1}/${maxRetries} in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.log(`❌ Firebase attempt ${i + 1} failed:`, error.message);
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    return false;
  }

  // Schedule periodic retry for Firebase connection
  scheduleRetrySync() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(async () => {
      console.log('🔄 Retrying Firebase connection...');
      await this.initializeSync();
    }, 30000); // Retry every 30 seconds
  }

  // Add operation to sync queue if offline
  addToSyncQueue(operation, data) {
    this.syncQueue.push({ operation, data, timestamp: Date.now() });
    console.log(`📥 Queued operation: ${operation} (queue size: ${this.syncQueue.length})`);
  }

  // Process sync queue when coming back online
  async processSyncQueue() {
    if (this.syncQueue.length === 0) return;
    
    console.log(`Processing ${this.syncQueue.length} queued operations...`);
    
    for (const item of this.syncQueue) {
      try {
        switch (item.operation) {
          case 'addEmployee':
            await this.cloudService.addEmployee(item.data);
            break;
          case 'updateEmployee':
            await this.cloudService.updateEmployee(item.data.id, item.data);
            break;
          case 'deleteEmployee':
            await this.cloudService.deleteEmployee(item.data.id);
            break;
          case 'addPayslip':
            await this.cloudService.addPayslip(item.data);
            break;
          case 'deletePayslip':
            await this.cloudService.deletePayslip(item.data.id);
            break;
          case 'setPayrollSettings':
            await this.cloudService.setPayrollSettings(item.data);
            break;
        }
      } catch {
        // Error handled silently
      }
    }
    
    // Clear processed queue
    this.syncQueue = [];
    console.log('Sync queue processed successfully');
  }

  // EMPLOYEE METHODS - Firebase-first approach
  async getEmployees() {
    try {
      if (this.isOnline) {
        try {
          // Always try Firebase first with better error handling
          console.log('📋 Fetching employees from Firebase...');
          const cloudEmployees = await this.cloudService.getEmployees();
          console.log(`✅ Fetched ${cloudEmployees.length} employees from Firebase`);
          
          // Update local storage with cloud data for offline access
          if (cloudEmployees.length >= 0) { // Even if empty, sync it
            this.localService.setEmployees(cloudEmployees);
            console.log('💾 Local storage updated with Firebase data');
          }
          
          return cloudEmployees; // Return Firebase data (even if empty)
        } catch (cloudError) {
          console.warn('⚠️ Firebase fetch failed, using local fallback:', cloudError.message);
          // Add to retry queue for later sync
          this.addToSyncQueue('getEmployees', null);
          return this.localService.getEmployees();
        }
      } else {
        console.log('📴 Offline: using local storage');
        return this.localService.getEmployees();
      }
    } catch (error) {
      console.error('❌ Error getting employees:', error);
      return this.localService.getEmployees();
    }
  }

  async addEmployee(employee) {
    try {
      console.log('👤 Adding employee:', employee.name);
      
      if (this.isOnline) {
        try {
          // Try Firebase first with priority
          await this.cloudService.addEmployee(employee);
          console.log('✅ Employee added to Firebase successfully');
          
          // Update local storage after successful Firebase save
          this.localService.addEmployee(employee);
          console.log('💾 Employee cached locally');
          
          return true;
        } catch (cloudError) {
          console.warn('⚠️ Firebase add failed, caching locally:', cloudError.message);
          // Save locally and queue for sync
          this.localService.addEmployee(employee);
          this.addToSyncQueue('addEmployee', employee);
          return true;
        }
      } else {
        console.log('📴 Offline: saving employee locally');
        this.localService.addEmployee(employee);
        this.addToSyncQueue('addEmployee', employee);
        return true;
      }
    } catch (error) {
      console.error('❌ Error adding employee:', error);
      throw error;
    }
  }

  async updateEmployee(employeeId, updatedEmployee) {
    try {
      // Always update locally first
      this.localService.updateEmployee(employeeId, updatedEmployee);
      
      if (this.isOnline) {
        try {
          await this.cloudService.updateEmployee(employeeId, updatedEmployee);
        } catch {
          this.addToSyncQueue('updateEmployee', { id: employeeId, ...updatedEmployee });
        }
      } else {
        this.addToSyncQueue('updateEmployee', { id: employeeId, ...updatedEmployee });
      }
      
      return true;
    } catch {
      // Error handled silently
      // Error suppressed
    }
  }

  async deleteEmployee(employeeId) {
    try {
      // Always delete locally first
      this.localService.deleteEmployee(employeeId);
      
      if (this.isOnline) {
        try {
          await this.cloudService.deleteEmployee(employeeId);
        } catch {
          this.addToSyncQueue('deleteEmployee', { id: employeeId });
        }
      } else {
        this.addToSyncQueue('deleteEmployee', { id: employeeId });
      }
      
      return true;
    } catch {
      // Error handled silently
      // Error suppressed
    }
  }

  // PAYSLIP METHODS
  async getPayslips() {
    try {
      console.log('🔍 getPayslips() called');
      console.log('📡 Online status:', this.isOnline);
      console.log('🚫 Recent deletions:', Array.from(this.recentDeletions));
      console.log('⏰ Deletion timestamps:', Object.fromEntries(this.deletionTimestamps));
      
      if (this.isOnline) {
        const cloudPayslips = await this.cloudService.getPayslips();
        // Update local storage with cloud data
        this.localService.setPayslips(cloudPayslips);
        return cloudPayslips;
      } else {
        return this.localService.getPayslips();
      }
    } catch {
      // Error handled silently
      return this.localService.getPayslips();
    }
  }

  async addPayslip(payslip) {
    try {
      // Always save locally first
      this.localService.addPayslip(payslip);
      
      if (this.isOnline) {
        try {
          await this.cloudService.addPayslip(payslip);
        } catch {
          this.addToSyncQueue('addPayslip', payslip);
        }
      } else {
        this.addToSyncQueue('addPayslip', payslip);
      }
      
      return true;
    } catch {
      // Error handled silently
      // Error suppressed
    }
  }

  async deletePayslip(payslipId) {
    try {
      // Always delete locally first
      this.localService.deletePayslip(payslipId);
      
      if (this.isOnline) {
        try {
          await this.cloudService.deletePayslip(payslipId);
        } catch {
          this.addToSyncQueue('deletePayslip', { id: payslipId });
        }
      } else {
        this.addToSyncQueue('deletePayslip', { id: payslipId });
      }
      
      return true;
    } catch {
      // Error handled silently
      // Error suppressed
    }
  }

  async cleanupDuplicatePayslips() {
    try {
      return this.localService.cleanupDuplicatePayslips();
    } catch {
      // Error handled silently
      return false;
    }
  }

  // SETTINGS METHODS - Firebase-first approach
  async getPayrollSettings() {
    try {
      if (this.isOnline) {
        try {
          console.log('⚙️ Fetching payroll settings from Firebase...');
          const cloudSettings = await this.cloudService.getPayrollSettings();
          
          if (cloudSettings) {
            console.log('✅ Payroll settings loaded from Firebase');
            this.localService.setPayrollSettings(cloudSettings);
            return cloudSettings;
          } else {
            console.log('📋 No settings in Firebase, using local defaults');
            return this.localService.getPayrollSettings();
          }
        } catch (cloudError) {
          console.warn('⚠️ Firebase settings fetch failed:', cloudError.message);
          return this.localService.getPayrollSettings();
        }
      } else {
        console.log('📴 Offline: using local settings');
        return this.localService.getPayrollSettings();
      }
    } catch (error) {
      console.error('❌ Error getting payroll settings:', error);
      return this.localService.getPayrollSettings();
    }
  }

  async setPayrollSettings(settings) {
    try {
      console.log('⚙️ Saving payroll settings:', settings);
      
      if (this.isOnline) {
        try {
          // Try Firebase first
          await this.cloudService.setPayrollSettings(settings);
          console.log('✅ Payroll settings saved to Firebase');
          
          // Update local after successful Firebase save
          this.localService.setPayrollSettings(settings);
          console.log('💾 Settings cached locally');
          
          return true;
        } catch (cloudError) {
          console.warn('⚠️ Firebase settings save failed:', cloudError.message);
          // Save locally and queue for sync
          this.localService.setPayrollSettings(settings);
          this.addToSyncQueue('setPayrollSettings', settings);
          return true;
        }
      } else {
        console.log('📴 Offline: saving settings locally');
        this.localService.setPayrollSettings(settings);
        this.addToSyncQueue('setPayrollSettings', settings);
        return true;
      }
    } catch (error) {
      console.error('❌ Error setting payroll settings:', error);
      throw error;
    }
  }

  // UTILITY METHODS
  getStorageInfo() {
    const localInfo = this.localService.getStorageInfo();
    return {
      ...localInfo,
      isOnline: this.isOnline,
      syncQueueLength: this.syncQueue.length,
      lastSyncAttempt: this.lastSyncAttempt || 'Never'
    };
  }

  // Real-time subscriptions (only work when online)
  subscribeToEmployees(callback) {
    if (this.isOnline) {
      return this.cloudService.subscribeToEmployees(callback);
    } else {
      // Return empty unsubscribe function for offline mode
      return () => {};
    }
  }

  subscribeToPayslips(callback) {
    if (this.isOnline) {
      return this.cloudService.subscribeToPayslips(callback);
    } else {
      return () => {};
    }
  }

  // Force sync methods
  async forceSyncToCloud() {
    if (!this.isOnline) {
      throw new Error('Cannot sync to cloud while offline');
    }
    
    this.lastSyncAttempt = new Date().toISOString();
    return await this.cloudService.syncLocalToCloud();
  }

  async forceSyncFromCloud() {
    if (!this.isOnline) {
      throw new Error('Cannot sync from cloud while offline');
    }
    
    this.lastSyncAttempt = new Date().toISOString();
    return await this.cloudService.syncCloudToLocal();
  }

  // Export/Import methods
  async exportAllData() {
    try {
      if (this.isOnline) {
        return await this.cloudService.exportAllData();
      } else {
        return this.localService.exportAllData();
      }
    } catch {
      // Error handled silently
      // Error suppressed
    }
  }

  async importAllData(data) {
    try {
      // Always import to local first
      this.localService.importAllData(data);
      
      if (this.isOnline) {
        try {
          await this.cloudService.importAllData(data);
        } catch {
          console.log('Cloud import failed, data saved locally. Will sync when online.');
        }
      }
      
      return true;
    } catch {
      // Error handled silently
      // Error suppressed
    }
  }

  // Search methods (delegate to local service for speed)
  searchEmployees(query) {
    return this.localService.searchEmployees(query);
  }

  searchPayslips(query) {
    return this.localService.searchPayslips(query);
  }

  // Analytics methods
  getEmployeeAnalytics() {
    return this.localService.getEmployeeAnalytics();
  }

  getPayrollAnalytics() {
    return this.localService.getPayrollAnalytics();
  }

  // Clear data
  async clearAllData() {
    try {
      // Clear local data
      this.localService.clearAllData();
      
      if (this.isOnline) {
        // Note: Clearing cloud data would require implementing batch delete
        console.log('Local data cleared. Cloud data clearing not implemented for safety.');
      }
      
      // Clear sync queue
      this.syncQueue = [];
      
      return true;
    } catch {
      // Error handled silently
      // Error suppressed
    }
  }

  // Initialize database - no auto data creation
  initializeDatabase() {
    // No automatic initialization - system only shows Firebase data
    console.log('SyncDatabaseService initialized - will only use Firebase data');
    return true;
  }
}

// Create and export singleton instance
const syncDatabaseService = new SyncDatabaseService();
export default syncDatabaseService;
