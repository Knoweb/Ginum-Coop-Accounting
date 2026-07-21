import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import { apiUrl } from "../../utils/api";
import Alert from "../Alert/Alert";

const EditProjectModal = ({ project, onClose, onSuccess }) => {
  const [projectCode, setProjectCode] = useState(project.code || "");
  const [projectName, setProjectName] = useState(project.name || "");
  const [selectedCustomer, setSelectedCustomer] = useState(project.customerId || "");
  const [startDate, setStartDate] = useState(project.startDate || "");
  const [workingStatus, setWorkingStatus] = useState(project.workingStatus || "ACTIVE");
  const [priority, setPriority] = useState(project.priority || "LOW");
  const [description, setDescription] = useState(project.description || "");

  const [customers, setCustomers] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const companyId = sessionStorage.getItem("companyId");
  const token = sessionStorage.getItem("auth_token");

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!companyId || !token) return;
      try {
        setIsLoadingCustomers(true);
        const response = await fetch(`${apiUrl}/api/customers/companies/${companyId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setCustomers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load customers for project editing", err);
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, [companyId, token]);

  const workingStatusOptions = [
    { id: "ACTIVE", name: "Active" },
    { id: "WORKING", name: "Working" },
    { id: "COMPLETED", name: "Completed" },
    { id: "CANCELLED", name: "Cancelled" },
  ];

  const priorityOptions = [
    { id: "LOW", name: "Low" },
    { id: "MEDIUM", name: "Medium" },
    { id: "HIGH", name: "High" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!projectCode.trim() || !projectName.trim() || !startDate || !selectedCustomer) {
      Alert.error("Please fill in all required fields.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        projectCode: projectCode.trim(),
        projectName: projectName.trim(),
        customerId: Number(selectedCustomer),
        startDate: startDate,
        workingStatus: workingStatus,
        priority: priority,
        description: description.trim(),
      };

      const response = await fetch(`${apiUrl}/api/companies/${companyId}/projects/${project.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update project.");
      }

      const updatedProject = await response.json();
      Alert.success("Project updated successfully!");
      onSuccess(updatedProject);
      onClose();
    } catch (err) {
      console.error("Error updating project:", err);
      Alert.error(err.message || "Failed to update project.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Update Project</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Project Code */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Project Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-sm font-medium transition-all"
                required
              />
            </div>

            {/* Project Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-sm font-medium transition-all"
                required
              />
            </div>

            {/* Customer Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Customer <span className="text-red-500">*</span>
              </label>
              {isLoadingCustomers ? (
                <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                  <FaSpinner className="animate-spin text-blue-500" /> Loading customers...
                </div>
              ) : (
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-sm font-medium bg-white transition-all"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id || c.customerId} value={c.id || c.customerId}>
                      {c.name || c.customerName || "Unnamed"}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-sm font-medium transition-all"
                required
              />
            </div>

            {/* Working Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Working Status <span className="text-red-500">*</span>
              </label>
              <select
                value={workingStatus}
                onChange={(e) => setWorkingStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-sm font-medium bg-white transition-all"
                required
              >
                {workingStatusOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-sm font-medium bg-white transition-all"
                required
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-sm font-medium transition-all"
              rows="3"
              placeholder="Enter project description..."
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-md disabled:bg-blue-400 transition-colors"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <FaSpinner className="animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;
