import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaCog,
  FaLock,
  FaBell,
  FaGlobe,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaArrowRight,
  FaExclamationTriangle,
  FaSignOutAlt
} from "react-icons/fa";
import { apiUrl } from "../../utils/api";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState(null);
  
  // Status states
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // System Preferences states (stored in localStorage)
  const [systemPrefs, setSystemPrefs] = useState({
    currency: "USD",
    dateFormat: "YYYY-MM-DD",
    numberFormat: "1,234,567.89"
  });

  // Notification Preferences states (stored in localStorage)
  const [notifPrefs, setNotifPrefs] = useState({
    emailNotif: true,
    paymentReminders: true,
    systemAlerts: false,
    reportUpdates: true
  });

  // Change Password states
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Load preferences from localStorage and profile details from API
  useEffect(() => {
    // 1. Fetch system preferences
    const savedCurrency = localStorage.getItem("pref_currency") || "USD";
    const savedDate = localStorage.getItem("pref_date_format") || "YYYY-MM-DD";
    const savedNumber = localStorage.getItem("pref_number_format") || "1,234,567.89";
    setSystemPrefs({
      currency: savedCurrency,
      dateFormat: savedDate,
      numberFormat: savedNumber
    });

    // 2. Fetch notifications preferences
    const savedEmailNotif = localStorage.getItem("pref_notif_email") !== "false";
    const savedPayments = localStorage.getItem("pref_notif_payments") !== "false";
    const savedAlerts = localStorage.getItem("pref_notif_alerts") === "true";
    const savedReports = localStorage.getItem("pref_notif_reports") !== "false";
    setNotifPrefs({
      emailNotif: savedEmailNotif,
      paymentReminders: savedPayments,
      systemAlerts: savedAlerts,
      reportUpdates: savedReports
    });

    // 3. Fetch user profile info
    const token = sessionStorage.getItem("auth_token") || sessionStorage.getItem("token");
    if (token) {
      fetch(`${apiUrl}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load user profile");
          return res.json();
        })
        .then((data) => {
          setProfile(data);
        })
        .catch((err) => {
          console.error("Error loading profile for settings:", err);
          setErrorMsg("Could not load user profile metadata.");
        })
        .finally(() => {
          setLoadingProfile(false);
        });
    } else {
      setLoadingProfile(false);
    }
  }, []);

  // Save System Preferences
  const handleSaveSystemPrefs = (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      localStorage.setItem("pref_currency", systemPrefs.currency);
      localStorage.setItem("pref_date_format", systemPrefs.dateFormat);
      localStorage.setItem("pref_number_format", systemPrefs.numberFormat);
      
      setSuccessMsg("System preferences updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg("Failed to save system preferences.");
    } finally {
      setSaving(false);
    }
  };

  // Save Notification Preferences
  const handleSaveNotifPrefs = (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      localStorage.setItem("pref_notif_email", notifPrefs.emailNotif);
      localStorage.setItem("pref_notif_payments", notifPrefs.paymentReminders);
      localStorage.setItem("pref_notif_alerts", notifPrefs.systemAlerts);
      localStorage.setItem("pref_notif_reports", notifPrefs.reportUpdates);

      setSuccessMsg("Notification preferences updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg("Failed to save notification preferences.");
    } finally {
      setSaving(false);
    }
  };

  // Change Password Submission
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setErrorMsg("All password fields are required.");
      return;
    }
    if (passwordForm.newPassword.length < 7) {
      setErrorMsg("New password must be at least 7 characters long.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMsg("New password and confirmation password do not match.");
      return;
    }

    try {
      setSaving(true);
      const token = sessionStorage.getItem("auth_token") || sessionStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users/profile/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password. Please check credentials.");
      }

      setSuccessMsg("Password updated successfully!");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  // Format roles
  const formatRole = (roleStr) => {
    if (!roleStr) return "";
    return roleStr
      .replace("ROLE_", "")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const tabs = [
    { id: "general", label: "System Preferences", icon: FaGlobe },
    { id: "security", label: "Security & Passwords", icon: FaLock },
    { id: "notifications", label: "Notifications", icon: FaBell },
    { id: "account", label: "Account Info", icon: FaUser },
    { id: "danger", label: "Danger Zone", icon: FaExclamationTriangle }
  ];

  return (
    <div className="p-6 sm:p-8 bg-gray-50 min-h-screen space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FaCog className="text-blue-600 text-2xl" />
          Account Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Configure system formats, update credentials, and manage your account preference
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-4.5 shadow-sm h-fit space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-xl transition cursor-pointer text-left ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-500 hover:bg-gray-55 hover:text-gray-850"
                }`}
              >
                <Icon className="text-base" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Success and Error Alerts */}
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
              <FaTimes className="text-red-500" />
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-755 rounded-xl text-sm font-medium flex items-center gap-2">
              <FaCheck className="text-emerald-500" />
              {successMsg}
            </div>
          )}

          {/* TAB 1: System Preferences */}
          {activeTab === "general" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-850">System Preferences</h3>
                <p className="text-sm text-gray-405 mt-1">
                  Adjust default formatting units for financial records, dates, and reports.
                </p>
              </div>

              <form onSubmit={handleSaveSystemPrefs} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* Currency Select */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-600">Default Currency</label>
                    <select
                      value={systemPrefs.currency}
                      onChange={(e) => setSystemPrefs({ ...systemPrefs, currency: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl bg-white focus:border-blue-500 focus:outline-none text-base transition"
                    >
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                      <option value="LKR">LKR (Rs) - Sri Lankan Rupee</option>
                      <option value="AUD">AUD ($) - Australian Dollar</option>
                    </select>
                  </div>

                  {/* Date Format Select */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-600">Date Format</label>
                    <select
                      value={systemPrefs.dateFormat}
                      onChange={(e) => setSystemPrefs({ ...systemPrefs, dateFormat: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl bg-white focus:border-blue-500 focus:outline-none text-base transition"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-07-02)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 02/07/2026)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 07/02/2026)</option>
                    </select>
                  </div>

                  {/* Number Format Select */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-600">Number Format</label>
                    <select
                      value={systemPrefs.numberFormat}
                      onChange={(e) => setSystemPrefs({ ...systemPrefs, numberFormat: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl bg-white focus:border-blue-500 focus:outline-none text-base transition"
                    >
                      <option value="1,234,567.89">1,234,567.89 (Standard US)</option>
                      <option value="1.234.567,89">1.234.567,89 (European)</option>
                    </select>
                  </div>

                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-bold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {saving ? <FaSpinner className="animate-spin" /> : <FaCheck />} Save Preferences
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Security & Passwords */}
          {activeTab === "security" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-855">Security Settings</h3>
                <p className="text-sm text-gray-405 mt-1">
                  Ensure your account credentials remain private and secure by updating passwords routinely.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-600 block">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-base transition"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-600 block">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-base transition"
                      placeholder="Min 7 chars"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-600 block">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-base transition"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl text-sm font-bold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {saving ? <FaSpinner className="animate-spin" /> : <FaLock />} Update Password
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: Notifications Settings */}
          {activeTab === "notifications" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-855">Notification Settings</h3>
                <p className="text-sm text-gray-405 mt-1">
                  Manage alerts you receive concerning invoice payments, logs, and billing reports.
                </p>
              </div>

              <form onSubmit={handleSaveNotifPrefs} className="space-y-5">
                <div className="space-y-4">
                  
                  {/* Email Notifications Toggle */}
                  <div className="flex items-center justify-between p-4.5 bg-gray-50/50 border border-gray-100 rounded-2xl">
                    <div>
                      <p className="text-sm font-bold text-gray-800">Email Notifications</p>
                      <p className="text-xs text-gray-400 mt-1">Receive summary reports and logs via email.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifPrefs.emailNotif}
                        onChange={(e) => setNotifPrefs({ ...notifPrefs, emailNotif: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-150 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Payment Reminders Toggle */}
                  <div className="flex items-center justify-between p-4.5 bg-gray-50/50 border border-gray-100 rounded-2xl">
                    <div>
                      <p className="text-sm font-bold text-gray-800">Payment Reminders</p>
                      <p className="text-xs text-gray-400 mt-1">Receive warnings before billing deadlines pass.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifPrefs.paymentReminders}
                        onChange={(e) => setNotifPrefs({ ...notifPrefs, paymentReminders: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-150 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* System Alerts Toggle */}
                  <div className="flex items-center justify-between p-4.5 bg-gray-50/50 border border-gray-100 rounded-2xl">
                    <div>
                      <p className="text-sm font-bold text-gray-800">System Alerts</p>
                      <p className="text-xs text-gray-400 mt-1">Receive notification alerts for login updates and system changes.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifPrefs.systemAlerts}
                        onChange={(e) => setNotifPrefs({ ...notifPrefs, systemAlerts: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-150 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Report Updates Toggle */}
                  <div className="flex items-center justify-between p-4.5 bg-gray-50/50 border border-gray-100 rounded-2xl">
                    <div>
                      <p className="text-sm font-bold text-gray-800">Report Updates</p>
                      <p className="text-xs text-gray-400 mt-1">Receive alerts when Trial Balance or Income Statements are recalculated.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifPrefs.reportUpdates}
                        onChange={(e) => setNotifPrefs({ ...notifPrefs, reportUpdates: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-150 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-bold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {saving ? <FaSpinner className="animate-spin" /> : <FaCheck />} Save Preferences
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: Account Information */}
          {activeTab === "account" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-855">Account Information</h3>
                <p className="text-sm text-gray-405 mt-1">
                  Metadata concerning corporate definitions and organizational user roles.
                </p>
              </div>

              {loadingProfile ? (
                <div className="flex items-center justify-center py-6">
                  <FaSpinner className="animate-spin text-xl text-blue-600" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Account Name</span>
                      <p className="text-base font-semibold text-gray-855 mt-1">{profile?.name || "-"}</p>
                    </div>
                    <div>
                      <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Email Address</span>
                      <p className="text-base font-semibold text-gray-855 mt-1">{profile?.email || "-"}</p>
                    </div>
                    <div>
                      <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">User Role</span>
                      <p className="text-base font-semibold text-gray-855 mt-1">{formatRole(profile?.role) || "-"}</p>
                    </div>
                    <div>
                      <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Account Status</span>
                      <p className="text-base font-semibold text-emerald-600 mt-1">{profile?.status || "Active"}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-5 flex justify-end">
                    <Link to="/profile">
                      <button className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700 text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
                        Edit Full Profile <FaArrowRight />
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Danger Zone */}
          {activeTab === "danger" && (
            <div className="bg-rose-50/20 border border-rose-100 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-rose-800 flex items-center gap-2">
                  <FaExclamationTriangle />
                  Danger Zone
                </h3>
                <p className="text-sm text-rose-600/70 mt-1">
                  Actions here can affect account authorization. Please proceed with caution.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4.5 bg-white border border-rose-100 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Exit and Terminate Session</h4>
                    <p className="text-xs text-gray-400 mt-1">Clears authentication tokens and log out of the console.</p>
                  </div>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FaSignOutAlt /> Log Out Now
                  </button>
                </div>
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
            <p className="text-sm text-gray-550 leading-relaxed">
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

export default SettingsPage;
