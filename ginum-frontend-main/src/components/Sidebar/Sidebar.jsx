import { useLocation, useNavigate } from "react-router-dom";
import { navItems } from "../../config/navigation";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";

const Sidebar = ({ isVisible }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedTabs, setExpandedTabs] = useState(() => {
    const currentMainPath = location.pathname.split("/")[1];
    return new Set([currentMainPath]);
  });

  const activeItemRef = useRef(null);

  const toggleExpanded = (tabId, hasSubItems) => {
    if (!hasSubItems) return; // Prevent expanding if there are no sub-items

    setExpandedTabs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tabId)) {
        newSet.delete(tabId);
      } else {
        newSet.add(tabId);
      }
      return newSet;
    });
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Scroll to the active item when the location changes
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [location.pathname]);

  return (
    <div
      className={`bg-gray-50 min-h-screen px-1.5 w-72 fixed left-0 top-0 
            transition-transform duration-700 ${
              isVisible ? "translate-x-0" : "-translate-x-full"
            } max-h-screen overflow-y-auto z-50`}
    >
      <div className="sticky top-0 shadow px-10 bg-gray-50 z-10 py-3">
        <a href="/">
          <div className="flex items-center justify-center">
            <img src="/ginum_logo.png" alt="Ginum" className="w-101 h-12" />
          </div>
        </a>
      </div>

      <nav className="mt-6 mb-10">
        <ul className="space-y-4">
          {navItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            // Render section titles
            if (item.sectionTitle) {
              return (
                <h4
                  key={item.sectionTitle}
                  className="px-6 text-gray-400 font-semibold mt-4"
                >
                  {item.sectionTitle}
                </h4>
              );
            }
            return (
              <div key={item.id}>
                <h4 className="px-6 text-gray-600 font-semibold mt-4">
                  {item.sectionTitle}
                </h4>

                <li>
                  <button
                    ref={
                      location.pathname.startsWith(item.path)
                        ? activeItemRef
                        : null
                    }
                    onClick={() => {
                      handleNavigation(item.path);
                      toggleExpanded(item.id, hasSubItems);
                    }}
                    className={`w-full flex items-center justify-between px-6 py-2 
                                      rounded-2xl text-gray-700 hover:bg-sky-200 cursor-pointer ${
                                        location.pathname.startsWith(item.path)
                                          ? "bg-sky-500 text-white hover:bg-sky-500"
                                          : ""
                                      }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="text-lg mr-4" />
                      <span className="font-semibold">{item.label}</span>
                    </div>
                    {hasSubItems && (
                      <div
                        className={`transform transition-transform duration-500 ease-in-out ${
                          expandedTabs.has(item.id) ? "rotate-180" : "rotate-0"
                        }`}
                      >
                        {expandedTabs.has(item.id) ? (
                          <FaChevronUp className="text-sm" />
                        ) : (
                          <FaChevronDown className="text-sm" />
                        )}
                      </div>
                    )}
                  </button>

                  {/* Sub-items */}
                  {hasSubItems && (
                    <ul
                      className={`ml-12 mt-2 space-y-2 overflow-hidden transition-all duration-700 ease-in-out`}
                      style={{
                        maxHeight: expandedTabs.has(item.id) ? "1000px" : "0",
                        opacity: expandedTabs.has(item.id) ? "1" : "0",
                        paddingBottom: expandedTabs.has(item.id) ? "20px" : "0",
                        paddingTop: expandedTabs.has(item.id) ? "10px" : "0",
                      }}
                    >
                      {expandedTabs.has(item.id) &&
                        item.subItems.map((subItem) => (
                          <li key={subItem.id}>
                            <button
                              ref={
                                location.pathname === subItem.path
                                  ? activeItemRef
                                  : null
                              }
                              onClick={() => handleNavigation(subItem.path)}
                              className={`w-full text-left px-4 py-2 rounded-lg 
                                                        text-gray-600 hover:bg-sky-100 ${
                                                          location.pathname ===
                                                          subItem.path
                                                            ? "bg-sky-100 text-sky-600 font-medium"
                                                            : ""
                                                        }`}
                            >
                              <span className="font-semibold">
                                {subItem.label}
                              </span>
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </li>
              </div>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
