// shape of what the login API returns
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// shape of the logged-in user
export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "hr" | "employee";
  created_at: string;
}

// ── existing types stay exactly as they are ─────────────

export interface Department {
  id: number;
  name: string;
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  job_title: string;
  department: Department | null;
  hire_date: string;
  salary: number;
  status: "active" | "inactive" | "on_leave";
  avatar_url: string | null;            // ← add this
  created_at: string;
}

export interface DepartmentFull {
  id: number;
  name: string;
  description: string | null;
  employee_count: number;     // ← add this
}

export type LeaveType =
  | "annual"
  | "sick"
  | "unpaid"
  | "maternity"
  | "paternity"
  | "emergency";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveRequest {
  id: number;
  employee: {
    id: number;
    first_name: string;
    last_name: string;
    job_title: string;
  };
  leave_type: LeaveType;
  from_date: string;
  to_date: string;
  reason: string | null;
  status: LeaveStatus;
  reviewed_by: { id: number; name: string } | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  total_days: number;
}

export interface AttendanceRecord {
  id: number;
  employee: {
    id: number;
    first_name: string;
    last_name: string;
  };
  date: string;
  clock_in: string;
  clock_out: string | null;
  hours_worked: number | null;
  note: string | null;
}

export interface AttendanceStatus {
  is_clocked_in: boolean;
  record: AttendanceRecord | null;
}

export interface PayrollRecord {
  id: number;
  employee: {
    id: number;
    first_name: string;
    last_name: string;
    job_title: string;
  };
  month: number;
  year: number;
  base_salary: number;
  overtime_bonus: number;
  performance_bonus: number;
  gross_salary: number;
  income_tax: number;
  social_security: number;
  total_deductions: number;
  net_pay: number;
  days_present: number;
  days_absent: number;
  overtime_hours: number;
  is_paid: boolean;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}