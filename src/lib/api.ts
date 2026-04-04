import Cookies from "js-cookie";

// Base URL is configured via NEXT_PUBLIC_API_URL in .env.local
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// ── CORS-aware fetch wrapper ──────────────────────────────
// All requests explicitly declare mode: "cors" so the browser
// negotiates CORS headers with the backend on every call.
function corsFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, { mode: "cors", ...init });
}

// ── Centralised API error handler ────────────────────────
// Parses status codes and throws human-readable messages.
// 401 → clears token and reloads to login.
export async function handleApiError(response: Response): Promise<never> {
  let detail = "";
  try {
    const body = await response.json();
    detail = Array.isArray(body.detail)
      ? body.detail.map((d: { msg: string }) => d.msg).join(", ")
      : body.detail ?? "";
  } catch {
    // body wasn't JSON
  }

  switch (response.status) {
    case 401:
      Cookies.remove("token");
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    case 403:
      throw new Error(detail || "You don't have permission to do that.");
    case 404:
      throw new Error(detail || "The requested resource was not found.");
    case 422:
      throw new Error(detail || "Validation error. Please check your input.");
    case 500:
      throw new Error("Server error. Please try again later.");
    default:
      throw new Error(detail || `Request failed (${response.status}).`);
  }
}

// ── LOGIN ────────────────────────────────────────────────
export async function loginUser(email: string, password: string) {
  const response = await corsFetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  // if something went wrong, extract the error detail and throw it
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Login failed");
  }

  const data = await response.json();

  // save the token in a cookie — expires in 1 day
  Cookies.set("token", data.access_token, { expires: 1 });

  return data;
}

// ── REGISTER ─────────────────────────────────────────────
export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const response = await corsFetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

// ── GET CURRENT USER ─────────────────────────────────────
export async function getCurrentUser() {
  const token = Cookies.get("token");
  if (!token) return null;

  const response = await corsFetch(`${BASE_URL}/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return response.json();
}

// ── LOGOUT ───────────────────────────────────────────────
export function logoutUser() {
  Cookies.remove("token");
}

// ── helper — every protected request needs this header ──
function authHeaders() {
  const token = Cookies.get("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getDashboardStats() {
  const response = await corsFetch(`${BASE_URL}/dashboard/stats`, { headers: authHeaders() });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

// ── EMPLOYEE API CALLS ───────────────────────────────────

export async function getEmployees(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search?.trim()) query.append("search", params.search.trim());
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());

  const queryString = query.toString();
  const url = queryString ? `${BASE_URL}/employees/?${queryString}` : `${BASE_URL}/employees/`;

  const response = await corsFetch(url, { headers: authHeaders() });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function getEmployee(id: number) {
  const response = await corsFetch(`${BASE_URL}/employees/${id}`, { headers: authHeaders() });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function deleteEmployee(id: number) {
  const response = await corsFetch(`${BASE_URL}/employees/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) return handleApiError(response);
  return true;
}

