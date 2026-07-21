import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../utils/api";
import {
  FaSpinner,
  FaSearch,
  FaSyncAlt,
  FaFileExport,
  FaPlus,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaReceipt,
  FaCalendarAlt,
} from "react-icons/fa";

export default function AgedReceivables() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("summary");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [page, setPage] = useState(1);

  const [salesOrders, setSalesOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const itemsPerPage = 8;

  const getCompanyId = () => sessionStorage.getItem("companyId");
  const getToken = () => sessionStorage.getItem("auth_token") || sessionStorage.getItem("token");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  const formatAmount = (amount) => {
    const value = Number(amount || 0);
    return `Rs. ${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return date;
  };

  const getDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;

    const today = new Date();
    const due = new Date(dueDate);

    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - due.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPaymentStatus = (order) => {
    const total = Number(order.total || 0);
    const paid = Number(order.amountPaid || 0);
    const balance = Number(order.balanceDue || 0);

    if (total > 0 && balance === 0) {
      return {
        label: "Paid",
        className: "bg-green-50 text-green-700 border-green-200",
      };
    }

    if (paid > 0 && balance > 0) {
      return {
        label: "Partially Paid",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }

    return {
      label: "Unpaid",
      className: "bg-red-50 text-red-700 border-red-200",
    };
  };

  const getBucketValues = (balanceDue, dueDate) => {
    const balance = Number(balanceDue || 0);
    const daysOverdue = getDaysOverdue(dueDate);

    const buckets = {
      notDueYet: 0,
      age1: 0,
      age2: 0,
      age3: 0,
      age4: 0,
    };

    if (balance <= 0) {
      return buckets;
    }

    if (daysOverdue <= 0) {
      buckets.notDueYet = balance;
    } else if (daysOverdue >= 1 && daysOverdue <= 30) {
      buckets.age1 = balance;
    } else if (daysOverdue >= 31 && daysOverdue <= 60) {
      buckets.age2 = balance;
    } else if (daysOverdue >= 61 && daysOverdue <= 90) {
      buckets.age3 = balance;
    } else {
      buckets.age4 = balance;
    }

    return buckets;
  };

  const fetchSalesOrders = async () => {
    try {
      setIsLoading(true);
      setError("");

      const companyId = getCompanyId();
      const token = getToken();

      if (!companyId || !token) {
        throw new Error("Session expired. Please log in again.");
      }

      const response = await fetch(
        `${apiUrl}/api/sales-orders/company/${companyId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText ||
            `Failed to fetch sales orders. Status: ${response.status}`
        );
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : data?.data || [];

      console.log("Sales Orders loaded for Aged Receivables:", list);
      setSalesOrders(list);
    } catch (err) {
      console.error("Aged Receivables Error:", err);
      setError(err.message || "Failed to load aged receivables.");
      setSalesOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  // Compute detail rows for all sale orders
  const detailData = useMemo(() => {
    return salesOrders.map((order) => {
      const balance = Number(order.balanceDue || 0);
      const dueDate = order.dueDate || order.issueDate;
      const buckets = getBucketValues(balance, dueDate);

      return {
        id: order.id,
        customer: order.customerName || "-",
        invoice: order.soNumber || `SO #${order.id}`,
        invoiceDate: order.issueDate || "-",
        dueDate: dueDate || "-",
        daysOverdue: getDaysOverdue(dueDate),
        notDueYet: buckets.notDueYet,
        age1: buckets.age1,
        age2: buckets.age2,
        age3: buckets.age3,
        age4: buckets.age4,
        total: Number(order.total || 0),
        amountPaid: Number(order.amountPaid || 0),
        balance,
        status: getPaymentStatus(order),
      };
    });
  }, [salesOrders]);

  // Compute aggregated summary data by customer
  const summaryData = useMemo(() => {
    const customerMap = {};

    detailData.forEach((row) => {
      if (!customerMap[row.customer]) {
        customerMap[row.customer] = {
          customer: row.customer,
          notDueYet: 0,
          age1: 0,
          age2: 0,
          age3: 0,
          age4: 0,
          total: 0,
          totalPaid: 0,
          totalInvoice: 0,
        };
      }

      customerMap[row.customer].notDueYet += row.notDueYet;
      customerMap[row.customer].age1 += row.age1;
      customerMap[row.customer].age2 += row.age2;
      customerMap[row.customer].age3 += row.age3;
      customerMap[row.customer].age4 += row.age4;
      customerMap[row.customer].total += row.balance; // Accumulated outstanding balance
      customerMap[row.customer].totalPaid += row.amountPaid;
      customerMap[row.customer].totalInvoice += row.total;
    });

    return Object.values(customerMap);
  }, [detailData]);

  // Aggregate global financial metrics for summary cards
  const totals = useMemo(() => {
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let totalPaid = 0;
    let totalInvoiceAmount = 0;

    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    salesOrders.forEach((so) => {
      const total = Number(so.total || 0);
      const paid = Number(so.amountPaid || 0);
      const balance = Number(so.balanceDue || 0);
      const dueDate = so.dueDate || so.issueDate;
      const daysOverdue = getDaysOverdue(dueDate);

      totalInvoiceAmount += total;
      totalPaid += paid;
      totalOutstanding += balance;

      if (balance > 0 && daysOverdue > 0) {
        totalOverdue += balance;
      }

      if (total > 0 && balance === 0) {
        paidCount++;
      } else if (paid > 0 && balance > 0) {
        partialCount++;
      } else if (balance > 0) {
        unpaidCount++;
      }
    });

    return {
      totalOutstanding,
      totalOverdue,
      totalPaid,
      totalInvoiceAmount,
      paidCount,
      partialCount,
      unpaidCount,
      totalCount: salesOrders.length,
    };
  }, [salesOrders]);

  const filterData = (data) => {
    let filteredData = [...data];

    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();

      filteredData = filteredData.filter((row) => {
        return (
          String(row.customer || "").toLowerCase().includes(term) ||
          String(row.invoice || "").toLowerCase().includes(term)
        );
      });
    }

    if (dateRange && activeTab === "detail") {
      const today = new Date();

      filteredData = filteredData.filter((row) => {
        const invoiceDate = new Date(row.invoiceDate);

        if (dateRange === "last30") {
          const last30 = new Date();
          last30.setDate(today.getDate() - 30);
          return invoiceDate >= last30;
        }

        if (dateRange === "thisMonth") {
          return (
            invoiceDate.getMonth() === today.getMonth() &&
            invoiceDate.getFullYear() === today.getFullYear()
          );
        }

        if (dateRange === "lastMonth") {
          const lastMonth = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1
          );

          return (
            invoiceDate.getMonth() === lastMonth.getMonth() &&
            invoiceDate.getFullYear() === lastMonth.getFullYear()
          );
        }

        return true;
      });
    }

    return filteredData;
  };

  const currentDataList = activeTab === "summary" ? summaryData : detailData;
  const filteredList = filterData(currentDataList);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;

  const paginatedData = filteredList.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleDateRangeChange = (e) => {
    setDateRange(e.target.value);
    setPage(1);
  };

  const handleExport = () => {
    if (filteredList.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers =
      activeTab === "summary"
        ? ["Customer", "Not Due Yet", "1-30 Days", "31-60 Days", "61-90 Days", "90+ Days", "Outstanding Balance"]
        : [
            "Customer",
            "Invoice",
            "Invoice Date",
            "Due Date",
            "Days Overdue",
            "Status",
            "Not Due Yet",
            "1-30 Days",
            "31-60 Days",
            "61-90 Days",
            "90+ Days",
            "Total Amount",
            "Balance Due",
          ];

    const csvRows = filteredList.map((row) => {
      if (activeTab === "summary") {
        return [
          row.customer,
          row.notDueYet,
          row.age1,
          row.age2,
          row.age3,
          row.age4,
          row.total,
        ];
      }

      return [
        row.customer,
        row.invoice,
        row.invoiceDate,
        row.dueDate,
        row.daysOverdue <= 0 ? "Not Due" : `${row.daysOverdue} Days`,
        row.status?.label || "-",
        row.notDueYet,
        row.age1,
        row.age2,
        row.age3,
        row.age4,
        row.total,
        row.balance,
      ];
    });

    const csvContent = [headers, ...csvRows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aged-receivables-${activeTab}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateInvoice = () => {
    navigate("/customer/sales/new");
  };

  const handleAddPayment = () => {
    navigate("/bank/receive-money");
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6 max-w-full overflow-x-hidden">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Aged Receivables</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage outstanding customer balances across aging periods
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <button
            type="button"
            onClick={fetchSalesOrders}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 font-medium transition-all shadow-sm"
          >
            <FaSyncAlt />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 font-medium transition-all shadow-md shadow-blue-500/10"
          >
            <FaFileExport />
            Export CSV
          </button>

          <button
            type="button"
            onClick={handleCreateInvoice}
            className="px-4 py-2 bg-green-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 font-medium transition-all shadow-md shadow-green-500/10"
          >
            <FaPlus />
            Create Invoice
          </button>

          <button
            type="button"
            onClick={handleAddPayment}
            className="px-4 py-2 bg-gray-800 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-gray-900 font-medium transition-all shadow-md shadow-gray-800/10"
          >
            <FaMoneyBillWave />
            Receive Money
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <SummaryCard
          title="Total Outstanding"
          value={formatAmount(totals.totalOutstanding)}
          description="Total unpaid receivables due"
          icon={<FaMoneyBillWave className="text-blue-500" />}
          borderColor="border-blue-500"
        />
        <SummaryCard
          title="Overdue Amount"
          value={formatAmount(totals.totalOverdue)}
          description="Past expected due date"
          icon={<FaClock className="text-red-500" />}
          borderColor="border-red-500"
        />
        <SummaryCard
          title="Total Settled"
          value={formatAmount(totals.totalPaid)}
          description="Amounts received on invoices"
          icon={<FaCheckCircle className="text-green-500" />}
          borderColor="border-green-500"
        />
        <SummaryCard
          title="Total Sales Value"
          value={formatAmount(totals.totalInvoiceAmount)}
          description="All generated invoices"
          icon={<FaReceipt className="text-indigo-500" />}
          borderColor="border-indigo-500"
        />
        <SummaryCard
          title="Invoices Status"
          value={`${totals.unpaidCount + totals.partialCount} Unpaid`}
          description={`${totals.paidCount} Fully Paid, ${totals.totalCount} Total`}
          icon={<FaCalendarAlt className="text-amber-500" />}
          borderColor="border-amber-500"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3">
          <FaExclamationCircle className="text-lg flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters and Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-grow max-w-md">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer or invoice..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <select
            value={dateRange}
            onChange={handleDateRangeChange}
            disabled={activeTab === "summary"}
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 outline-none cursor-pointer transition-all"
          >
            <option value="">All Dates</option>
            <option value="last30">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
          </select>
        </div>

        <div className="flex gap-4 border-b">
          <button
            type="button"
            className={`px-4 py-3 text-sm font-semibold transition-all relative ${
              activeTab === "summary"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-900"
            }`}
            onClick={() => {
              setActiveTab("summary");
              setPage(1);
            }}
          >
            Summary View
          </button>

          <button
            type="button"
            className={`px-4 py-3 text-sm font-semibold transition-all relative ${
              activeTab === "detail"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-900"
            }`}
            onClick={() => {
              setActiveTab("detail");
              setPage(1);
            }}
          >
            Detailed View
          </button>
        </div>
      </div>

      {/* Tables section */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24 bg-white rounded-2xl border shadow-sm">
          <FaSpinner className="animate-spin text-blue-500 text-4xl mr-3" />
          <span className="text-gray-600 text-lg font-medium">Loading Receivables...</span>
        </div>
      ) : activeTab === "summary" ? (
        <SummaryTable rows={paginatedData} formatAmount={formatAmount} />
      ) : (
        <DetailTable
          rows={paginatedData}
          formatAmount={formatAmount}
          formatDate={formatDate}
        />
      )}

      {/* Pagination control */}
      {!isLoading && filteredList.length > 0 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-600 font-medium">
            Showing Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
            <span className="font-semibold text-gray-900">{totalPages}</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 text-sm font-semibold rounded-lg bg-white text-gray-700 disabled:text-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages}
              className="px-4 py-2 border border-gray-300 text-sm font-semibold rounded-lg bg-white text-gray-700 disabled:text-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const SummaryCard = ({ title, value, description, icon, borderColor }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border-t-4 ${borderColor} border-l border-r border-b border-gray-200 p-5 flex flex-col justify-between h-32`}>
      <div className="flex justify-between items-start">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
        <div className="text-lg">{icon}</div>
      </div>
      <div>
        <p className="text-xl font-extrabold text-gray-900 mt-1">{value}</p>
        <p className="text-xs text-gray-400 mt-1 font-medium">{description}</p>
      </div>
    </div>
  );
};

const SummaryTable = ({ rows, formatAmount }) => {
  return (
    <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden w-full max-w-full">
      <div className="overflow-x-auto w-full max-w-full">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <Th>Customer</Th>
              <Th>Not Due Yet</Th>
              <Th>1–30 Days</Th>
              <Th>31–60 Days</Th>
              <Th>61–90 Days</Th>
              <Th>90+ Days</Th>
              <Th>Outstanding Balance</Th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                  <Td strong>{row.customer}</Td>
                  <Td>{formatAmount(row.notDueYet)}</Td>
                  <Td>{formatAmount(row.age1)}</Td>
                  <Td>{formatAmount(row.age2)}</Td>
                  <Td>{formatAmount(row.age3)}</Td>
                  <Td>{formatAmount(row.age4)}</Td>
                  <Td strong className="text-blue-600">{formatAmount(row.total)}</Td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-12 text-center text-gray-500 text-base font-medium"
                >
                  No unpaid sales orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DetailTable = ({ rows, formatAmount, formatDate }) => {
  return (
    <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden w-full max-w-full">
      <div className="overflow-x-auto w-full max-w-full">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <Th>Customer</Th>
              <Th>Invoice</Th>
              <Th>Invoice Date</Th>
              <Th>Due Date</Th>
              <Th>Days Overdue</Th>
              <Th>Status</Th>
              <Th>Not Due Yet</Th>
              <Th>1–30 Days</Th>
              <Th>31–60 Days</Th>
              <Th>61–90 Days</Th>
              <Th>90+ Days</Th>
              <Th>Total Amt</Th>
              <Th>Balance Due</Th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <tr key={row.id || index} className="hover:bg-gray-50/50 transition-colors">
                  <Td strong>{row.customer}</Td>
                  <Td className="font-semibold text-gray-600">{row.invoice}</Td>
                  <Td>{formatDate(row.invoiceDate)}</Td>
                  <Td>{formatDate(row.dueDate)}</Td>
                  <Td>
                    {row.balance <= 0 ? (
                      <span className="text-gray-400 font-medium">-</span>
                    ) : row.daysOverdue <= 0 ? (
                      <span className="text-green-600 font-medium">Not Due</span>
                    ) : (
                      <span className="text-red-600 font-semibold">{row.daysOverdue} Days</span>
                    )}
                  </Td>
                  <Td>
                    <span className={`inline-block px-2.5 py-1 text-xs rounded-full font-bold border ${row.status.className}`}>
                      {row.status.label}
                    </span>
                  </Td>
                  <Td>{formatAmount(row.notDueYet)}</Td>
                  <Td>{formatAmount(row.age1)}</Td>
                  <Td>{formatAmount(row.age2)}</Td>
                  <Td>{formatAmount(row.age3)}</Td>
                  <Td>{formatAmount(row.age4)}</Td>
                  <Td className="text-gray-500">{formatAmount(row.total)}</Td>
                  <Td strong className={row.balance > 0 ? "text-red-600" : "text-green-600"}>
                    {formatAmount(row.balance)}
                  </Td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="13"
                  className="px-6 py-12 text-center text-gray-500 text-base font-medium"
                >
                  No unpaid sales orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Th = ({ children }) => {
  return (
    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
      {children}
    </th>
  );
};

const Td = ({ children, strong = false, className = "" }) => {
  return (
    <td
      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-700 ${
        strong ? "font-semibold text-gray-900" : ""
      } ${className}`}
    >
      {children}
    </td>
  );
};