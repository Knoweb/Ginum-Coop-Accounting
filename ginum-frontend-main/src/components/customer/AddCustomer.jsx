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
  FiCopy,
} from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import Alert from "../Alert/Alert";
import { apiUrl } from "../../utils/api";

export default function AddCustomerForm({ onClose, initialData }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    phone_no: initialData?.phoneNo || "",
    email: initialData?.email || "",
    nic_no: initialData?.nicNo || "",
    customer_type: initialData?.customerType || "",
    tin_no: initialData?.tinNo || "",
    vat: initialData?.vat || "",
    br_document: null,
    swift_no: initialData?.swiftNo || "",
    billing_address: initialData?.billingAddress || "",
    delivery_address: initialData?.deliveryAddress || "",
    currencyId: initialData?.currency?.id ? String(initialData.currency.id) : "1",
    discount: initialData?.discountPercentage !== undefined && initialData?.discountPercentage !== null ? String(initialData.discountPercentage) : "",
    tax: initialData?.tax || "INCLUSIVE",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const getAuthToken = () => {
    return (
      sessionStorage.getItem("auth_token") ||
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("token")
    );
  };

  const getCompanyId = () => {
    return sessionStorage.getItem("companyId") || localStorage.getItem("companyId");
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "file" ? files[0] : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Customer Name is required";
    if (!formData.phone_no.trim()) newErrors.phone_no = "Phone Number is required";
    else if (!/^\+?[0-9\s-]{9,}$/.test(formData.phone_no)) {
      newErrors.phone_no = "Please enter a valid phone number (minimum 9 digits)";
    }
    if (!formData.customer_type) newErrors.customer_type = "Customer Type is required";
    if (!formData.delivery_address.trim()) newErrors.delivery_address = "Delivery Address is required";
    if (!formData.billing_address.trim()) newErrors.billing_address = "Billing Address is required";
    if (!formData.currencyId) newErrors.currencyId = "Currency is required";

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const copyBillingToDelivery = () => {
    setFormData((prev) => ({
      ...prev,
      delivery_address: prev.billing_address,
    }));
    if (errors.delivery_address) {
      setErrors((prev) => ({ ...prev, delivery_address: "" }));
    }
    Alert.success("Billing address copied to delivery address!");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone_no: "",
      email: "",
      nic_no: "",
      customer_type: "",
      tin_no: "",
      vat: "",
      br_document: null,
      swift_no: "",
      billing_address: "",
      delivery_address: "",
      currencyId: "1",
      discount: "",
      tax: "INCLUSIVE",
    });
    setErrors({});
    setFileInputKey(Date.now());
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      navigate("/customer/all");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) {
      Alert.error("Please fill all required fields correctly.");
      return;
    }

    const token = getAuthToken();
    const companyId = getCompanyId();

    if (!token || !companyId) {
      Alert.error("Session expired. Please login again.");
      return;
    }

    const customerPayload = {
      name: formData.name,
      phoneNo: formData.phone_no,
      email: formData.email,
      nicNo: formData.nic_no,
      customerType: formData.customer_type,
      vat: formData.vat,
      tinNo: formData.tin_no,
      deliveryAddress: formData.delivery_address,
      tax: formData.tax,
      billingAddress: formData.billing_address,
      swiftNo: formData.swift_no,
      currencyId: Number(formData.currencyId),
      discountPercentage: formData.discount !== "" ? Number(formData.discount) : 0,
      companyId: Number(companyId),
    };

    const multipartData = new FormData();
    multipartData.append(
      "customer",
      new Blob([JSON.stringify(customerPayload)], { type: "application/json" })
    );
    if (formData.br_document) {
      multipartData.append("businessRegistration", formData.br_document);
    }

    try {
      setLoading(true);

      const isEdit = !!initialData?.id;
      const url = isEdit 
        ? `${apiUrl}/api/customers/${initialData.id}`
        : `${apiUrl}/api/customers`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: multipartData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error ${isEdit ? 'updating' : 'creating'} customer:`, errorText);
        Alert.error(`Customer ${isEdit ? 'update' : 'registration'} failed. Please verify fields.`);
        return;
      }

      Alert.success(`Customer ${isEdit ? 'updated' : 'saved'} successfully!`);
      resetForm();
      if (onClose) {
        onClose();
      } else {
        navigate("/customer/all");
      }
    } catch (error) {
      console.error(error);
      Alert.error("Cannot connect to backend server.");
    } finally {
      setLoading(false);
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
              {initialData ? "Edit Customer" : "Create Customer"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {initialData ? "Update customer details" : "Add a new customer to system contacts and ledger"}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FiArrowLeft /> Back to Customers
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
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter customer or company name"
                    className={`w-full pl-10 pr-4 py-2 border ${errors.name ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                      } rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 outline-none transition-all`}
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="phone_no"
                    value={formData.phone_no}
                    onChange={handleChange}
                    placeholder="+94 77 123 4567"
                    className={`w-full pl-10 pr-4 py-2 border ${errors.phone_no ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                      } rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 outline-none transition-all`}
                  />
                </div>
                {errors.phone_no && <p className="text-red-500 text-xs mt-1">{errors.phone_no}</p>}
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
                    placeholder="name@domain.com"
                    className={`w-full pl-10 pr-4 py-2 border ${errors.email ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                      } rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 outline-none transition-all`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Customer Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="customer_type"
                  value={formData.customer_type}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.customer_type ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                    } rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 outline-none transition-all cursor-pointer`}
                >
                  <option value="">Select Type</option>
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="CORPORATE">Corporate</option>
                  <option value="GOVERNMENT">Government</option>
                </select>
                {errors.customer_type && <p className="text-red-500 text-xs mt-1">{errors.customer_type}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  NIC Number
                </label>
                <input
                  type="text"
                  name="nic_no"
                  value={formData.nic_no}
                  onChange={handleChange}
                  placeholder="e.g. 199512345678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Base Currency <span className="text-red-500">*</span>
                </label>
                <select
                  name="currencyId"
                  value={formData.currencyId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  <option value="1">USD ($)</option>
                  <option value="2">EUR (€)</option>
                  <option value="3">LKR (Rs.)</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
                />
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
                      value="INCLUSIVE"
                      checked={formData.tax === "INCLUSIVE"}
                      onChange={handleChange}
                      className="mr-2 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    Tax Inclusive
                  </label>
                  <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="tax"
                      value="EXCLUSIVE"
                      checked={formData.tax === "EXCLUSIVE"}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
                  />
                  <FiPercent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Address Details */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm lg:col-span-2">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
                <FiMapPin className="text-blue-500" />
                Address Details
              </h3>
              <button
                type="button"
                onClick={copyBillingToDelivery}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 transition-colors"
                title="Copy Billing Address to Delivery Address"
              >
                <FiCopy /> Same as Billing Address
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Billing Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="billing_address"
                  value={formData.billing_address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter invoice/billing address details"
                  className={`w-full px-4 py-2.5 border ${errors.billing_address ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                    } rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 outline-none transition-all`}
                />
                {errors.billing_address && <p className="text-red-500 text-xs mt-1">{errors.billing_address}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Delivery/Shipping Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="delivery_address"
                  value={formData.delivery_address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter goods delivery/shipping address details"
                  className={`w-full px-4 py-2.5 border ${errors.delivery_address ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                    } rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 outline-none transition-all`}
                />
                {errors.delivery_address && <p className="text-red-500 text-xs mt-1">{errors.delivery_address}</p>}
              </div>
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
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10 cursor-pointer disabled:bg-blue-400"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" /> {initialData ? "Updating Customer..." : "Saving Customer..."}
              </>
            ) : (
              initialData ? "Update Customer" : "Save Customer"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}