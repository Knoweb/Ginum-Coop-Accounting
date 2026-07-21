import React, { useState } from "react";
import { FaUser, FaBuilding, FaUserTie } from "react-icons/fa";
import AddCustomerForm from "../customer/AddCustomer"; 
import AddSupplierForm from "../supplier/AddSupplierForm";
import AddEmployeeForm from "../Employee/AddEmployeeForm";

const PayerPayee = ({ onClose, allowedTabs = ["customer", "supplier", "employee"] }) => {
  
  const [activeTab, setActiveTab] = useState(allowedTabs[0]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="bg-white rounded-lg shadow-xl w-full overflow-hidden">
      <div className="flex justify-between items-center border-b p-4 bg-gray-50">
        <h2 className="section-title">Create New Contact</h2>
      </div>

      <div className="border-b">
        <div className="flex">
          {/* Customer Tab - allowedTabs හි ඇත්නම් පමණක් පෙන්වන්න */}
          {allowedTabs.includes("customer") && (
            <button
              type="button"
              onClick={() => handleTabChange("customer")}
              className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === "customer" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <FaUser className="inline mr-2" /> Customer
            </button>
          )}

          {/* Supplier Tab */}
          {allowedTabs.includes("supplier") && (
            <button
              type="button"
              onClick={() => handleTabChange("supplier")}
              className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === "supplier" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <FaBuilding className="inline mr-2" /> Supplier
            </button>
          )}

          {/* Employee Tab */}
          {allowedTabs.includes("employee") && (
            <button
              type="button"
              onClick={() => handleTabChange("employee")}
              className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === "employee" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <FaUserTie className="inline mr-2" /> Employee
            </button>
          )}
        </div>
      </div>

      <div className="p-2 max-h-[70vh] overflow-y-auto">
        {activeTab === "customer" && <AddCustomerForm onClose={onClose} />}
        {activeTab === "supplier" && <AddSupplierForm onClose={onClose} />}
        {activeTab === "employee" && <AddEmployeeForm onClose={onClose} />}
      </div>
    </div>
  );
};

export default PayerPayee;