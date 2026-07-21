import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { FiPrinter, FiArrowLeft } from "react-icons/fi";
import api from "../../utils/api";

const TransactionVoucherPrint = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(location.state?.transaction || null);
  const [loading, setLoading] = useState(!transaction);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!transaction) {
      fetchTransaction();
    }
  }, [id, transaction]);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      setError(null);
      const companyId = sessionStorage.getItem("companyId");
      const token = sessionStorage.getItem("auth_token") || sessionStorage.getItem("token");
      
      const response = await api.get(`/api/transactions/companies/${companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const found = Array.isArray(response) ? response.find(t => t.id === parseInt(id) || t.id === id) : null;
      if (found) {
        setTransaction(found);
      } else {
        setError("Transaction not found.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch transaction details.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center">Loading voucher...</div>;
  }

  if (error || !transaction) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>{error || "Voucher data not available."}</p>
        <button onClick={() => navigate("/transactions/all")} className="mt-4 text-blue-500 underline">
          Go back to transactions
        </button>
      </div>
    );
  }

  // Determine Voucher Type
  let voucherType = "JOURNAL VOUCHER";
  if (transaction.type === "RECEIPT" || (transaction.amount > 0 && !transaction.totalDebit)) {
    voucherType = "RECEIPT VOUCHER";
  } else if (transaction.type === "PAYMENT" || (transaction.amount < 0 && !transaction.totalDebit)) {
    voucherType = "PAYMENT VOUCHER";
  }
  
  const amount = parseFloat(transaction.totalDebit || transaction.amount || 0).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white p-6 print:p-0">
      <div className="max-w-4xl mx-auto">
        {/* Actions - Hidden on Print */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <button 
            onClick={() => navigate("/transactions/all")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft /> Back to Transactions
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            <FiPrinter /> Print Voucher
          </button>
        </div>

        {/* Printable Area */}
        <div className="bg-white p-8 sm:p-12 border border-gray-200 shadow-sm print:border-none print:shadow-none print:m-0 print:p-0">
          
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-wide uppercase">
              {sessionStorage.getItem("companyName") || "COOP SYSTEM"}
            </h1>
            <h2 className="text-xl font-semibold text-gray-700 border-2 border-gray-800 inline-block px-4 py-1 mt-2">
              {voucherType}
            </h2>
          </div>

          {/* Meta Info */}
          <div className="flex justify-between mb-8">
            <div className="space-y-2 text-sm text-gray-800">
              <p><span className="font-semibold w-24 inline-block">Voucher No:</span> {transaction.referenceNumber || "-"}</p>
              <p><span className="font-semibold w-24 inline-block">Date:</span> {transaction.date || "-"}</p>
            </div>
            <div className="space-y-2 text-sm text-gray-800">
              <p><span className="font-semibold w-24 inline-block">Status:</span> {transaction.status || "Completed"}</p>
            </div>
          </div>

          {/* Description Block */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 border-b border-gray-300 pb-2 mb-4">Description</h3>
            <p className="text-gray-800 whitespace-pre-wrap">{transaction.description || "-"}</p>
          </div>

          {/* Amount Section */}
          <div className="mb-12 border border-gray-300 rounded p-4 flex justify-between items-center bg-gray-50 print:bg-white print:border-gray-800">
            <span className="font-bold text-gray-700 uppercase tracking-wide">Total Amount:</span>
            <span className="text-2xl font-bold text-gray-900">Rs. {amount}</span>
          </div>

          {/* Signatures */}
          <div className="mt-20 pt-10 border-t border-gray-200 print:border-gray-400">
            <div className="grid grid-cols-3 gap-8 text-center text-sm">
              <div>
                <div className="border-b border-gray-800 w-3/4 mx-auto mb-2 h-10"></div>
                <p className="font-semibold">Prepared By</p>
              </div>
              <div>
                <div className="border-b border-gray-800 w-3/4 mx-auto mb-2 h-10"></div>
                <p className="font-semibold">Checked By</p>
              </div>
              <div>
                <div className="border-b border-gray-800 w-3/4 mx-auto mb-2 h-10"></div>
                <p className="font-semibold">Authorized By</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default TransactionVoucherPrint;
