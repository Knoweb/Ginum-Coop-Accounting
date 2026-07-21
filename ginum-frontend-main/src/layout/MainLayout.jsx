import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Topbar/Header";
import Sidebar from "../components/Sidebar/Sidebar";
import TabHeader from "../components/TabHeader/TabHeader";

const MainLayout = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <Sidebar isVisible={isSidebarVisible} />

      {/* Main Content */}
      <div
        className={`flex flex-col flex-1 h-full min-w-0 transition-all duration-300 ${
          isSidebarVisible ? "lg:ml-72 ml-0" : "md:ml-1 ml-0"
        }`}
      >
        {/* Header with Fixed Height */}
        <Header
          toggleSidebar={toggleSidebar}
          isSidebarVisible={isSidebarVisible}
        />

        {/* Tab Header */}
        <TabHeader pathname={location.pathname} />

        {/* Main Content Area */}
        <main className="flex-1 bg-gray-100 w-full overflow-auto mt-[4rem]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