export async function createEmployee(data: unknown) {
  const response = await corsFetch(`${BASE_URL}/employees/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function updateEmployee(id: number, data: unknown) {
  const response = await corsFetch(`${BASE_URL}/employees/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function getDepartments() {
  const response = await corsFetch(`${BASE_URL}/departments/`, { headers: authHeaders() });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function createDepartment(data: { name: string; description?: string }) {
  const response = await corsFetch(`${BASE_URL}/departments/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function updateDepartment(id: number, data: { name?: string; description?: string }) {
  const response = await corsFetch(`${BASE_URL}/departments/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function deleteDepartment(id: number) {
  const response = await corsFetch(`${BASE_URL}/departments/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) return handleApiError(response);
  return true;
}

export async function uploadAvatar(employeeId: number, file: File) {
  const token = Cookies.get("token");
  const formData = new FormData();
  formData.append("file", file);

  const response = await corsFetch(`${BASE_URL}/employees/${employeeId}/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

// ── LEAVE REQUESTS ───────────────────────────────────────

export async function getLeaveRequests() {
  const response = await corsFetch(`${BASE_URL}/leave-requests/`, { headers: authHeaders() });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function createLeaveRequest(data: {
  leave_type: string;
  from_date: string;
  to_date: string;
  reason?: string;
}) {
  const response = await corsFetch(`${BASE_URL}/leave-requests/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function updateLeaveStatus(id: number, status: string, review_note?: string) {
  const response = await corsFetch(`${BASE_URL}/leave-requests/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status, review_note }),
  });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

// ── ATTENDANCE ───────────────────────────────────────────

export async function getAttendanceStatus() {
  const response = await corsFetch(`${BASE_URL}/attendance/status`, { headers: authHeaders() });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function clockIn(note?: string) {
  const response = await corsFetch(`${BASE_URL}/attendance/clock-in`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ note: note || null }),
  });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function clockOut(note?: string) {
  const response = await corsFetch(`${BASE_URL}/attendance/clock-out`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ note: note || null }),
  });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function getMyAttendanceHistory(month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month) params.append("month", month.toString());
  if (year) params.append("year", year.toString());

  const response = await corsFetch(`${BASE_URL}/attendance/my-history?${params}`, { headers: authHeaders() });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function getAllAttendance(month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month) params.append("month", month.toString());
  if (year) params.append("year", year.toString());

  const response = await corsFetch(`${BASE_URL}/attendance/all?${params}`, { headers: authHeaders() });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function getTodayAttendance() {
  const response = await corsFetch(`${BASE_URL}/attendance/today`, { headers: authHeaders() });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

// ── PAYROLL ──────────────────────────────────────────────

export async function getPayrollList(month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month) params.append("month", month.toString());
  if (year) params.append("year", year.toString());

  const response = await corsFetch(`${BASE_URL}/payroll/?${params}`, { headers: authHeaders() });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function getMyPayslips() {
  const response = await corsFetch(`${BASE_URL}/payroll/my-payslips`, { headers: authHeaders() });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function getPayslip(id: number) {
  const response = await corsFetch(`${BASE_URL}/payroll/${id}`, { headers: authHeaders() });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function generatePayrollForEmployee(
  employeeId: number,
  data: { month: number; year: number; performance_bonus?: number; overtime_hours?: number }
) {
  const response = await corsFetch(`${BASE_URL}/payroll/generate/${employeeId}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function generateBulkPayroll(month: number, year: number) {
  const response = await corsFetch(`${BASE_URL}/payroll/generate-bulk`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ month, year }),
  });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function markPayrollPaid(id: number, notes?: string) {
  const response = await corsFetch(`${BASE_URL}/payroll/${id}/mark-paid`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ notes: notes || null }),
  });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function downloadPayslipPDF(id: number, filename: string) {
  const token = Cookies.get("token");

  const response = await corsFetch(`${BASE_URL}/payroll/${id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return handleApiError(response);

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── NOTIFICATIONS ─────────────────────────────────────────

export async function getNotifications(unreadOnly = false) {
  const params = new URLSearchParams();
  if (unreadOnly) params.append("unread_only", "true");

  const response = await corsFetch(`${BASE_URL}/notifications/?${params}`, { headers: authHeaders() });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function getNotificationCount() {
  const response = await corsFetch(`${BASE_URL}/notifications/count`, { headers: authHeaders() });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function markNotificationRead(id: number) {
  const response = await corsFetch(`${BASE_URL}/notifications/${id}/read`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

export async function markAllNotificationsRead() {
  const response = await corsFetch(`${BASE_URL}/notifications/read-all`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  if (!response.ok) return handleApiError(response);
  return response.json();
}

// ── CSV EXPORT HELPERS ────────────────────────────────────
// Fetches an authenticated CSV endpoint and triggers a browser download.

async function downloadCSVFromAPI(url: string, filename: string): Promise<void> {
  const token = Cookies.get("token");
  const response = await corsFetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return handleApiError(response);

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

export function exportEmployeesCSV(): Promise<void> {
  return downloadCSVFromAPI(`${BASE_URL}/employees/export/csv`, "employees.csv");
}

export function exportAttendanceCSV(month?: number, year?: number): Promise<void> {
  const params = new URLSearchParams();
  if (month) params.append("month", month.toString());
  if (year) params.append("year", year.toString());
  const period = month && year ? `_${year}_${String(month).padStart(2, "0")}` : "";
  return downloadCSVFromAPI(
    `${BASE_URL}/attendance/export/csv?${params}`,
    `attendance${period}.csv`
  );
}

export function exportPayrollCSV(month?: number, year?: number): Promise<void> {
  const params = new URLSearchParams();
  if (month) params.append("month", month.toString());
  if (year) params.append("year", year.toString());
  const period = month && year ? `_${year}_${String(month).padStart(2, "0")}` : "";
  return downloadCSVFromAPI(
    `${BASE_URL}/payroll/export/csv?${params}`,
    `payroll${period}.csv`
  );
}