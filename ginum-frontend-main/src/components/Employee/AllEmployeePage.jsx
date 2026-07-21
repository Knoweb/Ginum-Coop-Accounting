import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiEdit, 
  FiTrash2, 
  FiPlus, 
  FiSearch, 
  FiUser, 
  FiCalendar, 
  FiPhone, 
  FiMail, 
  FiHome, 
  FiCreditCard,
  FiHash,
  FiX
} from "react-icons/fi";
import {apiUrl} from "../../utils/api";
import Alert from "../Alert/Alert";
import EditEmployeeForm from "./EditEmployeeForm";


const AllEmployeePage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const companyId = sessionStorage.getItem("companyId");
        const token = sessionStorage.getItem("auth_token");

        if (!companyId || !token) {
          setError("Missing company ID or auth token.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${apiUrl}/api/employees/${companyId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setEmployees(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Failed to fetch employees. " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(emp => {
    const searchLower = searchTerm.toLowerCase();
    return (
      emp.firstName.toLowerCase().includes(searchLower) ||
      emp.lastName.toLowerCase().includes(searchLower) ||
      (emp.designation?.name || "").toLowerCase().includes(searchLower) ||
      (emp.department?.name || "").toLowerCase().includes(searchLower) ||
      (emp.nic || "").toLowerCase().includes(searchLower) ||
      (emp.epfNo || "").toLowerCase().includes(searchLower) ||
      (emp.email || "").toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (emp) => {
    setSelectedEmployee(emp);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedEmployee) => {
    setEmployees(prev => prev.map(emp => emp.employeeId === updatedEmployee.employeeId ? updatedEmployee : emp));
  };

  const handleDelete = async (employeeId) => {
    const result = await Alert.confirm(
      "Are you sure you want to permanently delete this employee record?",
      "Delete",
      "Cancel"
    );
    if (result.isConfirmed) {
      try {
        const companyId = sessionStorage.getItem("companyId");
        const token = sessionStorage.getItem("auth_token");

        if (!companyId || !token) {
          Alert.error("Missing company ID or auth token.");
          return;
        }

        const response = await fetch(
          `${apiUrl}/api/employees/${companyId}/${employeeId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete employee from server.");
        }

        setEmployees(prev => prev.filter(emp => emp.employeeId !== employeeId));
        Alert.success("Employee record deleted successfully!");
      } catch (err) {
        Alert.error(err.message || "Failed to delete employee.");
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-4 mt-6">
      <p className="font-bold">Error</p>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Employees</h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search employees..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
  onClick={() => navigate("/employee/new")} 
  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
>
  <FiPlus /> Add Employee
</button>
        </div>
      </div>

      {filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 text-lg">
            {employees.length === 0 ? "No employees found." : "No matching employees found."}
          </p>
          <button 
  onClick={() => navigate("/employee/new")} 
  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
>
  <FiPlus /> Add New Employee
</button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position/Department
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Contact Info
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                    Identification
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {emp.imgPath ? (
                            <img
                              src={emp.imgPath}
                              alt={`${emp.firstName} ${emp.lastName}`}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold uppercase">
                              {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <FiUser className="mr-1" size={14} />
                            {emp.gender || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <FiCalendar className="mr-1" size={14} />
                            {formatDate(emp.dob)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {emp.designation?.name || "-"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {emp.department?.name || "-"} ({emp.department?.code || "-"})
                      </div>
                      <div className="text-sm text-gray-500">
                        Joined: {formatDate(emp.dateAdded)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900 flex items-center">
                        <FiPhone className="mr-2" size={14} />
                        {emp.mobileNo || "-"}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <FiMail className="mr-2" size={14} />
                        <span className="truncate max-w-xs" title={emp.email}>
                          {emp.email || "-"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <FiHome className="mr-2" size={14} />
                        <span className="truncate max-w-xs" title={emp.address}>
                          {emp.address || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                      <div className="text-sm text-gray-900 flex items-center">
                        <FiCreditCard className="mr-2" size={14} />
                        NIC: {emp.nic || "-"}
                      </div>
                      <div className="text-sm text-gray-500">
                        EPF No: {emp.epfNo || "-"}
                      </div>
                      <div className="text-sm text-gray-500">
                        Employee ID: {emp.employeeId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(emp)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <FiEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.employeeId)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {isEditModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative p-6 shadow-2xl">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedEmployee(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              title="Close"
            >
              <FiX size={24} />
            </button>
            <EditEmployeeForm
              employee={selectedEmployee}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedEmployee(null);
              }}
              onSuccess={handleEditSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllEmployeePage;