"use client";

import { useState } from "react";
import { createLeaveRequest } from "@/lib/api";

interface LeaveRequestFormProps {
  onSuccess: () => void;   // called after successful submit
  onCancel: () => void;
}

export default function LeaveRequestForm({
  onSuccess,
  onCancel,
}: LeaveRequestFormProps) {
  const [form, setForm] = useState({
    leave_type: "annual",
    from_date: "",
    to_date: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.from_date || !form.to_date) {
      setError("Please select both start and end dates");
      return;
    }

    if (form.to_date < form.from_date) {
      setError("End date cannot be before start date");
      return;
    }

    setSubmitting(true);
    try {
      await createLeaveRequest({
        leave_type: form.leave_type,
        from_date: form.from_date,
        to_date: form.to_date,
        reason: form.reason || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // calculate days preview as user selects dates
  const previewDays =
    form.from_date && form.to_date && form.to_date >= form.from_date
      ? (new Date(form.to_date).getTime() -
          new Date(form.from_date).getTime()) /
          (1000 * 60 * 60 * 24) +
        1
      : null;

  return (
    <div className="inline-form" style={{ marginBottom: "24px" }}>
      <div>
        <p className="app-kicker">Leave request</p>
        <h2 className="section-title">Plan time away with clarity.</h2>
      </div>

      {error && <p className="form-error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
        <div className="form-field">
          <label className="form-label">Leave Type *</label>
          <select className="app-select" name="leave_type" value={form.leave_type} onChange={handleChange}>
            <option value="annual">Annual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="unpaid">Unpaid Leave</option>
            <option value="maternity">Maternity Leave</option>
            <option value="paternity">Paternity Leave</option>
            <option value="emergency">Emergency Leave</option>
          </select>
        </div>

          <div className="form-field">
            <label className="form-label">From Date *</label>
            <input
              className="app-control"
              type="date"
              name="from_date"
              value={form.from_date}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="form-field">
            <label className="form-label">To Date *</label>
            <input
              className="app-control"
              type="date"
              name="to_date"
              value={form.to_date}
              onChange={handleChange}
              min={form.from_date || new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        {previewDays && (
          <p className="form-hint" style={{ marginTop: "12px" }}>
            Duration: <strong>{previewDays} day{previewDays !== 1 ? "s" : ""}</strong>
          </p>
        )}

        <div className="form-field" style={{ marginTop: "16px" }}>
          <label className="form-label">Reason (optional)</label>
          <textarea
            className="app-textarea"
            name="reason"
            value={form.reason}
            onChange={handleChange}
            rows={3}
            placeholder="Brief explanation..."
          />
        </div>

        <div className="app-actions" style={{ marginTop: "20px" }}>
          <button className="app-button" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
          <button className="app-button-ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
