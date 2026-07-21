import React, { useState, useEffect, useMemo } from "react";
import { FiPrinter, FiDownload, FiRefreshCw, FiCalendar, FiCheckCircle, FiAlertTriangle, FiList, FiDatabase } from "react-icons/fi";
import { apiUrl } from "../../utils/api";

const TrialBalance = () => {
  const [filterType, setFilterType] = useState("period"); // 'period' or 'custom'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState("full-year"); // 'full-year', 'q1'-'q4', '1'-'12'
  const [customStart, setCustomStart] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]
  );
  const [customEnd, setCustomEnd] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [reportData, setReportData] = useState({
    lines: [],
    totalDebit: 0,
    totalCredit: 0,
    difference: 0,
    balanced: false,
    accountsCount: 0,
    startDate: "",
    endDate: ""
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTrialBalance = async () => {
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

      const response = await fetch(`${apiUrl}/api/companies/${companyId}/reports/trial-balance${queryParams}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load Trial Balance data.");
      }

      const data = await response.json();
      setReportData({
        lines: data.lines || [],
        totalDebit: Number(data.totalDebit || 0),
        totalCredit: Number(data.totalCredit || 0),
        difference: Number(data.difference || 0),
        balanced: !!data.balanced,
        accountsCount: Number(data.accountsCount || 0),
        startDate: data.startDate || "",
        endDate: data.endDate || ""
      });

    } catch (err) {
      console.error("Error loading trial balance:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialBalance();
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

  const handleExportCSV = () => {
    const csvRows = [];
    csvRows.push([`Trial Balance Report`]);
    csvRows.push([`As of Date: ${reportData.endDate}`]);
    csvRows.push([`Balance Status: ${reportData.balanced ? "Balanced" : "Out of Balance (Diff: " + reportData.difference + ")"}`]);
    csvRows.push([]);
    csvRows.push(["Account Code", "Account Name", "Account Type", "Debit (LKR)", "Credit (LKR)"]);

    reportData.lines.forEach(line => {
      csvRows.push([
        line.accountCode || "-",
        line.accountName || "-",
        line.accountType || "-",
        line.debit,
        line.credit
      ]);
    });

    csvRows.push([]);
    csvRows.push(["TOTALS", "", "", reportData.totalDebit, reportData.totalCredit]);

    const csvContent = csvRows
      .map(e => e.map(val => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trial-balance-${reportData.endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const list = [];
    for (let y = currentYear - 5; y <= currentYear + 1; y++) {
      list.push(y);
    }
    return list;
  }, []);

  const formatAccountType = (typeStr) => {
    if (!typeStr) return "-";
    // Convert enum string (e.g. ASSET_BANK -> Asset Bank)
    return typeStr
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200 print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Trial Balance</h1>
            <p className="text-sm text-gray-500 mt-1">General Ledger Balances Verification</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={fetchTrialBalance}
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
          <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">Trial Balance</h1>
          <p className="text-base text-gray-700 font-medium">As of Date: {reportData.endDate}</p>
          <div className="text-xs text-gray-500">Generated dynamically from company general ledger records</div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 print:hidden">
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

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
            <span className="font-bold text-gray-700">Calculated as of:</span>
            <span>{reportData.endDate || "-"}</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-50 border border-gray-100 rounded-xl p-4 animate-pulse space-y-3" />
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col items-center text-center space-y-3">
            <h3 className="text-lg font-bold text-red-900">Failed to load Trial Balance</h3>
            <p className="text-sm text-red-700 max-w-md">{error}</p>
            <button
              onClick={fetchTrialBalance}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 print:hidden">
              {/* Total Debit */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <FiDatabase className="text-xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Debits</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">LKR {formatCurrency(reportData.totalDebit)}</p>
                </div>
              </div>

              {/* Total Credit */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <FiDatabase className="text-xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Credits</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">LKR {formatCurrency(reportData.totalCredit)}</p>
                </div>
              </div>

              {/* Accounts Count */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                  <FiList className="text-xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Accounts</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{reportData.accountsCount}</p>
                </div>
              </div>

              {/* Status */}
              <div className={`bg-white rounded-2xl border p-5 flex items-center gap-4 shadow-sm ${reportData.balanced ? "border-emerald-200" : "border-rose-200"}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${reportData.balanced ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                  {reportData.balanced ? <FiCheckCircle className="text-xl" /> : <FiAlertTriangle className="text-xl" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
                  <p className={`text-base font-bold mt-0.5 ${reportData.balanced ? "text-emerald-700" : "text-rose-700"}`}>
                    {reportData.balanced ? "Balanced" : "Out of Balance"}
                  </p>
                </div>
              </div>
            </div>

            {/* Out of Balance Explanation Banner */}
            {!reportData.balanced && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex gap-4 text-rose-900 print:border-red-600">
                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 flex-shrink-0">
                  <FiAlertTriangle className="text-lg" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Trial Balance Imbalance Detected</h4>
                  <p className="text-xs mt-1 opacity-90">
                    The general ledger is currently out of balance by <span className="font-bold">LKR {formatCurrency(reportData.difference)}</span>. 
                    This difference typically occurs due to unbalanced manual journal entries or missing baseline account mappings. Please review recent entries.
                  </p>
                </div>
              </div>
            )}

            {/* Report Table Block */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
              <div className="p-6 sm:p-10 space-y-6">
                
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold">
                      <th className="py-3 pl-4 text-left">Code</th>
                      <th className="py-3 text-left">Account Name</th>
                      <th className="py-3 text-left">Type</th>
                      <th className="py-3 text-right pr-4">Debit (LKR)</th>
                      <th className="py-3 text-right pr-4">Credit (LKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.lines.length > 0 ? (
                      reportData.lines.map((line, index) => (
                        <tr key={index} className="hover:bg-gray-50/50 border-b border-gray-100/50 text-gray-800">
                          <td className="py-3 pl-4 font-mono text-xs">{line.accountCode || "-"}</td>
                          <td className="py-3 font-semibold">{line.accountName || "-"}</td>
                          <td className="py-3 text-xs text-gray-500">{formatAccountType(line.accountType)}</td>
                          <td className="py-3 text-right font-mono text-gray-900 font-semibold pr-4">
                            {line.debit > 0 ? `LKR ${formatCurrency(line.debit)}` : "-"}
                          </td>
                          <td className="py-3 text-right font-mono text-gray-900 font-semibold pr-4">
                            {line.credit > 0 ? `LKR ${formatCurrency(line.credit)}` : "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-gray-400 italic">No accounts set up for this company.</td>
                      </tr>
                    )}
                    
                    {/* Double-underlined Summary Row */}
                    <tr className="bg-gray-100 font-extrabold border-t-2 border-b-4 border-double border-gray-300 text-gray-950">
                      <td colSpan="3" className="py-4 pl-4 text-base uppercase tracking-wider">Totals</td>
                      <td className="py-4 text-right font-mono text-lg text-blue-900 pr-4">
                        LKR {formatCurrency(reportData.totalDebit)}
                      </td>
                      <td className="py-4 text-right font-mono text-lg text-indigo-900 pr-4">
                        LKR {formatCurrency(reportData.totalCredit)}
                      </td>
                    </tr>
                  </tbody>
                </table>

              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default TrialBalance;