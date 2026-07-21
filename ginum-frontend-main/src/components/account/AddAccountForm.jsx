import React, { useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { FiBook, FiDollarSign, FiTag, FiLayers } from "react-icons/fi";
import api from "../../utils/api";
import Alert from "../../components/Alert/Alert";

const accountTypeMap = {
  Bank: "ASSET_BANK",
  "Account Receivable": "ASSET_ACCOUNT_RECEIVABLE",
  "Other Current Asset": "ASSET_OTHER_CURRENT_ASSET",
  "Fixed Asset": "ASSET_FIXED_ASSET",
  "Other Asset": "ASSET_OTHER_ASSET",
  "Credit Card": "LIABILITY_CREDIT_CARD",
  "Accounts Payable": "LIABILITY_ACCOUNTS_PAYABLE",
  "Other Current Liability": "LIABILITY_OTHER_CURRENT_LIABILITY",
  "Long Term Liability": "LIABILITY_LONG_TERM_LIABILITY",
  "Other Liability": "LIABILITY_OTHER_LIABILITY",
  Equity: "EQUITY",
  Income: "INCOME",
  Expense: "EXPENSE",
  "Cost of Sales": "COST_OF_SALES",
  "Other Income": "OTHER_INCOME",
  "Other Expense": "OTHER_EXPENSE",
};

const inputClass =
  "w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-gray-50 transition-all";

const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

const AddAccountForm = () => {
  const [accountType, setAccountType] = useState("");
  const [accountName, setAccountName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [subAccount, setSubAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!accountType) e.accountType = "Account category is required";
    if (!accountName.trim()) e.accountName = "Account name is required";
    if (accountType === "Bank") {
      if (!bankName.trim()) e.bankName = "Bank name is required";
      if (!bankAccountNumber.trim()) e.bankAccountNumber = "Account number is required";
      if (!bankBranch.trim()) e.bankBranch = "Branch is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const companyId = sessionStorage.getItem("companyId");
    const token = sessionStorage.getItem("auth_token");

    if (!companyId || !token) {
      Alert.error("Session expired. Please login again.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(
        `/api/companies/${companyId}/accounts`,
        {
          accountName: accountName.trim(),
          accountType: accountTypeMap[accountType] || accountType.toUpperCase(),
          currentBalance: parseFloat(openingBalance) || 0,
          subAccountName: subAccount.trim(),
        },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      Alert.success("Account added successfully!");
      setAccountType("");
      setAccountName("");
      setOpeningBalance("");
      setSubAccount("");
      setBankName("");
      setBankAccountNumber("");
      setBankBranch("");
      setErrors({});
    } catch (err) {
      Alert.error("Failed to add account. Please check your input.");
      console.error("API Error:", err.response?.data || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <FiBook className="text-blue-600 text-lg" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">New Account</h2>
          <p className="text-xs text-gray-500 mt-0.5">Add a new chart of account entry</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Account Category */}
        <div>
          <label className={labelClass}>
            Account Category <span className="text-red-500">*</span>
          </label>
          <select
            value={accountType}
            onChange={(e) => {
              setAccountType(e.target.value);
              setErrors((prev) => ({ ...prev, accountType: "" }));
            }}
            className={`${inputClass} cursor-pointer ${errors.accountType ? "border-red-400" : ""}`}
            disabled={isSubmitting}
          >
            <option value="">Select Category</option>
            <optgroup label="Assets">
              <option value="Bank">Bank</option>
              <option value="Account Receivable">Account Receivable</option>
              <option value="Other Current Asset">Other Current Asset</option>
              <option value="Fixed Asset">Fixed Asset</option>
              <option value="Other Asset">Other Asset</option>
            </optgroup>
            <optgroup label="Liabilities">
              <option value="Credit Card">Credit Card</option>
              <option value="Accounts Payable">Accounts Payable</option>
              <option value="Other Current Liability">Other Current Liability</option>
              <option value="Long Term Liability">Long Term Liability</option>
              <option value="Other Liability">Other Liability</option>
            </optgroup>
            <optgroup label="Other">
              <option value="Equity">Equity</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
              <option value="Cost of Sales">Cost of Sales</option>
              <option value="Other Income">Other Income</option>
              <option value="Other Expense">Other Expense</option>
            </optgroup>
          </select>
          {errors.accountType && (
            <p className="text-red-500 text-xs mt-1">{errors.accountType}</p>
          )}
        </div>

        {/* Account Name */}
        <div>
          <label className={labelClass}>
            Account Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => {
              setAccountName(e.target.value);
              setErrors((prev) => ({ ...prev, accountName: "" }));
            }}
            className={`${inputClass} ${errors.accountName ? "border-red-400" : ""}`}
            placeholder="e.g. Cash in Hand"
            disabled={isSubmitting}
          />
          {errors.accountName && (
            <p className="text-red-500 text-xs mt-1">{errors.accountName}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sub Account */}
          <div>
            <label className={labelClass}>Sub Account</label>
            <input
              type="text"
              value={subAccount}
              onChange={(e) => setSubAccount(e.target.value)}
              className={inputClass}
              placeholder="Optional sub-account name"
              disabled={isSubmitting}
            />
          </div>

          {/* Opening Balance */}
          <div>
            <label className={labelClass}>Opening Balance (Rs.)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-sm font-semibold">
                Rs.
              </div>
              <input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className={`${inputClass} pl-10`}
                placeholder="0.00"
                step="0.01"
                min="0"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Bank-specific fields */}
        {accountType === "Bank" && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-4">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Bank Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => {
                    setBankName(e.target.value);
                    setErrors((prev) => ({ ...prev, bankName: "" }));
                  }}
                  className={`${inputClass} ${errors.bankName ? "border-red-400" : ""}`}
                  placeholder="e.g. Bank of Ceylon"
                  disabled={isSubmitting}
                />
                {errors.bankName && (
                  <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => {
                    setBankAccountNumber(e.target.value);
                    setErrors((prev) => ({ ...prev, bankAccountNumber: "" }));
                  }}
                  className={`${inputClass} ${errors.bankAccountNumber ? "border-red-400" : ""}`}
                  placeholder="e.g. 1234567890"
                  disabled={isSubmitting}
                />
                {errors.bankAccountNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.bankAccountNumber}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Bank Branch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankBranch}
                  onChange={(e) => {
                    setBankBranch(e.target.value);
                    setErrors((prev) => ({ ...prev, bankBranch: "" }));
                  }}
                  className={`${inputClass} ${errors.bankBranch ? "border-red-400" : ""}`}
                  placeholder="e.g. Colombo Main Branch"
                  disabled={isSubmitting}
                />
                {errors.bankBranch && (
                  <p className="text-red-500 text-xs mt-1">{errors.bankBranch}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20 disabled:bg-blue-300 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin" /> Saving...
              </>
            ) : (
              "Save Account"
            )}
          </button>
        </div>
      </form>
        </div>
      </div>
    </div>
  );
};

export default AddAccountForm;
