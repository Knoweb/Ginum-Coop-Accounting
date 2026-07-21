import React from "react";
import { Navigate, Outlet } from "react-router-dom";

// PublicRoute component to restrict access to authenticated users
const PublicRoute = ({ children }) => {
  // Check if the user is already authenticated
  const authToken = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
  const isAuthenticated = !!authToken; // Convert to boolean
// false
  // const isAuthenticated = false;

  // Redirect authenticated users to the dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return children ? children : <Outlet />;
};

export default PublicRoute;
