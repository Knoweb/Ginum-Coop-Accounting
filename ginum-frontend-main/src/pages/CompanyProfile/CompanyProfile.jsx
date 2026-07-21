import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaLock,
  FaShieldAlt,
  FaEdit,
  FaCheck,
  FaTimes,
  FaBuilding,
  FaIdCard,
  FaSpinner
} from "react-icons/fa";
import { apiUrl } from "../../utils/api";

const CompanyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    address: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const getHeaders = () => {
    const token = sessionStorage.getItem("auth_token") || sessionStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  };

  // Fetch User Profile on mount
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${apiUrl}/api/users/profile`, {
        method: "GET",
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error("Failed to load user profile details.");
      }

      const data = await response.json();
      setProfile(data);
      setEditForm({
        name: data.name || "",
        phone: data.phone || "",
        address: data.address || ""
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while fetching your profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Format role string for presentation
  const formatRole = (roleStr) => {
    if (!roleStr) return "";
    return roleStr
      .replace("ROLE_", "")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Save profile changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setError("Full Name is required.");
      return;
    }

    try {
      setSavingProfile(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${apiUrl}/api/users/profile`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error("Failed to update profile details.");
      }

      const updatedData = await response.json();
      setProfile(updatedData);
      setIsEditing(false);
      setSuccess("Profile details updated successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password submit handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordForm.oldPassword) {
      setPasswordError("Current password is required.");
      return;
    }
    if (!passwordForm.newPassword) {
      setPasswordError("New password is required.");
      return;
    }
    if (passwordForm.newPassword.length < 7) {
      setPasswordError("New password must be at least 7 characters long.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation password do not match.");
      return;
    }

    try {
      setUpdatingPassword(true);
      const response = await fetch(`${apiUrl}/api/users/profile/change-password`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password. Please check your credentials.");
      }

      setPasswordSuccess("Password updated successfully!");
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setTimeout(() => setPasswordSuccess(""), 4000);
    } catch (err) {
      console.error(err);
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
        <p className="text-sm font-semibold text-gray-500">Loading your profile details...</p>
      </div>
    );
  }

  const initials = profile?.name ? profile.name.substring(0, 2).toUpperCase() : "US";

  return (
    <div className="p-6 sm:p-8 bg-gray-55 min-h-screen space-y-8 max-w-7xl mx-auto">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FaUser className="text-blue-600 text-2xl" />
          My Profile
        </h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Manage your personal details, role definitions, and account password
        </p>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Card: Summary Box */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-5 h-fit">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-3xl flex items-center justify-center shadow-md">
            {initials}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-850">{profile?.name}</h2>
            <p className="text-base text-gray-500 mt-1">{profile?.email}</p>
          </div>

          <div className="w-full border-t border-gray-100 pt-4 flex flex-col space-y-3.5 text-left">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-gray-400 uppercase tracking-wider text-xs">Role</span>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg uppercase tracking-wider text-xs">
                {formatRole(profile?.role)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-gray-400 uppercase tracking-wider text-xs">Status</span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg uppercase tracking-wider text-xs">
                {profile?.status || "Active"}
              </span>
            </div>
            {profile?.joinedDate && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-400 uppercase tracking-wider text-xs">Joined Date</span>
                <span className="font-medium text-gray-600">{profile.joinedDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Cards: Information Forms */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Card 1: Personal Details */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4.5 border-b border-gray-100 flex justify-between items-center bg-gray-55/50">
              <h3 className="font-bold text-gray-850 text-lg flex items-center gap-2">
                <FaShieldAlt className="text-blue-500" />
                Profile Information
              </h3>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 text-gray-700 text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <FaEdit /> Edit Profile
                </button>
              )}
            </div>

            <div className="p-6">
              {/* Alert Boxes */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-750 rounded-xl text-sm font-medium flex items-center gap-2">
                  <FaTimes className="text-red-500" />
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-755 rounded-xl text-sm font-medium flex items-center gap-2">
                  <FaCheck className="text-emerald-500" />
                  {success}
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-600 block">Full Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-base transition"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-600 block">Phone Number</label>
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-base transition"
                        placeholder="077XXXXXXXX"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-600 block">Address</label>
                    <textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-base transition min-h-[90px]"
                      placeholder="123 Corporate Ave, City"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({
                          name: profile?.name || "",
                          phone: profile?.phone || "",
                          address: profile?.address || ""
                        });
                      }}
                      className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 text-sm font-bold transition cursor-pointer flex items-center justify-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-bold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {savingProfile ? (
                        <>
                          <FaSpinner className="animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <FaCheck /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <span className="text-xs uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                      <FaUser /> Full Name
                    </span>
                    <p className="text-base font-semibold text-gray-800 mt-1">{profile?.name || "-"}</p>
                  </div>

                  <div>
                    <span className="text-xs uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                      <FaEnvelope /> Email Address
                    </span>
                    <p className="text-base font-semibold text-gray-800 mt-1">{profile?.email || "-"}</p>
                  </div>

                  <div>
                    <span className="text-xs uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                      <FaPhone /> Phone / Mobile
                    </span>
                    <p className="text-base font-semibold text-gray-800 mt-1">{profile?.phone || "-"}</p>
                  </div>

                  {profile?.companyName && (
                    <div>
                      <span className="text-xs uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                        <FaBuilding /> Company Context
                      </span>
                      <p className="text-base font-semibold text-gray-800 mt-1">{profile.companyName}</p>
                    </div>
                  )}

                  {profile?.department && (
                    <div>
                      <span className="text-xs uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                        <FaIdCard /> Department
                      </span>
                      <p className="text-base font-semibold text-gray-800 mt-1">{profile.department}</p>
                    </div>
                  )}

                  {profile?.designation && (
                    <div>
                      <span className="text-xs uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                        <FaIdCard /> Designation
                      </span>
                      <p className="text-base font-semibold text-gray-800 mt-1">{profile.designation}</p>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <span className="text-xs uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                      <FaMapMarkerAlt /> Address
                    </span>
                    <p className="text-base font-semibold text-gray-850 mt-1 leading-relaxed">{profile?.address || "-"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Change Password */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4.5 border-b border-gray-100 bg-gray-55/50">
              <h3 className="font-bold text-gray-850 text-lg flex items-center gap-2">
                <FaLock className="text-rose-500" />
                Change Password
              </h3>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-5">
              {/* Alert Boxes */}
              {passwordError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-750 rounded-xl text-sm font-medium flex items-center gap-2">
                  <FaTimes className="text-red-500" />
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-755 rounded-xl text-sm font-medium flex items-center gap-2">
                  <FaCheck className="text-emerald-500" />
                  {passwordSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-600 block">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-base transition"
                    placeholder="••••••••"
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
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-600 block">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-base transition"
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl text-sm font-bold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {updatingPassword ? (
                    <>
                      <FaSpinner className="animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <FaLock /> Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
