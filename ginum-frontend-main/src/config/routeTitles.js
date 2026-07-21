const routeTitles = [
  // Dashboard & Login
  { pattern: /^\/dashboard$/, title: "Dashboard | Ginum" },
  { pattern: /^\/login$/, title: "Login | Ginum" },

  // Employee Routes
  { pattern: /^\/employee\/new$/, title: "New Employee | Ginum" },
  { pattern: /^\/employee\/edit\/\d+$/, title: "Edit Employee | Ginum" },
  { pattern: /^\/employee\/all$/, title: "Employee Details | Ginum" },

  // Department Routes
  { pattern: /^\/department\/all$/, title: "Organization Setup | Ginum" },
  { pattern: /^\/department\/new$/, title: "New Department | Ginum" },
  { pattern: /^\/department\/designation$/, title: "New Designation | Ginum" },

  // Payroll
  { pattern: /^\/payroll$/, title: "Payroll | Ginum" },

  // Supplier Routes
  { pattern: /^\/supplier\/all$/, title: "All Suppliers | Ginum" },
  { pattern: /^\/supplier\/new$/, title: "New Supplier | Ginum" },

  // Customer Routes
  { pattern: /^\/customer\/all$/, title: "All Customers | Ginum" },
  { pattern: /^\/customer\/new$/, title: "New Customer | Ginum" },

  // Order & Inventory
  { pattern: /^\/orders$/, title: "Orders | Ginum" },
  { pattern: /^\/inventory$/, title: "Inventory | Ginum" },

  // Sales & Purchases
  { pattern: /^\/sales$/, title: "Sales | Ginum" },
  { pattern: /^\/purchases$/, title: "Purchases | Ginum" },

  // Transactions & Bank
  { pattern: /^\/transactions$/, title: "Transactions | Ginum" },
  { pattern: /^\/bank$/, title: "Bank | Ginum" },

  // Account Routes
  { pattern: /^\/account\/all$/, title: "All Accounts | Ginum" },
  { pattern: /^\/account\/new$/, title: "New Account | Ginum" },

  // Depreciation
  { pattern: /^\/depreciation$/, title: "Depreciation | Ginum" },

  // Reports
  { pattern: /^\/reports\/balance-sheet$/, title: "Balance Sheet Report | Ginum" },
  { pattern: /^\/reports\/income-statement$/, title: "Income Statement Report | Ginum" },
  { pattern: /^\/reports\/trial-balance$/, title: "Trial Balance Report | Ginum" },
  { pattern: /^\/reports\/daily-sales$/, title: "Daily Sales Report | Ginum" },
  { pattern: /^\/reports\/revenue-report$/, title: "Revenue Report | Ginum" },
  { pattern: /^\/reports\/cashflow$/, title: "Cash Flow Report | Ginum" },
  { pattern: /^\/reports\/general-ledger$/, title: "General Ledger Report | Ginum" },

  // Quotations
  { pattern: /^\/quotations\/new$/, title: "New Quotation | Ginum" },
  { pattern: /^\/quotations\/all$/, title: "All Quotations | Ginum" },

  // User Management
  { pattern: /^\/users\/all$/, title: "All Users | Ginum" },
  { pattern: /^\/users\/new$/, title: "New User | Ginum" },

  // Miscellaneous
  { pattern: /^\/edit-requests$/, title: "Edit Requests | Ginum" },
  { pattern: /^\/profile$/, title: "Profile | Ginum" },
  { pattern: /^\/settings$/, title: "Settings | Ginum" },

  // Default for 404
  // { pattern: /.*/, title: "404 - Page Not Found | Ginum" },
];

export default routeTitles;