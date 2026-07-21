import React, { useState, useEffect } from "react";
import { FaPlusCircle, FaTimes, FaSpinner } from "react-icons/fa";
import { FiUsers, FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiHash } from "react-icons/fi";
import AddDepartmentForm from "../department/AddDepartmentForm";
import AddDesignationForm from "../department/AddDesignationForm";
import { apiUrl } from "../../utils/api";
import Alert from "../../components/Alert/Alert";

const inputClass =
  "w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-gray-50 transition-all";

const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

const Field = ({ label, error, required, children }) => (
  <div>
    <label className={labelClass}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const AddEmployeeForm = ({ onClose }) => {
  const companyId = sessionStorage.getItem("companyId");
  const token = sessionStorage.getItem("auth_token");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dob: "",
    epfNo: "",
    nic: "",
    mobileNo: "",
    email: "",
    address: "",
    dateAdded: new Date().toISOString().split("T")[0],
    designationId: "",
    departmentId: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [isLoadingDesignations, setIsLoadingDesignations] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showDesignationModal, setShowDesignationModal] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      if (!companyId || !token) return;
      setIsLoadingDepartments(true);
      try {
        const response = await fetch(`${apiUrl}/api/${companyId}/departments/active`, {
          method: "GET",
          headers: getAuthHeaders(),
        });
        const data = await response.json();
        const deptData = data?.data || data || [];
        const activeDepartments = deptData.filter((item) => {
          if (item.active === undefined || item.active === null) return true;
          return item.active === true;
        });
        
        if (Array.isArray(activeDepartments)) {
          setDepartments(activeDepartments);
          setFormData(prev => {
             if (prev.departmentId && !activeDepartments.some(d => d.id == prev.departmentId)) {
                 return { ...prev, departmentId: "", designationId: "" };
             }
             return prev;
          });
        }
      } catch (err) {
        Alert.error("Failed to load departments");
        setDepartments([]);
      } finally {
        setIsLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, [companyId, token]);

  const fetchDesignationsByDepartment = async (departmentId) => {
    if (!departmentId) { setDesignations([]); return; }
    setIsLoadingDesignations(true);
    try {
      const selectedDept = departments.find((dept) => dept.id == departmentId);
      if (!selectedDept?.code) throw new Error("Department code is missing");
      const response = await fetch(
        `${apiUrl}/api/${companyId}/designations/by-department/${selectedDept.code}`,
        { method: "GET", headers: getAuthHeaders() }
      );
      if (response.status === 204) { setDesignations([]); return; }
      const data = await response.json();
      const designationsData = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      
      const activeDesignations = designationsData.filter((item) => {
        if (item.active === undefined || item.active === null) return true;
        return item.active === true;
      });
      
      setDesignations(activeDesignations);
      setFormData(prev => {
          if (prev.designationId && !activeDesignations.some(d => d.id == prev.designationId)) {
              return { ...prev, designationId: "" };
          }
          return prev;
      });
    } catch (error) {
      console.error("Error fetching designations:", error);
      if (!error.message.includes("Unexpected end of JSON input")) Alert.error("Failed to load designations");
      setDesignations([]);
    } finally {
      setIsLoadingDesignations(false);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "departmentId") {
      await fetchDesignationsByDepartment(value);
      setFormData((prev) => ({ ...prev, designationId: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.nic.trim()) newErrors.nic = "NIC No. is required";
    if (!formData.dob || isNaN(new Date(formData.dob).getTime())) newErrors.dob = "Valid date of birth is required";
    if (!formData.dateAdded || isNaN(new Date(formData.dateAdded).getTime())) newErrors.dateAdded = "Valid date added is required";
    if (!formData.mobileNo.trim()) newErrors.mobileNo = "Mobile number is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Email is invalid";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.departmentId) newErrors.departmentId = "Department is required";
    if (!formData.designationId) newErrors.designationId = designations.length === 0 ? "No designations for this department" : "Designation is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setErrors({});
    try {
      const formatDate = (dateString) => {
        if (!dateString) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
        return new Date(dateString).toISOString().split("T")[0];
      };
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: formData.gender,
        designationId: formData.designationId ? Number(formData.designationId) : null,
        departmentId: formData.departmentId ? Number(formData.departmentId) : null,
        address: formData.address.trim(),
        mobileNo: formData.mobileNo.trim(),
        dob: formatDate(formData.dob),
        nic: formData.nic.trim(),
        epfNo: formData.epfNo.trim() || null,
        email: formData.email.trim().toLowerCase(),
        dateAdded: formatDate(formData.dateAdded) || formatDate(new Date()),
      };
      const response = await fetch(`${apiUrl}/api/employees/${companyId}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = "Failed to create employee.";
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((err) => `${err.field}: ${err.defaultMessage}`).join("\n");
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      const employee = data?.employeeId ? data : data?.data;
      if (employee?.employeeId) {
        Alert.success(`Employee ${employee.firstName} ${employee.lastName} created successfully!`);
        setFormData({
          firstName: "", lastName: "", gender: "", dob: "", epfNo: "", nic: "",
          mobileNo: "", email: "", address: "", dateAdded: new Date().toISOString().split("T")[0],
          designationId: "", departmentId: "",
        });
        if (onClose) onClose();
      } else {
        Alert.error("Failed to create employee. Invalid response format.");
      }
    } catch (error) {
      Alert.error(error.message || "Failed to create employee.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDepartmentAdded = (newDepartment) => {
    const isActive = newDepartment.active === undefined || newDepartment.active === null || newDepartment.active === true;
    if (isActive) {
      setDepartments([...departments, newDepartment]);
      setFormData((prev) => ({ ...prev, departmentId: newDepartment.id }));
    }
    setShowDepartmentModal(false);
  };

  const handleDesignationAdded = (newDesignation) => {
    const isActive = newDesignation.active === undefined || newDesignation.active === null || newDesignation.active === true;
    if (isActive) {
      setDesignations([...designations, newDesignation]);
      setFormData((prev) => ({ ...prev, designationId: newDesignation.id }));
    }
    setShowDesignationModal(false);
  };


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 max-w-3xl mx-auto">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
          <FiUsers className="text-blue-600 text-xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">New Employee</h1>
          <p className="text-sm text-gray-500 mt-0.5">Add a new employee to the company</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
        {/* Personal Information */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5"><FiUser className="text-blue-500" /> Personal Information</h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="First Name" required error={errors.firstName}>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} disabled={isSubmitting}
                placeholder="e.g. John" className={`${inputClass} ${errors.firstName ? "border-red-400" : ""}`} />
            </Field>
            <Field label="Last Name" required error={errors.lastName}>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} disabled={isSubmitting}
                placeholder="e.g. Smith" className={`${inputClass} ${errors.lastName ? "border-red-400" : ""}`} />
            </Field>
            <Field label="Gender" required error={errors.gender}>
              <select name="gender" value={formData.gender} onChange={handleChange} disabled={isSubmitting}
                className={`${inputClass} cursor-pointer ${errors.gender ? "border-red-400" : ""}`}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Date of Birth" required error={errors.dob}>
              <input type="date" name="dob" value={formData.dob} disabled={isSubmitting}
                onChange={(e) => { setFormData((prev) => ({ ...prev, dob: e.target.value })); setErrors((p) => ({ ...p, dob: "" })); }}
                max={new Date().toISOString().split("T")[0]}
                className={`${inputClass} ${errors.dob ? "border-red-400" : ""}`} />
            </Field>
            <Field label="NIC No." required error={errors.nic}>
              <input type="text" name="nic" value={formData.nic} onChange={handleChange} disabled={isSubmitting}
                placeholder="e.g. 199012345678" className={`${inputClass} ${errors.nic ? "border-red-400" : ""}`} />
            </Field>
            <Field label="EPF No.">
              <input type="text" name="epfNo" value={formData.epfNo} onChange={handleChange} disabled={isSubmitting}
                placeholder="EPF Number (optional)" className={inputClass} />
            </Field>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5"><FiPhone className="text-blue-500" /> Contact Information</h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Mobile No." required error={errors.mobileNo}>
              <input type="text" name="mobileNo" value={formData.mobileNo} onChange={handleChange} disabled={isSubmitting}
                placeholder="e.g. +94 77 123 4567" className={`${inputClass} ${errors.mobileNo ? "border-red-400" : ""}`} />
            </Field>
            <Field label="Email Address" required error={errors.email}>
              <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={isSubmitting}
                placeholder="e.g. john@company.com" className={`${inputClass} ${errors.email ? "border-red-400" : ""}`} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address" required error={errors.address}>
                <textarea name="address" value={formData.address} onChange={handleChange} disabled={isSubmitting}
                  placeholder="Full residential address" rows="2"
                  className={`${inputClass} resize-none ${errors.address ? "border-red-400" : ""}`} />
              </Field>
            </div>
          </div>
        </div>

        {/* Work Information */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">3</span>
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5"><FiHash className="text-blue-500" /> Work Information</h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Field label="Date Added" required error={errors.dateAdded}>
              <input type="date" name="dateAdded" value={formData.dateAdded} disabled={isSubmitting}
                onChange={(e) => { setFormData((prev) => ({ ...prev, dateAdded: e.target.value })); setErrors((p) => ({ ...p, dateAdded: "" })); }}
                max={new Date().toISOString().split("T")[0]}
                className={`${inputClass} ${errors.dateAdded ? "border-red-400" : ""}`} />
            </Field>

            {/* Department */}
            <div>
              <label className={labelClass}>Department <span className="text-red-500">*</span></label>
              <div className="relative">
                <select name="departmentId" value={formData.departmentId} onChange={handleChange}
                  disabled={isLoadingDepartments || isSubmitting}
                  className={`${inputClass} cursor-pointer ${errors.departmentId ? "border-red-400" : ""}`}>
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                {isLoadingDepartments && (
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <FaSpinner className="animate-spin text-gray-400 text-xs" />
                  </div>
                )}
              </div>
              {errors.departmentId && <p className="text-red-500 text-xs mt-1">{errors.departmentId}</p>}
              <button type="button" onClick={() => setShowDepartmentModal(true)}
                className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1.5 mt-2 cursor-pointer">
                <FaPlusCircle /> Add Department
              </button>
            </div>

            {/* Designation */}
            <div>
              <label className={labelClass}>Designation <span className="text-red-500">*</span></label>
              <div className="relative">
                <select name="designationId" value={formData.designationId} onChange={handleChange}
                  disabled={!formData.departmentId || isLoadingDesignations || isSubmitting}
                  className={`${inputClass} cursor-pointer ${errors.designationId ? "border-red-400" : ""}`}>
                  <option value="">Select Designation</option>
                  {designations.map((desig) => (
                    <option key={desig.id} value={desig.id}>{desig.name}</option>
                  ))}
                </select>
                {isLoadingDesignations && (
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <FaSpinner className="animate-spin text-gray-400 text-xs" />
                  </div>
                )}
              </div>
              {errors.designationId && <p className="text-red-500 text-xs mt-1">{errors.designationId}</p>}
              <button type="button"
                onClick={() => setShowDesignationModal(true)}
                disabled={!formData.departmentId}
                className={`text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1.5 mt-2 ${!formData.departmentId ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
                <FaPlusCircle /> Add Designation
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          {onClose && (
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors cursor-pointer">
              Cancel
            </button>
          )}
          <button type="submit" disabled={isSubmitting}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20 disabled:bg-blue-300 disabled:cursor-not-allowed cursor-pointer">
            {isSubmitting ? (
              <><FaSpinner className="animate-spin" /> Saving Employee...</>
            ) : (
              "Save Employee"
            )}
          </button>
        </div>
      </form>

      {/* Department Modal */}
      {showDepartmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3 max-h-[90vh] overflow-y-auto relative">
            <button type="button" onClick={() => setShowDepartmentModal(false)}
              className="absolute top-4 right-4 text-gray-600 text-xl z-10 hover:text-red-500 cursor-pointer">
              <FaTimes />
            </button>
            <div className="p-2">
              <AddDepartmentForm companyId={companyId} onSuccess={handleDepartmentAdded} onClose={() => setShowDepartmentModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Designation Modal */}
      {showDesignationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3 max-h-[90vh] overflow-y-auto relative">
            <button type="button" onClick={() => setShowDesignationModal(false)}
              className="absolute top-4 right-4 text-gray-600 text-xl z-10 hover:text-red-500 cursor-pointer">
              <FaTimes />
            </button>
            <div className="p-2">
              <AddDesignationForm companyId={companyId} departmentId={formData.departmentId}
                onSuccess={handleDesignationAdded} onClose={() => setShowDesignationModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddEmployeeForm;
