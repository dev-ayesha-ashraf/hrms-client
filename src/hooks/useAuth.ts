import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

// ── ADD THIS ─────────────────────────────────────────────
// a clean way to check roles anywhere in your frontend
export function useRole() {
  const { user } = useAuth();

  return {
    isAdmin: user?.role === "admin",
    isHR: user?.role === "hr",
    isEmployee: user?.role === "employee",
    isAdminOrHR: user?.role === "admin" || user?.role === "hr",
    role: user?.role,
  };
}