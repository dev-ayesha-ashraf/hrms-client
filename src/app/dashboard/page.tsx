"use client";

import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

function DashboardContent() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome back, {user?.name}</p>
      <p>Role: {user?.role}</p>
      <p>Email: {user?.email}</p>
      <div style={{ marginTop: "24px" }}>
        <h2>Navigation</h2>
        <ul>
          <li>
            <a href="/employees">Employees</a>
          </li>
        </ul>
      </div>
      {/* only admins see this */}
      {user?.role === "admin" && (
        <div style={{ border: "1px solid red", padding: "12px", marginTop: "16px" }}>
          <h2>Admin Panel</h2>
          <p>You can manage all users and system settings.</p>
        </div>
      )}

      {/* admins and HR see this */}
      {(user?.role === "admin" || user?.role === "hr") && (
        <div style={{ border: "1px solid blue", padding: "12px", marginTop: "16px" }}>
          <h2>HR Panel</h2>
          <p>You can manage employees and leave requests.</p>
        </div>
      )}

      {/* everyone sees this */}
      <div style={{ border: "1px solid green", padding: "12px", marginTop: "16px" }}>
        <h2>My Profile</h2>
        <p>All employees can see their own profile and payslips.</p>
      </div>

      <button onClick={logout} style={{ marginTop: "16px" }}>
        Logout
      </button>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}