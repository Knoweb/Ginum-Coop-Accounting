import React, { useState, useEffect, useMemo } from "react";
import { FiPrinter, FiDownload, FiRefreshCw, FiCalendar, FiSearch, FiChevronDown, FiChevronUp, FiFolder, FiFolderMinus, FiFileText } from "react-icons/fi";
import { apiUrl } from "../../utils/api";

const GeneralLedger = () => {
  const [filterType, setFilterType] = useState("period"); // 'period' or 'custom'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState("full-year"); // 'full-year', 'q1'-'q4', '1'-'12'
  const [customStart, setCustomStart] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]
  );
  const [customEnd, setCustomEnd] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Search & Type Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccountType, setSelectedAccountType] = useState("ALL"); // ALL, ASSET, LIABILITY, EQUITY, INCOME, EXPENSE

  // Account Expansion state (holds codes or index that are expanded)
  const [expandedAccounts, setExpandedAccounts] = useState({});

  const [reportData, setReportData] = useState({
    accounts: [],
    totalAccounts: 0,
    totalDebit: 0,
    totalCredit: 0,
    netBalance: 0,
    totalTransactions: 0,
    startDate: "",
    endDate: ""
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGeneralLedger = async () => {
    try {
      setLoading(true);
      setError("");

      const companyId = sessionStorage.getItem("companyId");
      const token = sessionStorage.getItem("auth_token") || sessionStorage.getItem("token");

      if (!companyId || !token) {
        setError("Authentication missing. Please re-login.");
        return;
      }

      let queryParams = "";
      if (filterType === "custom") {
        queryParams = `?startDate=${customStart}&endDate=${customEnd}`;
      } else {
        queryParams = `?year=${selectedYear}`;
        if (selectedPeriod.startsWith("q")) {
          const qVal = selectedPeriod.substring(1);
          queryParams += `&quarter=${qVal}`;
        } else if (selectedPeriod !== "full-year") {
          queryParams += `&month=${selectedPeriod}`;
        }
      }

      const response = await fetch(`${apiUrl}/api/companies/${companyId}/reports/general-ledger${queryParams}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load General Ledger data.");
      }

      const data = await response.json();
      setReportData({
        accounts: data.accounts || [],
        totalAccounts: Number(data.totalAccounts || 0),
        totalDebit: Number(data.totalDebit || 0),
        totalCredit: Number(data.totalCredit || 0),
        netBalance: Number(data.netBalance || 0),
        totalTransactions: Number(data.totalTransactions || 0),
        startDate: data.startDate || "",
        endDate: data.endDate || ""
      });

    } catch (err) {
      console.error("Error loading general ledger:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeneralLedger();
  }, [filterType, selectedYear, selectedPeriod, customStart, customEnd]);

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Expand / Collapse Helpers
  const toggleAccount = (code) => {
    setExpandedAccounts(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const expandAll = () => {
    const nextState = {};
    filteredAccounts.forEach(acc => {
      nextState[acc.accountCode] = true;
    });
    setExpandedAccounts(nextState);
  };

  const collapseAll = () => {
    setExpandedAccounts({});
  };

  // Filter Accounts list based on Search Query and selected Account Type
  const filteredAccounts = useMemo(() => {
    return reportData.accounts.filter(acc => {
      // 1. Account type filter
      if (selectedAccountType !== "ALL") {
        const typeNormalized = (acc.accountType || "").toUpperCase();
        if (selectedAccountType === "ASSET" && !typeNormalized.includes("ASSET")) return false;
        if (selectedAccountType === "LIABILITY" && !typeNormalized.includes("LIABILITY")) return false;
        if (selectedAccountType === "EQUITY" && !typeNormalized.includes("EQUITY")) return false;
        if (selectedAccountType === "INCOME" && !typeNormalized.includes("INCOME")) return false;
        if (selectedAccountType === "EXPENSE" && !typeNormalized.includes("EXPENSE") && !typeNormalized.includes("COST_OF_SALES")) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesHeader = (acc.accountName || "").toLowerCase().includes(query) || 
                              (acc.accountCode || "").toLowerCase().includes(query);
        
        // Search inside transaction reference or description
        const matchesTx = (acc.transactions || []).some(tx => 
          (tx.reference || "").toLowerCase().includes(query) ||
          (tx.description || "").toLowerCase().includes(query)
        );

        return matchesHeader || matchesTx;
      }

      return true;
    });
  }, [reportData.accounts, searchQuery, selectedAccountType]);

  // Aggregate stats of filtered accounts
  const filteredStats = useMemo(() => {
    let debit = 0;
    let credit = 0;
    let txCount = 0;

    filteredAccounts.forEach(acc => {
      (acc.transactions || []).forEach(tx => {
        debit += Number(tx.debit || 0);
        credit += Number(tx.credit || 0);
        txCount++;
      });
    });

    return {
      debit,
      credit,
      net: debit - credit,
      txCount
    };
  }, [filteredAccounts]);

  const handleExportCSV = () => {
    const csvRows = [];
    csvRows.push([`General Ledger Report`]);
    csvRows.push([`Period: ${reportData.startDate} to ${reportData.endDate}`]);
    csvRows.push([]);

    filteredAccounts.forEach(acc => {
      csvRows.push([`ACCOUNT: ${acc.accountName} (${acc.accountCode}) - ${formatAccountType(acc.accountType)}`]);
      csvRows.push([`Opening Balance: ${acc.openingBalance}`]);
      csvRows.push([`Closing Balance: ${acc.closingBalance}`]);
      csvRows.push(["Date", "Reference No", "Description", "Debit (LKR)", "Credit (LKR)", "Running Balance (LKR)"]);

      if (acc.transactions && acc.transactions.length > 0) {
        acc.transactions.forEach(tx => {
          csvRows.push([
            tx.date || "-",
            tx.reference || "-",
            tx.description || "-",
            tx.debit,
            tx.credit,
            tx.runningBalance
          ]);
        });
      } else {
        csvRows.push(["No postings in period", "", "", "", "", ""]);
      }
      csvRows.push([]);
    });

    const csvContent = csvRows
      .map(e => e.map(val => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `general-ledger-${reportData.startDate}-to-${reportData.endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatAccountType = (typeStr) => {
    if (!typeStr) return "-";
    return typeStr
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const list = [];
    for (let y = currentYear - 5; y <= currentYear + 1; y++) {
      list.push(y);
    }
    return list;
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200 print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">General Ledger</h1>
            <p className="text-sm text-gray-500 mt-1">Detailed Account Posting Logs</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={fetchGeneralLedger}
              className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition border border-gray-200 cursor-pointer bg-white"
              title="Refresh Report"
            >
              <FiRefreshCw />
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold text-sm transition flex items-center gap-2 cursor-pointer bg-white"
            >
              <FiDownload /> Export CSV
            </button>
            <button 
              onClick={handlePrint}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition flex items-center gap-2 cursor-pointer shadow-sm shadow-blue-500/10"
            >
              <FiPrinter /> Print / PDF
            </button>
          </div>
        </div>

        {/* Print-Only Header */}
        <div className="hidden print:block text-center pb-6 border-b-2 border-gray-800 space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">General Ledger</h1>
          <p className="text-base text-gray-700 font-medium">Period: {reportData.startDate} to {reportData.endDate}</p>
          <div className="text-xs text-gray-500">System accounting database ledger record logs</div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 print:hidden space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            
            {/* Filter Type Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setFilterType("period")}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${filterType === "period" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              >
                Standard Period
              </button>
              <button
                onClick={() => setFilterType("custom")}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${filterType === "custom" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              >
                Custom Date Range
              </button>
            </div>

            {/* Standard Period Inputs */}
            {filterType === "period" && (
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-500 mb-1.5">Financial Year</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {yearOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-500 mb-1.5">Period</span>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <optgroup label="Yearly">
                      <option value="full-year">Full Year (Jan - Dec)</option>
                    </optgroup>
                    <optgroup label="Quarters">
                      <option value="q1">Q1 (Jan - Mar)</option>
                      <option value="q2">Q2 (Apr - Jun)</option>
                      <option value="q3">Q3 (Jul - Sep)</option>
                      <option value="q4">Q4 (Oct - Dec)</option>
                    </optgroup>
                    <optgroup label="Months">
                      <option value="1">January</option>
                      <option value="2">February</option>
                      <option value="3">March</option>
                      <option value="4">April</option>
                      <option value="5">May</option>
                      <option value="6">June</option>
                      <option value="7">July</option>
                      <option value="8">August</option>
                      <option value="9">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            )}

            {/* Custom Date Inputs */}
            {filterType === "custom" && (
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-500 mb-1.5">Start Date</span>
                  <div className="relative">
                    <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-500 mb-1.5">End Date</span>
                  <div className="relative">
                    <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Search and Category Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            {/* Account Search */}
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Account / Tx..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white w-full focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Account Type Selector */}
            <div>
              <select
                value={selectedAccountType}
                onChange={(e) => setSelectedAccountType(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white w-full focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">All Account Types</option>
                <option value="ASSET">Assets</option>
                <option value="LIABILITY">Liabilities</option>
                <option value="EQUITY">Equity</option>
                <option value="INCOME">Income / Revenue</option>
                <option value="EXPENSE">Expenses / Cost of Sales</option>
              </select>
            </div>

            {/* Expand / Collapse Buttons */}
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 bg-white w-full cursor-pointer"
              >
                <FiFolder className="text-sm" /> Expand All
              </button>
              <button
                onClick={collapseAll}
                className="flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 bg-white w-full cursor-pointer"
              >
                <FiFolderMinus className="text-sm" /> Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-24 bg-gray-50 border border-gray-100 rounded-xl p-4 animate-pulse space-y-3" />
              ))}
            </div>
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-gray-100 rounded-xl" />
              <div className="h-10 bg-gray-100 rounded-xl" />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col items-center text-center space-y-3">
            <h3 className="text-lg font-bold text-red-900">Failed to load General Ledger</h3>
            <p className="text-sm text-red-700 max-w-md">{error}</p>
            <button
              onClick={fetchGeneralLedger}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Report Content */}
        {!loading && !error && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 print:hidden">
              {/* Total Accounts */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col justify-between shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filtered Accounts</p>
                <p className="text-lg font-bold text-gray-900 mt-2">{filteredAccounts.length}</p>
              </div>

              {/* Total Debits */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col justify-between shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Period Debits</p>
                <p className="text-lg font-bold text-emerald-700 mt-2">LKR {formatCurrency(filteredStats.debit)}</p>
              </div>

              {/* Total Credits */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col justify-between shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Period Credits</p>
                <p className="text-lg font-bold text-orange-700 mt-2">LKR {formatCurrency(filteredStats.credit)}</p>
              </div>

              {/* Net Balance */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col justify-between shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Balance</p>
                <p className={`text-lg font-bold mt-2 ${filteredStats.net >= 0 ? "text-blue-700" : "text-rose-700"}`}>
                  LKR {formatCurrency(filteredStats.net)}
                </p>
              </div>

              {/* Transaction Count */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col justify-between shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Postings Count</p>
                <p className="text-lg font-bold text-purple-700 mt-2">{filteredStats.txCount}</p>
              </div>
            </div>

            {/* General Ledger Block */}
            <div className="space-y-4 print:space-y-6">
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((account, index) => {
                  const isExpanded = !!expandedAccounts[account.accountCode];
                  return (
                    <div key={index} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden print:border-none print:shadow-none">
                      
                      {/* Account Summary Header Bar */}
                      <div 
                        onClick={() => toggleAccount(account.accountCode)}
                        className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50 hover:bg-gray-50 border-b border-gray-150 transition cursor-pointer print:bg-white print:border-b-2 print:border-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 rounded-lg px-2.5 py-1">
                            {account.accountCode}
                          </span>
                          <div>
                            <h4 className="font-bold text-gray-800 text-base">{account.accountName}</h4>
                            <p className="text-xs text-gray-400 mt-0.5">{formatAccountType(account.accountType)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm font-semibold w-full md:w-auto justify-between md:justify-end">
                          <div className="text-right">
                            <span className="text-xs text-gray-400 block font-normal">Opening Bal</span>
                            <span className="text-gray-900">LKR {formatCurrency(account.openingBalance)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-400 block font-normal">Closing Bal</span>
                            <span className="text-gray-900 font-bold">LKR {formatCurrency(account.closingBalance)}</span>
                          </div>
                          <div className="text-gray-400 flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition print:hidden">
                            {isExpanded ? <FiChevronUp className="text-lg" /> : <FiChevronDown className="text-lg" />}
                          </div>
                        </div>
                      </div>

                      {/* Transaction Ledger Table (Collapsible) */}
                      {(isExpanded || window.matchMedia("print").matches) && (
                        <div className="p-4 sm:p-6 overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                                <th className="py-2.5 pl-3">Date</th>
                                <th className="py-2.5">Reference</th>
                                <th className="py-2.5">Narration / Description</th>
                                <th className="py-2.5 text-right">Debit (LKR)</th>
                                <th className="py-2.5 text-right">Credit (LKR)</th>
                                <th className="py-2.5 text-right pr-3">Balance (LKR)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Opening Balance Line */}
                              <tr className="border-b border-gray-100 bg-gray-50/20 font-semibold text-gray-500">
                                <td className="py-2 pl-3">{reportData.startDate}</td>
                                <td>-</td>
                                <td>Opening Balance</td>
                                <td className="text-right">-</td>
                                <td className="text-right">-</td>
                                <td className="text-right pr-3 font-mono">LKR {formatCurrency(account.openingBalance)}</td>
                              </tr>

                              {/* Transaction Lines */}
                              {account.transactions && account.transactions.length > 0 ? (
                                account.transactions.map((tx, txIdx) => (
                                  <tr key={txIdx} className="border-b border-gray-100 hover:bg-gray-50/50 text-gray-700">
                                    <td className="py-2.5 pl-3 whitespace-nowrap">{tx.date || "-"}</td>
                                    <td className="py-2.5 font-semibold text-blue-600">{tx.reference || "-"}</td>
                                    <td className="py-2.5 max-w-xs truncate">{tx.description || "-"}</td>
                                    <td className="py-2.5 text-right font-mono font-semibold">
                                      {tx.debit > 0 ? `LKR ${formatCurrency(tx.debit)}` : "-"}
                                    </td>
                                    <td className="py-2.5 text-right font-mono font-semibold">
                                      {tx.credit > 0 ? `LKR ${formatCurrency(tx.credit)}` : "-"}
                                    </td>
                                    <td className="py-2.5 text-right font-mono font-semibold text-gray-900 pr-3">
                                      LKR {formatCurrency(tx.runningBalance)}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="6" className="py-6 text-center text-gray-400 italic">No postings in this period.</td>
                                </tr>
                              )}

                              {/* Closing Balance Line */}
                              <tr className="border-t-2 border-b border-gray-200 bg-gray-50/20 font-bold text-gray-800">
                                <td className="py-2.5 pl-3">{reportData.endDate}</td>
                                <td>-</td>
                                <td>Closing Balance</td>
                                <td className="text-right text-emerald-700">
                                  {account.transactions && account.transactions.length > 0 ? `LKR ${formatCurrency(account.transactions.reduce((acc, tx) => acc + tx.debit, 0))}` : "-"}
                                </td>
                                <td className="text-right text-orange-700">
                                  {account.transactions && account.transactions.length > 0 ? `LKR ${formatCurrency(account.transactions.reduce((acc, tx) => acc + tx.credit, 0))}` : "-"}
                                </td>
                                <td className="text-right pr-3 font-mono text-gray-950">LKR {formatCurrency(account.closingBalance)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                    </div>
                  );
                })
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 italic shadow-sm">
                  No ledger accounts match the active search/filter criteria.
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default GeneralLedger;