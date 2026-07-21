import React, { useState, useEffect, useRef } from "react";
import { Line, Bar, Pie, Doughnut, Radar } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import { FiRefreshCw } from "react-icons/fi";
import { apiUrl } from "../../utils/api";

// Helper Functions
const getAmount = (item) => Number(item.totalAmount || item.grandTotal || item.total || item.amount || 0);
const getDate = (item) => item.orderDate || item.date || item.createdAt || item.purchaseDate || new Date().toISOString();
const getCustomerName = (item) => item.customerName || item.customer?.name || item.customer?.customerName || item.customer?.companyName || item.customerId || "Unknown Client";
const getSupplierName = (item) => item.supplierName || item.supplier?.name || item.supplier?.supplierName || item.supplier?.companyName || item.supplierId || "Unknown Supplier";

const RevealOnScroll = ({ children, className = "", delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (domRef.current) observer.unobserve(domRef.current);
        }
      });
    }, { threshold: 0.1 });

    if (domRef.current) observer.observe(domRef.current);

    return () => {
      if (domRef.current) observer.unobserve(domRef.current);
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const LazyChart = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (domRef.current) observer.unobserve(domRef.current);
        }
      });
    }, { threshold: 0.1 });

    if (domRef.current) observer.observe(domRef.current);

    return () => {
      if (domRef.current) observer.unobserve(domRef.current);
    };
  }, []);

  return (
    <div ref={domRef} className="w-full h-full flex justify-center items-center">
      {isVisible ? children : <div className="text-gray-400 animate-pulse text-sm">Loading chart...</div>}
    </div>
  );
};

// Finance Stats Component
const FinanceStats = ({ revenue, expenses, profit, prevRevenue, prevExpenses, prevProfit }) => {
  return (
    <div className="rounded-lg ">
      <h2 className="text-xl font-bold text-gray-800 mb-1">Last 30 Days</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Revenue" value={revenue} previous={prevRevenue} color="text-green-600" delay={0} />
        <StatCard title="Total Expenses" value={expenses} previous={prevExpenses} color="text-red-500" delay={150} />
        <StatCard title="Net Profit" value={profit} previous={prevProfit} color="text-blue-500" delay={300} />
      </div>
    </div>
  );
};

