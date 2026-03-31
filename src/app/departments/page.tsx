"use client";

import { useEffect, useState } from "react";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/lib/api";
import { DepartmentFull } from "@/types/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useRole } from "@/hooks/useAuth";

function DepartmentsContent() {
  const [departments, setDepartments] = useState<DepartmentFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── add form state ───────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // ── inline edit state ────────────────────────────────────
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);

  // ── delete state ─────────────────────────────────────────
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { isAdmin, isAdminOrHR } = useRole();

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── ADD ──────────────────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) {
      setAddError("Department name is required");
      return;
    }
    setAdding(true);
    setAddError("");
    try {
      const created = await createDepartment({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      setDepartments((prev) => [...prev, created]);
      setNewName("");
      setNewDesc("");
      setShowAddForm(false);
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  }

  // ── START EDITING ────────────────────────────────────────
  function startEdit(dept: DepartmentFull) {
    setEditingId(dept.id);
    setEditName(dept.name);
    setEditDesc(dept.description ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditDesc("");
  }

  // ── SAVE EDIT ────────────────────────────────────────────
  async function handleSaveEdit(id: number) {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const updated = await updateDepartment(id, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      });
      // update just this one item in state — no full re-fetch needed
      setDepartments((prev) =>
        prev.map((d) => (d.id === id ? updated : d))
      );
      cancelEdit();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── DELETE ───────────────────────────────────────────────
  async function handleDelete(id: number) {
    const confirmed = window.confirm("Delete this department?");
    if (!confirmed) return;
    setDeletingId(id);
    try {
      await deleteDepartment(id);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      // show the "has employees" error clearly
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <p>Loading departments...</p>;
  if (error) return <div className="app-page"><p className="form-error">{error}</p></div>;

  return (
    <div className="app-page app-stack">
      <div className="app-header">
        <div className="app-title-block">
          <p className="app-kicker">Departments</p>
          <h1 className="app-title">Structure teams with clearer ownership.</h1>
          <p className="app-subtitle">
            Create, refine, and maintain departments using the same visual system as the rest of the HR platform.
          </p>
        </div>
        {isAdminOrHR && !showAddForm && (
          <button className="app-button" onClick={() => setShowAddForm(true)}>
            + Add Department
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="inline-form">
          <div>
            <p className="app-kicker">New department</p>
            <h3 className="section-title">Create a new team space</h3>
          </div>
          {addError && <p className="form-error">{addError}</p>}
          <div className="form-field">
            <label className="form-label">Name *</label>
            <input
              className="app-control"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Marketing"
            />
          </div>
          <div className="form-field">
            <label className="form-label">Description</label>
            <input
              className="app-control"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="app-actions">
          <button className="app-button" type="submit" disabled={adding}>
            {adding ? "Creating..." : "Create"}
          </button>
          <button
            className="app-button-ghost"
            type="button"
            onClick={() => {
              setShowAddForm(false);
              setAddError("");
              setNewName("");
              setNewDesc("");
            }}
          >
            Cancel
          </button>
          </div>
        </form>
      )}

      {departments.length === 0 ? (
        <div className="empty-state">No departments yet.</div>
      ) : (
        <div className="table-shell">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Employees</th>
                  {isAdminOrHR && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id}>
                {editingId === dept.id ? (
                  <>
                    <td>
                      <input
                        className="app-control"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="app-control"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                      />
                    </td>
                    <td>{dept.employee_count}</td>
                    <td>
                      <div className="app-actions">
                      <button
                        className="app-button"
                        onClick={() => handleSaveEdit(dept.id)}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button className="app-button-ghost" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{dept.name}</td>
                    <td className="muted-text">{dept.description ?? "—"}</td>
                    <td>
                      <span className={dept.employee_count > 0 ? "badge-success" : "badge-neutral"}>
                        {dept.employee_count}{" "}
                        {dept.employee_count === 1 ? "employee" : "employees"}
                      </span>
                    </td>
                    {isAdminOrHR && (
                      <td>
                        <div className="app-actions">
                        <button
                          className="app-button-secondary"
                          onClick={() => startEdit(dept)}
                        >
                          Edit
                        </button>
                        {isAdmin && (
                          <button
                            className="app-button-danger"
                            onClick={() => handleDelete(dept.id)}
                            disabled={deletingId === dept.id}
                          >
                            {deletingId === dept.id ? "Deleting..." : "Delete"}
                          </button>
                        )}
                        </div>
                      </td>
                    )}
                  </>
                )}
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

export default function DepartmentsPage() {
  return (
    <ProtectedRoute>
      <DepartmentsContent />
    </ProtectedRoute>
  );
}