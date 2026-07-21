import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiDollarSign,
  FiPercent,
  FiShield,
  FiInfo,
  FiCreditCard,
  FiArrowLeft,
  FiUploadCloud,
  FiTag,
} from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import { apiUrl } from "../../utils/api";
import Alert from "../../components/Alert/Alert";

export default function AddSupplierForm({ onClose }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    supplier_name: "",
    email: "",
    mobile: "",
    address: "",
    supplier_type: "",
    item_category: "",
    tin_no: "",
    vat: "",
    tax: "inclusive",
    swift_no: "",
    currency: "USD",
    discount: "",
    br_document: null,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const itemCategories = ["CLOTHING", "AUTOMOBILE", "FURNITURE", "FOOD", "ELECTRONICS"];

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "file" ? files[0] : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.supplier_name.trim()) newErrors.supplier_name = "Supplier Name is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile No is required";
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Mobile number must be exactly 10 digits (e.g., 0712345678)";
    }

    if (!formData.supplier_type) newErrors.supplier_type = "Supplier Type is required";
    if (!formData.item_category.trim()) newErrors.item_category = "Item Category is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";

    if (formData.tin_no && !/^\d+$/.test(formData.tin_no)) {
      newErrors.tin_no = "TIN No must be numeric";
    }
    if (formData.vat && !/^\d+$/.test(formData.vat)) {
      newErrors.vat = "VAT must be numeric";
    }
    if (formData.swift_no && !/^[A-Za-z0-9]+$/.test(formData.swift_no)) {
      newErrors.swift_no = "SWIFT No must be alphanumeric";
    }
    if (formData.discount && isNaN(formData.discount)) {
      newErrors.discount = "Discount must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      navigate("/supplier/all");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      Alert.error("Please fill all required fields correctly.");
      return;
    }

    const companyId = sessionStorage.getItem("companyId");
    const token = sessionStorage.getItem("auth_token");

    if (!companyId || !token) {
      Alert.error("Company session expired. Please login again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supplierDetails = {
        supplierName: formData.supplier_name,
        email: formData.email,
        mobileNo: formData.mobile,
        address: formData.address,
        supplierType: formData.supplier_type,
        itemCategory: formData.item_category,
        tinNo: formData.tin_no,
        vat: formData.vat,
        tax: formData.tax.toUpperCase(),
        swiftNo: formData.swift_no,
        currencyId: 1, // Defaulting USD/1
        discountPercentage: formData.discount ? parseFloat(formData.discount) : 0,
        companyId: parseInt(companyId),
      };

      const formDataToSend = new FormData();
      formDataToSend.append(
        "supplier",
        new Blob([JSON.stringify(supplierDetails)], { type: "application/json" })
      );

      if (formData.br_document) {
        formDataToSend.append("file", formData.br_document);
      }

      const response = await fetch(`${apiUrl}/api/suppliers/${companyId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `HTTP error! status: ${response.status}`);
      }

      Alert.success("Supplier added successfully!");

      setFormData({
        supplier_name: "",
        email: "",
        mobile: "",
        address: "",
        supplier_type: "",
        item_category: "",
        tin_no: "",
        vat: "",
        tax: "inclusive",
        swift_no: "",
        currency: "USD",
        discount: "",
        br_document: null,
      });
      setFileInputKey(Date.now());

      if (onClose) {
        onClose();
      } else {
        navigate("/supplier/all");
      }
    } catch (error) {
      console.error("Error adding supplier:", error);
      Alert.error("Failed to add supplier. " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full ${onClose ? "p-2" : "p-6 bg-gray-50 min-h-screen"} max-w-5xl mx-auto space-y-6`}>
      {/* Header section (Only when rendered as page) */}
      {!onClose && (
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <FiUser className="text-blue-600" />
              Create Supplier
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Add a new supplier to system contacts and purchases ledger
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FiArrowLeft /> Back to Suppliers
          </button>
        </div>
      )}

      {/* Main form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Contact Details */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
            <h3 className="text-md font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <FiUser className="text-blue-500" />
              Primary Contact Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="supplier_name"
                    value={formData.supplier_name}
                    onChange={handleChange}
                    placeholder="Enter supplier or vendor name"
                    className={`w-full pl-10 pr-4 py-2 border ${
                      errors.supplier_name ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                    } rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 outline-none transition-all`}
                  />
                </div>
                {errors.supplier_name && <p className="text-red-500 text-xs mt-1">{errors.supplier_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    maxLength="10"
                    placeholder="e.g. 0771234567"
                    className={`w-full pl-10 pr-4 py-2 border ${
                      errors.mobile ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                    } rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 outline-none transition-all`}
                  />
                </div>
                {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="vendor@domain.com"
                    className={`w-full pl-10 pr-4 py-2 border ${
                      errors.email ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                    } rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 outline-none transition-all`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Supplier Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="supplier_type"
                  value={formData.supplier_type}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.supplier_type ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                  } rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 outline-none transition-all cursor-pointer`}
                >
                  <option value="">Select Type</option>
                  <option value="MANUFACTURER">Manufacturer</option>
                  <option value="SUPPLIER">Supplier</option>
                  <option value="RETAILER">Retailer</option>
                </select>
                {errors.supplier_type && <p className="text-red-500 text-xs mt-1">{errors.supplier_type}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Item Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="item_category"
                  value={formData.item_category}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.item_category ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                  } rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 outline-none transition-all cursor-pointer`}
                >
                  <option value="">Select Category</option>
                  {itemCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.item_category && <p className="text-red-500 text-xs mt-1">{errors.item_category}</p>}
              </div>
            </div>
          </div>

          {/* Card 2: Financial & Regulatory details */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
            <h3 className="text-md font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <FiCreditCard className="text-blue-500" />
              Financial & Tax Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  TIN Number
                </label>
                <input
                  type="text"
                  name="tin_no"
                  value={formData.tin_no}
                  onChange={handleChange}
                  placeholder="Tax Identification No"
                  className={`w-full px-3 py-2 border ${
                    errors.tin_no ? "border-red-500 focus:ring-red-200" : "border-gray-300"
                  } rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all`}
                />
                {errors.tin_no && <p className="text-red-500 text-xs mt-1">{errors.tin_no}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  VAT Registration No
                </label>
                <input
                  type="text"
                  name="vat"
                  value={formData.vat}
                  onChange={handleChange}
                  placeholder="VAT Reg No"
                  className={`w-full px-3 py-2 border ${
                    errors.vat ? "border-red-500 focus:ring-red-200" : "border-gray-300"
                  } rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all`}
                />
                {errors.vat && <p className="text-red-500 text-xs mt-1">{errors.vat}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Base Currency <span className="text-red-500">*</span>
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="LKR">LKR (Rs.)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  SWIFT Code
                </label>
                <input
                  type="text"
                  name="swift_no"
                  value={formData.swift_no}
                  onChange={handleChange}
                  placeholder="e.g. ABBYLKXX"
                  className={`w-full px-3 py-2 border ${
                    errors.swift_no ? "border-red-500 focus:ring-red-200" : "border-gray-300"
                  } rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all`}
                />
                {errors.swift_no && <p className="text-red-500 text-xs mt-1">{errors.swift_no}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tax Treatment <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-6 mt-2.5">
                  <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="tax"
                      value="inclusive"
                      checked={formData.tax === "inclusive"}
                      onChange={handleChange}
                      className="mr-2 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    Tax Inclusive
                  </label>
                  <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="tax"
                      value="exclusive"
                      checked={formData.tax === "exclusive"}
                      onChange={handleChange}
                      className="mr-2 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    Tax Exclusive
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Default Discount (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max="100"
                    className={`w-full px-3 py-2 border ${
                      errors.discount ? "border-red-500 focus:ring-red-200" : "border-gray-300"
                    } rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all`}
                  />
                  <FiPercent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {errors.discount && <p className="text-red-500 text-xs mt-1">{errors.discount}</p>}
              </div>
            </div>
          </div>

          {/* Card 3: Address Details */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm lg:col-span-2">
            <h3 className="text-md font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <FiMapPin className="text-blue-500" />
              Address Details
            </h3>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Supplier Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                placeholder="Enter complete supplier address details"
                className={`w-full px-4 py-2.5 border ${
                  errors.address ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                } rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 outline-none transition-all`}
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>
          </div>

          {/* Card 4: Document Upload */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm lg:col-span-2">
            <h3 className="text-md font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <FiFileText className="text-blue-500" />
              Business Documents
            </h3>

            <div className="w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business Registration (BR) Document
              </label>

              <div className="relative border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl p-6 transition-all flex flex-col items-center justify-center bg-gray-50/50 hover:bg-blue-50/10 cursor-pointer">
                <FiUploadCloud className="text-4xl text-gray-400 mb-2" />
                <span className="text-sm font-bold text-gray-700">
                  {formData.br_document ? formData.br_document.name : "Choose file to upload"}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  Supports PDF, PNG, JPG (Max 5MB)
                </span>
                <input
                  key={fileInputKey}
                  type="file"
                  name="br_document"
                  onChange={handleChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="border-t border-gray-200 pt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-bold transition-all cursor-pointer"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10 cursor-pointer disabled:bg-blue-400"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin" /> Saving Supplier...
              </>
            ) : (
              "Save Supplier"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}