import React, { useState, useEffect } from "react";
import { FaPlusCircle, FaTimes, FaUsers, FaSpinner } from "react-icons/fa";
import AddDepartmentForm from "../department/AddDepartmentForm";
import AddDesignationForm from "../department/AddDesignationForm";
import { apiUrl } from "../../utils/api";
import Alert from "../../components/Alert/Alert";

const EditEmployeeForm = ({ employee, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: employee.firstName || "",
    lastName: employee.lastName || "",
    gender: employee.gender || "",
    dob: employee.dob || "",
    epfNo: employee.epfNo || "",
    nic: employee.nic || "",
    mobileNo: employee.mobileNo || "",
    email: employee.email || "",
    address: employee.address || "",
    dateAdded: employee.dateAdded || new Date().toISOString().split("T")[0],
    designationId: employee.designation?.designationId || employee.designation?.id || "",
    departmentId: employee.department?.departmentId || employee.department?.id || "",
  });

  const companyId = sessionStorage.getItem("companyId");
  const token = sessionStorage.getItem("auth_token");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [isLoadingDesignations, setIsLoadingDesignations] = useState(false);
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [isAddingDesignation, setIsAddingDesignation] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [modalTransition, setModalTransition] = useState("opacity-0 invisible");

  useEffect(() => {
    if (showDesignationModal || showDepartmentModal) {
      setModalTransition("opacity-100 visible");
    } else {
      setModalTransition("opacity-0 invisible");
    }
  }, [showDesignationModal, showDepartmentModal]);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!companyId || !token) {
        Alert.error("Authentication required. Please log in again.");
        return;
      }

      setIsLoadingDepartments(true);
      try {
        const response = await fetch(`${apiUrl}/api/${companyId}/departments`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        const departmentsData = data?.data || data || [];

        if (Array.isArray(departmentsData)) {
          setDepartments(departmentsData);
        } else {
          console.error("Unexpected API response format", data);
          setDepartments([]);
        }
      } catch (err) {
        Alert.error("Failed to load departments");
        console.error("API Error:", err);
        setDepartments([]);
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [companyId, token]);

  // Fetch designations based on selected department
  const fetchDesignationsByDepartment = async (deptId) => {
    if (!deptId) {
      setDesignations([]);
      return;
    }

    setIsLoadingDesignations(true);
    try {
      const selectedDept = departments.find((dept) => dept.id == deptId);
      if (!selectedDept) {
        // Fallback: check if the selected department is matching the initial employee department
        if (employee.department && (employee.department.id == deptId || employee.department.departmentId == deptId)) {
          // If the department from departments list isn't loaded yet, try to use employee's department code
          const code = employee.department.code;
          if (code) {
            await fetchDesignationsByCode(code);
            return;
          }
        }
        setDesignations([]);
        return;
      }
      if (!selectedDept.code) {
        throw new Error("Department code is missing");
      }

      await fetchDesignationsByCode(selectedDept.code);
    } catch (error) {
      console.error("Error fetching designations:", error);
      if (!error.message.includes("Unexpected end of JSON input")) {
        Alert.error("Failed to load designations");
      }
      setDesignations([]);
    } finally {
      setIsLoadingDesignations(false);
    }
  };

  const fetchDesignationsByCode = async (deptCode) => {
    const response = await fetch(
      `${apiUrl}/api/${companyId}/designations/by-department/${deptCode}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 204) {
      setDesignations([]);
      return;
    }

    const contentLength = response.headers.get("Content-Length");
    if (contentLength === "0") {
      setDesignations([]);
      return;
    }

    const data = await response.json();
    let designationsData = Array.isArray(data) ? data : (data?.data || []);
    setDesignations(designationsData);
  };

  // Fetch designations when departmentId changes or departments are loaded
  useEffect(() => {
    if (formData.departmentId && departments.length > 0) {
      fetchDesignationsByDepartment(formData.departmentId);
    } else if (formData.departmentId && employee.department) {
      // Fetch designations during initial render if departments are still loading
      const deptCode = employee.department.code;
      if (deptCode) {
        setIsLoadingDesignations(true);
        fetchDesignationsByCode(deptCode)
          .catch(err => console.error(err))
          .finally(() => setIsLoadingDesignations(false));
      }
    }
  }, [formData.departmentId, departments]);

  const handleModalClick = (e, setModal) => {
    if (e.target === e.currentTarget) {
      setModal(false);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "departmentId") {
      await fetchDesignationsByDepartment(value);
      setFormData((prev) => ({ ...prev, designationId: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.nic.trim()) {
      newErrors.nic = "NIC No. is required";
    }

    if (!formData.dob || isNaN(new Date(formData.dob).getTime())) {
      newErrors.dob = "Invalid date of birth";
    }
    if (!formData.dateAdded || isNaN(new Date(formData.dateAdded).getTime())) {
      newErrors.dateAdded = "Invalid date added";
    }
    if (!formData.mobileNo.trim())
      newErrors.mobileNo = "Mobile number is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.departmentId)
      newErrors.departmentId = "Department is required";
    if (!formData.designationId)
      newErrors.designationId =
        designations.length === 0
          ? "The selected department has no available designations"
          : "Designation is required";

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
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      };

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: formData.gender,
        designationId: formData.designationId ? Number(formData.designationId) : null,
        departmentId: formData.departmentId ? Number(formData.departmentId) : null,
        address: formData.address.trim() || null,
        mobileNo: formData.mobileNo.trim(),
        dob: formatDate(formData.dob),
        nic: formData.nic.trim(),
        epfNo: formData.epfNo.trim() || null,
        email: formData.email.trim().toLowerCase(),
        dateAdded: formatDate(formData.dateAdded) || formatDate(new Date()),
      };

      const response = await fetch(`${apiUrl}/api/employees/${companyId}/${employee.employeeId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = "Failed to update employee.";
        
        if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map(err => `${err.field}: ${err.defaultMessage}`).join('\n');
        } else if (errorData.message) {
            errorMessage = errorData.message;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      const updatedEmployee = data?.employeeId ? data : data?.data;

      if (updatedEmployee && updatedEmployee.employeeId) {
        Alert.success(
          `Employee ${updatedEmployee.firstName} ${updatedEmployee.lastName} updated successfully!`
        );

        if (onSuccess) {
          onSuccess(updatedEmployee);
        }
        if (onClose) {
          onClose();
        }
      } else {
        Alert.error("Failed to update employee. Invalid response format.");
      }
    } catch (error) {
      console.error("Update error:", error);
      Alert.error(error.message || "Failed to update employee.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDepartmentAdded = (newDepartment) => {
    setDepartments([...departments, newDepartment]);
    setFormData((prev) => ({ ...prev, departmentId: newDepartment.id }));
    setShowDepartmentModal(false);
  };

  const handleDesignationAdded = (newDesignation) => {
    setDesignations([...designations, newDesignation]);
    setFormData((prev) => ({ ...prev, designationId: newDesignation.id }));
    setShowDesignationModal(false);
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg p-2 flex flex-col">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FaUsers className="text-blue-600" /> Edit Employee
        </h2>
        <form className="space-y-4 w-full" onSubmit={handleSubmit}>
          <div className="flex flex-wrap -mx-2">
            {/* First Name */}
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-gray-700 font-medium mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={formData.firstName}
                onChange={handleChange}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-gray-700 font-medium mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={formData.lastName}
                onChange={handleChange}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>

            {/* Gender */}
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-gray-700 font-medium mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-gray-700 font-medium mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dob"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={formData.dob}
                onChange={(e) => {
                  const dateValue = e.target.value;
                  setFormData((prev) => ({ ...prev, dob: dateValue }));
                }}
                required
                max={new Date().toISOString().split("T")[0]}
              />
              {errors.dob && (
                <p className="text-red-500 text-sm mt-1">{errors.dob}</p>
              )}
            </div>

            {/* EPF No. */}
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-gray-700 font-medium mb-1">EPF No.</label>
              <input
                type="text"
                name="epfNo"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={formData.epfNo}
                onChange={handleChange}
              />
            </div>

            {/* NIC No. */}
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-gray-700 font-medium mb-1">
                 NIC No. <span className="text-red-500">*</span> 
              </label>
              <input
                type="text"
                name="nic"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={formData.nic}
                onChange={handleChange}
              />
              {errors.nic && (
                <p className="text-red-500 text-sm mt-1">{errors.nic}</p>
              )}
            </div>

            {/* Mobile No. */}
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-gray-700 font-medium mb-1">
                Mobile No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="mobileNo"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={formData.mobileNo}
                onChange={handleChange}
              />
              {errors.mobileNo && (
                <p className="text-red-500 text-sm mt-1">{errors.mobileNo}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="w-full md:w-1/2 px-2 mb-4">
              <label className="block text-gray-700 font-medium mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Address */}
            <div className="w-full px-2 mb-4">
              <label className="block text-gray-700 font-medium mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                rows="2"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            {/* Date Added */}
            <div className="w-full md:w-1/3 px-2 mb-4">
              <label className="block text-gray-700 font-medium mb-1">
                Date Added <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dateAdded"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={formData.dateAdded}
                onChange={(e) => {
                  const dateValue = e.target.value;
                  setFormData((prev) => ({ ...prev, dateAdded: dateValue }));
                }}
                max={new Date().toISOString().split("T")[0]}
              />
              {errors.dateAdded && (
                <p className="text-red-500 text-sm mt-1">{errors.dateAdded}</p>
              )}
            </div>

            {/* Department */}
            <div className="w-full md:w-1/3 px-2 mb-4">
              <label className="block text-gray-700 font-medium mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="departmentId"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={formData.departmentId}
                  onChange={handleChange}
                  disabled={isLoadingDepartments}
                >
                  <option value="">--Choose a Department--</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {isLoadingDepartments && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FaSpinner className="animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              {errors.departmentId && (
                <p className="text-red-500 text-sm mt-1">{errors.departmentId}</p>
              )}
              <div className="text-center mt-2">
                <button
                  type="button"
                  className="text-blue-500 flex items-center justify-center hover:text-blue-700 text-sm font-medium"
                  onClick={() => setShowDepartmentModal(true)}
                >
                  <span className="mr-1"><FaPlusCircle /></span> Add New Department
                </button>
              </div>
            </div>

            {/* Designation */}
            <div className="w-full md:w-1/3 px-2 mb-4">
              <label className="block text-gray-700 font-medium mb-1">
                Designation <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="designationId"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={formData.designationId}
                  onChange={handleChange}
                  disabled={!formData.departmentId || isLoadingDesignations}
                >
                  <option value="">--Choose a Designation--</option>
                  {designations.map((desig) => (
                    <option key={desig.id} value={desig.id}>
                      {desig.name}
                    </option>
                  ))}
                </select>
                {isLoadingDesignations && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FaSpinner className="animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              {errors.designationId && (
                <p className="text-red-500 text-sm mt-1">{errors.designationId}</p>
              )}
              <div className="text-center mt-2">
                <button
                  type="button"
                  className={`text-blue-500 flex items-center justify-center hover:text-blue-700 text-sm font-medium ${
                    !formData.departmentId ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={() => setShowDesignationModal(true)}
                  disabled={!formData.departmentId}
                >
                  <span className="mr-1"><FaPlusCircle /></span> Add New Designation
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center justify-center font-medium transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Department Modal */}
      {showDepartmentModal && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] transition-opacity duration-500 ${modalTransition}`}
          onClick={(e) => handleModalClick(e, setShowDepartmentModal)}
        >
          <div className="bg-white w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3 p-4 rounded-lg max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
              onClick={() => setShowDepartmentModal(false)}
              disabled={isAddingDepartment}
            >
              <FaTimes />
            </button>
            <div className="p-2">
              <AddDepartmentForm
                companyId={companyId}
                onSuccess={handleDepartmentAdded}
                onClose={() => setShowDepartmentModal(false)}
              />
              {isAddingDepartment && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
                  <div className="flex items-center">
                    <FaSpinner className="animate-spin mr-2 text-blue-500" />
                    <span>Saving department...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Designation Modal */}
      {showDesignationModal && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] transition-opacity duration-500 ${modalTransition}`}
          onClick={(e) => handleModalClick(e, setShowDesignationModal)}
        >
          <div className="bg-white w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3 p-4 rounded-lg max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
              onClick={() => setShowDesignationModal(false)}
              disabled={isAddingDesignation}
            >
              <FaTimes />
            </button>
            <div className="p-2">
              <AddDesignationForm
                companyId={companyId}
                departmentId={formData.departmentId}
                onSuccess={handleDesignationAdded}
                onClose={() => setShowDesignationModal(false)}
              />
              {isAddingDesignation && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
                  <div className="flex items-center">
                    <FaSpinner className="animate-spin mr-2 text-blue-500" />
                    <span>Saving designation...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditEmployeeForm;
