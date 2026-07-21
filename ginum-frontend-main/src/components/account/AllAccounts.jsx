import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiPower,
  FiRefreshCw,
  FiCreditCard,
  FiDollarSign,
  FiTag,
  FiLayers,
  FiHash,
  FiX
} from "react-icons/fi";
import Alert from "../../components/Alert/Alert";
import { apiUrl } from "../../utils/api";

const AllAccounts = () => {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditAccount, setCurrentEditAccount] = useState(null);
  const [editFormData, setEditFormData] = useState({
    accountName: "",
    subAccountName: "",
    accountType: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError("");

      const companyId = sessionStorage.getItem("companyId");
      const token = sessionStorage.getItem("auth_token");

      if (!companyId || !token) {
        setError("Missing company ID or auth token. Please login again.");
        return;
      }

      const response = await fetch(
        `${apiUrl}/api/companies/${companyId}/accounts`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error:", errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
      setError("Failed to fetch accounts. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filteredAccounts = accounts.filter((account) => {
    const searchLower = searchTerm.toLowerCase();

    return (
      (account.accountName || "").toLowerCase().includes(searchLower) ||
      (account.subAccountName || "").toLowerCase().includes(searchLower) ||
      (account.accountType || "").toLowerCase().includes(searchLower) ||
      (account.accountCode || "").toLowerCase().includes(searchLower) ||
      String(account.currentBalance || "").includes(searchLower)
    );
  });

  const formatAccountType = (type) => {
    if (!type) return "-";
    return type
      .toString()
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatAmount = (amount) => {
    const value = Number(amount || 0);
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleEdit = (account) => {
    setCurrentEditAccount(account);
    setEditFormData({
      accountName: account.accountName || "",
      subAccountName: account.subAccountName || "",
      accountType: account.accountType || ""
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentEditAccount(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const companyId = sessionStorage.getItem("companyId");
      const token = sessionStorage.getItem("auth_token");

      if (!companyId || !token) {
        Alert.error("Session missing. Please log in.");
        return;
      }

      const response = await fetch(`${apiUrl}/api/companies/${companyId}/accounts/${currentEditAccount.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });

      if (!response.ok) {
        const errText = await response.text();
        let errMsg = "Failed to update account";
        try {
          const errData = JSON.parse(errText);
          errMsg = errData.error || errMsg;
        } catch (e) {
          errMsg = errText;
        }
        throw new Error(errMsg);
      }

      Alert.success("Account updated successfully.");
      handleCloseEditModal();
      fetchAccounts();
    } catch (err) {
      console.error(err);
      Alert.error(err.message || "Failed to update account");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (account) => {
    try {
      const companyId = sessionStorage.getItem("companyId");
      const token = sessionStorage.getItem("auth_token");

      if (!companyId || !token) {
        Alert.error("Session missing. Please log in.");
        return;
      }

      const newStatus = account.active === false ? true : false;
      const response = await fetch(`${apiUrl}/api/companies/${companyId}/accounts/${account.id}/active?active=${newStatus}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        let errMsg = "Failed to update status";
        try {
          const errData = JSON.parse(errText);
          errMsg = errData.error || errMsg;
        } catch (e) {
          errMsg = errText;
        }
        throw new Error(errMsg);
      }

      Alert.success(`Account ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      fetchAccounts();
    } catch (err) {
      console.error(err);
      Alert.error(err.message || "Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-4 mt-6">
        <p className="font-bold">Error</p>
        <p>{error}</p>
        <button
          type="button"
          onClick={fetchAccounts}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
        >
          <FiRefreshCw /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          Accounts
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>

            <input
              type="text"
              placeholder="Search accounts..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => navigate("/account/new")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <FiPlus /> Add Account
          </button>
        </div>
      </div>

      {filteredAccounts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
            <FiCreditCard size={30} />
          </div>

          <p className="text-gray-600 text-lg">
            {accounts.length === 0
              ? "No accounts found."
              : "No matching accounts found."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/account/new")}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <FiPlus /> Add New Account
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Sub Account
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccounts.map((account) => (
                  <tr
                    key={account.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <FiCreditCard size={20} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {account.accountName || "-"}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <FiTag className="mr-1" size={14} />
                            ID: {account.id || "-"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <FiHash className="mr-2" size={14} />
                        {account.accountCode || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <FiLayers className="mr-2" size={14} />
                        {formatAccountType(account.accountType)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">
                        {account.subAccountName || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900 flex items-center justify-end">
                        <FiDollarSign className="mr-1" size={14} />
                        {formatAmount(account.currentBalance)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${account.active === false ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {account.active === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(account)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <FiEdit size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(account)}
                          className={`${account.active === false ? 'text-green-600 hover:text-green-900 hover:bg-green-50' : 'text-red-600 hover:text-red-900 hover:bg-red-50'} p-1 rounded-full transition-colors`}
                          title={account.active === false ? "Activate" : "Deactivate"}
                        >
                          <FiPower size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-6 py-3 text-sm text-gray-600">
            Showing {filteredAccounts.length} of {accounts.length} accounts
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-black bg-opacity-50">
          <div className="relative w-full max-w-md mx-auto my-6">
            <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
              <div className="flex items-start justify-between p-5 border-b border-solid rounded-t border-blueGray-200">
                <h3 className="text-2xl font-semibold">Edit Account</h3>
                <button
                  className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                  onClick={handleCloseEditModal}
                >
                  <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                    ×
                  </span>
                </button>
                <button
                  type="button"
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                  onClick={handleCloseEditModal}
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveEdit}>
                <div className="relative p-6 flex-auto space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
                    <input
                      type="text"
                      name="accountName"
                      required
                      value={editFormData.accountName}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub Account Name</label>
                    <input
                      type="text"
                      name="subAccountName"
                      value={editFormData.subAccountName}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Type *</label>
                    <select
                      name="accountType"
                      required
                      value={editFormData.accountType}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Type</option>
                      <option value="ASSET_BANK">Bank (Asset)</option>
                      <option value="ASSET_ACCOUNT_RECEIVABLE">Accounts Receivable (Asset)</option>
                      <option value="ASSET_OTHER_CURRENT_ASSET">Other Current Asset</option>
                      <option value="ASSET_FIXED_ASSET">Fixed Asset</option>
                      <option value="ASSET_OTHER_ASSET">Other Asset</option>
                      <option value="LIABILITY_ACCOUNTS_PAYABLE">Accounts Payable (Liability)</option>
                      <option value="LIABILITY_CREDIT_CARD">Credit Card (Liability)</option>
                      <option value="LIABILITY_OTHER_CURRENT_LIABILITY">Other Current Liability</option>
                      <option value="LIABILITY_LONG_TERM_LIABILITY">Long Term Liability</option>
                      <option value="LIABILITY_OTHER_LIABILITY">Other Liability</option>
                      <option value="EQUITY">Equity</option>
                      <option value="INCOME">Income</option>
                      <option value="OTHER_INCOME">Other Income</option>
                      <option value="COST_OF_SALES">Cost of Sales</option>
                      <option value="EXPENSE">Expense</option>
                      <option value="OTHER_EXPENSE">Other Expense</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end p-6 border-t border-solid rounded-b border-blueGray-200">
                  <button
                    className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    type="button"
                    onClick={handleCloseEditModal}
                    disabled={isSaving}
                  >
                    Close
                  </button>
                  <button
                    className="bg-blue-600 text-white active:bg-blue-700 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 disabled:bg-blue-300"
                    type="submit"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllAccounts;