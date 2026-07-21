import React, { useEffect, useState } from "react";
import { apiUrl } from "../../utils/api";
import Alert from "../../components/Alert/Alert";
import {
  FaSpinner,
  FaSearch,
  FaPlus,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaTag,
  FaRegEdit,
  FaPowerOff,
  FaSyncAlt,
  FaTrashAlt,
  FaTimes,
} from "react-icons/fa";

const SuppliersList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editSupplierId, setEditSupplierId] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSupplierData, setDeleteSupplierData] = useState(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    supplierName: "",
    email: "",
    mobileNo: "",
    address: "",
    supplierType: "SUPPLIER",
    tax: "INCLUSIVE",
    itemCategory: "",
    tinNo: "",
    swiftNo: "",
    discountPercentage: "",
    active: true,
  });

  const getCompanyId = () => sessionStorage.getItem("companyId");
  const getToken = () => sessionStorage.getItem("auth_token");

  const getAuthHeaders = () => {
    return {
      Authorization: `Bearer ${getToken()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  };

  const getSupplierId = (supplier) => {
    return supplier.id || supplier.supplierId || supplier.supplier_id || "";
  };

  const isSupplierActive = (supplier) => {
    if (supplier.active === undefined || supplier.active === null) return true;
    return supplier.active === true;
  };

  const formatText = (value) => {
    if (!value) return "-";

    return value
      .toString()
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getInitial = (name) => {
    if (!name) return "S";
    return name.trim().charAt(0).toUpperCase();
  };

  const fetchSuppliers = async () => {
    const companyId = getCompanyId();
    const token = getToken();

    if (!companyId || !token) {
      Alert.error("Company session expired. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${apiUrl}/api/suppliers/companies/${companyId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];

      setSuppliers(list);
      setFilteredSuppliers(list);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      Alert.error("Failed to load suppliers.");
      setSuppliers([]);
      setFilteredSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();

    const filtered = suppliers.filter((supplier) => {
      const statusText = isSupplierActive(supplier) ? "active" : "inactive";

      return (
        String(supplier.supplierName || "").toLowerCase().includes(term) ||
        String(supplier.email || "").toLowerCase().includes(term) ||
        String(supplier.mobileNo || "").toLowerCase().includes(term) ||
        String(supplier.address || "").toLowerCase().includes(term) ||
        String(supplier.supplierType || "").toLowerCase().includes(term) ||
        String(supplier.itemCategory || "").toLowerCase().includes(term) ||
        String(supplier.tax || "").toLowerCase().includes(term) ||
        statusText.includes(term)
      );
    });

    setFilteredSuppliers(filtered);
  }, [searchTerm, suppliers]);

  const handleAddSupplier = () => {
    Alert.info("Connect this button to your Add Supplier page route.");
  };

  const openEditModal = (supplier) => {
    const supplierId = getSupplierId(supplier);

    if (!supplierId) {
      Alert.error("Supplier ID missing. Cannot edit.");
      return;
    }

    setEditSupplierId(supplierId);

    setEditForm({
      supplierName: supplier.supplierName || "",
      email: supplier.email || "",
      mobileNo: supplier.mobileNo || "",
      address: supplier.address || "",
      supplierType: supplier.supplierType || "SUPPLIER",
      tax: supplier.tax || "INCLUSIVE",
      itemCategory: supplier.itemCategory || "",
      tinNo: supplier.tinNo || "",
      swiftNo: supplier.swiftNo || "",
      discountPercentage:
        supplier.discountPercentage === null ||
        supplier.discountPercentage === undefined
          ? ""
          : supplier.discountPercentage,
      active: isSupplierActive(supplier),
    });

    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditSupplierId(null);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUpdateSupplier = async (e) => {
    e.preventDefault();

    if (!editSupplierId) {
      Alert.error("Supplier ID missing.");
      return;
    }

    if (!editForm.supplierName.trim()) {
      Alert.error("Supplier name is required.");
      return;
    }

    if (!editForm.address.trim()) {
      Alert.error("Address is required.");
      return;
    }

    if (!editForm.itemCategory.trim()) {
      Alert.error("Item category is required.");
      return;
    }

    try {
      setEditSaving(true);

      const payload = {
        supplierName: editForm.supplierName.trim(),
        email: editForm.email.trim() || null,
        mobileNo: editForm.mobileNo.trim() || null,
        address: editForm.address.trim(),
        supplierType: editForm.supplierType,
        tax: editForm.tax,
        itemCategory: editForm.itemCategory.trim(),
        tinNo: editForm.tinNo.trim() || null,
        swiftNo: editForm.swiftNo.trim() || null,
        discountPercentage:
          editForm.discountPercentage === ""
            ? null
            : Number(editForm.discountPercentage),
        active: editForm.active,
      };

      const response = await fetch(`${apiUrl}/api/suppliers/${editSupplierId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update supplier.");
      }

      Alert.success("Supplier updated successfully.");
      closeEditModal();
      await fetchSuppliers();
    } catch (error) {
      console.error("Error updating supplier:", error);
      Alert.error(error.message || "Failed to update supplier.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleActive = async (supplier) => {
    const supplierId = getSupplierId(supplier);

    if (!supplierId) {
      Alert.error("Supplier ID missing. Cannot update status.");
      return;
    }

    const currentStatus = isSupplierActive(supplier);
    const newStatus = !currentStatus;

    try {
      setStatusUpdatingId(supplierId);

      const response = await fetch(
        `${apiUrl}/api/suppliers/${supplierId}/active?active=${newStatus}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update supplier status.");
      }

      Alert.success(
        newStatus
          ? "Supplier activated successfully."
          : "Supplier deactivated successfully."
      );

      await fetchSuppliers();
    } catch (error) {
      console.error("Error updating supplier status:", error);
      Alert.error(error.message || "Failed to update supplier status.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const openDeleteModal = (supplier) => {
    const supplierId = getSupplierId(supplier);

    if (!supplierId) {
      Alert.error("Supplier ID missing. Cannot delete.");
      return;
    }

    setDeleteSupplierData(supplier);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setDeleteSupplierData(null);
    setShowDeleteModal(false);
  };

  const handleDeleteSupplier = async () => {
    if (!deleteSupplierData) return;

    const supplierId = getSupplierId(deleteSupplierData);

    try {
      setDeleteSaving(true);

      const response = await fetch(`${apiUrl}/api/suppliers/${supplierId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();

        let message = errorText;

        try {
          const errorJson = JSON.parse(errorText);
          message = errorJson.message || errorText;
        } catch {
          message = errorText;
        }

        throw new Error(message || "Failed to delete supplier.");
      }

      Alert.success("Supplier deleted successfully.");
      closeDeleteModal();
      await fetchSuppliers();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      Alert.error(
        error.message ||
          "Cannot delete this supplier. Please deactivate the supplier instead."
      );
    } finally {
      setDeleteSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-blue-600">
        <FaSpinner className="animate-spin text-4xl" />
        <span className="ml-3 text-lg">Loading Suppliers...</span>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Suppliers</h1>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />

              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-70 pl-11 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleAddSupplier}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-base flex items-center justify-center gap-2"
            >
              <FaPlus />
              Add Supplier
            </button>

            {/* <button
              type="button"
              onClick={fetchSuppliers}
              className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 px-4 py-3 rounded-lg text-base flex items-center justify-center gap-2"
              title="Refresh"
            >
              <FaSyncAlt />
            </button> */}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>

                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Contact Info
                  </th>

                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Address
                  </th>

                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type / Tax
                  </th>

                  <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>

                  <th className="py-3 px-6 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.map((supplier, index) => {
                  const supplierId = getSupplierId(supplier);
                  const active = isSupplierActive(supplier);
                  const updating = statusUpdatingId === supplierId;

                  return (
                    <tr
                      key={supplierId || index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold">
                            {getInitial(supplier.supplierName)}
                          </div>

                          <div>
                            <p className="text-base font-semibold text-gray-900">
                              {supplier.supplierName || "-"}
                            </p>

                            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                              <FaTag className="text-gray-400" />
                              {formatText(supplier.itemCategory)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-900 flex items-center gap-3 mb-2">
                          <FaPhoneAlt className="text-gray-500" />
                          {supplier.mobileNo || "-"}
                        </p>

                        <p className="text-sm text-gray-500 flex items-center gap-3">
                          <FaEnvelope className="text-gray-500" />
                          {supplier.email || "-"}
                        </p>
                      </td>

                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-900 flex items-center gap-3">
                          <FaMapMarkerAlt className="text-gray-500" />
                          {supplier.address || "-"}
                        </p>
                      </td>

                      <td className="py-4 px-6">
                        <p className="text-base text-gray-900">
                          {formatText(supplier.supplierType)}
                        </p>

                        <p className="text-sm text-gray-500">
                          Tax: {formatText(supplier.tax)}
                        </p>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-4">
                          <button
                            type="button"
                            onClick={() => openEditModal(supplier)}
                            className="text-blue-600 hover:text-blue-800 text-xl"
                            title="Edit Supplier"
                          >
                            <FaRegEdit />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleActive(supplier)}
                            disabled={updating}
                            className={`text-xl disabled:text-gray-400 ${
                              active
                                ? "text-red-500 hover:text-red-700"
                                : "text-green-500 hover:text-green-700"
                            }`}
                            title={
                              active
                                ? "Deactivate Supplier"
                                : "Activate Supplier"
                            }
                          >
                            {updating ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaPowerOff />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteModal(supplier)}
                            className="text-red-500 hover:text-red-700 text-xl"
                            title="Delete Supplier"
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-8 px-6 text-center text-gray-500 text-sm"
                    >
                      No suppliers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 bg-white text-gray-700 text-sm">
            Showing {filteredSuppliers.length} of {suppliers.length} suppliers
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeEditModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              disabled={editSaving}
            >
              <FaTimes />
            </button>

            <h2 className="section-title mb-5">
              Edit Supplier
            </h2>

            <form onSubmit={handleUpdateSupplier}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Supplier Name"
                  name="supplierName"
                  value={editForm.supplierName}
                  onChange={handleEditChange}
                  required
                />

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                />

                <Input
                  label="Mobile No"
                  name="mobileNo"
                  value={editForm.mobileNo}
                  onChange={handleEditChange}
                />

                <Input
                  label="Address"
                  name="address"
                  value={editForm.address}
                  onChange={handleEditChange}
                  required
                />

                <Select
                  label="Supplier Type"
                  name="supplierType"
                  value={editForm.supplierType}
                  onChange={handleEditChange}
                  options={[
                    { value: "MANUFACTURER", label: "Manufacturer" },
                    { value: "SUPPLIER", label: "Supplier" },
                    { value: "RETAILER", label: "Retailer" },
                  ]}
                />

                <Select
                  label="Tax Type"
                  name="tax"
                  value={editForm.tax}
                  onChange={handleEditChange}
                  options={[
                    { value: "INCLUSIVE", label: "Inclusive" },
                    { value: "EXCLUSIVE", label: "Exclusive" },
                  ]}
                />

                <Input
                  label="Item Category"
                  name="itemCategory"
                  value={editForm.itemCategory}
                  onChange={handleEditChange}
                  required
                />

                <Input
                  label="TIN No"
                  name="tinNo"
                  value={editForm.tinNo}
                  onChange={handleEditChange}
                />

                <Input
                  label="Swift No"
                  name="swiftNo"
                  value={editForm.swiftNo}
                  onChange={handleEditChange}
                />

                <Input
                  label="Discount Percentage"
                  name="discountPercentage"
                  type="number"
                  value={editForm.discountPercentage}
                  onChange={handleEditChange}
                />

                <div className="flex items-center gap-3 mt-7">
                  <input
                    type="checkbox"
                    name="active"
                    checked={editForm.active}
                    onChange={handleEditChange}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Active Supplier
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={editSaving}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg disabled:bg-gray-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-300 flex items-center gap-2"
                >
                  {editSaving && <FaSpinner className="animate-spin" />}
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && deleteSupplierData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button
              type="button"
              onClick={closeDeleteModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              disabled={deleteSaving}
            >
              <FaTimes />
            </button>

            <h2 className="section-title mb-3">
              Delete Supplier
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              You can delete this supplier only if there are no purchase
              transactions. If transactions exist, please use deactivate instead.
            </p>

            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-5 text-sm">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deleteSupplierData.supplierName}
              </span>
              ?
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteSaving}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg disabled:bg-gray-300"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteSupplier}
                disabled={deleteSaving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:bg-gray-300 flex items-center gap-2"
              >
                {deleteSaving && <FaSpinner className="animate-spin" />}
                {deleteSaving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Input = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

const Select = ({ label, name, value, onChange, options }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SuppliersList;