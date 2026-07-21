import React, { useState, useEffect } from "react";
import {
  FaSpinner,
  FaArrowLeft,
  FaExclamationTriangle,
  FaHandHoldingUsd,
  FaUser,
  FaUniversity,
} from "react-icons/fa";
import {
  FiCreditCard,
  FiCalendar,
  FiHash,
  FiFileText,
  FiArrowLeft,
  FiDollarSign,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../utils/api";
import Alert from "../Alert/Alert";

const ReceiveMoney = () => {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedSoId, setSelectedSoId] = useState("");
  const [selectedBankAccountCode, setSelectedBankAccountCode] = useState("");
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
  const token = sessionStorage.getItem("auth_token");

  const getCustomerId = (customer) =>
    customer.id ||
    customer.customerId ||
    customer.customer_id ||
    customer.customerID ||
    "";

  const getCustomerName = (customer) =>
    customer.customerName ||
    customer.name ||
    customer.companyName ||
    customer.email ||
    "Unnamed Customer";

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

  useEffect(() => {
    const fetchData = async () => {
      if (!companyId || !token) {
        Alert.error("Missing company ID or auth token. Please login again.");
        return;
      }

      setIsLoading(true);
      setErrorMsg("");

      try {
        const [accRes, custRes, soRes] = await Promise.all([
          fetch(`${apiUrl}/api/companies/${companyId}/accounts/active`, {
            headers: getAuthHeaders(),
          }),
          fetch(`${apiUrl}/api/customers/companies/${companyId}`, {
            headers: getAuthHeaders(),
          }),
          fetch(`${apiUrl}/api/sales-orders/company/${companyId}`, {
            headers: getAuthHeaders(),
          }),
        ]);

        if (accRes.ok) {
          const accData = await accRes.json();
          setAccounts(Array.isArray(accData) ? accData : accData?.data || []);
        }
        if (custRes.ok) {
          const custData = await custRes.json();
          setCustomers(Array.isArray(custData) ? custData : custData?.data || []);
        }
        if (soRes.ok) {
          const soData = await soRes.json();
          setSalesOrders(
            Array.isArray(soData)
              ? soData
              : soData?.data || soData?.salesOrders || []
          );
        }
      } catch (err) {
        console.error("Error loading receive money data:", err);
        setErrorMsg("Failed to load data from server. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [companyId, token]);

  const customerSalesOrders = salesOrders.filter(
    (so) =>
      String(so.customerId) === String(selectedCustomer) &&
      Number(so.balanceDue || 0) > 0
  );

  const currentSo = salesOrders.find(
    (so) => String(so.id) === String(selectedSoId)
  );

  useEffect(() => {
    if (currentSo) {
      setPaymentAmount(Number(currentSo.balanceDue || 0).toFixed(2));
    } else {
      setPaymentAmount("");
    }
  }, [selectedSoId, salesOrders]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();

    if (!selectedBankAccountCode) {
      Alert.error("Please select a deposit account.");
      return;
    }
    if (!selectedCustomer) {
      Alert.error("Please select a customer.");
      return;
    }
    if (!selectedSoId) {
      Alert.error("Please select a sales order.");
      return;
    }
    if (
      currentSo &&
      String(currentSo.customerId) !== String(selectedCustomer)
    ) {
      Alert.error(
        "Selected sales order does not belong to the selected customer."
      );
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.error("Please enter a valid amount greater than zero.");
      return;
    }
    if (currentSo && amount > Number(currentSo.balanceDue)) {
      Alert.error(
        `Amount cannot exceed the balance due of Rs. ${Number(currentSo.balanceDue).toFixed(2)}.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        amount,
        paymentAccountCode: selectedBankAccountCode,
        companyId: parseInt(companyId, 10),
      };

      const response = await fetch(
        `${apiUrl}/api/sales-orders/${selectedSoId}/pay`,
        { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(payload) }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Payment submission failed.");
      }

      Alert.success("Payment received and recorded successfully!");

      setSelectedCustomer("");
      setSelectedSoId("");
      setPaymentAmount("");
      setPaymentNote("");
      setReferenceNumber(`REF-${Math.floor(Date.now() / 1000)}`);

      const soRes = await fetch(
        `${apiUrl}/api/sales-orders/company/${companyId}`,
        { headers: getAuthHeaders() }
      );
      if (soRes.ok) {
        const soData = await soRes.json();
        setSalesOrders(
          Array.isArray(soData)
            ? soData
            : soData?.data || soData?.salesOrders || []
        );
      }
    } catch (err) {
      console.error("Receipt record error:", err);
      Alert.error(err.message || "Failed to record receipt.");
    } finally {
      setIsSubmitting(false);
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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <FaHandHoldingUsd className="text-green-600 text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Receive Money
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Record an incoming payment received from a customer sale order
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/bank/spend-money")}
            className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FiArrowLeft /> Switch to Spend Money
          </button>
          <button
            onClick={() => navigate("/customer/sales/all")}
            className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FaArrowLeft /> Back to Sales
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
          <FaExclamationTriangle className="text-xl flex-shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleRecordPayment}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="xl:col-span-2 space-y-5">

            {/* Step 1: Transaction Info */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  1
                </span>
                <h3 className="font-bold text-gray-800 text-sm">
                  Transaction Details
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Deposit Account */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <FiCreditCard className="text-green-500" />
                    Deposit Account <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedBankAccountCode}
                    onChange={(e) => setSelectedBankAccountCode(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-gray-50 transition-all cursor-pointer"
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts.map((acc) => (
                      <option key={acc.id || acc.accountCode} value={acc.accountCode}>
                        {getAccountLabel(acc)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Receipt Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <FiCalendar className="text-green-500" />
                    Receipt Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-gray-50 transition-all"
                    required
                  />
                </div>

                {/* Reference Number */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <FiHash className="text-green-500" />
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-gray-50 transition-all"
                    placeholder="e.g. REF-12345"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Customer & Sales Order */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  2
                </span>
                <h3 className="font-bold text-gray-800 text-sm">
                  Customer & Sales Order
                </h3>
              </div>
              <div className="p-6 space-y-5">
                {/* Customer */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <FaUser className="text-green-500" />
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => {
                      setSelectedCustomer(e.target.value);
                      setSelectedSoId("");
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-gray-50 transition-all cursor-pointer"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map((cust) => {
                      const cId = getCustomerId(cust);
                      return (
                        <option key={cId} value={cId}>
                          {getCustomerName(cust)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Sales Order (shown only after customer selected) */}
                {selectedCustomer && (
                  <div className="pt-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <FiFileText className="text-green-500" />
                      Sales Order <span className="text-red-500">*</span>
                    </label>
                    {customerSalesOrders.length === 0 ? (
                      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-medium">
                        <FaExclamationTriangle />
                        No outstanding sales orders found for this customer.
                      </div>
                    ) : (
                      <select
                        value={selectedSoId}
                        onChange={(e) => setSelectedSoId(e.target.value)}
                        className="w-full px-3 py-2.5 border border-green-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-green-50/30 transition-all cursor-pointer"
                        required
                      >
                        <option value="">Choose Sales Order</option>
                        {customerSalesOrders.map((so) => (
                          <option key={so.id} value={so.id}>
                            {so.soNumber || `SO #${so.id}`} — Balance: Rs.{" "}
                            {Number(so.balanceDue).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Payment Amount (shown after SO selected) */}
            {selectedSoId && currentSo && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    3
                  </span>
                  <h3 className="font-bold text-gray-800 text-sm">
                    Amount Received
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <FiDollarSign className="text-green-500" />
                      Amount to Receive <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 font-bold text-sm">
                        Rs.
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={Number(currentSo.balanceDue)}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 font-bold text-gray-900 transition-all"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <p className="text-xs text-green-700 mt-1.5 font-medium">
                      Maximum receivable: Rs. {Number(currentSo.balanceDue).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <FiFileText className="text-green-500" />
                Description / Notes
              </label>
              <textarea
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-gray-50 transition-all resize-none"
                rows="3"
                placeholder="Describe the nature of this receipt transaction..."
              />
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-5">
            {/* SO Financial Summary Card */}
            {selectedSoId && currentSo ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                    Sales Order Summary
                  </p>
                  <p className="text-lg font-bold mt-0.5">
                    {currentSo.soNumber || `SO #${currentSo.id}`}
                  </p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Total Invoice</span>
                    <span className="font-bold text-gray-800">
                      Rs. {Number(currentSo.total || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Amount Received</span>
                    <span className="font-bold text-green-600">
                      Rs. {Number(currentSo.amountPaid || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-4">
                    <span className="text-gray-700 font-semibold">Balance Due</span>
                    <span className="font-extrabold text-red-600 text-base">
                      Rs. {Number(currentSo.balanceDue || 0).toFixed(2)}
                    </span>
                  </div>
                  {(currentSo.dueDate || currentSo.issueDate) && (
                    <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-3">
                      <span className="text-gray-500">Due Date</span>
                      <span className="font-semibold text-gray-700">
                        {currentSo.dueDate || currentSo.issueDate}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FiFileText className="text-gray-400 text-2xl" />
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  Select a customer and sales order to see the financial summary
                </p>
              </div>
            )}

            {/* Amount Confirmation */}
            {selectedSoId && currentSo && paymentAmount && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">
                  You are receiving
                </p>
                <p className="text-3xl font-extrabold text-green-700">
                  Rs. {Number(paymentAmount || 0).toFixed(2)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  from{" "}
                  {getCustomerName(
                    customers.find(
                      (c) =>
                        String(getCustomerId(c)) === String(selectedCustomer)
                    ) || {}
                  )}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 disabled:bg-green-300 disabled:cursor-not-allowed transition-all cursor-pointer text-sm"
                disabled={isSubmitting || !selectedSoId}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin" /> Recording Receipt...
                  </>
                ) : (
                  <>
                    <FaHandHoldingUsd /> Record Receipt
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/customer/sales/all")}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer text-sm"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReceiveMoney;