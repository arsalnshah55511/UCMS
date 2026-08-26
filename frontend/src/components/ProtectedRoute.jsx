import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner";

// audience: "any" | "staff" | "submitter" — scopes which side of the
// portal a route belongs to, mirroring SUBMITTER_ROLES / STAFF_ROLES.
export default function ProtectedRoute({ children, audience = "any" }) {
  const { user, loading, isStaff } = useAuth();

  if (loading) return <Spinner label="Checking session" />;

  if (!user) return <Navigate to="/login" replace />;

  if (audience === "staff" && !isStaff) return <Navigate to="/dashboard" replace />;
  if (audience === "submitter" && isStaff) return <Navigate to="/staff" replace />;

  return children;
}
