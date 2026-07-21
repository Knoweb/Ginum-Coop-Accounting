import { Navigate, Outlet } from "react-router-dom";
import { isCoopAccountingMode } from "../config/coopMode";

const CoopModeGuard = ({ children }) => {
  if (isCoopAccountingMode) {
    return <Navigate to="/dashboard" replace />;
  }
  return children ? children : <Outlet />;
};

export default CoopModeGuard;
