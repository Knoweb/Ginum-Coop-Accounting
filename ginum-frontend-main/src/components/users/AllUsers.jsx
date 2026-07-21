import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiUserPlus,
  FiEdit,
  FiTrash2,
  FiUsers,
  FiUserCheck,
  FiShield,
  FiLock,
  FiX,
  FiInfo,
} from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import { apiUrl } from "../../utils/api";
import api from "../../utils/api";
import Alert from "../Alert/Alert";

function AllUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editRole, setEditRole] = useState("USER");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const companyId = sessionStorage.getItem("companyId");
  const token = sessionStorage.getItem("auth_token") || sessionStorage.getItem("token");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, empRes] = await Promise.all([
        fetch(`${apiUrl}/api/users/companies/${companyId}`, { headers: getAuthHeaders() }),
        fetch(`${apiUrl}/api/employees/${companyId}`, { headers: getAuthHeaders() }),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData) ? usersData : []);
      }

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(Array.isArray(empData) ? empData : []);
      }
    } catch (err) {
      console.error("Error fetching system users data:", err);
      Alert.error("Failed to load users list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  // Map users with corresponding employee details
  const mappedUsers = useMemo(() => {
    return users.map((user) => {
      const matchedEmp = employees.find(
        (emp) => (emp.email || "").toLowerCase() === (user.email || "").toLowerCase()
      );

      return {
        ...user,
        name: matchedEmp ? `${matchedEmp.firstName} ${matchedEmp.lastName}` : "System User",
        department: matchedEmp?.department?.name || "N/A",
        designation: matchedEmp?.designation?.name || "N/A",
        status: "Active",
      };
    });
  }, [users, employees]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return mappedUsers.filter((user) => {
      // Role filter
      if (roleFilter !== "ALL" && user.role !== roleFilter) return false;

      // Search term (email or name)
      const term = searchTerm.toLowerCase();
      const emailMatch = (user.email || "").toLowerCase().includes(term);
      const nameMatch = (user.name || "").toLowerCase().includes(term);

      return emailMatch || nameMatch;
    });
  }, [mappedUsers, searchTerm, roleFilter]);

  // Aggregate User Stats
  const stats = useMemo(() => {
    let admins = 0;
    let managers = 0;
    let standardUsers = 0;

    users.forEach((u) => {
      if (u.role === "ADMIN") admins++;
      else if (u.role === "MANAGER") managers++;
      else standardUsers++;
    });

    return {
      total: users.length,
      admins,
      managers,
      standardUsers,
    };
  }, [users]);

  // Delete/Remove user
  const handleDeleteUser = async (userId, userEmail) => {
    if (window.confirm(`Are you sure you want to remove access for user ${userEmail}?`)) {
      try {
        const response = await fetch(`${apiUrl}/api/users/${userId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          Alert.success("User access revoked successfully.");
          fetchData();
        } else {
          Alert.error("Failed to delete user mapping.");
        }
      } catch (err) {
        console.error(err);
        Alert.error("Error removing user access.");
      }
    }
  };

  // Submit User Role/Password Updates
  const handleUpdateUser = async (e) => {
    e.preventDefault();

    if (editPassword && editPassword !== editConfirmPassword) {
      Alert.error("Passwords do not match!");
      return;
    }

    setIsUpdating(true);
    try {
      const payload = {
        email: selectedUser.email,
        role: editRole,
        password: editPassword || null,
      };

      const response = await fetch(`${apiUrl}/api/users/companies/${companyId}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.success("User assignment updated successfully!");
        setShowEditModal(false);
        setEditPassword("");
        setEditConfirmPassword("");
        fetchData();
      } else {
        const errText = await response.text();
        Alert.error(errText || "Failed to update user.");
      }
    } catch (err) {
      console.error(err);
      Alert.error("Error updating user.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "MANAGER":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6 max-w-full overflow-x-hidden">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FiUsers className="text-blue-600" />
            System Users
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage company user profiles, update access permissions, and roles
          </p>
        </div>

        <button
          onClick={() => navigate("/users/new")}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
        >
          <FiUserPlus /> Assign User Access
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <SummaryCard
          title="Total App Users"
          value={stats.total}
          description="Total users with access"
          icon={<FiUsers className="text-blue-500" />}
          bgColor="bg-blue-50/50 border-blue-500"
          valueColor="text-blue-900"
        />
        <SummaryCard
          title="Administrators"
          value={stats.admins}
          description="Users with Admin rights"
          icon={<FiShield className="text-purple-500" />}
          bgColor="bg-purple-50/50 border-purple-500"
          valueColor="text-purple-700"
        />
        <SummaryCard
          title="Managers"
          value={stats.managers}
          description="Users with Manager rights"
          icon={<FiUserCheck className="text-amber-500" />}
          bgColor="bg-amber-50/50 border-amber-500"
          valueColor="text-amber-700"
        />
        <SummaryCard
          title="Active Users"
          value={stats.total}
          description="Status: Active in ledger"
          icon={<FiUserCheck className="text-green-500" />}
          bgColor="bg-green-50/50 border-green-500"
          valueColor="text-green-700"
        />
      </div>

      {/* Filters row */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-grow max-w-md">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-all"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="USER">USER</option>
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">User Name</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Email Address</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Role</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Department & Designation</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <FaSpinner className="animate-spin text-blue-500 text-3xl mb-3" />
                      <p className="text-gray-600 font-medium">Loading system users...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 text-xs rounded-full font-extrabold border ${getRoleBadgeStyle(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.department !== "N/A" ? (
                        <span>
                          {user.department} <span className="text-gray-300">|</span> {user.designation}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 text-xs rounded-full font-extrabold border bg-green-50 text-green-700 border-green-200">
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setEditRole(user.role);
                            setEditPassword("");
                            setEditConfirmPassword("");
                            setShowEditModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
                        >
                          <FiEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Revoke User Access"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <FiUsers className="text-5xl text-gray-300 mb-3" />
                      <p className="text-lg font-bold text-gray-600">No users found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Try modifying search parameters or assign access to a new user.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiEdit className="text-blue-600" /> Edit User Role & Pass
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-5">
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">User name</span>
                <span className="text-sm font-semibold text-gray-900 block">{selectedUser.name}</span>
              </div>

              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email address</span>
                <span className="text-sm font-semibold text-gray-700 block">{selectedUser.email}</span>
              </div>

              {/* System Role Selection */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">System Role *</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 cursor-pointer outline-none text-gray-900 font-medium transition-all"
                  required
                >
                  <option value="USER">USER</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {/* Password update (Optional) */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <FiLock /> Update Password (Optional)
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none bg-white"
                    minLength="6"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={editConfirmPassword}
                    onChange={(e) => setEditConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none bg-white"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold transition-colors cursor-pointer"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:bg-blue-400"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const SummaryCard = ({ title, value, description, icon, bgColor, valueColor }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between h-32">
      <div className="flex justify-between items-start">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
        <div className={`text-lg p-2 rounded-lg ${bgColor}`}>{icon}</div>
      </div>
      <div>
        <p className={`text-2xl font-extrabold ${valueColor} mt-1`}>{value}</p>
        <p className="text-xs text-gray-400 mt-1 font-medium">{description}</p>
      </div>
    </div>
  );
};

export default AllUsers;