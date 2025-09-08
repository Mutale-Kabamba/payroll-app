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
    
    // Don't auto-initialize sync - let components control when to sync
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
            // Both cloud and local are empty - check if user has deliberately cleared all data
            const hasBeenInitialized = localStorage.getItem('payroll_app_initialized');
            const deliberatelyCleared = localStorage.getItem('payroll_app_deliberately_cleared');
            
            if (!hasBeenInitialized && !deliberatelyCleared) {
              // First time setup - initialize with defaults
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
            } else {
              // User has previously used the system and/or deliberately deleted all employees
              // Respect their choice and return empty array
              return [];
            }
          }
        } catch (cloudError) {
          console.error('Cloud service error, falling back to local:', cloudError);
          // When falling back to local, also check if we should initialize
          const localEmployees = this.localService.getEmployees();
          if (localEmployees.length === 0) {
            const hasBeenInitialized = localStorage.getItem('payroll_app_initialized');
            const deliberatelyCleared = localStorage.getItem('payroll_app_deliberately_cleared');
            
            if (!hasBeenInitialized && !deliberatelyCleared) {
              // First time setup - initialize with defaults
              this.localService.initializeDatabase();
              return this.localService.getEmployees();
            }
          }
          return localEmployees;
        }
      } else {
        // When offline, also check if we should initialize
        const localEmployees = this.localService.getEmployees();
        if (localEmployees.length === 0) {
          const hasBeenInitialized = localStorage.getItem('payroll_app_initialized');
          const deliberatelyCleared = localStorage.getItem('payroll_app_deliberately_cleared');
          
          if (!hasBeenInitialized && !deliberatelyCleared) {
            // First time setup - initialize with defaults
            this.localService.initializeDatabase();
            return this.localService.getEmployees();
          }
        }
        return localEmployees;
      }
    } catch (error) {
      console.error('Error getting employees, falling back to local:', error);
      // Final fallback - also check if we should initialize
      const localEmployees = this.localService.getEmployees();
      if (localEmployees.length === 0) {
        const hasBeenInitialized = localStorage.getItem('payroll_app_initialized');
        const deliberatelyCleared = localStorage.getItem('payroll_app_deliberately_cleared');
        
        if (!hasBeenInitialized && !deliberatelyCleared) {
          // First time setup - initialize with defaults
          this.localService.initializeDatabase();
          return this.localService.getEmployees();
        }
      }
      return localEmployees;
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
      console.log(`SyncDatabaseService: Deleting employee ${employeeId}`);
      
      // Always delete locally first
      this.localService.deleteEmployee(employeeId);
      console.log(`Local deletion successful for employee ${employeeId}`);
      
      if (this.isOnline) {
        try {
          await this.cloudService.deleteEmployee(employeeId);
          console.log(`Cloud deletion successful for employee ${employeeId}`);
        } catch (cloudError) {
          console.error(`Cloud deletion failed for employee ${employeeId}, adding to sync queue:`, cloudError);
          this.addToSyncQueue('deleteEmployee', { id: employeeId });
        }
      } else {
        console.log(`Offline: Adding employee ${employeeId} deletion to sync queue`);
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
        try {
          const cloudPayslips = await this.cloudService.getPayslips();
          const localPayslips = this.localService.getPayslips();
          
          console.log(`Found ${cloudPayslips.length} payslips in cloud, ${localPayslips.length} locally`);
          
          if (cloudPayslips.length > 0) {
            // Use cloud data as the source of truth, but don't overwrite if local has more recent data
            this.localService.setPayslips(cloudPayslips);
            return cloudPayslips;
          } else if (localPayslips.length > 0) {
            // Cloud is empty but local has data, sync local to cloud
            console.log('Cloud is empty, syncing local payslips to cloud');
            try {
              for (const payslip of localPayslips) {
                await this.cloudService.addPayslip(payslip);
              }
            } catch (syncError) {
              console.log('Failed to sync local payslips to cloud:', syncError);
            }
            return localPayslips;
          } else {
            // Both are empty
            return [];
          }
        } catch (cloudError) {
          console.error('Cloud service error for payslips, falling back to local:', cloudError);
          return this.localService.getPayslips();
        }
      } else {
        return this.localService.getPayslips();
      }
    } catch (error) {
      console.error('Error getting payslips, falling back to local:', error);
      return this.localService.getPayslips();
    }
  }

  // Force refresh payslips from cloud (useful after deletions)
  async refreshPayslipsFromCloud() {
    try {
      if (this.isOnline) {
        console.log('Force refreshing payslips from cloud...');
        const cloudPayslips = await this.cloudService.getPayslips();
        console.log(`Fetched ${cloudPayslips.length} payslips from cloud`);
        
        // Update local storage with cloud data
        this.localService.setPayslips(cloudPayslips);
        return cloudPayslips;
      } else {
        console.log('Offline: Cannot refresh from cloud, returning local payslips');
        return this.localService.getPayslips();
      }
    } catch (error) {
      console.error('Error refreshing payslips from cloud:', error);
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
      console.log(`SyncDatabaseService: Deleting payslip ${payslipId}`);
      
      // Always delete locally first
      this.localService.deletePayslip(payslipId);
      console.log(`Local deletion successful for payslip ${payslipId}`);
      
      if (this.isOnline) {
        try {
          await this.cloudService.deletePayslip(payslipId);
          console.log(`Cloud deletion successful for payslip ${payslipId}`);
        } catch (cloudError) {
          console.error(`Cloud deletion failed for payslip ${payslipId}, adding to sync queue:`, cloudError);
          this.addToSyncQueue('deletePayslip', { id: payslipId });
        }
      } else {
        console.log(`Offline: Adding payslip ${payslipId} deletion to sync queue`);
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
      
      // Set flag to indicate user deliberately cleared all data
      localStorage.setItem('payroll_app_initialized', 'true');
      localStorage.setItem('payroll_app_deliberately_cleared', 'true');
      
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
