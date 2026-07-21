import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const ResetPassword = () => {
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    // Add your form submission logic here
    setError(""); // Clear any previous errors
    console.log("Form submitted successfully!");
  };

  return (
    <div className="w-full space-y-6 rounded shadow-md p-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Reset Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap -mx-2">
          {/* User Field */}
          <div className="w-full md:w-1/2 p-2">
            <label className="block text-gray-700">
              User <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email Field */}
          <div className="w-full md:w-1/2 p-2">
            <label className="block text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Old Password Field */}
          <div className="w-full md:w-1/3 p-2">
            <label className="block text-gray-700">
              Old Password <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center w-full border rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type={showOldPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="flex-1 px-4 py-2 rounded-lg outline-none"
              />
              <button
                type="button"
                className="p-2"
                onClick={() => setShowOldPassword(!showOldPassword)}
              >
                {showOldPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div className="w-full md:w-1/3 p-2">
            <label className="block text-gray-700">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center w-full border rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="flex-1 px-4 py-2 rounded-lg outline-none"
              />
              <button
                type="button"
                className="p-2"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Confirm New Password Field */}
          <div className="w-full md:w-1/3 p-2">
            <label className="block text-gray-700">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center w-full border rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type={showConfirmNewPassword ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                className="flex-1 px-4 py-2 rounded-lg outline-none"
              />
              <button
                type="button"
                className="p-2"
                onClick={() =>
                  setShowConfirmNewPassword(!showConfirmNewPassword)
                }
              >
                {showConfirmNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="p-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-200"
          >
            Reset Password
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
