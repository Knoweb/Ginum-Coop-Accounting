import React from "react";
import { FiPower } from "react-icons/fi";
import {
  Package,
  Pencil,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
} from "lucide-react";

const formatAmount = (amount) => {
  const value = Number(amount || 0);

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatText = (text) => {
  if (!text) return "-";

  return text
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStockStatus = (item) => {
  const stock = Number(item.currentStock || 0);
  const reorder = Number(item.reorderLevel || 0);

  if (stock <= 0) {
    return {
      label: "Out of Stock",
      className: "bg-red-100 text-red-700",
    };
  }

  if (reorder > 0 && stock <= reorder) {
    return {
      label: "Low Stock",
      className: "bg-yellow-100 text-yellow-700",
    };
  }

  return {
    label: "In Stock",
    className: "bg-green-100 text-green-700",
  };
};

const getStockValue = (item) => {
  const stock = Number(item.currentStock || 0);
  const purchase = Number(item.purchasePrice || 0);

  return stock * purchase;
};

const InventoryTable = ({
  items,
  filteredItems,
  onAddItem,
  onEditItem,
  onOpenStock,
  onDeleteItem,
  onToggleActive,
}) => {
  if (filteredItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
          <Package size={30} />
        </div>

        <p className="text-gray-600 text-lg">
          {items.length === 0 ? "No items found." : "No matching items found."}
        </p>

        <button
          type="button"
          onClick={onAddItem}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
        >
          <Plus size={16} /> Add New Item
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category / Type
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>

              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purchase Price
              </th>

              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Selling Price
              </th>

              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Value
              </th>

              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>

              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.map((item, index) => {
              const stockStatus = getStockStatus(item);

              return (
                <tr
                  key={item.itemId || index}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Package size={20} />
                      </div>

                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.name || "-"}
                        </div>

                        <div className="text-xs text-gray-500">
                          Code: {item.itemCode || "-"}
                        </div>

                        <div className="text-xs text-gray-500">
                          ID: {item.itemId || "-"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.category || "-"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatText(item.itemType)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {Number(item.currentStock || 0)} {item.unit || ""}
                    </div>

                    <div className="text-xs text-gray-500">
                      Reorder: {Number(item.reorderLevel || 0)}
                    </div>

                    <span
                      className={`inline-block mt-1 px-2 py-1 text-xs rounded-full font-semibold ${stockStatus.className}`}
                    >
                      {stockStatus.label}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    Rs. {formatAmount(item.purchasePrice)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                    Rs. {formatAmount(item.unitPrice)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                    Rs. {formatAmount(getStockValue(item))}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full font-semibold ${
                        item.active === false
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {item.active === false ? "Inactive" : "Active"}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEditItem(item)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenStock("add", item)}
                        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg"
                        title="Add Stock"
                      >
                        <ArrowUpCircle size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenStock("reduce", item)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg"
                        title="Reduce Stock"
                      >
                        <ArrowDownCircle size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleActive(item)}
                        className={`p-2 rounded-lg transition-colors ${
                          item.active === false
                            ? "text-emerald-600 hover:bg-emerald-50"
                            : "text-red-600 hover:bg-red-50"
                        }`}
                        title={item.active === false ? "Activate" : "Deactivate"}
                      >
                        <FiPower size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteItem(item)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 px-6 py-3 text-sm text-gray-600">
        Showing {filteredItems.length} of {items.length} items
      </div>
    </div>
  );
};

export default InventoryTable;