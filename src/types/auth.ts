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
  created_at: string;
}