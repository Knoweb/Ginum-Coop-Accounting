import React, { useState, useEffect } from "react";
import { FiPrinter, FiDownload, FiRefreshCw, FiCheckCircle, FiAlertTriangle, FiDollarSign, FiActivity, FiPieChart } from "react-icons/fi";
import { apiUrl } from "../../utils/api";

const BalanceSheet = () => {
  const [reportData, setReportData] = useState({
    currentAssets: [],
    nonCurrentAssets: [],
    currentLiabilities: [],
    nonCurrentLiabilities: [],
    equity: [],
    netProfitLoss: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    balanced: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true);
      setError("");

      const companyId = sessionStorage.getItem("companyId");
      const token = sessionStorage.getItem("auth_token") || sessionStorage.getItem("token");

      if (!companyId || !token) {
        setError("Authentication missing. Please re-login.");
        return;
      }

      const response = await fetch(`${apiUrl}/api/companies/${companyId}/reports/balance-sheet`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load Balance Sheet data from database.");
      }

      const data = await response.json();
      setReportData({
        currentAssets: data.currentAssets || [],
        nonCurrentAssets: data.nonCurrentAssets || [],
        currentLiabilities: data.currentLiabilities || [],
        nonCurrentLiabilities: data.nonCurrentLiabilities || [],
        equity: data.equity || [],
        netProfitLoss: Number(data.netProfitLoss || 0),
        totalAssets: Number(data.totalAssets || 0),
        totalLiabilities: Number(data.totalLiabilities || 0),
        totalEquity: Number(data.totalEquity || 0),
        balanced: !!data.balanced
      });

    } catch (err) {
      console.error("Error fetching balance sheet:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceSheet();
  }, []);

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded-lg animate-pulse" />
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white border border-gray-200 rounded-2xl p-5 animate-pulse space-y-3" />
            ))}
          </div>

          {/* Table Skeleton */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 space-y-6">
            <div className="h-6 w-36 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <FiAlertTriangle className="text-red-600 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Failed to Load Balance Sheet</h3>
              <p className="text-sm text-gray-600 mt-1 max-w-md">{error}</p>
            </div>
            <button
              onClick={fetchBalanceSheet}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 transition shadow-sm shadow-red-500/20 cursor-pointer"
            >
              <FiRefreshCw /> Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalLiabilitiesAndEquity = reportData.totalLiabilities + reportData.totalEquity;

  // Calculators for Asset sections
  const subtotalCurrentAssets = reportData.currentAssets.reduce((sum, item) => sum + item.balance, 0);
  const subtotalNonCurrentAssets = reportData.nonCurrentAssets.reduce((sum, item) => sum + item.balance, 0);

  // Calculators for Liabilities
  const subtotalCurrentLiabilities = reportData.currentLiabilities.reduce((sum, item) => sum + item.balance, 0);
  const subtotalNonCurrentLiabilities = reportData.nonCurrentLiabilities.reduce((sum, item) => sum + item.balance, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200 print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Balance Sheet</h1>
            <p className="text-sm text-gray-500 mt-1">As of {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={fetchBalanceSheet}
              className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition border border-gray-200 cursor-pointer bg-white"
              title="Refresh Data"
            >
              <FiRefreshCw />
            </button>
            <button 
              onClick={handlePrint}
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold text-sm transition flex items-center gap-2 cursor-pointer bg-white"
            >
              <FiPrinter /> Print Sheet
            </button>
          </div>
        </div>

        {/* Print-Only Header */}
        <div className="hidden print:block text-center pb-6 border-b-2 border-gray-800 space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">Balance Sheet</h1>
          <p className="text-base text-gray-700 font-medium">As of {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
          <div className="text-xs text-gray-500">Generated dynamically from company financial records</div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 print:hidden">
          {/* Total Assets */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <FiDollarSign className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Assets</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">LKR {formatCurrency(reportData.totalAssets)}</p>
            </div>
          </div>

          {/* Total Liabilities */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
              <FiActivity className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Liabilities</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">LKR {formatCurrency(reportData.totalLiabilities)}</p>
            </div>
          </div>

          {/* Total Equity */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <FiPieChart className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Equity</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">LKR {formatCurrency(reportData.totalEquity)}</p>
            </div>
          </div>

          {/* Balance Status */}
          <div className={`bg-white rounded-2xl border p-5 flex items-center gap-4 shadow-sm ${reportData.balanced ? "border-emerald-200" : "border-rose-200"}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${reportData.balanced ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
              {reportData.balanced ? <FiCheckCircle className="text-xl" /> : <FiAlertTriangle className="text-xl" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Equation Status</p>
              <p className={`text-base font-bold mt-0.5 ${reportData.balanced ? "text-emerald-700" : "text-rose-700"}`}>
                {reportData.balanced ? "Balanced" : "Out of Balance"}
              </p>
            </div>
          </div>
        </div>

        {/* Balance Sheet Document Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
          <div className="p-6 sm:p-10 space-y-8">
            
            {/* 1. ASSETS SECTION */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider">1. Assets</h3>
              
              {/* Current Assets */}
              <div className="mb-4 pl-2">
                <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Current Assets</h4>
                <table className="w-full text-sm">
                  <tbody>
                    {reportData.currentAssets.length > 0 ? (
                      reportData.currentAssets.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 border-b border-gray-100/50">
                          <td className="py-2.5 text-gray-700 pl-2">{item.accountName}</td>
                          <td className="py-2.5 text-right text-gray-500 font-mono pr-2">{item.accountCode}</td>
                          <td className="py-2.5 text-right text-gray-900 font-semibold font-mono pr-4">LKR {formatCurrency(item.balance)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="py-3 text-center text-gray-400 italic">No current assets configured.</td>
                      </tr>
                    )}
                    <tr className="bg-gray-50/50 font-bold border-t border-gray-200">
                      <td colSpan="2" className="py-3 text-gray-800 pl-2">Subtotal Current Assets</td>
                      <td className="py-3 text-right text-gray-900 font-mono pr-4">LKR {formatCurrency(subtotalCurrentAssets)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Non-Current Assets */}
              <div className="mb-6 pl-2">
                <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Non-Current Assets</h4>
                <table className="w-full text-sm">
                  <tbody>
                    {reportData.nonCurrentAssets.length > 0 ? (
                      reportData.nonCurrentAssets.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 border-b border-gray-100/50">
                          <td className="py-2.5 text-gray-700 pl-2">{item.accountName}</td>
                          <td className="py-2.5 text-right text-gray-500 font-mono pr-2">{item.accountCode}</td>
                          <td className="py-2.5 text-right text-gray-900 font-semibold font-mono pr-4">LKR {formatCurrency(item.balance)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="py-3 text-center text-gray-400 italic">No non-current assets configured.</td>
                      </tr>
                    )}
                    <tr className="bg-gray-50/50 font-bold border-t border-gray-200">
                      <td colSpan="2" className="py-3 text-gray-800 pl-2">Subtotal Non-Current Assets</td>
                      <td className="py-3 text-right text-gray-900 font-mono pr-4">LKR {formatCurrency(subtotalNonCurrentAssets)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Assets Summary Row */}
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex justify-between items-center font-bold text-lg">
                <span className="text-blue-900 uppercase tracking-wide">Total Assets</span>
                <span className="text-blue-800 font-mono">LKR {formatCurrency(reportData.totalAssets)}</span>
              </div>
            </div>

            {/* 2. LIABILITIES SECTION */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider">2. Liabilities</h3>
              
              {/* Current Liabilities */}
              <div className="mb-4 pl-2">
                <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Current Liabilities</h4>
                <table className="w-full text-sm">
                  <tbody>
                    {reportData.currentLiabilities.length > 0 ? (
                      reportData.currentLiabilities.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 border-b border-gray-100/50">
                          <td className="py-2.5 text-gray-700 pl-2">{item.accountName}</td>
                          <td className="py-2.5 text-right text-gray-500 font-mono pr-2">{item.accountCode}</td>
                          <td className="py-2.5 text-right text-gray-900 font-semibold font-mono pr-4">LKR {formatCurrency(item.balance)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="py-3 text-center text-gray-400 italic">No current liabilities configured.</td>
                      </tr>
                    )}
                    <tr className="bg-gray-50/50 font-bold border-t border-gray-200">
                      <td colSpan="2" className="py-3 text-gray-800 pl-2">Subtotal Current Liabilities</td>
                      <td className="py-3 text-right text-gray-900 font-mono pr-4">LKR {formatCurrency(subtotalCurrentLiabilities)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Non-Current Liabilities */}
              <div className="mb-6 pl-2">
                <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Non-Current Liabilities</h4>
                <table className="w-full text-sm">
                  <tbody>
                    {reportData.nonCurrentLiabilities.length > 0 ? (
                      reportData.nonCurrentLiabilities.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 border-b border-gray-100/50">
                          <td className="py-2.5 text-gray-700 pl-2">{item.accountName}</td>
                          <td className="py-2.5 text-right text-gray-500 font-mono pr-2">{item.accountCode}</td>
                          <td className="py-2.5 text-right text-gray-900 font-semibold font-mono pr-4">LKR {formatCurrency(item.balance)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="py-3 text-center text-gray-400 italic">No non-current liabilities configured.</td>
                      </tr>
                    )}
                    <tr className="bg-gray-50/50 font-bold border-t border-gray-200">
                      <td colSpan="2" className="py-3 text-gray-800 pl-2">Subtotal Non-Current Liabilities</td>
                      <td className="py-3 text-right text-gray-900 font-mono pr-4">LKR {formatCurrency(subtotalNonCurrentLiabilities)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Liabilities Summary Row */}
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex justify-between items-center font-bold text-lg">
                <span className="text-orange-950 uppercase tracking-wide">Total Liabilities</span>
                <span className="text-orange-850 font-mono">LKR {formatCurrency(reportData.totalLiabilities)}</span>
              </div>
            </div>

            {/* 3. EQUITY SECTION */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider">3. Owner's Equity</h3>
              <div className="pl-2">
                <table className="w-full text-sm mb-4">
                  <tbody>
                    {reportData.equity.length > 0 ? (
                      reportData.equity.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 border-b border-gray-100/50">
                          <td className={`py-2.5 pl-2 ${item.accountCode === "NET_INCOME" ? "text-blue-700 font-bold" : "text-gray-700"}`}>
                            {item.accountName}
                          </td>
                          <td className="py-2.5 text-right text-gray-500 font-mono pr-2">{item.accountCode === "NET_INCOME" ? "" : item.accountCode}</td>
                          <td className="py-2.5 text-right text-gray-900 font-semibold font-mono pr-4">LKR {formatCurrency(item.balance)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="py-3 text-center text-gray-400 italic">No equity accounts found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Equity Summary Row */}
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl flex justify-between items-center font-bold text-lg">
                <span className="text-purple-950 uppercase tracking-wide">Total Equity</span>
                <span className="text-purple-850 font-mono">LKR {formatCurrency(reportData.totalEquity)}</span>
              </div>
            </div>

            {/* TOTAL LIABILITIES & EQUITY block */}
            <div className={`mt-10 p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${reportData.balanced ? "bg-emerald-50/50 border-emerald-200 text-emerald-900" : "bg-rose-50/50 border-rose-200 text-rose-900"}`}>
              <div>
                <p className="text-xs uppercase font-extrabold tracking-wider opacity-75">Accounting Equation Result</p>
                <h4 className="text-xl font-bold uppercase tracking-wide mt-1">Total Liabilities and Equity</h4>
                <p className="text-xs mt-1 opacity-70">Equation: Assets ({formatCurrency(reportData.totalAssets)}) = Liabilities & Equity ({formatCurrency(totalLiabilitiesAndEquity)})</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono">LKR {formatCurrency(totalLiabilitiesAndEquity)}</span>
                <div className={`text-xs font-bold uppercase tracking-wide mt-1 rounded-full px-3 py-1 inline-block ${reportData.balanced ? "bg-emerald-200 text-emerald-800" : "bg-rose-200 text-rose-800"}`}>
                  {reportData.balanced ? "Balanced ✓" : "Out of Balance ✕"}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default BalanceSheet;