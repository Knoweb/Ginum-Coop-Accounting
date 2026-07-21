import React, { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { FiGrid } from "react-icons/fi";
import { apiUrl } from "../../utils/api";
import Alert from "../../components/Alert/Alert";

const inputClass =
  "w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-gray-50 transition-all";

const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

const AddDepartmentForm = ({
  onSuccess,
  onCancel,
  initialData = null,
  mode = "create",
}) => {
  const [formData, setFormData] = useState({ name: "", code: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const getCompanyId = () => sessionStorage.getItem("companyId");
  const getToken = () => sessionStorage.getItem("auth_token");

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        code: initialData.code || "",
      });
    }
  }, [initialData]);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  const extractResponse = async (response) => {
    const text = await response.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return text; }
  };

  const getDepartmentId = (department) =>
    department?.id || department?.departmentId || "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Department name is required";
    if (!formData.code.trim()) newErrors.code = "Department code is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const companyId = getCompanyId();
    const token = getToken();

    if (!companyId || !token) {
      Alert.error("Session expired. Please login again.");
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim(),
      };

      const isEdit = mode === "edit" && initialData;
      const departmentId = getDepartmentId(initialData);

      const url = isEdit
        ? `${apiUrl}/api/${companyId}/departments/${departmentId}`
        : `${apiUrl}/api/${companyId}/departments`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await extractResponse(response);

      if (!response.ok) {
        throw new Error(data?.message || data?.error || data || "Failed to save department.");
      }

      const savedDepartment = data?.data || data || payload;

      Alert.success(isEdit ? "Department updated successfully." : "Department added successfully.");

      if (!isEdit) setFormData({ name: "", code: "" });
      setErrors({});

      if (onSuccess) onSuccess(savedDepartment);
    } catch (err) {
      console.error("Department save error:", err);
      Alert.error(err.message || "Failed to save department.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <FiGrid className="text-indigo-600 text-lg" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === "edit" ? "Edit Department" : "Add Department"}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {mode === "edit" ? "Update department details" : "Create a new company department"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Department Name */}
          <div>
            <label className={labelClass}>
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="e.g. Human Resources"
              className={`${inputClass} ${errors.name ? "border-red-400" : ""}`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Department Code */}
          <div>
            <label className={labelClass}>
              Department Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="e.g. HR"
              className={`${inputClass} ${errors.code ? "border-red-400" : ""}`}
            />
            {errors.code && (
              <p className="text-red-500 text-xs mt-1">{errors.code}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm disabled:bg-blue-300 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading && <FaSpinner className="animate-spin" />}
            {isLoading ? "Saving..." : mode === "edit" ? "Update" : "Save Department"}
          </button>
        </div>
      </form>
        </div>
      </div>
    </div>
  );
};

export default AddDepartmentForm;