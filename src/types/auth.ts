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