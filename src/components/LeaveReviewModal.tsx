"use client";

import { useState } from "react";
import { updateLeaveStatus } from "@/lib/api";
import { LeaveRequest } from "@/types/auth";

interface LeaveReviewModalProps {
  leave: LeaveRequest;
  onClose: () => void;
  onSuccess: (updated: LeaveRequest) => void;
}

export default function LeaveReviewModal({
  leave,
  onClose,
  onSuccess,
}: LeaveReviewModalProps) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleDecision(decision: "approved" | "rejected") {
    setSubmitting(true);
    setError("");
    try {
      const updated = await updateLeaveStatus(leave.id, decision, note || undefined);
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="app-kicker">Review request</p>
        <h2 className="section-title">Review Leave Request</h2>

        <div className="surface-card surface-card-soft" style={{ marginTop: "18px", marginBottom: "18px", padding: "18px" }}>
          <div>
            <strong>Employee:</strong>{" "}
            {leave.employee.first_name} {leave.employee.last_name}
          </div>
          <div>
            <strong>Type:</strong>{" "}
            {leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1)} Leave
          </div>
          <div>
            <strong>Dates:</strong>{" "}
            {leave.from_date} → {leave.to_date} ({leave.total_days} days)
          </div>
          {leave.reason && (
            <div>
              <strong>Reason:</strong> {leave.reason}
            </div>
          )}
        </div>

        <div className="form-field" style={{ marginBottom: "16px" }}>
          <label className="form-label">
            Note to employee (optional)
          </label>
          <textarea
            className="app-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Add a comment..."
          />
        </div>

        {error && <p className="form-error" style={{ marginBottom: "12px" }}>{error}</p>}

        <div className="app-actions" style={{ justifyContent: "flex-end" }}>
          <button className="app-button-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="app-button-danger"
            onClick={() => handleDecision("rejected")}
            disabled={submitting}
          >
            {submitting ? "..." : "Reject"}
          </button>
          <button
            className="app-button"
            onClick={() => handleDecision("approved")}
            disabled={submitting}
          >
            {submitting ? "..." : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}