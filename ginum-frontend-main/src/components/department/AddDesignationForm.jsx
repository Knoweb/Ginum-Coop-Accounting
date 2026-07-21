import React, { useEffect, useState } from "react";
import { FaPlusCircle, FaTimes, FaSpinner } from "react-icons/fa";
import { FiTag } from "react-icons/fi";
import AddDepartmentForm from "./AddDepartmentForm";
import { apiUrl } from "../../utils/api";
import Alert from "../../components/Alert/Alert";

const inputClass =
  "w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-gray-50 transition-all cursor-pointer";

const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

const AddDesignationForm = ({
  onSuccess,
  onCancel,
  initialData = null,
  mode = "create",
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [designationName, setDesignationName] = useState("");
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDepartments, setIsFetchingDepartments] = useState(false);

  const getCompanyId = () => sessionStorage.getItem("companyId");
  const getToken = () => sessionStorage.getItem("auth_token");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  const extractArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.departments)) return data.departments;
    return [];
  };

  const extractResponse = async (response) => {
    const text = await response.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return text; }
  };

  const getDepartmentId = (dept) => dept?.id || dept?.departmentId || "";
  const getDesignationId = (desig) => desig?.id || desig?.designationId || "";

  const fetchDepartments = async () => {
    const companyId = getCompanyId();
    const token = getToken();
    if (!companyId || !token) {
      Alert.error("Authentication required. Please log in again.");
      return;
    }
    try {
      setIsFetchingDepartments(true);
      const response = await fetch(`${apiUrl}/api/${companyId}/departments`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await extractResponse(response);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to load departments.");
      }
      const list = extractArray(data);
      setDepartments(list);
      if (initialData?.departmentCode) {
        const matched = list.find((dept) => dept.code === initialData.departmentCode);
        if (matched) setSelectedDepartment(String(getDepartmentId(matched)));
      }
    } catch (err) {
      console.error("Departments fetch error:", err);
      Alert.error(err.message || "Failed to load departments.");
      setDepartments([]);
    } finally {
      setIsFetchingDepartments(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  useEffect(() => {
    if (initialData) {
      setDesignationName(initialData.name || "");
      if (initialData.departmentId) setSelectedDepartment(String(initialData.departmentId));
      else if (initialData.departmentCode) setSelectedDepartment(String(initialData.departmentCode));
    }
  }, [initialData]);

  const validateForm = () => {
    const e = {};
    if (!selectedDepartment) e.department = "Department is required";
    if (!designationName.trim()) e.designationName = "Designation name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const companyId = getCompanyId();
    const token = getToken();
    if (!companyId || !token) {
      Alert.error("Authentication required. Please log in again.");
      return;
    }
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const department = departments.find((dept) => {
        const deptId = String(getDepartmentId(dept));
        const deptCode = String(dept.code || "");
        const selected = String(selectedDepartment);
        return selected === deptId || selected === deptCode;
      });
      if (!department) throw new Error("Selected department not found.");

      const payload = {
        name: designationName.trim(),
        departmentCode: department.code,
      };

      const isEdit = mode === "edit" && initialData;
      const designationId = getDesignationId(initialData);
      const url = isEdit
        ? `${apiUrl}/api/${companyId}/designations/${designationId}`
        : `${apiUrl}/api/${companyId}/designations`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await extractResponse(response);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to save designation.");
      }

      const savedDesignation = data?.data || data || payload;
      Alert.success(isEdit ? "Designation updated successfully." : "Designation added successfully.");

      if (!isEdit) {
        setSelectedDepartment("");
        setDesignationName("");
      }
      setErrors({});
      if (onSuccess) onSuccess(savedDesignation);
    } catch (err) {
      console.error("Designation save error:", err);
      Alert.error(err.message || "Failed to save designation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewDepartment = (newDepartment) => {
    const saved = newDepartment?.data || newDepartment;
    if (saved) {
      setDepartments((prev) => [...prev, saved]);
      const newId = getDepartmentId(saved);
      if (newId) setSelectedDepartment(String(newId));
    }
    setShowDepartmentModal(false);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <FiTag className="text-purple-600 text-lg" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {mode === "edit" ? "Edit Designation" : "Add Designation"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {mode === "edit" ? "Update designation details" : "Create a new role designation"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Department */}
            <div>
              <label className={labelClass}>
                Department <span className="text-red-500">*</span>
              </label>
              {isFetchingDepartments ? (
                <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500">
                  <FaSpinner className="animate-spin text-blue-500" />
                  Loading departments...
                </div>
              ) : (
                <select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setErrors((prev) => ({ ...prev, department: "" }));
                  }}
                  disabled={isLoading}
                  className={`${inputClass} ${errors.department ? "border-red-400" : ""}`}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept, index) => {
                    const optionKey = String(getDepartmentId(dept) || dept.code || index);
                    const optionValue = String(getDepartmentId(dept) || dept.code || "");
                    return (
                      <option key={optionKey} value={optionValue}>
                        {dept.name} ({dept.code})
                      </option>
                    );
                  })}
                </select>
              )}
              {errors.department && (
                <p className="text-red-500 text-xs mt-1">{errors.department}</p>
              )}
              {mode !== "edit" && (
                <button
                  type="button"
                  onClick={() => setShowDepartmentModal(true)}
                  className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1.5 mt-2 cursor-pointer"
                >
                  <FaPlusCircle />
                  Add New Department
                </button>
              )}
            </div>

            {/* Designation Name */}
            <div>
              <label className={labelClass}>
                Designation Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={designationName}
                onChange={(e) => {
                  setDesignationName(e.target.value);
                  setErrors((prev) => ({ ...prev, designationName: "" }));
                }}
                disabled={isLoading}
                placeholder="e.g. Senior Developer"
                className={`${inputClass} ${errors.designationName ? "border-red-400" : ""}`}
              />
              {errors.designationName && (
                <p className="text-red-500 text-xs mt-1">{errors.designationName}</p>
              )}
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
                {isLoading ? "Saving..." : mode === "edit" ? "Update" : "Save Designation"}
              </button>
            </div>
          </form>

          {/* Department Modal */}
          {showDepartmentModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
              <div className="w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3 max-h-[90vh] overflow-y-auto relative">
                <button
                  type="button"
                  className="absolute top-4 right-4 text-gray-600 text-xl z-10 hover:text-red-500 transition-colors cursor-pointer"
                  onClick={() => setShowDepartmentModal(false)}
                >
                  <FaTimes />
                </button>
                <AddDepartmentForm
                  onSuccess={handleNewDepartment}
                  onCancel={() => setShowDepartmentModal(false)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddDesignationForm;