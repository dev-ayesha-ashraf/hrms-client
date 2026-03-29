"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getEmployees, deleteEmployee } from "@/lib/api";
import { Employee } from "@/types/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useRole } from "@/hooks/useAuth";

function EmployeeListContent() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filtered, setFiltered] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const router = useRouter();
  const { isAdmin, isAdminOrHR } = useRole();

  // ── fetch employees once on page load ───────────────────
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const data = await getEmployees();
        setEmployees(data);
        setFiltered(data); // initially show all
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  // ── filter employees when search input changes ───────────
  useEffect(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      setFiltered(employees); // empty search = show all
      return;
    }

    const results = employees.filter((emp) => {
      const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      return (
        fullName.includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.job_title.toLowerCase().includes(query) ||
        emp.department?.name.toLowerCase().includes(query)
      );
    });

    setFiltered(results);
  }, [search, employees]); // re-run when search OR employees change

  // ── delete handler ───────────────────────────────────────
  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this employee?"
    );
    if (!confirmed) return;

    setDeletingId(id); // show loading state on that specific row

    try {
      await deleteEmployee(id);
      // remove from local state — no need to re-fetch
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    } finally {
      setDeletingId(null);
    }
  }

  // ── render states ────────────────────────────────────────
  if (loading) return <p>Loading employees...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Employees ({filtered.length})</h1>

        {/* only admin and HR see the Add button */}
        {isAdminOrHR && (
          <button onClick={() => router.push("/employees/new")}>
            + Add Employee
          </button>
        )}
      </div>

      {/* search input */}
      <div style={{ marginTop: "16px", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Search by name, email, title, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        />
      </div>

      {/* empty state */}
      {filtered.length === 0 && (
        <p>
          {search
            ? `No employees found for "${search}"`
            : "No employees yet. Add your first one."}
        </p>
      )}

      {/* employee table */}
      {filtered.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Job Title</th>
              <th style={thStyle}>Department</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Salary</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr key={emp.id}>
                <td style={tdStyle}>
                  {emp.first_name} {emp.last_name}
                </td>
                <td style={tdStyle}>{emp.email}</td>
                <td style={tdStyle}>{emp.job_title}</td>
                <td style={tdStyle}>
                  {emp.department?.name ?? "—"}
                </td>
                <td style={tdStyle}>
                  <span style={statusStyle(emp.status)}>
                    {emp.status.replace("_", " ")}
                  </span>
                </td>
                <td style={tdStyle}>
                  ${Number(emp.salary).toLocaleString()}
                </td>
                <td style={tdStyle}>
                  {/* view button — everyone can see */}
                  <button
                    onClick={() => router.push(`/employees/${emp.id}`)}
                    style={{ marginRight: "8px" }}
                  >
                    View
                  </button>

                  {/* edit button — admin and HR only */}
                  {isAdminOrHR && (
                    <button
                      onClick={() => router.push(`/employees/${emp.id}/edit`)}
                      style={{ marginRight: "8px" }}
                    >
                      Edit
                    </button>
                  )}

                  {/* delete button — admin only */}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(emp.id)}
                      disabled={deletingId === emp.id}
                      style={{ color: "red" }}
                    >
                      {deletingId === emp.id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── tiny style helpers — will replace with Tailwind on Day 22 ──
const thStyle = {
  textAlign: "left" as const,
  padding: "8px 12px",
  borderBottom: "2px solid #ccc",
  fontWeight: "bold",
};

const tdStyle = {
  padding: "8px 12px",
  borderBottom: "1px solid #eee",
};

function statusStyle(status: string) {
  const colors: Record<string, string> = {
    active: "green",
    inactive: "gray",
    on_leave: "orange",
  };
  return { color: colors[status] ?? "black", fontWeight: "bold" };
}

// ── wrap with ProtectedRoute ─────────────────────────────
export default function EmployeesPage() {
  return (
    <ProtectedRoute>
      <EmployeeListContent />
    </ProtectedRoute>
  );
}