import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaBell, FaBars, FaUser, FaCog, FaSignOutAlt, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import PropTypes from "prop-types";
import { apiUrl } from "../../utils/api";
import { isCoopAccountingMode } from "../../config/coopMode";

const Header = ({ toggleSidebar, isSidebarVisible }) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [companyDetails, setCompanyDetails] = useState({
    name: "Knoweb PVT LTD",
    logo: null,
    role: "Admin"
  });

  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  // Load active company details and user details on mount
  useEffect(() => {
    const companyId = sessionStorage.getItem("companyId");
    const token = sessionStorage.getItem("auth_token") || sessionStorage.getItem("token");
    const role = sessionStorage.getItem("role") || "Admin";

    if (companyId && token) {
      fetch(`${apiUrl}/api/companies/${companyId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      })
        .then(res => {
          if (!res.ok) throw new Error("Failed to load company details");
          return res.json();
        })
        .then(data => {
          setCompanyDetails({
            name: data.companyName || "Knoweb PVT LTD",
            logo: data.companyLogoBase64 ? `data:image/png;base64,${data.companyLogoBase64}` : null,
            role: formatRole(role)
          });
        })
        .catch(err => {
          console.error("Error loading company details for header:", err);
          setCompanyDetails(prev => ({ ...prev, role: formatRole(role) }));
        });
    } else {
      setCompanyDetails(prev => ({ ...prev, role: formatRole(role) }));
    }
  }, []);

  const formatRole = (roleStr) => {
    if (!roleStr) return "User";
    return roleStr
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  // Function to handle logout
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  // Function to close the sidebar on mobile/tablet screens
  const handleSidebarOnResize = () => {
    const isMobileOrTablet = window.matchMedia("(max-width: 1024px)").matches;
    if (isMobileOrTablet && isSidebarVisible) {
      toggleSidebar();
    }
  };

  useEffect(() => {
    handleSidebarOnResize();
    window.addEventListener("resize", handleSidebarOnResize);

    return () => {
      window.removeEventListener("resize", handleSidebarOnResize);
    };
  }, []);

  // Handle clicks outside the dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      className={`bg-white border-b border-gray-150 px-6 py-3.5 flex justify-between items-center fixed top-0 ${
        isSidebarVisible ? "left-72" : "left-0"
      } right-0 transition-all duration-300 z-50 h-16`}
    >
      {/* Sidebar Toggle Button */}
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer focus:outline-none"
        >
          <FaBars className="text-lg" />
        </button>

        {isCoopAccountingMode && (
          <div className="ml-4 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
            Coop Accounting Mode
          </div>
        )}
      </div>

      {/* Right User Bar / Notifications Section */}
      <div className="flex items-center space-x-5">
        
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
            className="relative text-gray-500 hover:text-gray-800 p-2.5 hover:bg-gray-50 rounded-xl transition cursor-pointer focus:outline-none"
          >
            <FaBell className="text-lg" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotificationDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl shadow-xl shadow-gray-200/50 bg-white border border-gray-150 py-2.5 z-50 animate-fade-down">
              <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-800 text-xs uppercase tracking-wider">Notifications</span>
              </div>
              <div className="py-2.5 max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-xs ${n.read ? "text-gray-500" : "text-gray-800 font-medium"}`}
                    >
                      {n.text}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 px-4 text-center space-y-2">
                    <FaCheckCircle className="text-emerald-500 text-2xl" />
                    <div>
                      <p className="text-xs font-bold text-gray-800">All caught up!</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">No new notifications at this time.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center space-x-3 p-1.5 hover:bg-gray-50 rounded-xl transition cursor-pointer focus:outline-none"
          >
            {companyDetails.logo ? (
              <img
                src={companyDetails.logo}
                alt="Company Logo"
                className="w-8.5 h-8.5 rounded-xl object-cover border border-gray-200"
              />
            ) : (
              <div className="w-8.5 h-8.5 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-100 flex items-center justify-center text-sm uppercase">
                {companyDetails.name.substring(0, 2)}
              </div>
            )}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-gray-850 truncate max-w-[120px]">
                {companyDetails.name}
              </span>
              <span className="text-[10px] font-semibold text-gray-450 tracking-wider uppercase mt-0.5">
                {companyDetails.role}
              </span>
            </div>
          </button>

          {/* Profile Dropdown Panel */}
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl shadow-xl shadow-gray-200/50 bg-white border border-gray-150 py-1.5 z-50 animate-fade-down">
              <div className="py-1">
                <Link to="/profile" onClick={() => setIsProfileDropdownOpen(false)}>
                  <button className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-blue-50/50 hover:text-blue-700 font-semibold flex items-center gap-2.5 transition cursor-pointer">
                    <FaUser className="text-sm opacity-60" /> My Profile
                  </button>
                </Link>
                <Link to="/settings" onClick={() => setIsProfileDropdownOpen(false)}>
                  <button className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-blue-50/50 hover:text-blue-700 font-semibold flex items-center gap-2.5 transition cursor-pointer">
                    <FaCog className="text-sm opacity-60" /> Account Settings
                  </button>
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold flex items-center gap-2.5 transition cursor-pointer"
                >
                  <FaSignOutAlt className="text-base opacity-80" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-gray-150 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <FaExclamationTriangle className="text-2xl" />
              <h3 className="text-lg font-bold text-gray-800">Confirm Logout</h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Are you sure you want to log out of your session? You will need to enter your credentials to log back in.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-sm transition cursor-pointer"
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

Header.propTypes = {
  toggleSidebar: PropTypes.func.isRequired,
  isSidebarVisible: PropTypes.bool.isRequired,
};

export default Header;
