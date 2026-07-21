import {
  FaTachometerAlt,
  FaUsers,
  FaDollarSign,
  FaBuilding,
  FaTruck,
  FaUserTie,
  FaShoppingCart,
  FaClipboardList,
  FaWarehouse,
  FaExchangeAlt,
  FaFileAlt,
  FaBook,
  FaQuoteRight,
  FaUniversity,
} from "react-icons/fa";
import { RiContractLeftFill } from "react-icons/ri";

export const navItems = [
  {
    sectionTitle: "DASHBOARD",
  },
  {
    id: "dashboard",
    path: "/dashboard",
    label: "Dashboard",
    icon: FaTachometerAlt,
    subItems: [],
  },

  {
    sectionTitle: "HUMAN RESOURCES",
  },
  {
    id: "employee",
    path: "/employee",
    label: "Employees",
    icon: FaUsers,
    subItems: [
      { id: "all-employees", path: "/employee/all", label: "All Employees" },
      { id: "new-employee", path: "/employee/new", label: "New Employee" },
    ],
  },
  {
    id: "department",
    path: "/department",
    label: "Department",
    icon: FaBuilding,
    subItems: [
      {
        id: "all-department",
        path: "/department/all",
        label: "Organization Setup",
      },
      {
        id: "new-department",
        path: "/department/new",
        label: "New Department",
      },
      {
        id: "all-designation",
        path: "/department/designation",
        label: "New Designations",
      },
    ],
  },
  // {
  //   id: "payroll",
  //   path: "/payroll",
  //   label: "Payroll",
  //   icon: FaDollarSign,
  //   subItems: [
  //     { id: "all-payroll", path: "/payroll/all", label: "All Payroll" },
  //     { id: "new-payroll", path: "/payroll/new", label: "New Payroll" },
  //   ],
  // },

  {
    sectionTitle: "BUSINESS & OPERATIONS",
  },
  {
    id: "supplier",
    path: "/supplier",
    label: "Supplier",
    icon: FaTruck,
    subItems: [
      { id: "all-supplier", path: "/supplier/all", label: "All Suppliers" },
      { id: "new-supplier", path: "/supplier/new", label: "New Supplier" },
      {
        id: "all-purchases",
        path: "/supplier/purchase/all",
        label: "Purchases",
      },
      {
        id: "new-purchase",
        path: "/supplier/purchase/new",
        label: "Create Purchase",
      },
      {
        id: "aged-payables",
        path: "/supplier/aged-payables",
        label: "Aged Payables",
      },
    ],
  },
  {
    id: "customer",
    path: "/customer",
    label: "Customer",
    icon: FaUserTie,
    subItems: [
      { id: "all-customer", path: "/customer/all", label: "Customers" },
      { id: "new-customer", path: "/customer/new", label: "Create Customer" },
      { id: "all-sales", path: "/customer/sales/all", label: "Sales" },
      { id: "new-sale", path: "/customer/sales/new", label: "Create Sale" },
      {
        id: "aged-receivables",
        path: "/customer/aged-receivables",
        label: "Aged Receivables",
      },
    ],
  },
  {
    id: "projects",
    path: "/projects",
    label: "projects",
    icon: FaClipboardList,
    subItems: [
      { id: "all-projects", path: "/projects/all", label: "All Projects" },
      { id: "new-project", path: "/projects/new", label: "Create Project" },
    ],
  },
  {
    id: "inventory",
    path: "/inventory",
    label: "Inventory",
    icon: FaWarehouse,
    subItems: [],
  },

  {
    sectionTitle: "FINANCE & ACCOUNTING",
  },
  // {
  //   id: "sales",
  //   path: "/sales",
  //   label: "Sales",
  //   icon: FaShoppingCart,
  //   subItems: [

  //   ],
  // },
  // {
  //   id: "purchases",
  //   path: "/purchases",
  //   label: "Purchases",
  //   icon: FaClipboardList,
  //   subItems: [
  //     { id: "all-purchases", path: "/purchases/all", label: "All Purchases" },
  //     { id: "new-purchases", path: "/purchases/new", label: "Create Purchase" },
  //   ],
  // },
  {
    id: "transactions",
    path: "/transactions",
    label: "Transactions",
    icon: FaExchangeAlt,
    subItems: [
      {
        id: "new-transaction",
        path: "/transactions/new",
        label: "Create Transactions",
      },
    ],
  },
  {
    id: "bank",
    path: "/bank/reconsilation",
    label: "Bank Statement",
    icon: FaUniversity,
    subItems: [
      {
        id: "bank-reconsilation",
        path: "/bank/reconsilation",
        label: "Bank Reconsilation",
      },
      {
        id: "receive-money",
        path: "/bank/receive-money",
        label: "Receive Money",
      },
      { id: "spend-money", path: "/bank/spend-money", label: "Spend Money" },
    ],
  },
  {
    id: "account",
    path: "/account",
    label: "Accounts",
    icon: FaBook,
    subItems: [
      { id: "all-accounts", path: "/account/all", label: "All Accounts" },
      { id: "new-account", path: "/account/new", label: "New Account" },
    ],
  },
  {
    id: "depreciation",
    path: "/depreciation",
    label: "Depreciation",
    icon: FaFileAlt,
    subItems: [],
  },

  {
    sectionTitle: "REPORTS & DOCUMENTATION",
  },
  {
    id: "reports",
    path: "/reports",
    label: "Reports",
    icon: FaFileAlt,
    subItems: [
      {
        id: "balance-sheet",
        path: "/reports/balance-sheet",
        label: "Balance Sheet",
      },
      {
        id: "income-statement",
        path: "/reports/income-statement",
        label: "Income Statement",
      },
      {
        id: "trial-balance",
        path: "/reports/trial-balance",
        label: "Trial Balance",
      },
      // {
      //   id: "daily-sales",
      //   path: "/reports/daily-sales",
      //   label: "Daily Sales Report",
      // },
      // {
      //   id: "revenue-report",
      //   path: "/reports/revenue-report",
      //   label: "Revenue Report",
      // },
      { id: "cashflow", path: "/reports/cashflow", label: "Cashflow" },
      {
        id: "general-ledger",
        path: "/reports/general-ledger",
        label: "General Ledger",
      },
    ],
  },
  // {
  //   id: "quotations",
  //   path: "/quotations",
  //   label: "Quotations",
  //   icon: FaQuoteRight,
  //   subItems: [
  //     {
  //       id: "new-quotation",
  //       path: "/quotations/new",
  //       label: "Create Quotation",
  //     },
  //     { id: "all-quotation", path: "/quotations/all", label: "All Quotations" },
  //     ,
  //   ],
  // },

  {
    sectionTitle: "USER MANAGEMENT",
  },
  {
    id: "users",
    path: "/users",
    label: "Users",
    icon: FaUsers,
    subItems: [
      { id: "all-users", path: "/users/all", label: "All Users" },
      { id: "new-user", path: "/users/new", label: "New User" },
    ],
  },
  {
    id: "requests",
    path: "/edit-requests",
    label: "Requests",
    icon: RiContractLeftFill,
    subItems: [],
  },
];
