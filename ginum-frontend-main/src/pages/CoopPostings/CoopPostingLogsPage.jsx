import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FaSync, FaEye, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function CoopPostingLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/api/coop/postings', {
        headers: {
          'X-COOP-API-KEY': import.meta.env.VITE_COOP_API_KEY
        }
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch coop postings:', err);
      setError('Failed to load posting logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getStatusIcon = (status) => {
    if (status === 'PROCESSED' || status === 'POSTED') {
      return <FaCheckCircle className="text-green-500" />;
    }
    if (status === 'FAILED') {
      return <FaExclamationCircle className="text-red-500" />;
    }
    return <FaSync className="text-blue-500" />;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Coop ERP Postings</h1>
        <button 
          onClick={fetchLogs} 
          className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded shadow hover:bg-sky-600 transition-colors"
        >
          <FaSync className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Module</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                    No postings found from Coop ERP.
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {log.referenceType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.referenceId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <span>{log.status}</span>
                    </div>
                    {log.errorMessage && (
                      <p className="text-xs text-red-500 mt-1 truncate max-w-xs" title={log.errorMessage}>
                        {log.errorMessage}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {log.debitTotal ? (
                      `Rs. ${Number(log.debitTotal).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
