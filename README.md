# Payroll Generator App

A modern, responsive payroll management application built with React, Vite, and Tailwind CSS.

## Features

- **Employee Management**: Add and remove employees from the payroll
- **Payroll Calculations**: Automatic calculation of gross pay, deductions, and net pay
- **Real-time Totals**: Live summary of total gross pay, deductions, and net pay
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, professional interface built with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone or download this repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

To run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Usage

1. **Adding Employees**: Fill in the employee form with:
   - Employee Name
   - Hourly Rate
   - Hours Worked
   - Deductions (optional)

2. **Viewing Payroll**: The table displays all employees with calculated:
   - Gross Pay (Hourly Rate × Hours Worked)
   - Net Pay (Gross Pay - Deductions)

3. **Summary**: View totals at the bottom of the table

4. **Removing Employees**: Click "Remove" to delete an employee from the list

## Project Structure

```
payroll-app/
├── public/
├── src/
│   ├── components/
│   │   └── PayrollGenerator.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── package.json
└── tailwind.config.js
```

## Technologies Used

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS preprocessing

## License

This project is open source and available under the MIT License.
