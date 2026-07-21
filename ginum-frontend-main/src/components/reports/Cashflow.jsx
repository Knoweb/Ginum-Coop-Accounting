import React, { useState, useEffect, useMemo } from "react";
import { FiPrinter, FiDownload, FiRefreshCw, FiCalendar, FiDollarSign, FiTrendingUp, FiTrendingDown, FiActivity } from "react-icons/fi";
import { apiUrl } from "../../utils/api";

const Cashflow = () => {
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
    openingBalance: 0,
    closingBalance: 0,
    netCashFlow: 0,
    operatingActivities: [],
    investingActivities: [],
    financingActivities: [],
    netOperatingCash: 0,
    netInvestingCash: 0,
    netFinancingCash: 0,
    totalInflows: 0,
    totalOutflows: 0,
    startDate: "",
    endDate: ""
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCashFlow = async () => {
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

      const response = await fetch(`${apiUrl}/api/companies/${companyId}/reports/cash-flow${queryParams}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load Cash Flow Statement data.");
      }

      const data = await response.json();
      setReportData({
        openingBalance: Number(data.openingBalance || 0),
        closingBalance: Number(data.closingBalance || 0),
        netCashFlow: Number(data.netCashFlow || 0),
        operatingActivities: data.operatingActivities || [],
        investingActivities: data.investingActivities || [],
        financingActivities: data.financingActivities || [],
        netOperatingCash: Number(data.netOperatingCash || 0),
        netInvestingCash: Number(data.netInvestingCash || 0),
        netFinancingCash: Number(data.netFinancingCash || 0),
        totalInflows: Number(data.totalInflows || 0),
        totalOutflows: Number(data.totalOutflows || 0),
        startDate: data.startDate || "",
        endDate: data.endDate || ""
      });

    } catch (err) {
      console.error("Error loading cash flow statement:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashFlow();
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
    csvRows.push([`Cash Flow Statement Report (Direct Method)`]);
    csvRows.push([`Period: ${reportData.startDate} to ${reportData.endDate}`]);
    csvRows.push([`Opening Cash Balance: LKR ${reportData.openingBalance}`]);
    csvRows.push([`Closing Cash Balance: LKR ${reportData.closingBalance}`]);
    csvRows.push([]);

    const appendSection = (title, items, total) => {
      csvRows.push([title.toUpperCase()]);
      csvRows.push(["Flow Description", "Flow Direction", "Amount (LKR)"]);
      if (items.length > 0) {
        items.forEach(item => {
          csvRows.push([
            item.description,
            item.inflow ? "Inflow (+)" : "Outflow (-)",
            item.amount
          ]);
        });
      } else {
        csvRows.push(["No movements", "", "0.00"]);
      }
      csvRows.push([`Net Cash from ${title}`, "", total]);
      csvRows.push([]);
    };

    appendSection("Operating Activities", reportData.operatingActivities, reportData.netOperatingCash);
    appendSection("Investing Activities", reportData.investingActivities, reportData.netInvestingCash);
    appendSection("Financing Activities", reportData.financingActivities, reportData.netFinancingCash);

    csvRows.push(["NET INCREASE/(DECREASE) IN CASH", "", reportData.netCashFlow]);

    const csvContent = csvRows
      .map(e => e.map(val => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cash-flow-statement-${reportData.startDate}-to-${reportData.endDate}.csv`;
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200 print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Cash Flow Statement</h1>
            <p className="text-sm text-gray-500 mt-1">Direct Method Report</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={fetchCashFlow}
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
          <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">Cash Flow Statement</h1>
          <p className="text-base text-gray-700 font-medium">Period: {reportData.startDate} to {reportData.endDate}</p>
          <div className="text-xs text-gray-500">Generated dynamically from company cash book accounts</div>
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
            <span className="font-bold text-gray-700">Statement Period:</span>
            <span>{reportData.startDate || "-"}</span>
            <span>to</span>
            <span>{reportData.endDate || "-"}</span>
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
            <h3 className="text-lg font-bold text-red-900">Failed to load Cash Flow Statement</h3>
            <p className="text-sm text-red-700 max-w-md">{error}</p>
            <button
              onClick={fetchCashFlow}
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
              {/* Opening Balance */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col justify-between shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Opening Cash</p>
                <p className="text-lg font-bold text-gray-900 mt-2">LKR {formatCurrency(reportData.openingBalance)}</p>
              </div>

              {/* Total Inflows */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col justify-between shadow-sm">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Inflows</p>
                <p className="text-lg font-bold text-emerald-700 mt-2">+LKR {formatCurrency(reportData.totalInflows)}</p>
              </div>

              {/* Total Outflows */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col justify-between shadow-sm">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Total Outflows</p>
                <p className="text-lg font-bold text-orange-700 mt-2">-LKR {formatCurrency(reportData.totalOutflows)}</p>
              </div>

              {/* Net Cash Flow */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col justify-between shadow-sm">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Net Cash Flow</p>
                <p className={`text-lg font-bold mt-2 ${reportData.netCashFlow >= 0 ? "text-blue-700" : "text-red-700"}`}>
                  LKR {formatCurrency(reportData.netCashFlow)}
                </p>
              </div>

              {/* Closing Balance */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col justify-between shadow-sm">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Closing Cash</p>
                <p className="text-lg font-bold text-purple-700 mt-2">LKR {formatCurrency(reportData.closingBalance)}</p>
              </div>
            </div>

            {/* Statement Document Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
              <div className="p-6 sm:p-10 space-y-8">
                
                {/* Beginning Cash Row */}
                <div className="flex justify-between items-center text-sm font-bold text-gray-800 bg-gray-50 p-3.5 rounded-xl border border-gray-150">
                  <span className="uppercase tracking-wide">Cash and Cash Equivalents at Beginning of Period</span>
                  <span className="font-mono text-base">LKR {formatCurrency(reportData.openingBalance)}</span>
                </div>

                {/* 1. OPERATING ACTIVITIES */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1.5 mb-3">1. Cash Flow from Operating Activities</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {reportData.operatingActivities.map((line, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-2.5 pl-4 text-gray-700">{line.description}</td>
                          <td className={`py-2.5 text-right font-semibold font-mono pr-4 ${line.inflow ? "text-emerald-700" : "text-gray-900"}`}>
                            {line.inflow ? "+" : ""}{formatCurrency(line.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-gray-50/50 border-t border-gray-250">
                        <td className="py-2.5 pl-4 text-gray-800">Net Cash provided by Operating Activities</td>
                        <td className="py-2.5 text-right font-mono pr-4 text-gray-950">LKR {formatCurrency(reportData.netOperatingCash)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. INVESTING ACTIVITIES */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1.5 mb-3">2. Cash Flow from Investing Activities</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {reportData.investingActivities.map((line, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-2.5 pl-4 text-gray-700">{line.description}</td>
                          <td className={`py-2.5 text-right font-semibold font-mono pr-4 ${line.inflow ? "text-emerald-700" : "text-gray-900"}`}>
                            {line.inflow ? "+" : ""}{formatCurrency(line.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-gray-50/50 border-t border-gray-250">
                        <td className="py-2.5 pl-4 text-gray-800">Net Cash provided by (used in) Investing Activities</td>
                        <td className="py-2.5 text-right font-mono pr-4 text-gray-950">LKR {formatCurrency(reportData.netInvestingCash)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3. FINANCING ACTIVITIES */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1.5 mb-3">3. Cash Flow from Financing Activities</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {reportData.financingActivities.map((line, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-2.5 pl-4 text-gray-700">{line.description}</td>
                          <td className={`py-2.5 text-right font-semibold font-mono pr-4 ${line.inflow ? "text-emerald-700" : "text-gray-900"}`}>
                            {line.inflow ? "+" : ""}{formatCurrency(line.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-gray-50/50 border-t border-gray-250">
                        <td className="py-2.5 pl-4 text-gray-800">Net Cash provided by (used in) Financing Activities</td>
                        <td className="py-2.5 text-right font-mono pr-4 text-gray-950">LKR {formatCurrency(reportData.netFinancingCash)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Net Increase / Decrease */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm font-bold text-gray-900 bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                    <span className="uppercase tracking-wide">Net Increase / (Decrease) in Cash and Cash Equivalents</span>
                    <span className={`font-mono text-base ${reportData.netCashFlow >= 0 ? "text-blue-700" : "text-rose-700"}`}>
                      LKR {formatCurrency(reportData.netCashFlow)}
                    </span>
                  </div>
                </div>

                {/* Ending Cash Row */}
                <div className="flex justify-between items-center text-base font-extrabold text-gray-900 bg-purple-50/30 border-2 border-double border-purple-200 p-4 rounded-xl">
                  <span className="uppercase tracking-wider">Cash and Cash Equivalents at End of Period</span>
                  <span className="font-mono text-lg text-purple-900">LKR {formatCurrency(reportData.closingBalance)}</span>
                </div>

                {/* Reconciliation Statement */}
                <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 italic text-center print:hidden">
                  Reconciliation equation satisfied: Opening cash ({formatCurrency(reportData.openingBalance)}) + Net cash flow ({formatCurrency(reportData.netCashFlow)}) = Closing cash ({formatCurrency(reportData.closingBalance)}).
                </div>

              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Cashflow;