// Reusable Stat Card Component
const StatCard = ({ title, value, previous, color, delay }) => {
  const previousValue = previous || 0;
  const change = previousValue === 0
    ? (value > 0 ? 100 : 0)
    : (((value - previousValue) / Math.abs(previousValue)) * 100).toFixed(2);
  const isPositive = change >= 0;

  return (
    <RevealOnScroll className="bg-white p-5 rounded-lg shadow flex flex-col items-center" delay={delay}>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className={`text-3xl font-semibold ${color}`}>Rs. {value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      <p className="text-gray-400 text-xs">from Rs. {previousValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      <span
        className={`mt-2 text-sm font-medium px-2 py-1 rounded-full ${isPositive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          }`}
      >
        {isPositive ? "▲" : "▼"} {Math.abs(change)}%
      </span>
    </RevealOnScroll>
  );
};

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const companyId = sessionStorage.getItem("companyId");
      const token = sessionStorage.getItem("auth_token");

      if (!companyId || !token) {
        throw new Error("Missing company ID or auth token. Please login again.");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      };

      const [salesRes, purchasesRes, accountsRes, customersRes] = await Promise.all([
        fetch(`${apiUrl}/api/sales-orders/company/${companyId}`, { headers }).catch(() => ({ ok: false })),
        fetch(`${apiUrl}/api/${companyId}/purchase-orders`, { headers }).catch(() => ({ ok: false })),
        fetch(`${apiUrl}/api/companies/${companyId}/accounts`, { headers }).catch(() => ({ ok: false })),
        fetch(`${apiUrl}/api/customers/companies/${companyId}`, { headers }).catch(() => ({ ok: false }))
      ]);

      const salesData = salesRes.ok ? await salesRes.json() : [];
      const purchasesData = purchasesRes.ok ? await purchasesRes.json() : [];
      const accountsData = accountsRes.ok ? await accountsRes.json() : [];
      const customersData = customersRes.ok ? await customersRes.json() : [];

      setSales(Array.isArray(salesData) ? salesData : (salesData.data || []));
      setPurchases(Array.isArray(purchasesData) ? purchasesData : (purchasesData.data || []));
      setAccounts(Array.isArray(accountsData) ? accountsData : (accountsData.data || []));
      setCustomers(Array.isArray(customersData) ? customersData : (customersData.data || []));

    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-gray-100 min-h-screen">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-4 mt-6 rounded shadow">
          <p className="font-bold">Error Loading Dashboard</p>
          <p>{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <FiRefreshCw /> Retry
          </button>
        </div>
      </div>
    );
  }

  // --- Date Calculations ---
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(now.getDate() - 60);

  // --- Metrics ---
  let currentRevenue = 0;
  let prevRevenue = 0;
  let currentExpenses = 0;
  let prevExpenses = 0;

  sales.forEach(sale => {
    const date = new Date(getDate(sale));
    const amount = getAmount(sale);
    if (date >= thirtyDaysAgo) currentRevenue += amount;
    else if (date >= sixtyDaysAgo && date < thirtyDaysAgo) prevRevenue += amount;
  });

  purchases.forEach(purchase => {
    const date = new Date(getDate(purchase));
    const amount = getAmount(purchase);
    if (date >= thirtyDaysAgo) currentExpenses += amount;
    else if (date >= sixtyDaysAgo && date < thirtyDaysAgo) prevExpenses += amount;
  });

  const currentProfit = currentRevenue - currentExpenses;
  const prevProfit = prevRevenue - prevExpenses;

  // --- Monthly Grouping ---
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyRevenue = Array(12).fill(0);
  const monthlyExpenses = Array(12).fill(0);
  const monthlySalesCount = Array(12).fill(0);

  sales.forEach(sale => {
    const d = new Date(getDate(sale));
    if (d.getFullYear() === now.getFullYear()) {
      const m = d.getMonth();
      monthlyRevenue[m] += getAmount(sale);
      monthlySalesCount[m] += 1;
    }
  });

  purchases.forEach(purchase => {
    const d = new Date(getDate(purchase));
    if (d.getFullYear() === now.getFullYear()) {
      monthlyExpenses[d.getMonth()] += getAmount(purchase);
    }
  });

  const currentMonth = now.getMonth();
  // Get last 7 months for the charts
  const chartLabels = [];
  const revData = [];
  const expData = [];
  const salesCountData = [];

  for (let i = 6; i >= 0; i--) {
    let mIndex = currentMonth - i;
    if (mIndex < 0) mIndex += 12;
    chartLabels.push(monthNames[mIndex]);
    revData.push(monthlyRevenue[mIndex]);
    expData.push(monthlyExpenses[mIndex]);
    salesCountData.push(monthlySalesCount[mIndex]);
  }

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Revenue (Rs.)",
        data: revData,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
        tension: 0.3
      },
      {
        label: "Expenses (Rs.)",
        data: expData,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderWidth: 2,
        tension: 0.3
      },
    ],
  };

  const barData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Sales Count",
        data: salesCountData,
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  // --- Customer / Supplier Grouping ---
  const customerTotals = {};
  sales.forEach(sale => {
    const cName = getCustomerName(sale);
    customerTotals[cName] = (customerTotals[cName] || 0) + getAmount(sale);
  });

  const sortedCustomers = Object.entries(customerTotals).sort((a, b) => b[1] - a[1]);
  const top5Customers = sortedCustomers.slice(0, 5);

  const pieData = {
    labels: top5Customers.length ? top5Customers.map(c => c[0]) : ["No Data"],
    datasets: [{
      data: top5Customers.length ? top5Customers.map(c => c[1]) : [1],
      backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
      borderWidth: 1,
    }],
  };

  const supplierTotals = {};
  purchases.forEach(p => {
    const sName = getSupplierName(p);
    supplierTotals[sName] = (supplierTotals[sName] || 0) + getAmount(p);
  });

  const sortedSuppliers = Object.entries(supplierTotals).sort((a, b) => b[1] - a[1]);
  const top4Suppliers = sortedSuppliers.slice(0, 4);

  const doughnutData = {
    labels: top4Suppliers.length ? top4Suppliers.map(s => s[0]) : ["No Data"],
    datasets: [{
      data: top4Suppliers.length ? top4Suppliers.map(s => s[1]) : [1],
      backgroundColor: ["#FF9F40", "#FF6384", "#36A2EB", "#FFCE56"],
      borderWidth: 1,
    }],
  };

  // --- Recent Transactions ---
  const combinedTransactions = [
    ...sales.map(s => ({
      id: s.id || Math.random(),
      date: new Date(getDate(s)),
      desc: `Sale to ${getCustomerName(s)}`,
      amount: getAmount(s),
      type: "Revenue",
      color: "text-green-600"
    })),
    ...purchases.map(p => ({
      id: p.id || Math.random(),
      date: new Date(getDate(p)),
      desc: `Purchase from ${getSupplierName(p)}`,
      amount: getAmount(p),
      type: "Expense",
      color: "text-red-600"
    }))
  ].sort((a, b) => b.date - a.date).slice(0, 5);

  const radarData = {
    labels: [
      "Revenue",
      "Growth",
      "Customer Satisfaction",
      "Efficiency",
      "Profitability",
    ],
    datasets: [
      {
        label: "Performance",
        data: [
          currentRevenue > 0 ? 85 : 0,
          currentRevenue >= prevRevenue ? 90 : 40,
          80, // Static baseline for customer satisfaction
          currentExpenses < currentRevenue ? 85 : 50,
          currentProfit > 0 ? 95 : 30
        ],
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1900,
      easing: "easeOutQuart",
      animateRotate: true,
      animateScale: true
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col gap-6">

      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <FinanceStats
        revenue={currentRevenue} prevRevenue={prevRevenue}
        expenses={currentExpenses} prevExpenses={prevExpenses}
        profit={currentProfit} prevProfit={prevProfit}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RevealOnScroll className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center" delay={0}>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Revenue and Expenses Overview</h3>
          <div className="h-80 w-full max-w-md">
            {sales.length > 0 || purchases.length > 0 ? (
              <LazyChart>
                <Line data={chartData} options={chartOptions} />
              </LazyChart>
            ) : <p className="text-center text-gray-500 mt-32">No data available</p>}
          </div>
        </RevealOnScroll>
        <RevealOnScroll className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center" delay={150}>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Monthly Sales Comparison</h3>
          <div className="h-80 w-full max-w-md">
            {sales.length > 0 ? (
              <LazyChart>
                <Bar data={barData} options={chartOptions} />
              </LazyChart>
            ) : <p className="text-center text-gray-500 mt-32">No data available</p>}
          </div>
        </RevealOnScroll>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RevealOnScroll className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center" delay={0}>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Top Revenue Sources</h3>
          <div className="h-80 w-full max-w-md">
            {top5Customers.length > 0 ? (
              <LazyChart>
                <Pie data={pieData} options={chartOptions} />
              </LazyChart>
            ) : <p className="text-center text-gray-500 mt-32">No data available</p>}
          </div>
        </RevealOnScroll>
        <RevealOnScroll className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center" delay={150}>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Top Expenses</h3>
          <div className="h-80 w-full max-w-md">
            {top4Suppliers.length > 0 ? (
              <LazyChart>
                <Doughnut data={doughnutData} options={chartOptions} />
              </LazyChart>
            ) : <p className="text-center text-gray-500 mt-32">No data available</p>}
          </div>
        </RevealOnScroll>
        <RevealOnScroll className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center" delay={300}>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Financial KPIs</h3>
          <div className="h-80 w-full max-w-md">
            <LazyChart>
              <Radar data={radarData} options={chartOptions} />
            </LazyChart>
          </div>
        </RevealOnScroll>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RevealOnScroll className="bg-white p-6 rounded-lg shadow-lg" delay={0}>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
          <div className="bg-gradient-to-r from-cyan-300 to-cyan-500 h-px mb-6"></div>
          <div className="overflow-x-auto">
            {combinedTransactions.length > 0 ? (
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-4">Date</th>
                    <th className="py-2 px-4">Description</th>
                    <th className="py-2 px-4 text-right">Amount</th>
                    <th className="py-2 px-4">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {combinedTransactions.map((t, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-4">{t.date.toLocaleDateString()}</td>
                      <td className="py-2 px-4 font-medium text-gray-700">{t.desc}</td>
                      <td className={`py-2 px-4 text-right font-semibold ${t.color}`}>
                        {t.type === "Expense" ? "- " : ""}Rs. {t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${t.type === 'Revenue' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {t.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-500 py-4">No recent transactions found.</p>
            )}
          </div>
        </RevealOnScroll>

        <RevealOnScroll className="bg-white p-6 rounded-lg shadow-lg" delay={150}>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Clients</h3>
          <div className="bg-gradient-to-r from-cyan-300 to-cyan-500 h-px mb-6"></div>
          {top5Customers.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {top5Customers.map((client, idx) => (
                <li key={idx} className="py-3 px-4 flex justify-between items-center hover:bg-gray-50 rounded transition-colors">
                  <span className="font-medium text-gray-700 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                    {client[0]}
                  </span>
                  <span className="font-semibold text-gray-900">Rs. {client[1].toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-4">No client data available.</p>
          )}
        </RevealOnScroll>
      </div>
    </div>
  );
};

export default DashboardPage;
