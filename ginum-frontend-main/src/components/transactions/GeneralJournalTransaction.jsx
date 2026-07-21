import React, { useState, useEffect } from "react";
import { FaTimes, FaSpinner } from "react-icons/fa";
import { FiArrowLeft, FiPlusCircle, FiTrash2, FiRefreshCw } from "react-icons/fi";
import { MdSwapHoriz } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import AddAccountForm from "../account/AddAccountForm";
import NewProjectForm from "../projects/NewProjectForm";
import api from "../../utils/api";
import Alert from "../Alert/Alert";

const tinyInput =
  "w-full px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-400 bg-white transition-all";

const CreateGeneralJournalTransaction = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState([
    { account: "", debit: "", credit: "", quantity: "", description: "", project: "" },
  ]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState(`TXN-${Math.floor(Date.now() / 1000)}`);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);
  const [transactionDescription, setTransactionDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [accounts, setAccounts] = useState([]);
  const [accountsError, setAccountsError] = useState(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  const [projects, setProjects] = useState([]);
  const [projectsError, setProjectsError] = useState(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [outOfBalance, setOutOfBalance] = useState(0);

  useEffect(() => {
    let debit = 0;
    let credit = 0;
    rows.forEach((row) => {
      const d = parseFloat(row.debit);
      const c = parseFloat(row.credit);
      if (!isNaN(d)) debit += d;
      if (!isNaN(c)) credit += c;
    });
    setTotalDebit(debit);
    setTotalCredit(credit);
    setOutOfBalance(Math.abs(debit - credit));
  }, [rows]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setIsLoadingAccounts(true);
        setAccountsError(null);
        const companyId = sessionStorage.getItem("companyId");
        if (!companyId) throw new Error("Company ID not found");
        const response = await api.get(`/api/companies/${companyId}/accounts/active`);
        let accountsData = response.data || response;
        if (response?.data?.data && Array.isArray(response.data.data)) accountsData = response.data.data;
        if (!Array.isArray(accountsData)) throw new Error("Invalid format");
        setAccounts(
          accountsData.map((account) => ({
            id: account.id,
            name: `${account.accountCode} - ${account.accountName}`,
            accountCode: account.accountCode,
            currentBalance: account.currentBalance,
          }))
        );
      } catch (error) {
        setAccountsError(error.message);
        setAccounts([]);
      } finally {
        setIsLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoadingProjects(true);
        setProjectsError(null);
        const companyId = sessionStorage.getItem("companyId");
        const token = sessionStorage.getItem("auth_token") || sessionStorage.getItem("token");
        if (!companyId || !token) throw new Error("Credentials not found");
        const response = await api.get(`/api/companies/${companyId}/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let projectsData = response.data || response;
        if (projectsData?.data && Array.isArray(projectsData.data)) projectsData = projectsData.data;
        if (!Array.isArray(projectsData)) throw new Error("Invalid format");
        setProjects(projectsData);
      } catch (error) {
        setProjectsError("Failed to load projects.");
        setProjects([]);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  const handleRowChange = (index, field, value) => {
    const updatedRows = [...rows];
    if (field === "debit" && value.trim() !== "") updatedRows[index].credit = "";
    else if (field === "credit" && value.trim() !== "") updatedRows[index].debit = "";
    updatedRows[index][field] = value;
    if (index === rows.length - 1 && value.trim() !== "") {
      updatedRows.push({ account: "", debit: "", credit: "", quantity: "", description: "", project: "" });
    }
    setRows(updatedRows);
  };

  const removeRow = (index) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const addRow = () => {
    setRows([...rows, { account: "", debit: "", credit: "", quantity: "", description: "", project: "" }]);
  };

  const resetForm = () => {
    setRows([{ account: "", debit: "", credit: "", quantity: "", description: "", project: "" }]);
    setReferenceNumber(`TXN-${Math.floor(Date.now() / 1000)}`);
    setTransactionDate(new Date().toISOString().split("T")[0]);
    setTransactionDescription("");
  };

  const handleSaveTransaction = async () => {
    const companyId = sessionStorage.getItem("companyId");
    const token = sessionStorage.getItem("auth_token") || sessionStorage.getItem("token");

    const validEntries = rows.filter(
      (row) => row.account !== "" && (row.debit !== "" || row.credit !== "")
    );

    if (validEntries.length === 0) {
      Alert.error("Please add at least one valid entry with an account and amount.");
      return;
    }
    if (!referenceNumber.trim()) {
      Alert.error("Reference number is required.");
      return;
    }
    if (outOfBalance > 0.001) {
      Alert.error("Transaction is out of balance. Total debit must equal total credit.");
      return;
    }

    const transactionData = {
      referenceNumber,
      date: transactionDate,
      description: transactionDescription,
      entries: validEntries,
      totalDebit,
      totalCredit,
    };

    try {
      setIsSaving(true);
      await api.post(`/api/transactions/companies/${companyId}`, transactionData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      Alert.success("Transaction saved successfully!");
      navigate("/transactions/all");
    } catch (error) {
      console.error("Save failed:", error);
      if (error.response) {
        Alert.error(`Failed to save: ${error.response.data?.message || error.response.statusText || "Server Error"}`);
      } else {
        Alert.error("Failed to connect to the server. Check your network.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isBalanced = outOfBalance <= 0.001 && totalDebit > 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 max-w-5xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <MdSwapHoriz className="text-blue-600 text-2xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              General Journal Entry
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Record a manual double-entry accounting transaction
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/transactions/all")}
          className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <FiArrowLeft /> Back to Transactions
        </button>
      </div>

      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Transaction Header Info */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
            <h3 className="font-bold text-gray-800 text-sm">Transaction Details</h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Reference Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-gray-50"
                placeholder="e.g. TXN-001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={transactionDescription}
                onChange={(e) => setTransactionDescription(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-gray-50"
                placeholder="Brief description of transaction..."
              />
            </div>
          </div>
        </div>

        {/* Journal Entries Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
              <h3 className="font-bold text-gray-800 text-sm">Journal Entries</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAccountModal(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <FiPlusCircle /> Add Account
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => setShowProjectModal(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <FiPlusCircle /> Add Project
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 min-w-[180px]">
                    Account <span className="text-red-400">*</span>
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 min-w-[110px]">
                    Debit (Rs.) <span className="text-red-400">*</span>
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 min-w-[110px]">
                    Credit (Rs.) <span className="text-red-400">*</span>
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 min-w-[80px]">
                    Quantity
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 min-w-[150px]">
                    Description
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 min-w-[130px]">
                    Project
                  </th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row, index) => (
                  <tr key={index} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <select
                        value={row.account}
                        onChange={(e) => handleRowChange(index, "account", e.target.value)}
                        className={tinyInput}
                        disabled={isLoadingAccounts}
                      >
                        <option value="">Select Account</option>
                        {isLoadingAccounts ? (
                          <option disabled>Loading...</option>
                        ) : accountsError ? (
                          <option disabled>Error loading</option>
                        ) : accounts.length === 0 ? (
                          <option disabled>No accounts</option>
                        ) : (
                          accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                          ))
                        )}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={row.debit}
                        onChange={(e) => handleRowChange(index, "debit", e.target.value)}
                        disabled={row.credit.trim() !== ""}
                        className={`${tinyInput} ${row.credit.trim() !== "" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}`}
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={row.credit}
                        onChange={(e) => handleRowChange(index, "credit", e.target.value)}
                        disabled={row.debit.trim() !== ""}
                        className={`${tinyInput} ${row.debit.trim() !== "" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}`}
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        placeholder="0"
                        value={row.quantity}
                        onChange={(e) => handleRowChange(index, "quantity", e.target.value)}
                        className={tinyInput}
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="text"
                        placeholder="Note..."
                        value={row.description}
                        onChange={(e) => handleRowChange(index, "description", e.target.value)}
                        className={tinyInput}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={row.project}
                        onChange={(e) => handleRowChange(index, "project", e.target.value)}
                        className={tinyInput}
                        disabled={isLoadingProjects}
                      >
                        <option value="">No project</option>
                        {isLoadingProjects ? (
                          <option disabled>Loading...</option>
                        ) : projects.length === 0 ? (
                          <option disabled>No projects</option>
                        ) : (
                          projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.projectName || p.name}
                            </option>
                          ))
                        )}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-1"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Row */}
          <div className="px-6 py-3 border-t border-gray-100">
            <button
              type="button"
              onClick={addRow}
              className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <FiPlusCircle /> Add Another Line
            </button>
          </div>
        </div>

        {/* Balance Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider">Total Debit</p>
                <p className="text-lg font-extrabold text-blue-700 mt-1">Rs. {totalDebit.toFixed(2)}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <p className="text-xs text-green-500 font-semibold uppercase tracking-wider">Total Credit</p>
                <p className="text-lg font-extrabold text-green-700 mt-1">Rs. {totalCredit.toFixed(2)}</p>
              </div>
              <div className={`text-center p-3 rounded-xl col-span-2 ${isBalanced ? "bg-green-50" : "bg-red-50"}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${isBalanced ? "text-green-500" : "text-red-500"}`}>
                  {isBalanced ? "✓ Balanced" : "Out of Balance"}
                </p>
                <p className={`text-lg font-extrabold mt-1 ${isBalanced ? "text-green-700" : "text-red-700"}`}>
                  Rs. {outOfBalance.toFixed(2)}
                </p>
                {!isBalanced && outOfBalance > 0 && (
                  <p className="text-xs text-red-500 mt-1">Debit must equal Credit</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={resetForm}
            disabled={isSaving}
            className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FiRefreshCw className="text-sm" /> Reset
          </button>
          <button
            type="button"
            onClick={handleSaveTransaction}
            disabled={!isBalanced || isSaving}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20 disabled:bg-blue-300 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? (
              <><FaSpinner className="animate-spin" /> Saving...</>
            ) : (
              "Save Transaction"
            )}
          </button>
        </div>
      </div>

      {/* Account Modal */}
      {showAccountModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAccountModal(false); }}
        >
          <div className="w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3 max-h-[90vh] overflow-y-auto relative rounded-2xl">
            <button
              type="button"
              className="absolute top-4 right-4 text-gray-600 text-xl z-10 hover:text-red-500 cursor-pointer"
              onClick={() => setShowAccountModal(false)}
            >
              <FaTimes />
            </button>
            <div className="p-2">
              <AddAccountForm />
            </div>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowProjectModal(false); }}
        >
          <div className="w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3 max-h-[90vh] overflow-y-auto relative rounded-2xl">
            <button
              type="button"
              className="absolute top-4 right-4 text-gray-600 text-xl z-10 hover:text-red-500 cursor-pointer"
              onClick={() => setShowProjectModal(false)}
            >
              <FaTimes />
            </button>
            <div className="p-2">
              <NewProjectForm />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateGeneralJournalTransaction;