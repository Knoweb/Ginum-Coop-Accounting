import React, { useState, useEffect, useMemo } from "react";
import {
  MdSearch,
  MdAccountBalanceWallet,
  MdRefresh,
  MdArrowUpward,
  MdArrowDownward,
  MdFilterList,
  MdDateRange,
  MdReceipt,
} from "react-icons/md";
import { FaFileCsv } from "react-icons/fa";
import { apiUrl } from "../../utils/api";
import Alert from "../Alert/Alert";

function BankReconsilation() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [contactSearch, setContactSearch] = useState("");

  // Pagination states
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const getCompanyId = () => sessionStorage.getItem("companyId");
  const getToken = () => sessionStorage.getItem("auth_token") || sessionStorage.getItem("token");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
    Accept: "application/json",
  });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const companyId = getCompanyId();
      if (!companyId) {
        Alert.error("Session expired. Please log in again.");
        return;
      }

      const response = await fetch(`${apiUrl}/api/transactions/companies/${companyId}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Reconciliation raw transactions loaded:", data);
        setTransactions(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch transactions");
        Alert.error("Failed to load bank reconciliation records.");
      }
    } catch (error) {
      console.error("Error connecting to API:", error);
      Alert.error("Network error. Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Helpers to classify transactions, parse contact name, and calculate amounts
  const getTransactionType = (t) => {
    if (t.totalCredit > 0 && t.totalDebit === 0) return "SPEND";
    if (t.totalDebit > 0 && t.totalCredit === 0) return "RECEIVE";
    const desc = (t.description || "").toLowerCase();
    if (desc.includes("spend") || desc.includes("payment")) return "SPEND";
    if (desc.includes("receive") || desc.includes("receipt")) return "RECEIVE";
    return t.totalCredit > t.totalDebit ? "SPEND" : "RECEIVE";
  };

  const getContactName = (t) => {
    if (t.payeeName) return t.payeeName;
    const desc = t.description || "";
    if (desc.includes("Receive Money - ")) {
      const parts = desc.split("Receive Money - ");
      if (parts[1]) {
        return parts[1].split(" (SO:")[0];
      }
    }
    if (desc.includes("Spend Money - ")) {
      const parts = desc.split("Spend Money - ");
      if (parts[1]) {
        return parts[1].split(" (PO:")[0];
      }
    }
    return "-";
  };

  const getAmount = (t, type) => {
    return type === "SPEND"
      ? Number(t.totalCredit || t.totalDebit || 0)
      : Number(t.totalDebit || t.totalCredit || 0);
  };

  const formatCurrency = (value) => {
    return `Rs. ${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Process data with filtering
  const processedTransactions = useMemo(() => {
    return transactions.map((t) => {
      const type = getTransactionType(t);
      const contact = getContactName(t);
      const amount = getAmount(t, type);

      return {
        ...t,
        type,
        contact,
        amount,
      };
    });
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return processedTransactions.filter((t) => {
      // 1. General search term (reference or description)
      const descMatch = (t.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const refMatch = (t.referenceNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (searchTerm && !descMatch && !refMatch) return false;

      // 2. Transaction Type
      if (typeFilter !== "ALL" && t.type !== typeFilter) return false;

      // 3. Contact (Customer/Supplier) Search
      if (contactSearch && !(t.contact || "").toLowerCase().includes(contactSearch.toLowerCase())) {
        return false;
      }

      // 4. Date Range
      if (startDate && t.date && t.date < startDate) return false;
      if (endDate && t.date && t.date > endDate) return false;

      return true;
    });
  }, [processedTransactions, searchTerm, typeFilter, contactSearch, startDate, endDate]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalSpend = 0;
    let totalReceive = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === "SPEND") {
        totalSpend += t.amount;
      } else {
        totalReceive += t.amount;
      }
    });

    return {
      totalSpend,
      totalReceive,
      balance: totalReceive - totalSpend,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Paginated list
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, page]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, typeFilter, contactSearch, startDate, endDate]);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      Alert.error("No transactions to export.");
      return;
    }

    const headers = ["Date", "Reference", "Contact (Customer/Supplier)", "Description", "Type", "Amount"];
    const rows = filteredTransactions.map((t) => [
      t.date || "-",
      t.referenceNumber || "-",
      t.contact,
      t.description || "-",
      t.type,
      t.amount,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bank-reconciliation-report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    Alert.success("Transactions exported successfully.");
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6 max-w-full overflow-x-hidden">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2.5">
            <MdAccountBalanceWallet className="text-blue-600" />
            Bank Reconciliation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Reconcile recent payments and receipts from Sales, Purchases, and general journals
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <button
            onClick={fetchTransactions}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 font-medium transition-all shadow-sm"
          >
            <MdRefresh className={`${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 font-medium transition-all shadow-md shadow-blue-500/10"
          >
            <FaFileCsv />
            Export CSV
          </button>
        </div>
      </div>

      {/* Aggregated Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <SummaryCard
          title="Total Cash Received"
          value={formatCurrency(stats.totalReceive)}
          description="Debits to bank accounts"
          icon={<MdArrowUpward className="text-green-500" />}
          bgColor="bg-green-50/50 border-green-500"
          valueColor="text-green-700"
        />
        <SummaryCard
          title="Total Cash Spent"
          value={formatCurrency(stats.totalSpend)}
          description="Credits to bank accounts"
          icon={<MdArrowDownward className="text-red-500" />}
          bgColor="bg-red-50/50 border-red-500"
          valueColor="text-red-700"
        />
        <SummaryCard
          title="Net Reconciliation Balance"
          value={formatCurrency(stats.balance)}
          description="Net bank flow impact"
          icon={<MdAccountBalanceWallet className="text-blue-500" />}
          bgColor="bg-blue-50/50 border-blue-500"
          valueColor="text-blue-700"
        />
        <SummaryCard
          title="Reconciled Transactions"
          value={`${stats.count} Records`}
          description="Matching bank records found"
          icon={<MdReceipt className="text-indigo-500" />}
          bgColor="bg-indigo-50/50 border-indigo-500"
          valueColor="text-indigo-700"
        />
      </div>

      {/* Advanced Filters Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 text-gray-800 font-bold text-base pb-2 border-b border-gray-100">
          <MdFilterList /> Filter Transactions
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Term Search */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Search Reference/Desc</label>
            <div className="relative">
              <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="REF-xxxxx..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
          </div>

          {/* Contact Search */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer/Supplier</label>
            <div className="relative">
              <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Contact name..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Transaction Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="RECEIVE">RECEIVE (Money Received)</option>
              <option value="SPEND">SPEND (Money Spent)</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <MdDateRange /> From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <MdDateRange /> To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
          </div>
        </div>

        {/* Clear filters shortcut */}
        {(searchTerm || typeFilter !== "ALL" || contactSearch || startDate || endDate) && (
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("ALL");
                setContactSearch("");
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Reference</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Customer / Supplier</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Description</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-600 font-medium">Reconciling transaction records...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedList.length > 0 ? (
                paginatedList.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {t.date || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {t.referenceNumber || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {t.contact}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={t.description}>
                      {t.description || "No description"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs rounded-full font-extrabold border ${
                          t.type === "RECEIVE"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                        t.type === "RECEIVE" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {t.type === "RECEIVE" ? "+" : "-"} {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <MdAccountBalanceWallet className="text-5xl text-gray-300 mb-3" />
                      <p className="text-lg font-bold text-gray-600">No transactions match the filter criteria</p>
                      <p className="text-sm text-gray-400 mt-1">Try resetting the filters or add a new transaction.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer ledger totals */}
        {!loading && filteredTransactions.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-600">
            <span>Showing <span className="font-semibold text-gray-900">{filteredTransactions.length}</span> transactions</span>
            <span className="font-semibold text-gray-900">
              Total Impact:{" "}
              <span className={stats.balance >= 0 ? "text-green-600" : "text-red-600"}>
                {stats.balance >= 0 ? "+" : "-"} {formatCurrency(Math.abs(stats.balance))}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && filteredTransactions.length > 0 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600 font-medium">
            Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
            <span className="font-semibold text-gray-900">{totalPages}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 text-sm font-semibold rounded-lg bg-white text-gray-700 disabled:text-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages}
              className="px-4 py-2 border border-gray-300 text-sm font-semibold rounded-lg bg-white text-gray-700 disabled:text-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const SummaryCard = ({ title, value, description, icon, bgColor, valueColor }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between h-32`}>
      <div className="flex justify-between items-start">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
        <div className={`text-lg p-2 rounded-lg ${bgColor}`}>{icon}</div>
      </div>
      <div>
        <p className={`text-2xl font-extrabold ${valueColor} mt-1`}>{value}</p>
        <p className="text-xs text-gray-400 mt-1 font-medium">{description}</p>
      </div>
    </div>
  );
};

export default BankReconsilation;