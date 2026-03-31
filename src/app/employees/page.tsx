"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getEmployees, deleteEmployee } from "@/lib/api";
import { Employee } from "@/types/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useRole } from "@/hooks/useAuth";

interface EmployeeListPayload {
  items: Employee[];
  total: number;
  page: number;
  limit: number;
}

function normalizeEmployeeListResponse(
  response: unknown,
  requestedPage: number,
  requestedLimit: number
): EmployeeListPayload {
  if (Array.isArray(response)) {
    return {
      items: response as Employee[],
      total: response.length,
      page: requestedPage,
      limit: requestedLimit,
    };
  }

  if (!response || typeof response !== "object") {
    return { items: [], total: 0, page: requestedPage, limit: requestedLimit };
  }

  const payload = response as Record<string, unknown>;

  const items = (payload.items || payload.data || payload.results || []) as Employee[];
  const total = Number(payload.total ?? payload.count ?? items.length);
  const page = Number(payload.page ?? requestedPage);
  const limit = Number(payload.limit ?? requestedLimit);

  return {
    items: Array.isArray(items) ? items : [],
    total: Number.isFinite(total) ? total : 0,
    page: Number.isFinite(page) ? page : requestedPage,
    limit: Number.isFinite(limit) ? limit : requestedLimit,
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function EmployeeListContent() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const router = useRouter();
  const { isAdmin, isAdminOrHR } = useRole();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // ── fetch employees with API query params ───────────────
  useEffect(() => {
    async function fetchEmployees() {
      setLoading(true);
      setError("");

      try {
        const response = await getEmployees({
          search: debouncedSearch || undefined,
          page,
          limit,
        });
        const payload = normalizeEmployeeListResponse(response, page, limit);

        setEmployees(payload.items);
        setTotal(payload.total);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    fetchEmployees();
  }, [debouncedSearch, page, limit, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // ── delete handler ───────────────────────────────────────
  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this employee?"
    );
    if (!confirmed) return;

    setDeletingId(id); // show loading state on that specific row

    try {
      await deleteEmployee(id);
      if (employees.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        setRefreshKey((prev) => prev + 1);
      }
    } catch (err: unknown) {
      alert("Failed to delete: " + getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  // ── render states ────────────────────────────────────────
  if (loading) return <p>Loading employees...</p>;
  if (error) return <div className="app-page"><p className="form-error">Error: {error}</p></div>;

  return (
    <div className="app-page app-stack">
      <div className="app-header">
        <div className="app-title-block">
          <p className="app-kicker">Employees</p>
          <h1 className="app-title">People directory and workforce records.</h1>
          <p className="app-subtitle">
            Search the team, review profiles, and manage employee records in one polished directory.
          </p>
        </div>

        {isAdminOrHR && (
          <button className="app-button" onClick={() => router.push("/employees/new")}>
            + Add Employee
          </button>
        )}
      </div>

      <section className="surface-card surface-card-soft app-stack" style={{ gap: "18px" }}>
        <div className="app-toolbar" style={{ justifyContent: "space-between" }}>
          <div>
            <p className="app-kicker">Directory</p>
            <h2 className="section-title">Employees ({total})</h2>
          </div>
          <span className="badge-accent">Page {page} of {totalPages}</span>
        </div>

        <input
          className="app-control"
          type="text"
          placeholder="Search by name, email, title, department..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />

        <div className="pagination-controls">
          <div className="app-toolbar">
            <label className="form-label" htmlFor="employee-page-size" style={{ marginBottom: 0 }}>Rows per page</label>
            <select
              id="employee-page-size"
              className="app-select pagination-select"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div className="app-toolbar">
            <button
              className="app-button-ghost"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1 || loading}
            >
              Previous
            </button>
            <span className="muted-text">{page} / {totalPages}</span>
            <button
              className="app-button-ghost"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages || loading}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {employees.length === 0 && (
        <div className="empty-state">
          {debouncedSearch
            ? `No employees found for "${debouncedSearch}"`
            : "No employees yet. Add your first one."}
        </div>
      )}

      {employees.length > 0 && (
        <div className="table-shell">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Job Title</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Salary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="person-cell">
                        <div className="person-avatar">
                          {emp.avatar_url ? (
                            <img src={emp.avatar_url} alt={emp.first_name} />
                          ) : (
                            `${emp.first_name[0]}${emp.last_name[0]}`.toUpperCase()
                          )}
                        </div>
                        <div className="person-meta">
                          <span className="person-name">{emp.first_name} {emp.last_name}</span>
                          <span className="person-subtext">#{emp.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>{emp.email}</td>
                    <td>{emp.job_title}</td>
                    <td>{emp.department?.name ?? "—"}</td>
                    <td>
                      <span className={statusClassName(emp.status)}>
                        {emp.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>${Number(emp.salary).toLocaleString()}</td>
                    <td>
                      <div className="app-actions">
                        <button
                          className="app-button-ghost"
                          onClick={() => router.push(`/employees/${emp.id}`)}
                        >
                          View
                        </button>
                        {isAdminOrHR && (
                          <button
                            className="app-button-secondary"
                            onClick={() => router.push(`/employees/${emp.id}/edit`)}
                          >
                            Edit
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            className="app-button-danger"
                            onClick={() => handleDelete(emp.id)}
                            disabled={deletingId === emp.id}
                          >
                            {deletingId === emp.id ? "Deleting..." : "Delete"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function statusClassName(status: string) {
  const classes: Record<string, string> = {
    active: "badge-success",
    inactive: "badge-neutral",
    on_leave: "badge-warning",
  };
  return classes[status] ?? "badge-neutral";
}

// ── wrap with ProtectedRoute ─────────────────────────────
export default function EmployeesPage() {
  return (
    <ProtectedRoute>
      <EmployeeListContent />
    </ProtectedRoute>
  );
}