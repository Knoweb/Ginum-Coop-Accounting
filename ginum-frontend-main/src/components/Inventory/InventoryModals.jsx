import React from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

export const Toast = ({ toast, onClose }) => {
  if (!toast.show) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999]">
      <div
        className={`min-w-[280px] max-w-sm px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 border ${
          toast.type === "success"
            ? "bg-green-50 border-green-300 text-green-800"
            : "bg-red-50 border-red-300 text-red-800"
        }`}
      >
        <div className="mt-1">
          {toast.type === "success" ? (
            <CheckCircle className="text-green-600" size={18} />
          ) : (
            <AlertCircle className="text-red-600" size={18} />
          )}
        </div>

        <div className="flex-1">
          <p className="font-semibold">
            {toast.type === "success" ? "Success" : "Error"}
          </p>
          <p className="text-sm">{toast.message}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export const ItemModal = ({
  open,
  modalMode,
  form,
  setForm,
  saving,
  onClose,
  onSubmit,
}) => {
  if (!open) return null;

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          {modalMode === "add" ? "Add New Item" : "Edit Item"}
        </h3>

        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-3">
              <label className="block text-gray-700 font-medium mb-1">
                Item Code
              </label>
              <input
                type="text"
                value={form.itemCode}
                onChange={(e) => updateField("itemCode", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="ITM-001"
              />
            </div>

            <div className="mb-3">
              <label className="block text-gray-700 font-medium mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.itemName}
                onChange={(e) => updateField("itemName", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter item name"
                required
              />
            </div>

            <div className="mb-3">
              <label className="block text-gray-700 font-medium mb-1">
                Category
              </label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Stationery, Raw Material..."
              />
            </div>

            <div className="mb-3">
              <label className="block text-gray-700 font-medium mb-1">
                Item Type
              </label>
              <select
                value={form.itemType}
                onChange={(e) => updateField("itemType", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="SALES_ITEM">Sales Item</option>
                <option value="RAW_MATERIAL">Raw Material</option>
                <option value="BOTH">Both</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-gray-700 font-medium mb-1">
                Purchase Price
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.purchasePrice}
                onChange={(e) => updateField("purchasePrice", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div className="mb-3">
              <label className="block text-gray-700 font-medium mb-1">
                Selling Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={form.unitPrice}
                onChange={(e) => updateField("unitPrice", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                required
              />
            </div>

            <div className="mb-3">
              <label className="block text-gray-700 font-medium mb-1">
                Current Stock
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.currentStock}
                onChange={(e) => updateField("currentStock", e.target.value)}
                disabled={modalMode === "edit"}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="0"
              />
            </div>

            <div className="mb-3">
              <label className="block text-gray-700 font-medium mb-1">
                Reorder Level
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.reorderLevel}
                onChange={(e) => updateField("reorderLevel", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div className="mb-3">
              <label className="block text-gray-700 font-medium mb-1">
                Unit
              </label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => updateField("unit", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="pcs, kg, box, hours"
              />
            </div>

            <div className="mb-3 flex items-center gap-2 mt-8">
              <input
                id="active"
                type="checkbox"
                checked={form.active}
                onChange={(e) => updateField("active", e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="active" className="text-gray-700 font-medium">
                Active item
              </label>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 font-medium mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {saving
                ? "Saving..."
                : modalMode === "add"
                ? "Save Item"
                : "Update Item"}
            </button>
          </div>
        </form>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export const StockModal = ({
  open,
  type,
  item,
  quantity,
  setQuantity,
  notes,
  setNotes,
  saving,
  onClose,
  onSubmit,
}) => {
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <h3 className="text-xl font-semibold mb-4">
          {type === "add" ? "Add Stock" : "Reduce Stock"}
        </h3>

        <div className="mb-3">
          <label className="block text-gray-700 font-medium mb-1">Item</label>
          <input
            type="text"
            value={item.name || ""}
            disabled
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
          />
        </div>

        <div className="mb-3">
          <label className="block text-gray-700 font-medium mb-1">
            Current Stock
          </label>
          <input
            type="text"
            value={`${Number(item.currentStock || 0)} ${item.unit || ""}`}
            disabled
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
          />
        </div>

        <div className="mb-3">
          <label className="block text-gray-700 font-medium mb-1">
            Quantity to {type === "add" ? "Add" : "Reduce"}
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Enter quantity"
          />
        </div>

        <div className="mb-3">
          <label className="block text-gray-700 font-medium mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder={
              type === "add"
                ? "Supplier purchase, opening adjustment..."
                : "Damaged, used, correction..."
            }
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className={`px-4 py-2 rounded text-white disabled:bg-gray-400 disabled:cursor-not-allowed ${
              type === "add"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-yellow-600 hover:bg-yellow-700"
            } transition`}
          >
            {saving ? "Saving..." : type === "add" ? "Add Stock" : "Reduce Stock"}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export const DeleteItemModal = ({
  open,
  item,
  deleting,
  onClose,
  onConfirm,
}) => {
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <h3 className="text-xl font-semibold mb-2 text-gray-900">
          Deactivate Item
        </h3>

        <p className="text-gray-600 mb-6">
          Are you sure you want to deactivate{" "}
          <span className="font-semibold text-gray-900">{item.name}</span>?
        </p>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 rounded text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {deleting ? "Deactivating..." : "Deactivate"}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
    </div>
  );
};