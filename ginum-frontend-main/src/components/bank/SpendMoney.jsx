import React, { useState, useEffect } from "react";
import {
  FaSpinner,
  FaArrowLeft,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaBuilding,
  FaUniversity,
  FaUser,
  FaTrash,
} from "react-icons/fa";
import {
  FiCreditCard,
  FiCalendar,
  FiHash,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiDollarSign,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../utils/api";
import Alert from "../Alert/Alert";

const SpendMoney = () => {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [pastTransactions, setPastTransactions] = useState([]);

  const [payeeType, setPayeeType] = useState("Supplier");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedPoId, setSelectedPoId] = useState("");
  const [selectedBankAccountCode, setSelectedBankAccountCode] = useState("");
  const [selectedExpenseAccount, setSelectedExpenseAccount] = useState("");
  const [paymentCategory, setPaymentCategory] = useState("Salary Expense");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [referenceNumber, setReferenceNumber] = useState(
    `REF-${Math.floor(Date.now() / 1000)}`
  );
  const [paymentNote, setPaymentNote] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const companyId = sessionStorage.getItem("companyId");
  const token = sessionStorage.getItem("auth_token") || sessionStorage.getItem("token");

  const getSupplierId = (supplier) =>
    supplier.id ||
    supplier.supplierId ||
    supplier.supplier_id ||
    supplier.supplierID ||
    "";

  const getSupplierName = (supplier) =>
    supplier.supplierName ||
    supplier.name ||
    supplier.companyName ||
    supplier.email ||
    "Unnamed Supplier";

  const getAccountLabel = (account) => {
    const code = account.accountCode || "";
    const name = account.accountName || account.name || "Unnamed Account";
    return code ? `${code} - ${name}` : name;
  };

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  });

  const fetchPastTransactions = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/transactions/companies/${companyId}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setPastTransactions(
          (Array.isArray(data) ? data : []).filter((t) => t.totalCredit > 0)
        );
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!companyId || !token) {
        Alert.error("Missing company ID or auth token. Please login again.");
        return;
      }

      setIsLoading(true);
      setErrorMsg("");

      try {
        const [accRes, supRes, poRes, empRes] = await Promise.allSettled([
          fetch(`${apiUrl}/api/companies/${companyId}/accounts/active`, {
            headers: getAuthHeaders(),
          }),
          fetch(`${apiUrl}/api/suppliers/companies/${companyId}/active`, {
            headers: getAuthHeaders(),
          }),
          fetch(`${apiUrl}/api/${companyId}/purchase-orders`, {
            headers: getAuthHeaders(),
          }),
          fetch(`${apiUrl}/api/employees/${companyId}`, {
            headers: getAuthHeaders(),
          }),
        ]);

        if (accRes.status === "fulfilled" && accRes.value.ok) {
          const accData = await accRes.value.json();
          setAccounts(Array.isArray(accData) ? accData : accData?.data || []);
        }
        if (supRes.status === "fulfilled" && supRes.value.ok) {
          const supData = await supRes.value.json();
          setSuppliers(Array.isArray(supData) ? supData : supData?.data || []);
        }
        if (poRes.status === "fulfilled" && poRes.value.ok) {
          const poData = await poRes.value.json();
          setPurchaseOrders(
            Array.isArray(poData)
              ? poData
              : poData?.data || poData?.purchaseOrders || []
          );
        }
        if (empRes.status === "fulfilled" && empRes.value.ok) {
          const empData = await empRes.value.json();
          setEmployees(Array.isArray(empData) ? empData : empData?.data || []);
        }

        await fetchPastTransactions();
      } catch (err) {
        console.error("Error loading data:", err);
        setErrorMsg("Failed to load data from server. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [companyId, token]);

  const supplierPurchaseOrders = purchaseOrders.filter(
    (po) =>
      String(po.supplierId) === String(selectedSupplier) &&
      Number(po.balanceDue || 0) > 0
  );

  const currentPo = purchaseOrders.find(
    (po) => String(po.id) === String(selectedPoId)
  );

  // Filter accounts for expenses dropdown
  const expenseAccounts = accounts.filter(
    (acc) =>
      acc.accountType === "EXPENSE" ||
      acc.accountType === "OTHER_EXPENSE" ||
      acc.accountType === "COST_OF_SALES" ||
      acc.accountType?.mainCategory === "Expense" ||
      (acc.accountCode && acc.accountCode.startsWith("5")) // standard expense code starts with 5
  );

  useEffect(() => {
    if (payeeType === "Supplier" && currentPo) {
      setPaymentAmount(Number(currentPo.balanceDue || 0).toFixed(2));
    } else if (payeeType === "Employee") {
      // Don't auto-fill amount for employee direct payments
    } else {
      setPaymentAmount("");
    }
  }, [selectedPoId, purchaseOrders, payeeType, currentPo]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();

    if (!selectedBankAccountCode) {
      Alert.error("Please select a payment account.");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.error("Please enter a valid payment amount greater than zero.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (payeeType === "Supplier") {
        if (!selectedSupplier) {
          Alert.error("Please select a supplier.");
          setIsSubmitting(false);
          return;
        }
        if (!selectedPoId) {
          Alert.error("Please select a purchase order.");
          setIsSubmitting(false);
          return;
        }
        if (currentPo && amount > Number(currentPo.balanceDue)) {
          Alert.error(
            `Amount cannot exceed the balance due of Rs. ${Number(currentPo.balanceDue).toFixed(2)}.`
          );
          setIsSubmitting(false);
          return;
        }

        const payload = {
          amount,
          paymentAccountCode: selectedBankAccountCode,
          paymentNote:
            paymentNote.trim() ||
            `Payment against PO #${currentPo.purchaseOrderNumber || currentPo.poNumber || selectedPoId}`,
          companyId: parseInt(companyId, 10),
        };

        const response = await fetch(
          `${apiUrl}/api/${companyId}/purchase-orders/${selectedPoId}/pay`,
          { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(payload) }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Payment submission failed.");
        }
      } else {
        // Employee Payment
        if (!selectedEmployee) {
          Alert.error("Please select an employee.");
          setIsSubmitting(false);
          return;
        }
        if (!selectedExpenseAccount) {
          Alert.error("Please select an expense account category.");
          setIsSubmitting(false);
          return;
        }

        const payload = {
          payeeId: parseInt(selectedEmployee, 10),
          payeeType: "EMPLOYEE",
          amount,
          paymentAccountCode: selectedBankAccountCode,
          expenseAccountCode: selectedExpenseAccount,
          paymentCategory,
          paymentMethod,
          paymentNote: paymentNote.trim() || `${paymentCategory} payment`,
          referenceNumber: referenceNumber.trim() || `REF-${Math.floor(Date.now() / 1000)}`,
        };

        const response = await fetch(
          `${apiUrl}/api/transactions/companies/${companyId}/spend-direct`,
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Direct payment submission failed.");
        }
      }

      Alert.success("Payment recorded successfully!");

      // Reset values
      setSelectedSupplier("");
      setSelectedEmployee("");
      setSelectedPoId("");
      setPaymentAmount("");
      setPaymentNote("");
      setReferenceNumber(`REF-${Math.floor(Date.now() / 1000)}`);

      // Reload POs, transactions and accounts
      const poRes = await fetch(
        `${apiUrl}/api/${companyId}/purchase-orders`,
        { headers: getAuthHeaders() }
      );
      if (poRes.ok) {
        const poData = await poRes.json();
        setPurchaseOrders(
          Array.isArray(poData)
            ? poData
            : poData?.data || poData?.purchaseOrders || []
        );
      }
      
      const accRes = await fetch(`${apiUrl}/api/companies/${companyId}/accounts/active`, {
        headers: getAuthHeaders(),
      });
      if (accRes.ok) {
        const accData = await accRes.json();
        setAccounts(Array.isArray(accData) ? accData : accData?.data || []);
      }

      await fetchPastTransactions();
    } catch (err) {
      console.error("Payment error:", err);
      Alert.error(err.message || "Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (txId) => {
    if (!window.confirm("Are you sure you want to delete this transaction? All associated journal entries and ledger balances will be reverted.")) {
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/api/transactions/${txId}/companies/${companyId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        Alert.success("Transaction deleted successfully!");
        await fetchPastTransactions();
        // Refresh balances and POs
        const poRes = await fetch(
          `${apiUrl}/api/${companyId}/purchase-orders`,
          { headers: getAuthHeaders() }
        );
        if (poRes.ok) {
          const poData = await poRes.json();
          setPurchaseOrders(
            Array.isArray(poData)
              ? poData
              : poData?.data || poData?.purchaseOrders || []
          );
        }
        const accRes = await fetch(`${apiUrl}/api/companies/${companyId}/accounts/active`, {
          headers: getAuthHeaders(),
        });
        if (accRes.ok) {
          const accData = await accRes.json();
          setAccounts(Array.isArray(accData) ? accData : accData?.data || []);
        }
      } else {
        const errText = await res.text();
        throw new Error(errText || "Deletion failed");
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
      Alert.error(err.message || "Failed to delete transaction.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
        <p className="text-gray-500 font-medium">Loading transaction data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <FaMoneyBillWave className="text-red-600 text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Spend Money
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Record outgoing payments for suppliers or employee expenses
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/bank/receive-money")}
            className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer animate-pulse"
          >
            Switch to Receive Money <FiArrowRight />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
          <FaExclamationTriangle className="text-xl flex-shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleRecordPayment}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Form Steps */}
          <div className="xl:col-span-2 space-y-5">
            
            {/* Step 1: Transaction Details */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  1
                </span>
                <h3 className="font-bold text-gray-800 text-sm">
                  Transaction Details
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Payee Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <FaUser className="text-red-500" />
                    Payee Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={payeeType}
                    onChange={(e) => {
                      setPayeeType(e.target.value);
                      setSelectedSupplier("");
                      setSelectedEmployee("");
                      setSelectedPoId("");
                      setPaymentAmount("");
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 bg-gray-50 transition-all cursor-pointer font-medium"
                    required
                  >
                    <option value="Supplier">Supplier (Against PO)</option>
                    <option value="Employee">Employee (Direct Payment)</option>
                  </select>
                </div>

                {/* Payment Account */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <FiCreditCard className="text-red-500" />
                    Payment Bank Account <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedBankAccountCode}
                    onChange={(e) => setSelectedBankAccountCode(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 bg-gray-50 transition-all cursor-pointer"
                    required
                  >
                    <option value="">Select Bank Account</option>
                    {accounts.map((acc) => (
                      <option key={acc.id || acc.accountCode} value={acc.accountCode}>
                        {getAccountLabel(acc)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <FiCalendar className="text-red-500" />
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 bg-gray-50 transition-all"
                    required
                  />
                </div>

                {/* Reference Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <FiHash className="text-red-500" />
                    Reference Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 bg-gray-50 transition-all font-semibold text-gray-800"
                    placeholder="REF-12345"
                    required
                  />
                </div>

                {/* Payment Method */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <FiCreditCard className="text-red-500" />
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 bg-gray-50 transition-all cursor-pointer"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Payee Information (Supplier / Employee) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  2
                </span>
                <h3 className="font-bold text-gray-800 text-sm">
                  {payeeType} Information
                </h3>
              </div>
              <div className="p-6 space-y-5">
                {payeeType === "Supplier" ? (
                  <>
                    {/* Supplier dropdown */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <FaBuilding className="text-red-500" />
                        Supplier <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedSupplier}
                        onChange={(e) => {
                          setSelectedSupplier(e.target.value);
                          setSelectedPoId("");
                        }}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 bg-gray-50 transition-all cursor-pointer"
                        required={payeeType === "Supplier"}
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map((sup) => {
                          const sId = getSupplierId(sup);
                          return (
                            <option key={sId} value={sId}>
                              {getSupplierName(sup)}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Purchase Order */}
                    {selectedSupplier && (
                      <div className="pt-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                          <FiFileText className="text-red-500" />
                          Purchase Order <span className="text-red-500">*</span>
                        </label>
                        {supplierPurchaseOrders.length === 0 ? (
                          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-medium">
                            <FaExclamationTriangle />
                            No outstanding purchase orders found for this supplier.
                          </div>
                        ) : (
                          <select
                            value={selectedPoId}
                            onChange={(e) => setSelectedPoId(e.target.value)}
                            className="w-full px-3 py-2.5 border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 bg-red-50/10 transition-all cursor-pointer font-semibold text-red-900"
                            required={payeeType === "Supplier"}
                          >
                            <option value="">Choose Purchase Order</option>
                            {supplierPurchaseOrders.map((po) => (
                              <option key={po.id} value={po.id}>
                                {po.purchaseOrderNumber || po.poNumber || `PO #${po.id}`} — Balance: Rs.{" "}
                                {Number(po.balanceDue).toFixed(2)}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Employee dropdown */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <FaUser className="text-red-500" />
                        Employee <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 bg-gray-50 transition-all cursor-pointer"
                        required={payeeType === "Employee"}
                      >
                        <option value="">Select Employee</option>
                        {employees.map((emp) => (
                          <option key={emp.employeeId} value={emp.employeeId}>
                            {emp.firstName} {emp.lastName} (NIC: {emp.nic})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Expense Category Dropdown */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                          <FaUniversity className="text-red-500" />
                          Expense Category Account <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedExpenseAccount}
                          onChange={(e) => setSelectedExpenseAccount(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 bg-gray-50 transition-all cursor-pointer"
                          required={payeeType === "Employee"}
                        >
                          <option value="">Select Expense Account</option>
                          {expenseAccounts.map((acc) => (
                            <option key={acc.id || acc.accountCode} value={acc.accountCode}>
                              {getAccountLabel(acc)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Payment Category Dropdown */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                          <FiFileText className="text-red-500" />
                          Payment Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={paymentCategory}
                          onChange={(e) => setPaymentCategory(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 bg-gray-50 transition-all cursor-pointer"
                          required
                        >
                          <option value="Salary Expense">Salary Expense</option>
                          <option value="Allowance">Allowance</option>
                          <option value="Reimbursement">Reimbursement</option>
                          <option value="Other Employee Payment">Other Employee Payment</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Step 3: Payment Amount (For Employee or when PO is selected) */}
            {(payeeType === "Employee" || (payeeType === "Supplier" && selectedPoId && currentPo)) && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <span className="w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    3
                  </span>
                  <h3 className="font-bold text-gray-800 text-sm">
                    Payment Amount
                  </h3>
                </div>
                <div className="p-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <FiDollarSign className="text-red-500" />
                      Amount to Pay <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 font-bold text-sm">
                        Rs.
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={payeeType === "Supplier" && currentPo ? Number(currentPo.balanceDue) : undefined}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 font-bold text-gray-900 transition-all"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    {payeeType === "Supplier" && currentPo && (
                      <p className="text-xs text-red-700 mt-1.5 font-semibold">
                        Maximum payable: Rs. {Number(currentPo.balanceDue).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <FiFileText className="text-red-500" />
                Description / Notes
              </label>
              <textarea
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 bg-gray-50 transition-all resize-none"
                rows="3"
                placeholder="Describe the nature of this payment transaction..."
              />
            </div>
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="space-y-5">
            {/* Purchase Order Summary Card (Only for Supplier POs) */}
            {payeeType === "Supplier" && selectedPoId && currentPo ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fadeIn">
                <div className="px-5 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                    Purchase Order Summary
                  </p>
                  <p className="text-lg font-bold mt-0.5">
                    {currentPo.purchaseOrderNumber || currentPo.poNumber || `PO #${currentPo.id}`}
                  </p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Total Amount</span>
                    <span className="font-bold text-gray-800">
                      Rs. {Number(currentPo.total || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="font-bold text-green-600">
                      Rs. {Number(currentPo.amountPaid || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-4">
                    <span className="text-gray-700 font-semibold">Balance Due</span>
                    <span className="font-extrabold text-red-600 text-base">
                      Rs. {Number(currentPo.balanceDue || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : payeeType === "Supplier" ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FiFileText className="text-gray-400 text-2xl" />
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  Select a supplier and purchase order to see the financial summary
                </p>
              </div>
            ) : null}

            {/* Direct Expense Summary Card (Only for Employees) */}
            {payeeType === "Employee" && selectedEmployee && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fadeIn">
                <div className="px-5 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                    Direct Payment Details
                  </p>
                  <p className="text-lg font-bold mt-0.5">
                    {employees.find((emp) => String(emp.employeeId) === String(selectedEmployee))?.firstName}{" "}
                    {employees.find((emp) => String(emp.employeeId) === String(selectedEmployee))?.lastName}
                  </p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Category</span>
                    <span className="font-bold text-gray-800">{paymentCategory}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Method</span>
                    <span className="font-bold text-gray-800">{paymentMethod}</span>
                  </div>
                  {selectedExpenseAccount && (
                    <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-3">
                      <span className="text-gray-500">Debit Account</span>
                      <span className="font-semibold text-gray-700 text-xs truncate max-w-[150px]">
                        {getAccountLabel(accounts.find(a => a.accountCode === selectedExpenseAccount) || {})}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Amount Confirmation */}
            {paymentAmount && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">
                  You are paying
                  {payeeType === "Supplier" && " against PO"}
                </p>
                <p className="text-3xl font-extrabold text-red-700">
                  Rs. {Number(paymentAmount || 0).toFixed(2)}
                </p>
                {payeeType === "Supplier" && selectedSupplier && (
                  <p className="text-xs text-red-500 mt-1">
                    to {getSupplierName(suppliers.find((s) => String(getSupplierId(s)) === String(selectedSupplier)) || {})}
                  </p>
                )}
                {payeeType === "Employee" && selectedEmployee && (
                  <p className="text-xs text-red-500 mt-1">
                    to {employees.find((emp) => String(emp.employeeId) === String(selectedEmployee))?.firstName}{" "}
                    {employees.find((emp) => String(emp.employeeId) === String(selectedEmployee))?.lastName}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 disabled:bg-red-300 disabled:cursor-not-allowed transition-all cursor-pointer text-sm"
                disabled={isSubmitting || (payeeType === "Supplier" && !selectedPoId) || (payeeType === "Employee" && !selectedEmployee)}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin" /> Recording Payment...
                  </>
                ) : (
                  <>
                    <FaMoneyBillWave /> Record Payment
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/supplier/purchase/all")}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer text-sm"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Transaction List Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">
              Recent Spend Money Transactions
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Review and reconcile recent outgoing payments made in the system
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          {pastTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-medium">
              No recent Spend Money transactions found.
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
                <tr>
                  <th className="px-6 py-4">Payment Date</th>
                  <th className="px-6 py-4">Payee Type</th>
                  <th className="px-6 py-4">Payee Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pastTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors font-medium">
                    <td className="px-6 py-4 text-gray-900">{tx.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        tx.payeeType === "Employee"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}>
                        {tx.payeeType === "Employee" ? <FaUser className="text-[10px]" /> : <FaBuilding className="text-[10px]" />}
                        {tx.payeeType || "Supplier"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{tx.payeeName || tx.description}</td>
                    <td className="px-6 py-4 text-gray-500">{tx.paymentCategory || "Supplier Payment"}</td>
                    <td className="px-6 py-4 text-gray-500">{tx.paymentMethod || "Bank Transfer"}</td>
                    <td className="px-6 py-4 font-semibold text-gray-700">{tx.referenceNumber || "-"}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">
                      Rs. {Number(tx.totalCredit).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Transaction"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpendMoney;