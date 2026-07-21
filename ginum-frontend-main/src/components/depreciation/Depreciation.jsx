import React, { useState, useEffect, useMemo } from "react";
import {
  FaSpinner,
  FaPlus,
  FaTrashAlt,
  FaCalculator,
  FaInfoCircle,
  FaCalendarAlt,
  FaTimes,
  FaChartLine,
  FaCoins,
} from "react-icons/fa";
import { apiUrl } from "../../utils/api";
import Alert from "../Alert/Alert";

const Depreciation = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [usefulLife, setUsefulLife] = useState("");
  const [depreciationMethod, setDepreciationMethod] = useState("Straight Line");
  const [isSaving, setIsSaving] = useState(false);

  // Detail view states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const companyId = sessionStorage.getItem("companyId");
  const token = sessionStorage.getItem("auth_token") || sessionStorage.getItem("token");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  });

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/assets/companies/${companyId}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setAssets(Array.isArray(data) ? data : []);
      } else {
        Alert.error("Failed to load fixed assets.");
      }
    } catch (err) {
      console.error(err);
      Alert.error("Error connecting to fixed assets API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchAssets();
    }
  }, [companyId]);

  const handleAddAsset = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      Alert.error("Please enter asset name.");
      return;
    }
    const cost = parseFloat(purchaseCost);
    if (isNaN(cost) || cost <= 0) {
      Alert.error("Please enter a valid purchase cost.");
      return;
    }
    const life = parseInt(usefulLife, 10);
    if (isNaN(life) || life <= 0) {
      Alert.error("Please enter a valid useful life in years.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        purchaseCost: cost,
        purchaseDate,
        usefulLife: life,
        depreciationMethod,
      };

      const response = await fetch(`${apiUrl}/api/assets/companies/${companyId}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.success("Fixed Asset created successfully!");
        setShowAddModal(false);
        // Reset form
        setName("");
        setPurchaseCost("");
        setPurchaseDate(new Date().toISOString().split("T")[0]);
        setUsefulLife("");
        setDepreciationMethod("Straight Line");
        fetchAssets();
      } else {
        const errorText = await response.text();
        Alert.error(errorText || "Failed to create fixed asset.");
      }
    } catch (err) {
      console.error(err);
      Alert.error("Error saving fixed asset.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm("Are you sure you want to permanently delete this fixed asset?")) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/assets/${assetId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        Alert.success("Fixed Asset deleted successfully.");
        fetchAssets();
      } else {
        Alert.error("Failed to delete fixed asset.");
      }
    } catch (err) {
      console.error(err);
      Alert.error("Error deleting fixed asset.");
    }
  };

  // Calculations for summary metrics
  const totals = useMemo(() => {
    let totalCost = 0;
    let totalDep = 0;
    let netBookVal = 0;

    assets.forEach((asset) => {
      totalCost += Number(asset.purchaseCost || 0);
      totalDep += Number(asset.accumulatedDepreciation || 0);
      netBookVal += Number(asset.bookValue || 0);
    });

    return {
      totalCost,
      totalDep,
      netBookVal,
      count: assets.length,
    };
  }, [assets]);

  // Live preview calculations for Add Form
  const livePreview = useMemo(() => {
    const cost = parseFloat(purchaseCost);
    const life = parseInt(usefulLife, 10);
    if (isNaN(cost) || isNaN(life) || cost <= 0 || life <= 0) {
      return null;
    }
    const annualDep = cost / life;
    const monthlyDep = annualDep / 12;

    return {
      annual: annualDep,
      monthly: monthlyDep,
    };
  }, [purchaseCost, usefulLife]);

  // Depreciation schedule generation for detailed view
  const depreciationSchedule = useMemo(() => {
    if (!selectedAsset) return [];

    const schedule = [];
    const cost = Number(selectedAsset.purchaseCost);
    const life = selectedAsset.usefulLife;
    const annualDep = cost / life;

    let remainingBookValue = cost;
    let accumulatedDep = 0;

    for (let year = 1; year <= life; year++) {
      const beginningBook = remainingBookValue;
      let depExpense = annualDep;

      if (beginningBook < depExpense) {
        depExpense = beginningBook;
      }

      accumulatedDep += depExpense;
      remainingBookValue -= depExpense;

      schedule.push({
        year,
        beginningBook,
        depExpense,
        accumulatedDep,
        endingBook: remainingBookValue,
      });
    }

    return schedule;
  }, [selectedAsset]);

  const formatCurrency = (val) => {
    return `Rs. ${Number(val || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6 max-w-full overflow-x-hidden">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FaCalculator className="text-blue-600" />
            Asset Depreciation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track fixed assets, calculate useful life, and review depreciation schedules
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
        >
          <FaPlus /> Add Fixed Asset
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Fixed Assets Cost</p>
            <div className="text-lg p-2 rounded-lg bg-blue-50/50 text-blue-500">
              <FaCoins />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{formatCurrency(totals.totalCost)}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Initial asset value</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Accumulated Depreciation</p>
            <div className="text-lg p-2 rounded-lg bg-red-50/50 text-red-500">
              <FaChartLine />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-red-600 mt-1">{formatCurrency(totals.totalDep)}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Value expensed over time</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Book Value</p>
            <div className="text-lg p-2 rounded-lg bg-green-50/50 text-green-500">
              <FaCalculator />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-green-600 mt-1">{formatCurrency(totals.netBookVal)}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Remaining carrying value</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Asset Count</p>
            <div className="text-lg p-2 rounded-lg bg-indigo-50/50 text-indigo-500">
              <FaInfoCircle />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-indigo-900 mt-1">{totals.count} Assets</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Total registered fixed assets</p>
          </div>
        </div>
      </div>

      {/* Main Assets Table */}
      <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Asset Name</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Purchase Date</th>
                <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Useful Life</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Method</th>
                <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Purchase Cost</th>
                <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Annual Dep</th>
                <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Accumulated Dep</th>
                <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Net Book Value</th>
                <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <FaSpinner className="animate-spin text-blue-500 text-3xl mb-3" />
                      <p className="text-gray-600 font-medium">Loading fixed assets ledger...</p>
                    </div>
                  </td>
                </tr>
              ) : assets.length > 0 ? (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {asset.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {asset.purchaseDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-medium">
                      {asset.usefulLife} Years
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {asset.depreciationMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold text-right">
                      {formatCurrency(asset.purchaseCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                      {formatCurrency(asset.annualDepreciation)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold text-right">
                      {formatCurrency(asset.accumulatedDepreciation)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold text-right">
                      {formatCurrency(asset.bookValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setShowDetailModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
                        >
                          <FaInfoCircle /> Schedule
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Asset"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <FaCalculator className="text-5xl text-gray-300 mb-3" />
                      <p className="text-lg font-bold text-gray-600">No fixed assets registered</p>
                      <p className="text-sm text-gray-400 mt-1">Click the "Add Fixed Asset" button above to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FaPlus className="text-blue-600" /> Add Fixed Asset
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="p-6 space-y-5">
              {/* Asset Name */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Asset Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Office Laptops, Building, Machinery"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Cost */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Purchase Cost (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-900 font-medium"
                    required
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Purchase Date *</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-900 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Useful Life */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Useful Life (Years) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 5"
                    value={usefulLife}
                    onChange={(e) => setUsefulLife(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-900 font-medium"
                    required
                  />
                </div>

                {/* Method */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Method *</label>
                  <select
                    value={depreciationMethod}
                    onChange={(e) => setDepreciationMethod(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer outline-none text-gray-900"
                    required
                  >
                    <option value="Straight Line">Straight Line</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Live Preview */}
              {livePreview && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 space-y-1.5">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Depreciation Projection</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Annual Depreciation:</span>
                    <span className="font-bold text-blue-900">{formatCurrency(livePreview.annual)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Monthly Depreciation:</span>
                    <span className="font-bold text-blue-900">{formatCurrency(livePreview.monthly)}</span>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold transition-colors cursor-pointer"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:bg-blue-400"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Schedule Modal */}
      {showDetailModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedAsset.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Depreciation Schedule Breakdown ({selectedAsset.depreciationMethod})</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Asset Snapshot Row */}
              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Cost</span>
                  <span className="text-sm font-extrabold text-gray-900">{formatCurrency(selectedAsset.purchaseCost)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Purchase Date</span>
                  <span className="text-sm font-extrabold text-gray-900">{selectedAsset.purchaseDate}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Useful Life</span>
                  <span className="text-sm font-extrabold text-gray-900">{selectedAsset.usefulLife} Years</span>
                </div>
              </div>

              {/* Schedule Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="max-h-72 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-left">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Period (Year)</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase text-right">Beginning Book Value</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase text-right">Depreciation Expense</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase text-right">Accumulated Dep</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase text-right">Ending Book Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {depreciationSchedule.map((row) => (
                        <tr key={row.year} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-sm font-bold text-gray-800">Year {row.year}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(row.beginningBook)}</td>
                          <td className="px-4 py-3 text-sm text-blue-600 font-semibold text-right">{formatCurrency(row.depExpense)}</td>
                          <td className="px-4 py-3 text-sm text-red-600 text-right">{formatCurrency(row.accumulatedDep)}</td>
                          <td className="px-4 py-3 text-sm text-green-600 font-bold text-right">{formatCurrency(row.endingBook)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer"
              >
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Depreciation;
