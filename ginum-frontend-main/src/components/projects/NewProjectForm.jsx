import React, { useState, useEffect } from "react";
import { FaPlusCircle, FaTimes, FaSpinner } from "react-icons/fa";
import { FiFolder, FiUser, FiCalendar, FiHash, FiFlag } from "react-icons/fi";
import AddCustomerForm from "../customer/AddCustomer";
import { apiUrl } from "../../utils/api";
import Alert from "../Alert/Alert";

const inputClass =
  "w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-gray-50 transition-all";

const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

const WORKING_STATUS_OPTIONS = [
  { id: "ACTIVE", name: "Active" },
  { id: "WORKING", name: "Working" },
  { id: "COMPLETED", name: "Completed" },
  { id: "CANCELED", name: "Canceled" },
];

const PRIORITY_OPTIONS = [
  { id: "LOW", name: "Low" },
  { id: "MEDIUM", name: "Medium" },
  { id: "HIGH", name: "High" },
];

const PRIORITY_COLORS = {
  LOW: "text-green-600 bg-green-50",
  MEDIUM: "text-amber-600 bg-amber-50",
  HIGH: "text-red-600 bg-red-50",
};

const NewProjectForm = () => {
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [projectCode, setProjectCode] = useState("");
  const [projectName, setProjectName] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [startDate, setStartDate] = useState("");
  const [workingStatus, setWorkingStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [description, setDescription] = useState("");
  const [customers, setCustomers] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const getCompanyId = () => sessionStorage.getItem("companyId");
  const getToken = () => sessionStorage.getItem("auth_token");

  const getHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  const getCustomerId = (customer) => customer.customerId || customer.id;
  const getCustomerName = (customer) => customer.customerName || customer.name || "-";

  const fetchCustomers = async () => {
    const companyId = getCompanyId();
    const token = getToken();
    if (!companyId || !token) return;

    try {
      setCustomerLoading(true);
      const response = await fetch(`${apiUrl}/api/customers/companies/${companyId}`, {
        method: "GET",
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load customers:", error);
      Alert.error("Failed to load customers.");
    } finally {
      setCustomerLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const closeCustomerModal = () => {
    setShowCustomerModal(false);
    fetchCustomers();
  };

  const resetForm = () => {
    setProjectCode("");
    setProjectName("");
    setSelectedCustomer("");
    setStartDate("");
    setWorkingStatus("");
    setPriority("");
    setDescription("");
    setErrors({});
  };

  const validate = () => {
    const e = {};
    if (!projectCode.trim()) e.projectCode = "Project code is required";
    if (!projectName.trim()) e.projectName = "Project name is required";
    if (!selectedCustomer) e.selectedCustomer = "Customer is required";
    if (!startDate) e.startDate = "Start date is required";
    if (!workingStatus) e.workingStatus = "Working status is required";
    if (!priority) e.priority = "Priority is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const companyId = getCompanyId();
    const token = getToken();

    if (!companyId || !token) {
      Alert.error("Missing company ID or auth token. Please login again.");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${apiUrl}/api/companies/${companyId}/projects`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          projectCode: projectCode.trim(),
          projectName: projectName.trim(),
          customerId: Number(selectedCustomer),
          startDate,
          workingStatus,
          priority,
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Project save error:", errorText);
        Alert.error("Project save failed. Please try again.");
        return;
      }

      Alert.success("Project saved successfully!");
      resetForm();
    } catch (error) {
      console.error("Cannot connect to backend:", error);
      Alert.error("Cannot connect to backend.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 max-w-3xl mx-auto">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
          <FiFolder className="text-blue-600 text-xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Create Project</h1>
          <p className="text-sm text-gray-500 mt-0.5">Set up a new project and assign it to a customer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
        {/* Project Info Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
            <h3 className="font-bold text-gray-800 text-sm">Project Information</h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>
                Project Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={projectCode}
                onChange={(e) => { setProjectCode(e.target.value); setErrors((p) => ({ ...p, projectCode: "" })); }}
                className={`${inputClass} ${errors.projectCode ? "border-red-400" : ""}`}
                placeholder="e.g. PRJ-001"
                disabled={saving}
              />
              {errors.projectCode && <p className="text-red-500 text-xs mt-1">{errors.projectCode}</p>}
            </div>
            <div>
              <label className={labelClass}>
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => { setProjectName(e.target.value); setErrors((p) => ({ ...p, projectName: "" })); }}
                className={`${inputClass} ${errors.projectName ? "border-red-400" : ""}`}
                placeholder="e.g. Website Redesign"
                disabled={saving}
              />
              {errors.projectName && <p className="text-red-500 text-xs mt-1">{errors.projectName}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputClass} resize-none`}
                rows="3"
                placeholder="Brief description of the project..."
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Customer & Schedule Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
            <h3 className="font-bold text-gray-800 text-sm">Customer & Schedule</h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Customer */}
            <div>
              <label className={labelClass}>
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => { setSelectedCustomer(e.target.value); setErrors((p) => ({ ...p, selectedCustomer: "" })); }}
                className={`${inputClass} ${errors.selectedCustomer ? "border-red-400" : ""}`}
                disabled={customerLoading || saving}
              >
                <option value="">
                  {customerLoading ? "Loading customers..." : "Select a customer"}
                </option>
                {customers.map((customer, index) => {
                  const customerId = getCustomerId(customer);
                  return (
                    <option key={customerId || index} value={customerId}>
                      {getCustomerName(customer)}
                    </option>
                  );
                })}
              </select>
              {errors.selectedCustomer && <p className="text-red-500 text-xs mt-1">{errors.selectedCustomer}</p>}
              <button
                type="button"
                onClick={() => setShowCustomerModal(true)}
                className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1.5 mt-2 cursor-pointer"
              >
                <FaPlusCircle /> Add New Customer
              </button>
            </div>

            {/* Start Date */}
            <div>
              <label className={labelClass}>
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setErrors((p) => ({ ...p, startDate: "" })); }}
                className={`${inputClass} ${errors.startDate ? "border-red-400" : ""}`}
                disabled={saving}
              />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>

            {/* Working Status */}
            <div>
              <label className={labelClass}>
                Working Status <span className="text-red-500">*</span>
              </label>
              <select
                value={workingStatus}
                onChange={(e) => { setWorkingStatus(e.target.value); setErrors((p) => ({ ...p, workingStatus: "" })); }}
                className={`${inputClass} ${errors.workingStatus ? "border-red-400" : ""}`}
                disabled={saving}
              >
                <option value="">Select status</option>
                {WORKING_STATUS_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.workingStatus && <p className="text-red-500 text-xs mt-1">{errors.workingStatus}</p>}
            </div>

            {/* Priority */}
            <div>
              <label className={labelClass}>
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => { setPriority(e.target.value); setErrors((p) => ({ ...p, priority: "" })); }}
                className={`${inputClass} ${errors.priority ? "border-red-400" : ""}`}
                disabled={saving}
              >
                <option value="">Select priority</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {errors.priority && <p className="text-red-500 text-xs mt-1">{errors.priority}</p>}
              {priority && (
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold mt-1.5 ${PRIORITY_COLORS[priority]}`}>
                  {priority} Priority
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={resetForm}
            disabled={saving}
            className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors cursor-pointer"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20 disabled:bg-blue-300 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? (
              <><FaSpinner className="animate-spin" /> Saving Project...</>
            ) : (
              "Save Project"
            )}
          </button>
        </div>
      </form>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) closeCustomerModal(); }}
        >
          <div className="w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3 max-h-[90vh] overflow-y-auto relative">
            <button
              type="button"
              className="absolute top-4 right-4 text-gray-600 text-xl z-10 hover:text-red-500 transition-colors cursor-pointer"
              onClick={closeCustomerModal}
            >
              <FaTimes />
            </button>
            <AddCustomerForm />
          </div>
        </div>
      )}
    </div>
  );
};

export default NewProjectForm;