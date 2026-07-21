import React, { useEffect, useState } from "react";
import {
  FiEdit,
  FiPower,
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";
import { apiUrl } from "../../utils/api";
import Alert from "../../components/Alert/Alert";
import AddDepartmentForm from "./AddDepartmentForm";
import AddDesignationForm from "./AddDesignationForm";

const DepartmentsList = () => {
  const [activeTab, setActiveTab] = useState("departments");

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [designationWarning, setDesignationWarning] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const [designationModalOpen, setDesignationModalOpen] = useState(false);
  const [designationModalMode, setDesignationModalMode] = useState("create");
  const [selectedDesignation, setSelectedDesignation] = useState(null);

  const getCompanyId = () => sessionStorage.getItem("companyId");
  const getToken = () => sessionStorage.getItem("auth_token");

  const getAuthHeaders = () => {
    const token = getToken();

    return {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  };

  const extractResponse = async (response) => {
    const text = await response.text();

    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  const extractArray = (data, key) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.[key])) return data[key];
    return [];
  };

  const getDepartmentId = (department) => {
    return department?.id || department?.departmentId || "";
  };

  const getDesignationId = (designation) => {
    return designation?.id || designation?.designationId || "";
  };

  const isActive = (item) => {
    if (item?.active === undefined || item?.active === null) return true;
    return item.active === true;
  };

  const fetchDepartments = async () => {
    const companyId = getCompanyId();
    const token = getToken();

    if (!companyId || !token) {
      throw new Error("Missing company ID or authentication token. Please login again.");
    }

    const response = await fetch(`${apiUrl}/api/${companyId}/departments`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await extractResponse(response);

    if (!response.ok) {
      const message =
        data?.message ||
        data?.error ||
        data ||
        "Failed to load departments.";
      throw new Error(message);
    }

    return extractArray(data, "departments");
  };

  const fetchDesignationsSafely = async () => {
    const companyId = getCompanyId();

    try {
      const response = await fetch(`${apiUrl}/api/${companyId}/designations`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await extractResponse(response);

      if (!response.ok) {
        if (response.status === 405) {
          setDesignationWarning(
            "Designations list cannot be loaded because backend GET /designations endpoint is not available yet."
          );
          return [];
        }

        const message =
          data?.message ||
          data?.error ||
          data ||
          "Failed to load designations.";

        setDesignationWarning(message);
        return [];
      }

      setDesignationWarning("");
      return extractArray(data, "designations");
    } catch (err) {
      console.error("Designations fetch warning:", err);
      setDesignationWarning("Failed to load designations.");
      return [];
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      setDesignationWarning("");

      const departmentsList = await fetchDepartments();
      setDepartments(departmentsList);

      const designationsList = await fetchDesignationsSafely();
      setDesignations(designationsList);
    } catch (err) {
      console.error("Organization setup fetch error:", err);
      setError(err.message || "Failed to connect to the database.");
      setDepartments([]);
      setDesignations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDepartments = departments.filter((dept) => {
    const searchLower = searchTerm.toLowerCase();

    return (
      String(dept.name || "").toLowerCase().includes(searchLower) ||
      String(dept.code || "").toLowerCase().includes(searchLower)
    );
  });

  const filteredDesignations = designations.filter((desig) => {
    const searchLower = searchTerm.toLowerCase();

    return (
      String(desig.name || "").toLowerCase().includes(searchLower) ||
      String(desig.departmentCode || "").toLowerCase().includes(searchLower) ||
      String(desig.departmentName || "").toLowerCase().includes(searchLower)
    );
  });

  const openAddDepartmentModal = () => {
    setSelectedDepartment(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const openEditDepartmentModal = (department) => {
    setSelectedDepartment(department);
    setModalMode("edit");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedDepartment(null);
    setModalMode("create");
  };

  const handleFormSuccess = async () => {
    closeModal();
    await fetchData();
  };

  const openAddDesignationModal = () => {
    setSelectedDesignation(null);
    setDesignationModalMode("create");
    setDesignationModalOpen(true);
  };

  const openEditDesignationModal = (designation) => {
    setSelectedDesignation(designation);
    setDesignationModalMode("edit");
    setDesignationModalOpen(true);
  };

  const closeDesignationModal = () => {
    setDesignationModalOpen(false);
    setSelectedDesignation(null);
    setDesignationModalMode("create");
  };

  const handleDesignationFormSuccess = async () => {
    closeDesignationModal();
    await fetchData();
  };

  const handleAddClick = () => {
    if (activeTab === "departments") {
      openAddDepartmentModal();
      return;
    }

    openAddDesignationModal();
  };

  const handleToggleDepartmentActive = async (department) => {
    const companyId = getCompanyId();
    const token = getToken();
    const departmentId = getDepartmentId(department);
    const newStatus = !isActive(department);

    if (!companyId || !token) {
      Alert.error("Session expired. Please login again.");
      return;
    }

    if (!departmentId) {
      Alert.error("Department ID missing. Cannot update status.");
      return;
    }

    try {
      setStatusUpdatingId(`department-${departmentId}`);

      const response = await fetch(
        `${apiUrl}/api/${companyId}/departments/${departmentId}/active?active=${newStatus}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        }
      );

      const data = await extractResponse(response);

      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          data ||
          "Failed to update department status.";
        throw new Error(message);
      }

      Alert.success(
        `Department ${newStatus ? "activated" : "deactivated"} successfully.`
      );
      await fetchData();
    } catch (err) {
      console.error("Department status update error:", err);
      Alert.error(err.message || "Failed to update department status.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleToggleDesignationActive = async (designation) => {
    const companyId = getCompanyId();
    const token = getToken();
    const designationId = getDesignationId(designation);
    const newStatus = !isActive(designation);

    if (!companyId || !token) {
      Alert.error("Session expired. Please login again.");
      return;
    }

    if (!designationId) {
      Alert.error("Designation ID missing. Cannot update status.");
      return;
    }

    try {
      setStatusUpdatingId(`designation-${designationId}`);

      const response = await fetch(
        `${apiUrl}/api/${companyId}/designations/${designationId}/active?active=${newStatus}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        }
      );

      const data = await extractResponse(response);

      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          data ||
          "Failed to update designation status.";
        throw new Error(message);
      }

      Alert.success(
        `Designation ${newStatus ? "activated" : "deactivated"} successfully.`
      );
      await fetchData();
    } catch (err) {
      console.error("Designation status update error:", err);
      Alert.error(err.message || "Failed to update designation status.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FiRefreshCw className="animate-spin text-blue-500 text-4xl" />
        <span className="ml-3 text-gray-600">
          Loading organization setup...
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Organization Setup
          </h1>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>

              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              onClick={fetchData}
            >
              <FiRefreshCw /> Refresh
            </button>

            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              onClick={handleAddClick}
            >
              <FiPlus />
              {activeTab === "departments"
                ? "Add Department"
                : "Add Designation"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
            <p className="font-bold">Database/API Error</p>
            <p>{error}</p>
          </div>
        )}

        {designationWarning && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md flex gap-3">
            <FiAlertCircle className="mt-1" />
            <div>
              <p className="font-bold">Designation Endpoint Warning</p>
              <p>{designationWarning}</p>
            </div>
          </div>
        )}

        <div className="flex border-b border-gray-200 mb-6">
          <button
            type="button"
            className={`py-3 px-6 text-sm font-medium transition-colors ${
              activeTab === "departments"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setActiveTab("departments");
              setSearchTerm("");
            }}
          >
            Departments
          </button>

          <button
            type="button"
            className={`py-3 px-6 text-sm font-medium transition-colors ${
              activeTab === "designations"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setActiveTab("designations");
              setSearchTerm("");
            }}
          >
            Designations
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {activeTab === "departments" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Department Name</Th>
                    <Th>Code</Th>
                    <Th>Status</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDepartments.length > 0 ? (
                    filteredDepartments.map((dept) => {
                      const deptId = getDepartmentId(dept);
                      const updating = statusUpdatingId === `department-${deptId}`;
                      const active = isActive(dept);

                      return (
                        <tr
                          key={deptId}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <Td strong>{dept.name}</Td>

                          <Td>
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                              {dept.code}
                            </span>
                          </Td>

                          <Td>
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                active
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {active ? "Active" : "Inactive"}
                            </span>
                          </Td>

                          <Td align="right">
                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => openEditDepartmentModal(dept)}
                                className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                title="Edit Department"
                              >
                                <FiEdit size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleDepartmentActive(dept)}
                                disabled={updating}
                                className={`p-2 rounded-lg transition-colors ${
                                  active
                                    ? "text-red-600 hover:bg-red-50"
                                    : "text-emerald-600 hover:bg-emerald-50"
                                } ${updating ? "disabled:text-gray-400" : ""}`}
                                title={active ? "Deactivate Department" : "Activate Department"}
                              >
                                {updating ? (
                                  <FiRefreshCw
                                    className="animate-spin"
                                    size={16}
                                  />
                                ) : (
                                  <FiPower size={16} />
                                )}
                              </button>
                            </div>
                          </Td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        {error
                          ? "Unable to load data."
                          : "No departments found in the database."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "designations" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Designation Title</Th>
                    <Th>Department</Th>
                    <Th>Status</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDesignations.length > 0 ? (
                    filteredDesignations.map((desig) => {
                      const desigId = getDesignationId(desig);
                      const updating = statusUpdatingId === `designation-${desigId}`;
                      const active = isActive(desig);

                      return (
                        <tr
                          key={desigId}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <Td strong>{desig.name}</Td>

                          <Td>
                            {desig.departmentName ||
                              desig.departmentCode ||
                              "N/A"}
                          </Td>

                          <Td>
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                active
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {active ? "Active" : "Inactive"}
                            </span>
                          </Td>

                          <Td align="right">
                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                title="Edit Designation"
                                onClick={() => openEditDesignationModal(desig)}
                              >
                                <FiEdit size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleDesignationActive(desig)}
                                disabled={updating}
                                className={`p-2 rounded-lg transition-colors ${
                                  active
                                    ? "text-red-600 hover:bg-red-50"
                                    : "text-emerald-600 hover:bg-emerald-50"
                                } ${updating ? "disabled:text-gray-400" : ""}`}
                                title={active ? "Deactivate Designation" : "Activate Designation"}
                              >
                                {updating ? (
                                  <FiRefreshCw
                                    className="animate-spin"
                                    size={16}
                                  />
                                ) : (
                                  <FiPower size={16} />
                                )}
                              </button>
                            </div>
                          </Td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        {designationWarning
                          ? "Backend GET designations endpoint is not available yet."
                          : "No designations found in the database."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 z-10"
            >
              <FiX size={22} />
            </button>

            <AddDepartmentForm
              mode={modalMode}
              initialData={selectedDepartment}
              onSuccess={handleFormSuccess}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}

      {designationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeDesignationModal}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 z-10"
            >
              <FiX size={22} />
            </button>

            <AddDesignationForm
              mode={designationModalMode}
              initialData={selectedDesignation}
              onSuccess={handleDesignationFormSuccess}
              onCancel={closeDesignationModal}
            />
          </div>
        </div>
      )}
    </>
  );
};

const Th = ({ children, align = "left" }) => {
  const alignClass = align === "right" ? "text-right" : "text-left";

  return (
    <th
      className={`px-6 py-4 ${alignClass} text-xs font-semibold text-gray-500 uppercase tracking-wider`}
    >
      {children}
    </th>
  );
};

const Td = ({ children, strong = false, align = "left" }) => {
  const alignClass = align === "right" ? "text-right" : "text-left";

  return (
    <td
      className={`px-6 py-4 whitespace-nowrap ${alignClass} text-sm ${
        strong ? "font-medium text-gray-900" : "text-gray-600"
      }`}
    >
      {children}
    </td>
  );
};

export default DepartmentsList;