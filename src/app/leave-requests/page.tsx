"use client";

import { useEffect, useState } from "react";
import { getLeaveRequests, updateLeaveStatus } from "@/lib/api";
import { LeaveRequest, LeaveStatus } from "@/types/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import LeaveRequestForm from "@/components/LeaveRequestForm";
import LeaveReviewModal from "@/components/LeaveReviewModal";
import { useRole, useAuth } from "@/hooks/useAuth";

function LeaveRequestsContent() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [reviewingLeave, setReviewingLeave] = useState<LeaveRequest | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // filter state for HR view
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { isAdminOrHR } = useRole();
  const { user } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const data = await getLeaveRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // after form submits successfully
  function handleFormSuccess() {
    setShowForm(false);
    fetchRequests();  // re-fetch to show the new request
  }

  // after HR approves or rejects
  function handleReviewSuccess(updated: LeaveRequest) {
    setRequests((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
    setReviewingLeave(null);
  }

  // employee cancels their own pending request
  async function handleCancel(id: number) {
    const confirmed = window.confirm("Cancel this leave request?");
    if (!confirmed) return;

    setCancellingId(id);
    try {
      const updated = await updateLeaveStatus(id, "cancelled");
      setRequests((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancellingId(null);
    }
  }

  // filter by status for HR view
  const filtered =
    statusFilter === "all"
      ? requests
      : requests.filter((r) => r.status === statusFilter);

  if (loading) return <p>Loading...</p>;
  if (error) return <div className="app-page"><p className="form-error">{error}</p></div>;

  return (
    <div className="app-page app-stack">
      {reviewingLeave && (
        <LeaveReviewModal
          leave={reviewingLeave}
          onClose={() => setReviewingLeave(null)}
          onSuccess={handleReviewSuccess}
        />
      )}

      <div className="app-header">
        <div className="app-title-block">
          <p className="app-kicker">Leave Management</p>
          <h1 className="app-title">Time off decisions without the clutter.</h1>
          <p className="app-subtitle">
            Submit, review, and track leave with a calmer layout and clearer decision states.
          </p>
        </div>
        {!isAdminOrHR && !showForm && (
          <button className="app-button" onClick={() => setShowForm(true)}>+ Request Leave</button>
        )}
      </div>

      {showForm && (
        <LeaveRequestForm
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {isAdminOrHR && (
        <div className="app-toolbar">
          {["all", "pending", "approved", "rejected", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                background: statusFilter === s ? "linear-gradient(135deg, #0e2b69, #14d8c4)" : "rgba(14,43,105,0.08)",
                color: statusFilter === s ? "#fff" : "#0e2b69",
                textTransform: "capitalize",
              }}
              className={statusFilter === s ? "app-button" : "app-button-secondary"}
            >
              {s === "all"
                ? `All (${requests.length})`
                : `${s} (${requests.filter((r) => r.status === s).length})`}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="empty-state">
          {statusFilter === "all"
            ? "No leave requests yet."
            : `No ${statusFilter} requests.`}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="table-shell">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {isAdminOrHR && <th>Employee</th>}
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => (
                  <tr key={req.id}>
                {isAdminOrHR && (
                  <td>
                    <div className="person-meta">
                      <span className="person-name">{req.employee.first_name} {req.employee.last_name}</span>
                      <span className="person-subtext">{req.employee.job_title}</span>
                    </div>
                  </td>
                )}
                <td style={{ textTransform: "capitalize" }}>{req.leave_type}</td>
                <td>{req.from_date}</td>
                <td>{req.to_date}</td>
                <td>{req.total_days}</td>
                <td>
                  <StatusBadge status={req.status} />
                </td>
                <td>
                  {new Date(req.created_at).toLocaleDateString()}
                </td>
                <td>
                  <div className="app-actions">
                  {isAdminOrHR && req.status === "pending" && (
                    <button
                      className="app-button-secondary"
                      onClick={() => setReviewingLeave(req)}
                    >
                      Review
                    </button>
                  )}

                  {isAdminOrHR && req.review_note && (
                    <span
                      title={`Note: ${req.review_note}`}
                      className="badge-neutral"
                      style={{ cursor: "help" }}
                    >
                      Note
                    </span>
                  )}

                  {!isAdminOrHR && req.status === "pending" && (
                    <button
                      className="app-button-danger"
                      onClick={() => handleCancel(req.id)}
                      disabled={cancellingId === req.id}
                    >
                      {cancellingId === req.id ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                  </div>

                  {req.reviewed_by && (
                    <div className="person-subtext" style={{ marginTop: "6px" }}>
                      by {req.reviewed_by.name}
                    </div>
                  )}
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

// ── status badge component ────────────────────────────────
function StatusBadge({ status }: { status: LeaveStatus }) {
  const classes: Record<LeaveStatus, string> = {
    pending: "badge-warning",
    approved: "badge-success",
    rejected: "badge-danger",
    cancelled: "badge-neutral",
  };

  return (
    <span className={classes[status]} style={{ textTransform: "capitalize" }}>
      {status}
    </span>
  );
}

export default function LeaveRequestsPage() {
  return (
    <ProtectedRoute>
      <LeaveRequestsContent />
    </ProtectedRoute>
  );
}