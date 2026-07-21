import React from "react";
import { FiX, FiFolder, FiHash, FiUser, FiCalendar, FiDollarSign } from "react-icons/fi";

const ViewProjectModal = ({ project, onClose }) => {
  const formatStatus = (status) => {
    if (!status) return "-";
    return status
      .toString()
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatPriority = (priority) => {
    if (!priority) return "-";
    return priority
      .toString()
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "WORKING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ACTIVE":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatAmount = (amount) => {
    const value = Number(amount || 0);
    return `Rs. ${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <FiFolder size={18} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Project Details</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Title / Code */}
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Project Name</span>
              <h2 className="section-title mt-0.5">{project.name || "-"}</h2>
              <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <FiHash size={14} />
                <span>{project.code || "-"}</span>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Grid of basic parameters */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              {/* Customer */}
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Customer</span>
                <div className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 mt-1">
                  <FiUser size={14} className="text-gray-400" />
                  <span>{project.customerName || "-"}</span>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Start Date</span>
                <div className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 mt-1">
                  <FiCalendar size={14} className="text-gray-400" />
                  <span>{project.startDate || "-"}</span>
                </div>
              </div>

              {/* Status */}
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Working Status</span>
                <div className="mt-1">
                  <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-bold border ${getStatusClass(project.workingStatus)}`}>
                    {formatStatus(project.workingStatus)}
                  </span>
                </div>
              </div>

              {/* Priority */}
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Priority</span>
                <div className="mt-1">
                  <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-bold border ${getPriorityClass(project.priority)}`}>
                    {formatPriority(project.priority)}
                  </span>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Cost section */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/40">
              <span className="text-xs font-semibold text-blue-900/60 uppercase tracking-wider block">Total Recorded Cost</span>
              <div className="text-2xl font-extrabold text-blue-950 flex items-center mt-1">
                <FiDollarSign className="text-blue-600 mr-0.5" size={22} />
                <span>{formatAmount(project.totalCost)}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Description</span>
              <p className="text-sm text-gray-700 mt-1.5 bg-gray-50 p-3 rounded-xl border border-gray-150 leading-relaxed max-h-32 overflow-y-auto">
                {project.description || "No description provided for this project."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-xl shadow-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewProjectModal;
