import React from "react";
import { Navigate, Outlet } from "react-router-dom";

// PrivateRoute component to protect authenticated routes
const PrivateRoute = ({ children }) => {
  // Check if the user is authenticated
  const authToken =
    localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
  const isAuthenticated =!!authToken; // Convert to boolean
// true

  // const isAuthenticated = false;

  // If the user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children ? children : <Outlet />;
};

export default PrivateRoute;
