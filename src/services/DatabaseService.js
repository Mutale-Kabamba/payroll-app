import initSqlJs from 'sql.js';

class DatabaseService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return this.db;

    try {
      // Initialize SQL.js
      const SQL = await initSqlJs({
        locateFile: file => `/${file}`
      });

      // Check if there's an existing database in localStorage
      const existingDb = localStorage.getItem('payrollDatabase');
      
      if (existingDb) {
        // Load existing database
        const dbData = new Uint8Array(JSON.parse(existingDb));
        this.db = new SQL.Database(dbData);
        console.log('Loaded existing database from localStorage');
      } else {
        // Create new database
        this.db = new SQL.Database();
        console.log('Created new database');
      }

      // Create tables if they don't exist
      await this.createTables();
      
      // Insert default employees if database is empty
      await this.insertDefaultEmployees();

      this.isInitialized = true;
      return this.db;
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async createTables() {
    try {
      // Create employees table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS employees (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          nrc TEXT,
          ssn TEXT,
          gender TEXT,
          designation TEXT,
          dateOfJoining TEXT,
          basicPay REAL,
          transportAllowance REAL,
          mealAllowance REAL,
          address TEXT,
          department TEXT,
          napsa TEXT,
          nhima TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create payslips table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS payslips (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employeeId TEXT NOT NULL,
          payrollPeriod TEXT NOT NULL,
          workedDays INTEGER,
          totalDays INTEGER,
          basicPay REAL,
          transportAllowance REAL,
          houseRentAllowance REAL,
          mealAllowance REAL,
          otherEarnings TEXT, -- JSON string
          totalEarnings REAL,
          napsa REAL,
          nhima REAL,
          loan REAL DEFAULT 0,
          otherDeductions TEXT, -- JSON string
          totalDeductions REAL,
          netPay REAL,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (employeeId) REFERENCES employees (id)
        )
      `);

      console.log('Database tables created successfully');
      this.saveToLocalStorage();
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  async insertDefaultEmployees() {
    try {
      // Check if employees table is empty
      const result = this.db.exec("SELECT COUNT(*) as count FROM employees");
      const count = result[0]?.values[0][0] || 0;

      if (count === 0) {
        console.log('Inserting default employees...');
        
        const defaultEmployees = [
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
        ];

        for (const employee of defaultEmployees) {
          this.db.run(`
            INSERT INTO employees (
              id, name, nrc, ssn, gender, designation, dateOfJoining,
              basicPay, transportAllowance, mealAllowance, address,
              department, napsa, nhima, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            employee.id, employee.name, employee.nrc, employee.ssn,
            employee.gender, employee.designation, employee.dateOfJoining,
            employee.basicPay, employee.transportAllowance, employee.mealAllowance,
            employee.address, employee.department, employee.napsa, employee.nhima,
            new Date().toISOString(), new Date().toISOString()
          ]);
        }

        console.log(`Inserted ${defaultEmployees.length} default employees`);
        this.saveToLocalStorage();
      }
    } catch (error) {
      console.error('Error inserting default employees:', error);
      throw error;
    }
  }

  // Employee CRUD operations
  async getAllEmployees() {
    try {
      const result = this.db.exec(`
        SELECT * FROM employees ORDER BY name
      `);
      
      if (result.length === 0) return [];
      
      const columns = result[0].columns;
      const values = result[0].values;
      
      return values.map(row => {
        const employee = {};
        columns.forEach((col, index) => {
          employee[col] = row[index];
        });
        return employee;
      });
    } catch (error) {
      console.error('Error getting employees:', error);
      return [];
    }
  }

  async getEmployeeById(id) {
    try {
      const result = this.db.exec(`
        SELECT * FROM employees WHERE id = ?
      `, [id]);
      
      if (result.length === 0) return null;
      
      const columns = result[0].columns;
      const values = result[0].values;
      
      if (values.length === 0) return null;
      
      const employee = {};
      columns.forEach((col, index) => {
        employee[col] = values[0][index];
      });
      
      return employee;
    } catch (error) {
      console.error('Error getting employee by id:', error);
      return null;
    }
  }

  // Payslip CRUD operations
  async createPayslip(payslipData) {
    try {
      const {
        employeeId, payrollPeriod, workedDays, totalDays,
        basicPay, transportAllowance, houseRentAllowance, mealAllowance,
        otherEarnings, totalEarnings, napsa, nhima, loan,
        otherDeductions, totalDeductions, netPay
      } = payslipData;

      this.db.run(`
        INSERT INTO payslips (
          employeeId, payrollPeriod, workedDays, totalDays,
          basicPay, transportAllowance, houseRentAllowance, mealAllowance,
          otherEarnings, totalEarnings, napsa, nhima, loan,
          otherDeductions, totalDeductions, netPay, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        employeeId, payrollPeriod, workedDays, totalDays,
        basicPay, transportAllowance, houseRentAllowance, mealAllowance,
        JSON.stringify(otherEarnings || []), totalEarnings, napsa, nhima, loan,
        JSON.stringify(otherDeductions || []), totalDeductions, netPay,
        new Date().toISOString()
      ]);

      this.saveToLocalStorage();
      console.log('Payslip created successfully');
      return true;
    } catch (error) {
      console.error('Error creating payslip:', error);
      throw error;
    }
  }

  async getAllPayslips() {
    try {
      const result = this.db.exec(`
        SELECT p.*, e.name, e.nrc, e.ssn, e.gender, e.designation, 
               e.dateOfJoining, e.address, e.department, e.napsa as employeeNapsa, 
               e.nhima as employeeNhima
        FROM payslips p
        LEFT JOIN employees e ON p.employeeId = e.id
        ORDER BY p.createdAt DESC
      `);
      
      if (result.length === 0) return [];
      
      const columns = result[0].columns;
      const values = result[0].values;
      
      return values.map(row => {
        const payslip = {};
        columns.forEach((col, index) => {
          if (col === 'otherEarnings' || col === 'otherDeductions') {
            try {
              payslip[col] = JSON.parse(row[index] || '[]');
            } catch {
              payslip[col] = [];
            }
          } else {
            payslip[col] = row[index];
          }
        });
        return payslip;
      });
    } catch (error) {
      console.error('Error getting payslips:', error);
      return [];
    }
  }

  async getPayslipsByPeriod(period) {
    try {
      const result = this.db.exec(`
        SELECT p.*, e.name, e.nrc, e.ssn, e.gender, e.designation, 
               e.dateOfJoining, e.address, e.department, e.napsa as employeeNapsa, 
               e.nhima as employeeNhima
        FROM payslips p
        LEFT JOIN employees e ON p.employeeId = e.id
        WHERE p.payrollPeriod = ?
        ORDER BY e.name
      `, [period]);
      
      if (result.length === 0) return [];
      
      const columns = result[0].columns;
      const values = result[0].values;
      
      return values.map(row => {
        const payslip = {};
        columns.forEach((col, index) => {
          if (col === 'otherEarnings' || col === 'otherDeductions') {
            try {
              payslip[col] = JSON.parse(row[index] || '[]');
            } catch {
              payslip[col] = [];
            }
          } else {
            payslip[col] = row[index];
          }
        });
        return payslip;
      });
    } catch (error) {
      console.error('Error getting payslips by period:', error);
      return [];
    }
  }

  async deletePayslip(payslipId) {
    try {
      this.db.run('DELETE FROM payslips WHERE id = ?', [payslipId]);
      this.saveToLocalStorage();
      console.log('Payslip deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting payslip:', error);
      throw error;
    }
  }

  // Get reporting data
  async getWageBillReport() {
    try {
      const result = this.db.exec(`
        SELECT 
          payrollPeriod,
          COUNT(*) as employeeCount,
          SUM(basicPay) as totalBasicPay,
          SUM(transportAllowance + houseRentAllowance + mealAllowance) as totalAllowances,
          SUM(totalEarnings) as totalGrossPay,
          SUM(totalDeductions) as totalDeductions,
          SUM(netPay) as totalNetPay,
          SUM(napsa) as totalNAPSA,
          SUM(nhima) as totalNHIMA,
          AVG(netPay) as avgNetPay
        FROM payslips
        GROUP BY payrollPeriod
        ORDER BY payrollPeriod DESC
      `);
      
      if (result.length === 0) return [];
      
      const columns = result[0].columns;
      const values = result[0].values;
      
      return values.map(row => {
        const report = {};
        columns.forEach((col, index) => {
          report[col] = row[index];
        });
        return report;
      });
    } catch (error) {
      console.error('Error getting wage bill report:', error);
      return [];
    }
  }

  async getDepartmentAnalysis(payrollPeriod = null) {
    try {
      let query = `
        SELECT 
          e.department,
          COUNT(*) as employeeCount,
          SUM(p.netPay) as totalPay,
          AVG(p.netPay) as avgPay
        FROM payslips p
        LEFT JOIN employees e ON p.employeeId = e.id
      `;
      
      const params = [];
      if (payrollPeriod) {
        query += ' WHERE p.payrollPeriod = ?';
        params.push(payrollPeriod);
      }
      
      query += ' GROUP BY e.department ORDER BY totalPay DESC';
      
      const result = this.db.exec(query, params);
      
      if (result.length === 0) return [];
      
      const columns = result[0].columns;
      const values = result[0].values;
      
      return values.map(row => {
        const analysis = {};
        columns.forEach((col, index) => {
          analysis[col] = row[index];
        });
        return analysis;
      });
    } catch (error) {
      console.error('Error getting department analysis:', error);
      return [];
    }
  }

  // Save database to localStorage
  saveToLocalStorage() {
    try {
      const data = this.db.export();
      localStorage.setItem('payrollDatabase', JSON.stringify(Array.from(data)));
      console.log('Database saved to localStorage');
    } catch (error) {
      console.error('Error saving database to localStorage:', error);
    }
  }

  // Clear all data (for testing purposes)
  async clearDatabase() {
    try {
      this.db.run('DELETE FROM payslips');
      this.db.run('DELETE FROM employees');
      this.saveToLocalStorage();
      console.log('Database cleared');
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  }

  // Export database
  exportDatabase() {
    try {
      const data = this.db.export();
      return data;
    } catch (error) {
      console.error('Error exporting database:', error);
      return null;
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

export default databaseService;