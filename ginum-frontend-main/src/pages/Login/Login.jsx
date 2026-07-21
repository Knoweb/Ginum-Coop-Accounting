import React, { useState } from "react";
import usePageTitle from "../../hooks/usePageTitle"; // Custom hook to set the page title
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Icons for showing/hiding password
import api from "../../utils/api"; // Adjust the import path
import axios from "axios";
import { apiUrl } from "../../utils/api";
import Alert from "../../components/Alert/Alert"; 

const Login = () => {
  usePageTitle("Login"); // Set the page title to "Login" using the custom hook

  // State to manage password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // api.post වෙනුවට axios.post භාවිතා කරන්න (Full URL එක දෙන්න)
      const res = await axios.post(`${apiUrl}/api/auth/login`, {
        email,
        password,
      });

      // axios වලදී actual data එක තියෙන්නේ res.data කියන එක ඇතුළෙයි
      const response = res.data; 
      console.log("Login response:", response);

      if (!response.token || !response.role) {
        throw new Error("Missing token or role in response");
      }

      // Save authentication details
      if (response.role === "ROLE_SUPER_ADMIN") {
        sessionStorage.setItem("auth_token", response.token);
        sessionStorage.setItem("role", response.role);
        sessionStorage.setItem("userId", response.userId ?? "");

        Alert.success("Welcome, Super Admin!");
        setTimeout(() => {
          window.location.href = "/super-admin/dashboard";
        }, 1500);
      } else if (
        response.role === "ROLE_COMPANY" ||
        response.role === "COMPANY" ||
        response.role === "ROLE_APP_USER" ||
        response.role === "APP_USER"
      ) {
        sessionStorage.setItem("auth_token", response.token);
        sessionStorage.setItem("role", response.role);
        sessionStorage.setItem("companyId", response.companyId ?? "");
        sessionStorage.setItem("userId", response.userId ?? "");

        Alert.success("Welcome!");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        Alert.error("Unknown user role. Please contact support.");
      }
    } catch (err) {
      setError("Invalid email or password. Please try again.");
      Alert.error("Invalid email or password. Please try again.");
      console.error("Login error:", err.message || err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      {/* Main container for the login form and image */}
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-lg md:flex-row flex-col">
        {/* Left Section (Form) */}
        <div className="w-full p-6 md:w-1/2 md:p-10">
          {/* Ginum logo */}
          <div className="flex justify-center mb-6">
            <img
              src="ginum_logo.png"
              alt="Ginum Logo"
              className="h-16 w-76" // Adjust the size as needed
            />
          </div>

          {/* Login heading and sign-up link */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Don't have an account?{" "}
              <a href="/register" className="text-blue-600 hover:underline">
                Sign up now
              </a>
            </p>
          </div>

          {/* Error message display */}
          {error && (
            <div className="mt-4 text-center text-red-500 text-sm">{error}</div>
          )}

          {/* Login form */}
          <form className="mt-6" onSubmit={handleSubmit}>
            {/* Email input field */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:ring-2"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password input field with toggle visibility */}
            <div className="mt-4">
              <label className="block text-gray-700">Password</label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"} // Toggle between text and password type
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  required
                />
                {/* Button to toggle password visibility */}
                <button
                  type="button" // Changed to type="button" to prevent form submission
                  className="absolute inset-y-0 right-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}{" "}
                  {/* Toggle eye icon */}
                </button>
              </div>
            </div>

            {/* Remember me checkbox and forgot password link */}
            <div className="mt-4 flex items-center justify-between">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">Remember me</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Sign-in button */}
            <button
              type="submit"
              className="mt-6 w-full rounded-lg bg-blue-500 px-4 py-2 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign in
            </button>
          </form>
        </div>

        {/* Right Section (Image) - Hidden on small screens */}
        <div className="hidden w-1/2 md:block">
          <img
            src="ginum-login.svg"
            alt="Workspace"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
