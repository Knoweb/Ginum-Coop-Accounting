import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiFileText,
  FiUser,
  FiCalendar,
  FiPlusCircle,
  FiTrash2,
  FiRefreshCw,
  FiArrowLeft,
  FiFilePlus,
  FiInfo,
  FiPercent,
} from "react-icons/fi";
import { FaSpinner, FaTimes } from "react-icons/fa";
import AddAccountForm from "../account/AddAccountForm";
import NewProjectForm from "../projects/NewProjectForm";
import { apiUrl } from "../../utils/api";
import Alert from "../Alert/Alert";

const API_BASE_URL = apiUrl;

const emptyRow = {
  itemId: "",
  description: "",
  accountCode: "",
  quantity: "",
  unitPrice: "",
  discount: "",
  amount: "",
  projectId: "",
};

const CreatePurchase = () => {
  const navigate = useNavigate();

  const [isServiceMode, setIsServiceMode] = useState(false);
  const [rows, setRows] = useState([{ ...emptyRow }]);

  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [promiseDate, setPromiseDate] = useState("");
  const [notes, setNotes] = useState("");

  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [items, setItems] = useState([]);

  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const [suppliersError, setSuppliersError] = useState("");
  const [accountsError, setAccountsError] = useState("");
  const [projectsError, setProjectsError] = useState("");
  const [itemsError, setItemsError] = useState("");

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [modalTransition, setModalTransition] = useState("opacity-0 invisible");

  const [subtotal, setSubtotal] = useState(0);
  const [freight, setFreight] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [total, setTotal] = useState(0);
  const [balanceDue, setBalanceDue] = useState(0);

  const [saving, setSaving] = useState(false);

  const getCompanyId = () => sessionStorage.getItem("companyId");
  const getToken = () => sessionStorage.getItem("auth_token");

  const getAuthHeaders = () => {
    const token = getToken();
    return {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
  };

  const getJsonHeaders = () => {
    const token = getToken();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  };

  const checkAuth = () => {
    const companyId = getCompanyId();
    const token = getToken();
    if (!companyId || !token) {
      throw new Error("Missing company ID or auth token. Please login again.");
    }
    return companyId;
  };

  const extractArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.suppliers)) return data.suppliers;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.projects)) return data.projects;
    if (Array.isArray(data?.accounts)) return data.accounts;
    return [];
  };

  const getSupplierId = (supplier) => {
    return (
      supplier.id ||
      supplier.supplierId ||
      supplier.supplier_id ||
      supplier.supplierID ||
      ""
    );
  };

  const getSupplierName = (supplier) => {
    return (
      supplier.supplierName ||
      supplier.name ||
      supplier.companyName ||
      supplier.email ||
      "Unnamed Supplier"
    );
  };

  const getItemId = (item) => item.itemId || item.id;
  const getProjectId = (project) => project.id || project.projectId;

  const getAccountLabel = (account) => {
    const code = account.accountCode || "";
    const name = account.accountName || account.name || "Unnamed Account";
    return code ? `${code} - ${name}` : name;
  };

  useEffect(() => {
    const newSubtotal = rows.reduce((sum, row) => {
      return sum + (Number(row.amount) || 0);
    }, 0);
    const newTotal = newSubtotal + (Number(freight) || 0) + (Number(taxAmount) || 0);
    setSubtotal(newSubtotal);
    setTotal(newTotal);
    setBalanceDue(newTotal);
  }, [rows, freight, taxAmount]);

  useEffect(() => {
    if (showAccountModal || showProjectModal || showItemModal) {
      setModalTransition("opacity-100 visible");
    } else {
      setModalTransition("opacity-0 invisible");
    }
  }, [showAccountModal, showProjectModal, showItemModal]);

  const handleModalClick = (e, setModal) => {
    if (e.target === e.currentTarget) {
      setModal(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      setIsLoadingSuppliers(true);
      setSuppliersError("");
      const companyId = checkAuth();
      const response = await fetch(`${API_BASE_URL}/api/suppliers/companies/${companyId}/active`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to load suppliers.");
      }
      const data = await response.json();
      const supplierList = extractArray(data);
      setSuppliers(supplierList);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setSuppliersError("Failed to load suppliers.");
      setSuppliers([]);
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      setAccountsError("");
      const companyId = checkAuth();
      const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/accounts/active`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to load accounts.");
      }
      const data = await response.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setAccountsError("Failed to load accounts.");
      setAccounts([]);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      setProjectsError("");
      const companyId = checkAuth();
      const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/projects`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to load projects.");
      }
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjectsError("Failed to load projects.");
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const fetchItems = async () => {
    try {
      setIsLoadingItems(true);
      setItemsError("");
      const companyId = checkAuth();
      const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}/items`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to load items.");
      }
      const data = await response.json();
      const itemList = extractArray(data);
      setItems(itemList);
    } catch (error) {
      console.error("Error fetching items:", error);
      setItemsError("Failed to load items.");
      setItems([]);
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchAccounts();
    fetchProjects();
    fetchItems();
  }, []);

  const calculateRowAmount = (row) => {
    if (isServiceMode) {
      return Number(row.amount || 0).toFixed(2);
    }
    const quantity = Number(row.quantity) || 0;
    const unitPrice = Number(row.unitPrice) || 0;
    const discount = Number(row.discount) || 0;
    const discountedPrice = unitPrice * (1 - discount / 100);
    return (quantity * discountedPrice).toFixed(2);
  };

  const shouldAddNewRow = (row) => {
    if (isServiceMode) {
      return row.description || row.accountCode || row.amount || row.projectId;
    }
    return (
      row.itemId ||
      row.description ||
      row.accountCode ||
      row.quantity ||
      row.unitPrice ||
      row.discount ||
      row.amount ||
      row.projectId
    );
  };

  const handleRowChange = (index, field, value) => {
    const updatedRows = [...rows];
    let updatedRow = {
      ...updatedRows[index],
      [field]: value,
    };

    if (field === "itemId") {
      const selectedItem = items.find(
        (item) => String(getItemId(item)) === String(value)
      );
      if (selectedItem) {
        const purchasePrice = selectedItem.purchasePrice != null ? Number(selectedItem.purchasePrice) : 0;
        updatedRow = {
          ...updatedRow,
          itemId: getItemId(selectedItem),
          description: selectedItem.description || selectedItem.name || "",
          unitPrice: purchasePrice > 0 ? purchasePrice : "",
        };

        if (purchasePrice <= 0) {
          Alert.error("Purchase price not available. Please enter unit price manually.");
        }
      }
    }

    if (
      !isServiceMode &&
      (field === "itemId" ||
        field === "quantity" ||
        field === "unitPrice" ||
        field === "discount")
    ) {
      updatedRow.amount = calculateRowAmount(updatedRow);
    }

    updatedRows[index] = updatedRow;

    if (index === rows.length - 1 && shouldAddNewRow(updatedRow)) {
      updatedRows.push({ ...emptyRow });
    }
    setRows(updatedRows);
  };

  const removeRow = (index) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    if (updatedRows.length === 0) {
      updatedRows.push({ ...emptyRow });
    }
    setRows(updatedRows);
  };

  const getValidRows = () => {
    return rows.filter((row) => {
      if (isServiceMode) {
        return (
          row.description.trim() &&
          row.accountCode &&
          Number(row.amount) > 0
        );
      }
      return (
        row.itemId &&
        row.accountCode &&
        Number(row.quantity) > 0 &&
        Number(row.unitPrice) > 0 &&
        Number(row.amount) > 0
      );
    });
  };

  const validatePurchaseOrder = () => {
    if (!selectedSupplier) {
      Alert.error("Please select a supplier.");
      return false;
    }
    if (!poNumber.trim()) {
      Alert.error("Please enter the purchase order number.");
      return false;
    }
    if (!supplierInvoiceNumber.trim()) {
      Alert.error("Supplier invoice number is required.");
      return false;
    }
    if (!issueDate) {
      Alert.error("Please select the order date.");
      return false;
    }
    if (!dueDate) {
      Alert.error("Please select the due date.");
      return false;
    }
    if (!promiseDate) {
      Alert.error("Please select the promise date.");
      return false;
    }

    let hasLine = false;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const isLastRow = i === rows.length - 1;
      const isCompletelyEmpty =
        !row.itemId &&
        !row.description?.trim() &&
        !row.accountCode &&
        !row.quantity &&
        !row.unitPrice &&
        !row.discount &&
        !row.amount;
      
      if (isLastRow && isCompletelyEmpty) {
        continue;
      }

      hasLine = true;

      if (isServiceMode) {
        if (!row.description?.trim()) {
          Alert.error(`Line ${i + 1}: Description is required.`);
          return false;
        }
        if (!row.accountCode) {
          Alert.error(`Line ${i + 1}: Account is required.`);
          return false;
        }
        const amt = Number(row.amount);
        if (isNaN(amt) || amt <= 0) {
          Alert.error(`Line ${i + 1}: Amount must be greater than zero.`);
          return false;
        }
      } else {
        if (!row.itemId) {
          Alert.error(`Line ${i + 1}: Item is required.`);
          return false;
        }
        if (!row.accountCode) {
          Alert.error(`Line ${i + 1}: Account is required.`);
          return false;
        }
        if (row.quantity === "" || row.quantity === null || row.quantity === undefined) {
          Alert.error(`Line ${i + 1}: Quantity must be provided.`);
          return false;
        }
        const qty = Number(row.quantity);
        if (isNaN(qty) || qty <= 0) {
          Alert.error(`Line ${i + 1}: Quantity must be greater than zero.`);
          return false;
        }
        if (row.unitPrice === "" || row.unitPrice === null || row.unitPrice === undefined) {
          Alert.error(`Line ${i + 1}: Please enter unit price for this item.`);
          return false;
        }
        const price = Number(row.unitPrice);
        if (isNaN(price) || price <= 0) {
          Alert.error(`Line ${i + 1}: Unit Price must be greater than zero.`);
          return false;
        }
      }
    }

    if (!hasLine) {
      Alert.error("Please add at least one line item.");
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    const companyId = checkAuth();
    const validRows = getValidRows();
    return {
      supplierId: Number(selectedSupplier),
      poNumber: poNumber.trim(),
      supplierInvoiceNumber: supplierInvoiceNumber.trim() || null,
      issueDate: issueDate,
      dueDate: dueDate,
      promiseDate: promiseDate,
      notes: notes.trim(),
      purchaseType: isServiceMode ? "SERVICES" : "GOODS",
      companyId: Number(companyId),
      freight: freight ? Number(freight) : 0,
      taxAmount: taxAmount ? Number(taxAmount) : 0,
      items: validRows.map((row) => ({
        itemId: isServiceMode ? null : Number(row.itemId),
        description: row.description.trim(),
        accountCode: row.accountCode,
        quantity: isServiceMode ? 1 : Number(row.quantity),
        unitPrice: isServiceMode ? Number(row.amount) : Number(row.unitPrice),
        discount: Number(row.discount || 0),
        amount: Number(row.amount || 0),
        projectId: row.projectId ? Number(row.projectId) : null,
      })),
    };
  };

  const handleSavePurchaseOrder = async () => {
    try {
      if (!validatePurchaseOrder()) return;
      setSaving(true);

      const companyId = checkAuth();
      const payload = buildPayload();

      const response = await fetch(`${API_BASE_URL}/api/purchase-orders/company/${companyId}`, {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = "Purchase order save failed.";
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.errors && Array.isArray(errorData.errors)) {
            // Spring Boot validation errors array
            errorMessage = errorData.errors.map(err => err.defaultMessage).join(", ");
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch (e) {
          // Fallback to text if not JSON
          const text = await response.text();
          if (text) {
             // Avoid showing raw HTML stack traces
             errorMessage = text.includes("<html") ? "An internal server error occurred." : text;
          }
        }
        throw new Error(errorMessage);
      }

      Alert.success("Purchase order saved successfully!");
      resetForm();
      navigate("/supplier/purchase/all");
    } catch (error) {
      console.error(error);
      Alert.error(error.message || "Purchase order save failed.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setRows([{ ...emptyRow }]);
    setSelectedSupplier("");
    setPoNumber("");
    setSupplierInvoiceNumber("");
    setIssueDate(new Date().toISOString().split("T")[0]);
    setDueDate("");
    setPromiseDate("");
    setNotes("");
    setFreight("");
    setTaxAmount("");
  };

  const closeAccountModal = () => {
    setShowAccountModal(false);
    fetchAccounts();
  };

  const closeProjectModal = () => {
    setShowProjectModal(false);
    fetchProjects();
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    fetchItems();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6 max-w-full overflow-x-hidden">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FiFileText className="text-blue-600" />
            Create Purchase Order
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and save a new purchase order bill or expense invoice
          </p>
        </div>
        <button
          onClick={() => navigate("/supplier/purchase/all")}
          className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <FiArrowLeft /> Cancel & Exit
        </button>
      </div>



      {/* Segment Mode Switch */}
      <div className="flex bg-gray-200/60 p-1.5 rounded-xl w-fit border border-gray-300/40">
        <button
          type="button"
          onClick={() => {
            setIsServiceMode(false);
            setRows([{ ...emptyRow }]);
          }}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
            !isServiceMode ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Goods / Items Mode
        </button>
        <button
          type="button"
          onClick={() => {
            setIsServiceMode(true);
            setRows([{ ...emptyRow }]);
          }}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
            isServiceMode ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Services Mode
        </button>
      </div>

      {/* Meta Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="text-md font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
          <FiUser className="text-blue-500" />
          Supplier & Bill Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Supplier */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all cursor-pointer"
              disabled={isLoadingSuppliers}
            >
              <option value="">Select Supplier</option>
              {suppliers.map((supplier, index) => {
                const supplierId = getSupplierId(supplier);
                return (
                  <option key={supplierId || index} value={supplierId}>
                    {getSupplierName(supplier)}
                  </option>
                );
              })}
            </select>
          </div>

          {/* PO Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              PO Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
              placeholder="e.g. PO-000001"
            />
          </div>

          {/* Supplier Invoice Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Supplier Invoice No <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={supplierInvoiceNumber}
              onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
              placeholder="e.g. INV-123"
            />
          </div>

          {/* Purchase Type removed to match Segment Switch */}

          {/* Order Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Order Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Promise Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Promise Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={promiseDate}
              onChange={(e) => setPromiseDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Ledger Items Table */}
      <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {!isServiceMode && (
                  <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[200px]">
                    Item <span className="text-red-500">*</span>
                    <button
                      type="button"
                      onClick={fetchItems}
                      className="text-blue-500 hover:text-blue-700 ml-1.5 cursor-pointer"
                      title="Refresh Items"
                    >
                      <FiRefreshCw className="h-3.5 w-3.5 inline" />
                    </button>
                  </th>
                )}
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Description <span className="text-red-500">*</span>
                </th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[200px]">
                  Account <span className="text-red-500">*</span>
                  <button
                    type="button"
                    onClick={() => setShowAccountModal(true)}
                    className="ml-1.5 text-blue-500 hover:text-blue-700 cursor-pointer"
                    title="Add Account"
                  >
                    <FiPlusCircle className="h-3.5 w-3.5 inline" />
                  </button>
                </th>
                {!isServiceMode && (
                  <>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap w-24">
                      Units <span className="text-red-500">*</span>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap w-36">
                      Unit Price <span className="text-red-500">*</span>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap w-24">
                      Discount (%)
                    </th>
                  </>
                )}
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap w-40">
                  Amount (Rs.) <span className="text-red-500">*</span>
                </th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[160px]">
                  Project
                  <button
                    type="button"
                    onClick={() => setShowProjectModal(true)}
                    className="ml-1.5 text-blue-500 hover:text-blue-700 cursor-pointer"
                    title="Add Project"
                  >
                    <FiPlusCircle className="h-3.5 w-3.5 inline" />
                  </button>
                </th>
                <th className="px-2 py-3 w-12"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50/20">
                  {/* Item (Goods Mode) */}
                  {!isServiceMode && (
                    <td className="p-2 whitespace-nowrap">
                      <select
                        value={row.itemId}
                        onChange={(e) => handleRowChange(index, "itemId", e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 cursor-pointer"
                        disabled={isLoadingItems}
                      >
                        <option value="">Select Item</option>
                        {items.map((item) => {
                          const itemId = getItemId(item);
                          return (
                            <option key={itemId} value={itemId}>
                              {item.itemCode ? `${item.itemCode} - ${item.name}` : item.name}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                  )}

                  {/* Description */}
                  <td className="p-2">
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                      placeholder="Line Description"
                      value={row.description}
                      onChange={(e) => handleRowChange(index, "description", e.target.value)}
                    />
                  </td>

                  {/* Account */}
                  <td className="p-2 whitespace-nowrap">
                    <select
                      value={row.accountCode}
                      onChange={(e) => handleRowChange(index, "accountCode", e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 cursor-pointer"
                      disabled={isLoadingAccounts}
                    >
                      <option value="">Select Account</option>
                      {accounts.map((account, accountIndex) => (
                        <option
                          key={account.id || account.accountCode || accountIndex}
                          value={account.accountCode}
                        >
                          {getAccountLabel(account)}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Units, Price, Discount (Goods Mode) */}
                  {!isServiceMode && (
                    <>
                      <td className="p-2">
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => handleRowChange(index, "quantity", e.target.value)}
                          min="0"
                          step="1"
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-right"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={row.unitPrice}
                          onChange={(e) => handleRowChange(index, "unitPrice", e.target.value)}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-right"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={row.discount}
                          onChange={(e) => handleRowChange(index, "discount", e.target.value)}
                          min="0"
                          max="100"
                          step="1"
                          placeholder="%"
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-right"
                        />
                      </td>
                    </>
                  )}

                  {/* Amount */}
                  <td className="p-2">
                    <input
                      type="number"
                      value={row.amount}
                      onChange={(e) => handleRowChange(index, "amount", e.target.value)}
                      readOnly={!isServiceMode}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-right bg-gray-50/50 read-only:bg-gray-100/40"
                    />
                  </td>

                  {/* Project */}
                  <td className="p-2 whitespace-nowrap">
                    <select
                      value={row.projectId}
                      onChange={(e) => handleRowChange(index, "projectId", e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 cursor-pointer"
                      disabled={isLoadingProjects}
                    >
                      <option value="">Select Project</option>
                      {projects.map((project, projectIndex) => {
                        const projectId = getProjectId(project);
                        return (
                          <option key={projectId || projectIndex} value={projectId}>
                            {project.code ? `${project.code} - ${project.name}` : project.name}
                          </option>
                        );
                      })}
                    </select>
                  </td>

                  {/* Remove Button */}
                  <td className="p-2 text-center">
                    {index !== rows.length - 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remove Line"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes and Totals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Notes Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
          <label className="block text-sm font-semibold text-gray-700">Order Notes / Terms</label>
          <textarea
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
            rows={4}
            placeholder="Add general terms, supplier terms or payment details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Totals Summary Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Financial Breakdown</h4>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-gray-800">Rs. {subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-600">
              <label className="font-semibold text-gray-700">Freight Charge:</label>
              <input
                type="number"
                className="w-36 px-2.5 py-1 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                placeholder="0.00"
                value={freight}
                onChange={(e) => setFreight(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="flex justify-between items-center text-sm text-gray-600">
              <label className="font-semibold text-gray-700">Tax Amount:</label>
              <input
                type="number"
                className="w-36 px-2.5 py-1 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                placeholder="0.00"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="flex justify-between items-center border-t border-gray-100 pt-2.5 text-sm text-gray-900">
              <span className="font-bold">Total:</span>
              <span className="font-extrabold text-blue-700">Rs. {total.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center border-t border-gray-100 pt-2.5 text-sm text-gray-900">
              <span className="font-bold">Balance Due:</span>
              <span className="font-extrabold text-red-600">Rs. {balanceDue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pb-6">
        <button
          type="button"
          onClick={() => navigate("/supplier/purchase/all")}
          className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-bold transition-all cursor-pointer"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSavePurchaseOrder}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10 cursor-pointer disabled:bg-blue-400"
        >
          {saving ? (
            <>
              <FaSpinner className="animate-spin" /> Saving Order...
            </>
          ) : (
            "Save Purchase Order"
          )}
        </button>
      </div>

      {/* Account Modal */}
      {showAccountModal && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-500 ${modalTransition}`}
          onClick={(e) => handleModalClick(e, setShowAccountModal)}
        >
          <div className="w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3 p-2 rounded-lg max-h-[90vh] overflow-y-auto relative">
            <button
              type="button"
              className="absolute top-2 right-2 text-black-600 text-xl cursor-pointer hover:text-red-500 transition-colors z-10"
              onClick={closeAccountModal}
            >
              <FaTimes />
            </button>
            <AddAccountForm />
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-500 ${modalTransition}`}
          onClick={(e) => handleModalClick(e, setShowProjectModal)}
        >
          <div className="w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5 xl:w-1/3 p-2 rounded-lg max-h-[90vh] overflow-y-auto relative">
            <button
              type="button"
              className="absolute top-2 right-2 text-black-600 text-xl cursor-pointer hover:text-red-500 transition-colors z-10"
              onClick={closeProjectModal}
            >
              <FaTimes />
            </button>
            <NewProjectForm />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePurchase;