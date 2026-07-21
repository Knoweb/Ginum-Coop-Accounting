import React, { useEffect, useState } from "react";
import { Search, Plus, RefreshCw } from "lucide-react";

import InventoryTable from "./InventoryTable";
import {
  Toast,
  ItemModal,
  StockModal,
  DeleteItemModal,
} from "./InventoryModals";

import { apiUrl as API_BASE_URL } from "../../utils/api";

const emptyItemForm = {
  itemCode: "",
  itemName: "",
  category: "",
  itemType: "SALES_ITEM",
  description: "",
  purchasePrice: "",
  unitPrice: "",
  currentStock: "",
  reorderLevel: "",
  unit: "",
  active: true,
};

const InventoryDashboard = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);

  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockModalType, setStockModalType] = useState("add");
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockNotes, setStockNotes] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  const [saving, setSaving] = useState(false);
  const [stockSaving, setStockSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    type: "",
    message: "",
  });

  const getCompanyId = () => sessionStorage.getItem("companyId");
  const getToken = () => sessionStorage.getItem("auth_token");

  const showToast = (type, message) => {
    setToast({ show: true, type, message });

    setTimeout(() => {
      setToast({ show: false, type: "", message: "" });
    }, 3000);
  };

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

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");

      const companyId = checkAuth();

      const response = await fetch(
        `${API_BASE_URL}/api/companies/${companyId}/items`,
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
      console.log("Items API Response:", data);

      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch items:", err);
      setError("Failed to fetch items. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openAddModal = () => {
    setItemForm(emptyItemForm);
    setEditingItemId(null);
    setModalMode("add");
    setItemModalOpen(true);
  };

  const openEditModal = (item) => {
    setModalMode("edit");
    setEditingItemId(item.itemId);

    setItemForm({
      itemCode: item.itemCode || "",
      itemName: item.name || "",
      category: item.category || "",
      itemType: item.itemType || "SALES_ITEM",
      description: item.description || "",
      purchasePrice: item.purchasePrice ?? "",
      unitPrice: item.unitPrice ?? "",
      currentStock: item.currentStock ?? "",
      reorderLevel: item.reorderLevel ?? "",
      unit: item.unit || "",
      active: item.active !== false,
    });

    setItemModalOpen(true);
  };

  const closeItemModal = () => {
    setItemModalOpen(false);
    setItemForm(emptyItemForm);
    setEditingItemId(null);
  };

  const openStockModal = (type, item) => {
    setStockModalType(type);
    setSelectedStockItem(item);
    setStockQuantity("");
    setStockNotes("");
    setStockModalOpen(true);
  };

  const closeStockModal = () => {
    setStockModalOpen(false);
    setSelectedStockItem(null);
    setStockQuantity("");
    setStockNotes("");
  };

  const openDeleteModal = (item) => {
    setDeletingItem(item);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeletingItem(null);
    setDeleteModalOpen(false);
  };

  const buildItemPayload = () => ({
    itemCode: itemForm.itemCode.trim(),
    name: itemForm.itemName.trim(),
    category: itemForm.category.trim(),
    itemType: itemForm.itemType,
    description: itemForm.description.trim(),
    purchasePrice: Number(itemForm.purchasePrice || 0),
    unitPrice: Number(itemForm.unitPrice),
    currentStock: Number(itemForm.currentStock || 0),
    reorderLevel: Number(itemForm.reorderLevel || 0),
    unit: itemForm.unit.trim(),
    active: itemForm.active,
  });

  const handleSaveItem = async (e) => {
    e.preventDefault();

    if (!itemForm.itemName.trim()) {
      showToast("error", "Item name is required.");
      return;
    }

    if (!itemForm.unitPrice || Number(itemForm.unitPrice) <= 0) {
      showToast("error", "Please enter a valid selling price.");
      return;
    }

    try {
      setSaving(true);

      const companyId = checkAuth();
      const payload = buildItemPayload();

      const url =
        modalMode === "add"
          ? `${API_BASE_URL}/api/companies/${companyId}/items`
          : `${API_BASE_URL}/api/companies/${companyId}/items/${editingItemId}`;

      const method = modalMode === "add" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Item save failed.");
      }

      showToast(
        "success",
        modalMode === "add"
          ? "Item added successfully!"
          : "Item updated successfully!"
      );

      closeItemModal();
      fetchItems();
    } catch (err) {
      console.error("Item save error:", err);
      showToast("error", "Item save failed. Please check the details.");
    } finally {
      setSaving(false);
    }
  };

  const handleStockUpdate = async () => {
    if (!selectedStockItem) {
      showToast("error", "No item selected.");
      return;
    }

    const qty = Number(stockQuantity);

    if (!qty || qty <= 0) {
      showToast("error", "Please enter a valid quantity.");
      return;
    }

    const availableStock = Number(selectedStockItem.currentStock || 0);

    if (stockModalType === "reduce" && qty > availableStock) {
      showToast("error", "Cannot reduce more than current stock.");
      return;
    }

    try {
      setStockSaving(true);

      const companyId = checkAuth();
      const itemId = selectedStockItem.itemId;

      const url =
        stockModalType === "add"
          ? `${API_BASE_URL}/api/companies/${companyId}/items/${itemId}/stock/add`
          : `${API_BASE_URL}/api/companies/${companyId}/items/${itemId}/stock/reduce`;

      const payload = {
        quantity: qty,
        notes: stockNotes.trim(),
      };

      const response = await fetch(url, {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Stock update failed.");
      }

      showToast(
        "success",
        stockModalType === "add"
          ? "Stock added successfully!"
          : "Stock reduced successfully!"
      );

      closeStockModal();
      fetchItems();
    } catch (err) {
      console.error("Stock update error:", err);
      showToast("error", "Stock update failed.");
      setStockSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingItem?.itemId) {
      showToast("error", "Item ID is missing.");
      return;
    }

    try {
      setDeleting(true);

      const companyId = checkAuth();

      const response = await fetch(
        `${API_BASE_URL}/api/companies/${companyId}/items/${deletingItem.itemId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (errorData && errorData.message) {
          throw new Error(errorData.message);
        }
        const errorText = await response.text();
        throw new Error(errorText || "Item delete failed.");
      }

      const data = await response.json().catch(() => null);
      let msg = "Item deleted successfully.";
      if (data && data.message) msg = data.message;

      showToast("success", msg);
      closeDeleteModal();
      fetchItems();
    } catch (err) {
      console.error("Item delete error:", err);
      showToast("error", err.message || "Item delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActiveItem = async (item) => {
    try {
      const companyId = checkAuth();
      const newStatus = item.active === false ? true : false;
      
      const response = await fetch(
        `${API_BASE_URL}/api/companies/${companyId}/items/${item.itemId}/active?active=${newStatus}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update active status");
      }

      showToast("success", `Item ${newStatus ? "activated" : "deactivated"} successfully!`);
      fetchItems();
    } catch (err) {
      console.error("Status update error:", err);
      showToast("error", "Failed to update item status.");
    }
  };

  const filteredItems = items.filter((item) => {
    const text = searchTerm.toLowerCase();

    return (
      (item.itemCode || "").toLowerCase().includes(text) ||
      (item.name || "").toLowerCase().includes(text) ||
      (item.category || "").toLowerCase().includes(text) ||
      (item.itemType || "").toLowerCase().includes(text) ||
      (item.description || "").toLowerCase().includes(text) ||
      (item.unit || "").toLowerCase().includes(text) ||
      String(item.unitPrice || "").includes(text) ||
      String(item.currentStock || "").includes(text)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-4 mt-6">
        <p className="font-bold">Error</p>
        <p>{error}</p>

        <button
          type="button"
          onClick={fetchItems}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <Toast
        toast={toast}
        onClose={() => setToast({ show: false, type: "", message: "" })}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Inventory Dashboard
          </h1>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-gray-400" size={18} />
              </div>

              <input
                type="text"
                placeholder="Search items..."
                className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={16} /> Add Item
            </button>

            <button
              type="button"
              onClick={fetchItems}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        <InventoryTable
          items={items}
          filteredItems={filteredItems}
          onAddItem={openAddModal}
          onEditItem={openEditModal}
          onOpenStock={openStockModal}
          onDeleteItem={openDeleteModal}
          onToggleActive={handleToggleActiveItem}
        />
      </div>

      <ItemModal
        open={itemModalOpen}
        modalMode={modalMode}
        form={itemForm}
        setForm={setItemForm}
        saving={saving}
        onClose={closeItemModal}
        onSubmit={handleSaveItem}
      />

      <StockModal
        open={stockModalOpen}
        type={stockModalType}
        item={selectedStockItem}
        quantity={stockQuantity}
        setQuantity={setStockQuantity}
        notes={stockNotes}
        setNotes={setStockNotes}
        saving={stockSaving}
        onClose={closeStockModal}
        onSubmit={handleStockUpdate}
      />

      <DeleteItemModal
        open={deleteModalOpen}
        item={deletingItem}
        deleting={deleting}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteItem}
      />
    </>
  );
};

export default InventoryDashboard;