import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import SuperAdminSideBar from "../components/super-admin/SuperAdminSideBar.jsx";
import SuperAdminTopBar from "../components/super-admin/SuperAdminTopBar.jsx";

function SuperAdminDashboard() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen">
      {/* Conditionally render the Sidebar */}
      {!isCollapsed && <SuperAdminSideBar isCollapsed={isCollapsed} />}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <SuperAdminTopBar onToggle={() => setIsCollapsed(!isCollapsed)} />

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-gray-100">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;