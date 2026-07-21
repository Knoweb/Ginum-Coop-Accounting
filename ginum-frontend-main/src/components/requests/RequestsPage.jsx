import React, { useState, useEffect } from "react";
import { 
  FiSearch, 
  FiFilter, 
  FiPlus, 
  FiEye, 
  FiEdit2, 
  FiTrash2, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock,
  FiFileText,
  FiX
} from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import { apiUrl } from "../../utils/api";
import Alert from "../Alert/Alert";

const RequestsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE"); // CREATE, EDIT, VIEW
  const [currentRequest, setCurrentRequest] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    title: "",
    requestType: "Leave",
    description: "",
    priority: "LOW"
  });
  const [isSaving, setIsSaving] = useState(false);

  // Reject modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const companyId = sessionStorage.getItem("companyId");
  const token = sessionStorage.getItem("auth_token");
  // Try to get user info. If not in session, default to a generic name for now.
  const loggedInUser = sessionStorage.getItem("userName") || "Current User"; 

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/requests/company/${companyId}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch requests");
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      Alert.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId && token) {
      fetchRequests();
    }
  }, [companyId, token]);

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.id?.toString().includes(searchTerm.toLowerCase()) ||
                          req.requestedBy?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const total = requests.length;
  const pending = requests.filter(r => r.status === "PENDING").length;
  const approved = requests.filter(r => r.status === "APPROVED").length;
  const rejected = requests.filter(r => r.status === "REJECTED").length;

  const openCreateModal = () => {
    setModalMode("CREATE");
    setFormData({ title: "", requestType: "Leave", description: "", priority: "LOW" });
    setIsModalOpen(true);
  };

  const openEditModal = (req) => {
    setModalMode("EDIT");
    setCurrentRequest(req);
    setFormData({
      title: req.title,
      requestType: req.requestType,
      description: req.description,
      priority: req.priority
    });
    setIsModalOpen(true);
  };

  const openViewModal = (req) => {
    setModalMode("VIEW");
    setCurrentRequest(req);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      Alert.error("Title and Description are required");
      return;
    }

    setIsSaving(true);
    try {
      const url = modalMode === "CREATE" 
        ? `${apiUrl}/api/requests/company/${companyId}`
        : `${apiUrl}/api/requests/${currentRequest.id}`;
      
      const method = modalMode === "CREATE" ? "POST" : "PUT";
      
      const payload = {
        ...formData,
        requestedBy: modalMode === "CREATE" ? loggedInUser : currentRequest.requestedBy
      };

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save request");
      Alert.success(`Request ${modalMode === "CREATE" ? "created" : "updated"} successfully`);
      setIsModalOpen(false);
      fetchRequests();
    } catch (err) {
      Alert.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;
    try {
      const res = await fetch(`${apiUrl}/api/requests/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Failed to delete request");
      Alert.success("Request deleted successfully");
      fetchRequests();
    } catch (err) {
      Alert.error(err.message);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${apiUrl}/api/requests/${id}/approve`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ approvedBy: loggedInUser })
      });
      if (!res.ok) throw new Error("Failed to approve request");
      Alert.success("Request approved successfully");
      fetchRequests();
    } catch (err) {
      Alert.error(err.message);
    }
  };

  const openRejectModal = (req) => {
    setCurrentRequest(req);
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason) {
      Alert.error("Reject reason is required");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/requests/${currentRequest.id}/reject`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ rejectedBy: loggedInUser, reason: rejectReason })
      });
      if (!res.ok) throw new Error("Failed to reject request");
      Alert.success("Request rejected");
      setIsRejectModalOpen(false);
      fetchRequests();
    } catch (err) {
      Alert.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'APPROVED') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
    if (status === 'PENDING') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Pending</span>;
    if (status === 'REJECTED') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
    if (status === 'IN_REVIEW') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">In Review</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Requests</h1>
        <p className="text-gray-500 mt-1">Manage and track internal requests</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Requests</p>
            <h3 className="text-2xl font-bold text-gray-800">{total}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <FiFileText size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Pending</p>
            <h3 className="text-2xl font-bold text-gray-800">{pending}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <FiClock size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Approved</p>
            <h3 className="text-2xl font-bold text-gray-800">{approved}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <FiCheckCircle size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Rejected</p>
            <h3 className="text-2xl font-bold text-gray-800">{rejected}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
            <FiXCircle size={24} />
          </div>
        </div>
      </div>

      {/* Controls & Actions */}
      <div className="bg-white rounded-t-xl shadow-sm border-b border-gray-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiFilter className="text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent appearance-none cursor-pointer pr-8"
            >
              <option value="All">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <button 
          onClick={openCreateModal}
          className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
        >
          <FiPlus size={16} />
          New Request
        </button>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-b-xl shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-[400px]">
            <FaSpinner className="animate-spin text-sky-500 text-3xl" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
            <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <FiFileText size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No requests found</h3>
            <p className="text-sm text-gray-500 max-w-sm text-center">
              There are currently no requests matching your criteria, or none have been created yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Request ID</th>
                  <th className="px-6 py-4">Title / Type</th>
                  <th className="px-6 py-4">Requested By</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-sky-600">
                      REQ-{req.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{req.title}</div>
                      <div className="text-xs text-gray-500">{req.requestType} • {req.priority} Priority</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {req.requestedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {req.requestedDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2 items-center">
                        {req.status === 'PENDING' || req.status === 'IN_REVIEW' ? (
                          <>
                            <button onClick={() => handleApprove(req.id)} className="text-green-600 hover:text-green-800 transition-colors mr-2" title="Approve">
                              <FiCheckCircle size={18} />
                            </button>
                            <button onClick={() => openRejectModal(req)} className="text-red-600 hover:text-red-800 transition-colors mr-2" title="Reject">
                              <FiXCircle size={18} />
                            </button>
                          </>
                        ) : null}
                        
                        <button onClick={() => openViewModal(req)} className="text-gray-400 hover:text-sky-600 transition-colors" title="View">
                          <FiEye size={18} />
                        </button>
                        
                        {(req.status === 'PENDING' || req.status === 'IN_REVIEW') && (
                          <button onClick={() => openEditModal(req)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                            <FiEdit2 size={18} />
                          </button>
                        )}
                        
                        <button onClick={() => handleDelete(req.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Main Request Modal (Create/Edit/View) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                {modalMode === "CREATE" ? "New Request" : modalMode === "EDIT" ? "Edit Request" : "Request Details"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {modalMode === "VIEW" ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Title</label>
                    <p className="text-sm text-gray-900 mt-1">{currentRequest.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Type</label>
                      <p className="text-sm text-gray-900 mt-1">{currentRequest.requestType}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Priority</label>
                      <p className="text-sm text-gray-900 mt-1">{currentRequest.priority}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                    <div className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{currentRequest.description}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Requested By</label>
                      <p className="text-sm text-gray-900 mt-1">{currentRequest.requestedBy}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Date</label>
                      <p className="text-sm text-gray-900 mt-1">{currentRequest.requestedDate}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                      <div className="mt-1">{getStatusBadge(currentRequest.status)}</div>
                    </div>
                  </div>
                  
                  {currentRequest.status === 'REJECTED' && (
                    <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
                      <label className="text-xs font-bold text-red-800 uppercase">Rejection Reason</label>
                      <p className="text-sm text-red-900 mt-1">{currentRequest.rejectReason}</p>
                      <p className="text-xs text-red-700 mt-2">By {currentRequest.rejectedBy} on {currentRequest.rejectedDate}</p>
                    </div>
                  )}
                  {currentRequest.status === 'APPROVED' && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-sm text-green-900">Approved by {currentRequest.approvedBy} on {currentRequest.approvedDate}</p>
                    </div>
                  )}
                </div>
              ) : (
                <form id="requestForm" onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Request Type *</label>
                    <select
                      required
                      value={formData.requestType}
                      onChange={e => setFormData({...formData, requestType: e.target.value})}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Leave">Leave Request</option>
                      <option value="Expense">Expense Claim</option>
                      <option value="Equipment">Equipment / Asset</option>
                      <option value="Access">System Access</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="e.g. Annual Leave Request"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                    <select
                      required
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value})}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Provide details about your request..."
                    />
                  </div>
                </form>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {modalMode === "VIEW" ? "Close" : "Cancel"}
              </button>
              {modalMode !== "VIEW" && (
                <button
                  type="submit"
                  form="requestForm"
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:opacity-50 flex items-center"
                >
                  {isSaving ? <FaSpinner className="animate-spin mr-2" /> : null}
                  {modalMode === "CREATE" ? "Create Request" : "Save Changes"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Reject Request</h2>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for rejection *</label>
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Please provide a reason..."
              />
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
              <button 
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isSaving || !rejectReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
              >
                {isSaving ? <FaSpinner className="animate-spin mr-2" /> : null}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsPage;
