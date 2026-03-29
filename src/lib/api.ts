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