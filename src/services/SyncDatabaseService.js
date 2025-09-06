// SyncDatabaseService.js - Hybrid service that syncs between local and cloud storage
import cloudDatabaseService from './CloudDatabaseService';
import databaseService from './DatabaseService';

class SyncDatabaseService {
  constructor() {
    this.cloudService = cloudDatabaseService;
    this.localService = databaseService;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    // Initialize sync
    this.initializeSync();
  }

  async initializeSync() {
    if (this.isOnline) {
      try {
        // Check if cloud service is available
        const cloudAvailable = await this.cloudService.isOnline();
        if (cloudAvailable) {
          // Sync local data to cloud on first load
          await this.cloudService.syncLocalToCloud();
        }
      } catch (error) {
        console.log('Cloud sync not available, using local storage only');
      }
    }
  }

  // Add operation to sync queue if offline
  addToSyncQueue(operation, data) {
    this.syncQueue.push({ operation, data, timestamp: Date.now() });
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
      } catch (error) {
        console.error('Error processing sync queue item:', error);
      }
    }
    
    // Clear processed queue
    this.syncQueue = [];
    console.log('Sync queue processed successfully');
  }

  // EMPLOYEE METHODS
  async getEmployees() {
    try {
      if (this.isOnline) {
        try {
          const cloudEmployees = await this.cloudService.getEmployees();
          // Only update local storage with cloud data if cloud has data OR local is empty
          const localEmployees = this.localService.getEmployees();
          if (cloudEmployees.length > 0) {
            this.localService.setEmployees(cloudEmployees);
            return cloudEmployees;
          } else if (localEmployees.length > 0) {
            // Cloud is empty but local has data, use local and sync to cloud
            try {
              for (const employee of localEmployees) {
                await this.cloudService.addEmployee(employee);
              }
            } catch (syncError) {
              console.log('Failed to sync local employees to cloud:', syncError);
            }
            return localEmployees;
          } else {
            // Both cloud and local are empty, let local service initialize defaults
            this.localService.initializeDatabase();
            const initializedEmployees = this.localService.getEmployees();
            // Try to sync initialized data to cloud
            try {
              for (const employee of initializedEmployees) {
                await this.cloudService.addEmployee(employee);
              }
            } catch (syncError) {
              console.log('Failed to sync initialized employees to cloud:', syncError);
            }
            return initializedEmployees;
          }
        } catch (cloudError) {
          console.error('Cloud service error, falling back to local:', cloudError);
          return this.localService.getEmployees();
        }
      } else {
        return this.localService.getEmployees();
      }
    } catch (error) {
      console.error('Error getting employees, falling back to local:', error);
      return this.localService.getEmployees();
    }
  }

  async addEmployee(employee) {
    try {
      // Always save locally first
      this.localService.addEmployee(employee);
      
      if (this.isOnline) {
        try {
          await this.cloudService.addEmployee(employee);
        } catch (cloudError) {
          // Add to sync queue if cloud fails
          this.addToSyncQueue('addEmployee', employee);
        }
      } else {
        // Add to sync queue for later
        this.addToSyncQueue('addEmployee', employee);
      }
      
      return true;
    } catch (error) {
      console.error('Error adding employee:', error);
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
        } catch (cloudError) {
          this.addToSyncQueue('updateEmployee', { id: employeeId, ...updatedEmployee });
        }
      } else {
        this.addToSyncQueue('updateEmployee', { id: employeeId, ...updatedEmployee });
      }
      
      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  async deleteEmployee(employeeId) {
    try {
      // Always delete locally first
      this.localService.deleteEmployee(employeeId);
      
      if (this.isOnline) {
        try {
          await this.cloudService.deleteEmployee(employeeId);
        } catch (cloudError) {
          this.addToSyncQueue('deleteEmployee', { id: employeeId });
        }
      } else {
        this.addToSyncQueue('deleteEmployee', { id: employeeId });
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  // PAYSLIP METHODS
  async getPayslips() {
    try {
      if (this.isOnline) {
        const cloudPayslips = await this.cloudService.getPayslips();
        // Update local storage with cloud data
        this.localService.setPayslips(cloudPayslips);
        return cloudPayslips;
      } else {
        return this.localService.getPayslips();
      }
    } catch (error) {
      console.error('Error getting payslips, falling back to local:', error);
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
        } catch (cloudError) {
          this.addToSyncQueue('addPayslip', payslip);
        }
      } else {
        this.addToSyncQueue('addPayslip', payslip);
      }
      
      return true;
    } catch (error) {
      console.error('Error adding payslip:', error);
      throw error;
    }
  }

  async deletePayslip(payslipId) {
    try {
      // Always delete locally first
      this.localService.deletePayslip(payslipId);
      
      if (this.isOnline) {
        try {
          await this.cloudService.deletePayslip(payslipId);
        } catch (cloudError) {
          this.addToSyncQueue('deletePayslip', { id: payslipId });
        }
      } else {
        this.addToSyncQueue('deletePayslip', { id: payslipId });
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting payslip:', error);
      throw error;
    }
  }

  // SETTINGS METHODS
  async getPayrollSettings() {
    try {
      if (this.isOnline) {
        const cloudSettings = await this.cloudService.getPayrollSettings();
        // Update local storage with cloud data
        this.localService.setPayrollSettings(cloudSettings);
        return cloudSettings;
      } else {
        return this.localService.getPayrollSettings();
      }
    } catch (error) {
      console.error('Error getting settings, falling back to local:', error);
      return this.localService.getPayrollSettings();
    }
  }

  async setPayrollSettings(settings) {
    try {
      // Always save locally first
      this.localService.setPayrollSettings(settings);
      
      if (this.isOnline) {
        try {
          await this.cloudService.setPayrollSettings(settings);
        } catch (cloudError) {
          this.addToSyncQueue('setPayrollSettings', settings);
        }
      } else {
        this.addToSyncQueue('setPayrollSettings', settings);
      }
      
      return true;
    } catch (error) {
      console.error('Error setting payroll settings:', error);
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
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async importAllData(data) {
    try {
      // Always import to local first
      this.localService.importAllData(data);
      
      if (this.isOnline) {
        try {
          await this.cloudService.importAllData(data);
        } catch (cloudError) {
          console.log('Cloud import failed, data saved locally. Will sync when online.');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
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
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  // Initialize database
  initializeDatabase() {
    return this.localService.initializeDatabase();
  }
}

// Create and export singleton instance
const syncDatabaseService = new SyncDatabaseService();
export default syncDatabaseService;
