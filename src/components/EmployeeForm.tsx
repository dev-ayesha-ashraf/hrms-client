"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDepartments, createEmployee, updateEmployee } from "@/lib/api";
import { Employee, DepartmentFull } from "@/types/auth";

interface EmployeeFormProps {
  existing?: Employee;  // if passed → edit mode, if not → create mode
}

// shape of our form fields
interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title: string;
  department_id: string;  // string because HTML inputs are always strings
  hire_date: string;
  salary: string;
  status: string;
}

// shape of our validation errors
interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  job_title?: string;
  hire_date?: string;
  salary?: string;
}

export default function EmployeeForm({ existing }: EmployeeFormProps) {
  const router = useRouter();
  const isEditMode = !!existing;  // true if we have existing employee data

  const [departments, setDepartments] = useState<DepartmentFull[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  // ── initialize form — empty for create, pre-filled for edit ──
  const [form, setForm] = useState<FormData>({
    first_name: existing?.first_name ?? "",
    last_name: existing?.last_name ?? "",
    email: existing?.email ?? "",
    phone: existing?.phone ?? "",
    job_title: existing?.job_title ?? "",
    department_id: existing?.department?.id?.toString() ?? "",
    hire_date: existing?.hire_date ?? "",
    salary: existing?.salary?.toString() ?? "",
    status: existing?.status ?? "active",
  });

  // fetch departments for the dropdown
  useEffect(() => {
    getDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  // ── single handler for all inputs ───────────────────────
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // clear the error for this field as user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  // ── validation ───────────────────────────────────────────
  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!form.first_name.trim()) newErrors.first_name = "First name is required";
    if (!form.last_name.trim()) newErrors.last_name = "Last name is required";

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!form.job_title.trim()) newErrors.job_title = "Job title is required";
    if (!form.hire_date) newErrors.hire_date = "Hire date is required";

    if (!form.salary) {
      newErrors.salary = "Salary is required";
    } else if (isNaN(Number(form.salary)) || Number(form.salary) <= 0) {
      newErrors.salary = "Enter a valid salary amount";
    }

    setErrors(newErrors);

    // if newErrors is empty, validation passed
    return Object.keys(newErrors).length === 0;
  }

  // ── submit ───────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");

    if (!validate()) return;  // stop if validation fails

    setSubmitting(true);

    // build the payload — convert types for the API
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      job_title: form.job_title.trim(),
      department_id: form.department_id ? Number(form.department_id) : null,
      hire_date: form.hire_date,
      salary: Number(form.salary),
      status: form.status,
    };

    try {
      if (isEditMode) {
        await updateEmployee(existing!.id, payload);
      } else {
        await createEmployee(payload);
      }
      router.push("/employees");  // go back to the list on success
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── render ───────────────────────────────────────────────
  return (
    <div className="app-page app-page-tight app-stack" style={{ paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0 }}>
      <div className="app-title-block">
        <p className="app-kicker">Employees</p>
        <h1 className="app-title">{isEditMode ? `Edit ${existing!.first_name}` : "Add New Employee"}</h1>
        <p className="app-subtitle">
          Capture clean employee records with the same visual language used across the platform.
        </p>
      </div>

      {apiError && <p className="form-error">{apiError}</p>}

      <form onSubmit={handleSubmit} className="surface-card surface-card-soft">
        <div className="form-grid">

        <div className="form-field">
          <label className="form-label">First Name *</label>
          <input
            className="app-control"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
          />
          {errors.first_name && <span className="form-error">{errors.first_name}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Last Name *</label>
          <input
            className="app-control"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
          />
          {errors.last_name && <span className="form-error">{errors.last_name}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Email *</label>
          <input
            className="app-control"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            disabled={isEditMode}
            style={isEditMode ? { background: "#f5f5f5" } : {}}
          />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Phone</label>
          <input
            className="app-control"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>

        <div className="form-field">
          <label className="form-label">Job Title *</label>
          <input
            className="app-control"
            name="job_title"
            value={form.job_title}
            onChange={handleChange}
          />
          {errors.job_title && <span className="form-error">{errors.job_title}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Department</label>
          <select
            className="app-select"
            name="department_id"
            value={form.department_id}
            onChange={handleChange}
          >
            <option value="">— No Department —</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label">Hire Date *</label>
          <input
            className="app-control"
            name="hire_date"
            type="date"
            value={form.hire_date}
            onChange={handleChange}
          />
          {errors.hire_date && <span className="form-error">{errors.hire_date}</span>}
        </div>

        <div className="form-field">
          <label className="form-label">Salary *</label>
          <input
            className="app-control"
            name="salary"
            type="number"
            value={form.salary}
            onChange={handleChange}
            placeholder="e.g. 65000"
          />
          {errors.salary && <span className="form-error">{errors.salary}</span>}
        </div>

        {isEditMode && (
          <div className="form-field">
            <label className="form-label">Status</label>
            <select className="app-select" name="status" value={form.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        )}
        </div>

        <div className="app-actions" style={{ marginTop: "24px" }}>
          <button className="app-button" type="submit" disabled={submitting}>
            {submitting
              ? isEditMode ? "Saving..." : "Creating..."
              : isEditMode ? "Save Changes" : "Create Employee"}
          </button>
          <button
            className="app-button-ghost"
            type="button"
            onClick={() => router.push("/employees")}
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}
