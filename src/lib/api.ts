import Cookies from "js-cookie";

// your FastAPI backend URL
const BASE_URL = "http://127.0.0.1:8000";

// ── LOGIN ────────────────────────────────────────────────
export async function loginUser(email: string, password: string) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
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
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Registration failed");
  }

  return response.json();
}

// ── GET CURRENT USER ─────────────────────────────────────
export async function getCurrentUser() {
  const token = Cookies.get("token");

  if (!token) return null;

  const response = await fetch(`${BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      // this is how you send the JWT — every protected request needs this
      Authorization: `Bearer ${token}`,
    },
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
  const response = await fetch(`${BASE_URL}/dashboard/stats`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch dashboard stats");
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

  const response = await fetch(url, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch employees");
  return response.json();
}

export async function getEmployee(id: number) {
  const response = await fetch(`${BASE_URL}/employees/${id}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Employee not found");
  return response.json();
}

export async function deleteEmployee(id: number) {
  const response = await fetch(`${BASE_URL}/employees/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete employee");
  // 204 means no response body — just return true
  return true;
}

export async function createEmployee(data: unknown) {
  const response = await fetch(`${BASE_URL}/employees/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create employee");
  }

  return response.json();
}

export async function updateEmployee(id: number, data: unknown) {
  const response = await fetch(`${BASE_URL}/employees/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update employee");
  }

  return response.json();
}

export async function getDepartments() {
  const response = await fetch(`${BASE_URL}/departments/`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch departments");
  return response.json();
}

export async function createDepartment(data: {
  name: string;
  description?: string;
}) {
  const response = await fetch(`${BASE_URL}/departments/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create department");
  }
  return response.json();
}

export async function updateDepartment(
  id: number,
  data: { name?: string; description?: string }
) {
  const response = await fetch(`${BASE_URL}/departments/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update department");
  }
  return response.json();
}

export async function deleteDepartment(id: number) {
  const response = await fetch(`${BASE_URL}/departments/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to delete department");
  }
  return true;
}

export async function uploadAvatar(employeeId: number, file: File) {
  const token = Cookies.get("token");

  // file uploads use FormData — NOT JSON
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${BASE_URL}/employees/${employeeId}/avatar`,
    {
      method: "POST",
      headers: {
        // DO NOT set Content-Type here — browser sets it automatically
        // with the correct multipart boundary when using FormData
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Upload failed");
  }

  return response.json();
}

// ── LEAVE REQUESTS ───────────────────────────────────────

export async function getLeaveRequests() {
  const response = await fetch(`${BASE_URL}/leave-requests/`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch leave requests");
  return response.json();
}

export async function createLeaveRequest(data: {
  leave_type: string;
  from_date: string;
  to_date: string;
  reason?: string;
}) {
  const response = await fetch(`${BASE_URL}/leave-requests/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to submit leave request");
  }
  return response.json();
}

export async function updateLeaveStatus(
  id: number,
  status: string,
  review_note?: string
) {
  const response = await fetch(`${BASE_URL}/leave-requests/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status, review_note }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update status");
  }
  return response.json();
}

// ── ATTENDANCE ───────────────────────────────────────────

export async function getAttendanceStatus() {
  const response = await fetch(`${BASE_URL}/attendance/status`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to get attendance status");
  return response.json();
}

export async function clockIn(note?: string) {
  const response = await fetch(`${BASE_URL}/attendance/clock-in`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ note: note || null }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to clock in");
  }
  return response.json();
}

export async function clockOut(note?: string) {
  const response = await fetch(`${BASE_URL}/attendance/clock-out`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ note: note || null }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to clock out");
  }
  return response.json();
}

export async function getMyAttendanceHistory(month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month) params.append("month", month.toString());
  if (year) params.append("year", year.toString());

  const response = await fetch(
    `${BASE_URL}/attendance/my-history?${params}`,
    { headers: authHeaders() }
  );
  if (!response.ok) throw new Error("Failed to fetch history");
  return response.json();
}

export async function getAllAttendance(month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month) params.append("month", month.toString());
  if (year) params.append("year", year.toString());

  const response = await fetch(
    `${BASE_URL}/attendance/all?${params}`,
    { headers: authHeaders() }
  );
  if (!response.ok) throw new Error("Failed to fetch attendance");
  return response.json();
}

export async function getTodayAttendance() {
  const response = await fetch(`${BASE_URL}/attendance/today`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch today's attendance");
  return response.json();
}

// ── PAYROLL ──────────────────────────────────────────────

export async function getPayrollList(month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month) params.append("month", month.toString());
  if (year) params.append("year", year.toString());

  const response = await fetch(`${BASE_URL}/payroll/?${params}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch payroll");
  return response.json();
}

export async function getMyPayslips() {
  const response = await fetch(`${BASE_URL}/payroll/my-payslips`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch payslips");
  return response.json();
}

export async function getPayslip(id: number) {
  const response = await fetch(`${BASE_URL}/payroll/${id}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Payslip not found");
  return response.json();
}

export async function generatePayrollForEmployee(
  employeeId: number,
  data: { month: number; year: number; performance_bonus?: number; overtime_hours?: number }
) {
  const response = await fetch(`${BASE_URL}/payroll/generate/${employeeId}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to generate payroll");
  }
  return response.json();
}

export async function generateBulkPayroll(month: number, year: number) {
  const response = await fetch(`${BASE_URL}/payroll/generate-bulk`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ month, year }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to generate bulk payroll");
  }
  return response.json();
}

export async function markPayrollPaid(id: number, notes?: string) {
  const response = await fetch(`${BASE_URL}/payroll/${id}/mark-paid`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ notes: notes || null }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to mark as paid");
  }
  return response.json();
}

export async function downloadPayslipPDF(id: number, filename: string) {
  const token = Cookies.get("token");

  const response = await fetch(`${BASE_URL}/payroll/${id}/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Failed to generate PDF");

  // get the binary data as a blob
  const blob = await response.blob();

  // create a temporary URL pointing to the blob
  const url = URL.createObjectURL(blob);

  // create an invisible link, click it, then clean up
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // free the memory
  URL.revokeObjectURL(url);
}