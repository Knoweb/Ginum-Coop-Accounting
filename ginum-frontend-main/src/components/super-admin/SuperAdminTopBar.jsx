import React from "react";
import { FiMenu } from "react-icons/fi";

const SuperAdminTopBar = ({ onToggle }) => {
  return (
    <div className="w-full bg-white p-4 flex items-center transition-all sticky top-0 z-50">
      {/* Hamburger Menu */}
      <button onClick={onToggle} className="text-gray-700 text-2xl">
        <FiMenu />
      </button>
    </div>
  );
};

export default SuperAdminTopBar;
