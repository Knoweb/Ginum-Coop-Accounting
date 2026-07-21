import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import {
  FaTachometerAlt,
  FaBuilding,
  FaList,
  FaCog,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";

const SuperAdminSideBar = ({ isCollapsed }) => {
  const [openCompany, setOpenCompany] = useState(false);
  const [openRequests, setOpenRequests] = useState(false);
  const [activePage, setActivePage] = useState("dashboard"); // Default to dashboard
  const navigate = useNavigate(); // Initialize navigate

  // Function to handle logout
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };
  return (
    <div className="flex">
      {/* Sidebar */}
      <div
        className={`h-screen bg-white transition-all duration-300 flex flex-col fixed ${
          isCollapsed ? "w-20" : "w-64"
        } px-4 py-5`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <img
            src="/ginum_logo.png"
            alt="Ginum Logo"
            className={`${isCollapsed ? "w-10" : "w-full"} h-auto`}
          />
        </div>

        {/* Dashboard */}
        <div className="mb-6 mt-4">
          <button
            className="flex items-center justify-center w-full p-3 text-white bg-blue-500 rounded-lg my-2"
            onClick={() => {
              navigate("/super-admin/dashboard");
              setActivePage("dashboard");
            }}
          >
            {!isCollapsed && "Dashboard"}
          </button>
        </div>

        {/* Admin Pages */}
        <div className="mb-6">
          {!isCollapsed && (
            <h2 className="text-gray-400 text-sm mb-3">ADMIN PAGES</h2>
          )}

          {/* Company */}
          <button
            className="flex items-center w-full p-3 text-gray-700 hover:bg-blue-500 hover:text-white rounded-lg my-2"
            onClick={() => setOpenCompany(!openCompany)}
          >
            <FaBuilding className="mr-3" />
            {!isCollapsed && "Company"}
            {!isCollapsed && (
              <span className="ml-auto">
                {openCompany ? <FaChevronDown /> : <FaChevronRight />}
              </span>
            )}
          </button>

          {/* Dropdown for Company */}
          {openCompany && !isCollapsed && (
            <div className="pl-6">
              <button
                className={`w-full text-left p-2 my-1 ${
                  activePage === "companies" ? "text-blue-500" : "text-gray-600"
                } hover:text-blue-500`}
                onClick={() => {
                  navigate("/super-admin/companies");
                  setActivePage("companies");
                }}
              >
                All Companies
              </button>
            </div>
          )}

          {/* Requests */}
          <button
            className="flex items-center w-full p-3 text-gray-700 hover:bg-blue-500 hover:text-white rounded-lg my-2"
            onClick={() => setOpenRequests(!openRequests)}
          >
            <FaList className="mr-3" />
            {!isCollapsed && "Requests"}
            {!isCollapsed && (
              <span className="ml-auto">
                {openRequests ? <FaChevronDown /> : <FaChevronRight />}
              </span>
            )}
          </button>

          {/* Dropdown for Requests */}
          {openRequests && !isCollapsed && (
            <div className="pl-6">
              <button
                className={`w-full text-left p-2 my-1 ${
                  activePage === "requests" ? "text-blue-500" : "text-gray-600"
                } hover:text-blue-500`}
                onClick={() => {
                  navigate("/super-admin/requests");
                  setActivePage("requests");
                }}
              >
                Requested Companies
              </button>
            </div>
          )}
        </div>

        {/* Additional */}
        <div className="mt-auto">
          {!isCollapsed && (
            <h2 className="text-gray-400 text-sm mb-3">ADDITIONAL</h2>
          )}

          {/* Reset Password (Only text highlighted) */}
          <button
            className="flex items-center w-full p-3 text-gray-700 hover:bg-gray-100 rounded-lg my-2"
            onClick={() => {
              navigate("/super-admin/reset-password");
              setActivePage("reset-password");
            }}
          >
            <FaCog className="mr-3" />
            {!isCollapsed && (
              <span
                className={
                  activePage === "reset-password"
                    ? "text-blue-500"
                    : "text-gray-700"
                }
              >
                Reset Password
              </span>
            )}
          </button>

          {/* Logout (Text and icon in red) */}
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-3 hover:bg-gray-100 rounded-lg my-2"
          >
            <FaSignOutAlt className="mr-3 text-red-500" />
            {!isCollapsed && <span className="text-red-500">Logout</span>}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="ml-[calc(20rem)] sm:ml-[calc(16rem)] w-full overflow-auto h-screen">
        {/* Your content goes here */}
      </div>
    </div>
  );
};

export default SuperAdminSideBar;
