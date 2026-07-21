import React, { useState, useEffect, useMemo } from "react";
import { FiPrinter, FiDownload, FiRefreshCw, FiCalendar, FiDollarSign, FiTrendingUp, FiPercent, FiFileText } from "react-icons/fi";
import { apiUrl } from "../../utils/api";

const IncomeStatement = () => {
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
    revenue: [],
    costOfGoodsSold: [],
    operatingExpenses: [],
    otherIncome: [],
    otherExpenses: [],
    totalRevenue: 0,
    totalCostOfGoodsSold: 0,
    grossProfit: 0,
    totalOperatingExpenses: 0,
    operatingProfit: 0,
    totalOtherIncome: 0,
    totalOtherExpenses: 0,
    netProfitLoss: 0,
    startDate: "",
    endDate: ""
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchIncomeStatement = async () => {
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

      const response = await fetch(`${apiUrl}/api/companies/${companyId}/reports/income-statement${queryParams}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load Income Statement data.");
      }

      const data = await response.json();
      setReportData({
        revenue: data.revenue || [],
        costOfGoodsSold: data.costOfGoodsSold || [],
        operatingExpenses: data.operatingExpenses || [],
        otherIncome: data.otherIncome || [],
        otherExpenses: data.otherExpenses || [],
        totalRevenue: Number(data.totalRevenue || 0),
        totalCostOfGoodsSold: Number(data.totalCostOfGoodsSold || 0),
        grossProfit: Number(data.grossProfit || 0),
        totalOperatingExpenses: Number(data.totalOperatingExpenses || 0),
        operatingProfit: Number(data.operatingProfit || 0),
        totalOtherIncome: Number(data.totalOtherIncome || 0),
        totalOtherExpenses: Number(data.totalOtherExpenses || 0),
        netProfitLoss: Number(data.netProfitLoss || 0),
        startDate: data.startDate || "",
        endDate: data.endDate || ""
      });

    } catch (err) {
      console.error("Error loading income statement:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomeStatement();
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
    csvRows.push([`Income Statement Report (Profit & Loss)`]);
    csvRows.push([`Period: ${reportData.startDate} to ${reportData.endDate}`]);
    csvRows.push([]);

    const appendSection = (title, items, total) => {
      csvRows.push([title.toUpperCase()]);
      csvRows.push(["Account Name", "Account Code", "Amount (LKR)"]);
      if (items.length > 0) {
        items.forEach(item => {
          csvRows.push([item.accountName, item.accountCode, item.balance]);
        });
      } else {
        csvRows.push(["No data", "", "0.00"]);
      }
      csvRows.push([`Total ${title}`, "", total]);
      csvRows.push([]);
    };

    appendSection("Revenue", reportData.revenue, reportData.totalRevenue);
    appendSection("Cost of Goods Sold", reportData.costOfGoodsSold, reportData.totalCostOfGoodsSold);
    csvRows.push(["GROSS PROFIT", "", reportData.grossProfit]);
    csvRows.push([]);

    appendSection("Operating Expenses", reportData.operatingExpenses, reportData.totalOperatingExpenses);
    csvRows.push(["OPERATING PROFIT", "", reportData.operatingProfit]);
    csvRows.push([]);

    appendSection("Other Income", reportData.otherIncome, reportData.totalOtherIncome);
    appendSection("Other Expenses", reportData.otherExpenses, reportData.totalOtherExpenses);
    
    csvRows.push(["NET PROFIT / (LOSS)", "", reportData.netProfitLoss]);

    const csvContent = csvRows
      .map(e => e.map(val => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `income-statement-${reportData.startDate}-to-${reportData.endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Gross profit margin calculation
  const grossProfitMargin = useMemo(() => {
    if (reportData.totalRevenue <= 0) return 0;
    return (reportData.grossProfit / reportData.totalRevenue) * 100;
  }, [reportData.grossProfit, reportData.totalRevenue]);

  // Net profit margin calculation
  const netProfitMargin = useMemo(() => {
    if (reportData.totalRevenue <= 0) return 0;
    return (reportData.netProfitLoss / reportData.totalRevenue) * 100;
  }, [reportData.netProfitLoss, reportData.totalRevenue]);

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
            <h1 className="text-3xl font-bold text-gray-800">Income Statement</h1>
            <p className="text-sm text-gray-500 mt-1">Profit &amp; Loss Statement</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={fetchIncomeStatement}
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
          <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">Income Statement</h1>
          <p className="text-base text-gray-700 font-medium">For the Period: {reportData.startDate} to {reportData.endDate}</p>
          <div className="text-xs text-gray-500">Generated dynamically from company financial records</div>
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

        {/* Loading Indicator */}
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
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col items-center text-center space-y-3">
            <h3 className="text-lg font-bold text-red-900">Failed to load Statement</h3>
            <p className="text-sm text-red-700 max-w-md">{error}</p>
            <button
              onClick={fetchIncomeStatement}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition"
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
              {/* Total Revenue */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <FiDollarSign className="text-xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">LKR {formatCurrency(reportData.totalRevenue)}</p>
                </div>
              </div>

              {/* Cost of Goods Sold */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                  <FiFileText className="text-xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost of Sales</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">LKR {formatCurrency(reportData.totalCostOfGoodsSold)}</p>
                </div>
              </div>

              {/* Gross Profit Margin */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <FiPercent className="text-xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross Margin</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{grossProfitMargin.toFixed(1)}%</p>
                </div>
              </div>

              {/* Net Profit / Loss */}
              <div className={`bg-white rounded-2xl border p-5 flex items-center gap-4 shadow-sm ${reportData.netProfitLoss >= 0 ? "border-emerald-200" : "border-rose-200"}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${reportData.netProfitLoss >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                  <FiTrendingUp className="text-xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Profit / Loss</p>
                  <p className={`text-xl font-bold mt-0.5 ${reportData.netProfitLoss >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    LKR {formatCurrency(reportData.netProfitLoss)}
                  </p>
                </div>
              </div>
            </div>

            {/* Income Statement Report Block */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
              <div className="p-6 sm:p-10 space-y-6">
                
                {/* 1. REVENUE SECTION */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1.5 mb-3">Revenues</h3>
                  <table className="w-full text-sm mb-2">
                    <tbody>
                      {reportData.revenue.length > 0 ? (
                        reportData.revenue.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50/50">
                            <td className="py-2 pl-4 text-gray-700">{item.accountName}</td>
                            <td className="py-2 text-right text-gray-500 font-mono pr-4">{item.accountCode}</td>
                            <td className="py-2 text-right text-gray-900 font-semibold font-mono pr-4">LKR {formatCurrency(item.balance)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="py-2 text-center text-gray-400 italic">No revenue accounts.</td>
                        </tr>
                      )}
                      <tr className="bg-gray-50 font-bold border-t border-gray-200">
                        <td colSpan="2" className="py-2.5 pl-4 text-gray-800">Total Revenues</td>
                        <td className="py-2.5 text-right text-gray-950 font-mono pr-4">LKR {formatCurrency(reportData.totalRevenue)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. COST OF SALES SECTION */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1.5 mb-3">Cost of Sales</h3>
                  <table className="w-full text-sm mb-2">
                    <tbody>
                      {reportData.costOfGoodsSold.length > 0 ? (
                        reportData.costOfGoodsSold.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50/50">
                            <td className="py-2 pl-4 text-gray-700">{item.accountName}</td>
                            <td className="py-2 text-right text-gray-500 font-mono pr-4">{item.accountCode}</td>
                            <td className="py-2 text-right text-gray-900 font-semibold font-mono pr-4">LKR {formatCurrency(item.balance)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="py-2 text-center text-gray-400 italic">No cost of sales accounts.</td>
                        </tr>
                      )}
                      <tr className="bg-gray-50 font-bold border-t border-gray-200">
                        <td colSpan="2" className="py-2.5 pl-4 text-gray-800">Total Cost of Sales</td>
                        <td className="py-2.5 text-right text-gray-950 font-mono pr-4">LKR {formatCurrency(reportData.totalCostOfGoodsSold)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3. GROSS PROFIT ROW */}
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex justify-between items-center font-bold text-base">
                  <span className="text-blue-900 uppercase tracking-wider">Gross Profit</span>
                  <span className="text-blue-800 font-mono">LKR {formatCurrency(reportData.grossProfit)}</span>
                </div>

                {/* 4. OPERATING EXPENSES SECTION */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1.5 mb-3">Operating Expenses</h3>
                  <table className="w-full text-sm mb-2">
                    <tbody>
                      {reportData.operatingExpenses.length > 0 ? (
                        reportData.operatingExpenses.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50/50">
                            <td className="py-2 pl-4 text-gray-700">{item.accountName}</td>
                            <td className="py-2 text-right text-gray-500 font-mono pr-4">{item.accountCode}</td>
                            <td className="py-2 text-right text-gray-900 font-semibold font-mono pr-4">LKR {formatCurrency(item.balance)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="py-2 text-center text-gray-400 italic">No operating expense accounts.</td>
                        </tr>
                      )}
                      <tr className="bg-gray-50 font-bold border-t border-gray-200">
                        <td colSpan="2" className="py-2.5 pl-4 text-gray-800">Total Operating Expenses</td>
                        <td className="py-2.5 text-right text-gray-950 font-mono pr-4">LKR {formatCurrency(reportData.totalOperatingExpenses)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 5. OPERATING PROFIT ROW */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center font-bold text-base">
                  <span className="text-gray-900 uppercase tracking-wider">Operating Profit (EBIT)</span>
                  <span className="text-gray-900 font-mono">LKR {formatCurrency(reportData.operatingProfit)}</span>
                </div>

                {/* 6. OTHER INCOME / OTHER EXPENSES GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Other Income */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">Other Income</h3>
                    <table className="w-full text-xs">
                      <tbody>
                        {reportData.otherIncome.length > 0 ? (
                          reportData.otherIncome.map((item, index) => (
                            <tr key={index}>
                              <td className="py-1.5 pl-2 text-gray-700">{item.accountName}</td>
                              <td className="py-1.5 text-right text-gray-900 font-semibold font-mono pr-2">LKR {formatCurrency(item.balance)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="2" className="py-2 text-gray-400 italic">No other income.</td>
                          </tr>
                        )}
                        <tr className="font-bold border-t border-gray-200">
                          <td className="py-2 pl-2 text-gray-800">Total Other Income</td>
                          <td className="py-2 text-right text-gray-950 font-mono pr-2">LKR {formatCurrency(reportData.totalOtherIncome)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Other Expenses */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">Other Expenses</h3>
                    <table className="w-full text-xs">
                      <tbody>
                        {reportData.otherExpenses.length > 0 ? (
                          reportData.otherExpenses.map((item, index) => (
                            <tr key={index}>
                              <td className="py-1.5 pl-2 text-gray-700">{item.accountName}</td>
                              <td className="py-1.5 text-right text-gray-900 font-semibold font-mono pr-2">LKR {formatCurrency(item.balance)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="2" className="py-2 text-gray-400 italic">No other expenses.</td>
                          </tr>
                        )}
                        <tr className="font-bold border-t border-gray-200">
                          <td className="py-2 pl-2 text-gray-800">Total Other Expenses</td>
                          <td className="py-2 text-right text-gray-950 font-mono pr-2">LKR {formatCurrency(reportData.totalOtherExpenses)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 7. NET PROFIT OR LOSS double-underlined summary card */}
                <div className={`mt-8 p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${reportData.netProfitLoss >= 0 ? "bg-emerald-50/50 border-emerald-200 text-emerald-900" : "bg-rose-50/50 border-rose-200 text-rose-900"}`}>
                  <div>
                    <p className="text-xs uppercase font-extrabold tracking-wider opacity-75">Financial Year Result</p>
                    <h4 className="text-xl font-bold uppercase tracking-wide mt-1">Net Profit / (Loss)</h4>
                    <p className="text-xs mt-1 opacity-70">Margins: Gross {grossProfitMargin.toFixed(1)}% | Net {netProfitMargin.toFixed(1)}%</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black font-mono">LKR {formatCurrency(reportData.netProfitLoss)}</span>
                    <div className={`text-xs font-bold uppercase tracking-wide mt-1 rounded-full px-3 py-1 inline-block ${reportData.netProfitLoss >= 0 ? "bg-emerald-200 text-emerald-800" : "bg-rose-200 text-rose-800"}`}>
                      {reportData.netProfitLoss >= 0 ? "Net Profit" : "Net Loss"}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default IncomeStatement;