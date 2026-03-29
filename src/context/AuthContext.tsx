"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser } from "@/lib/api";
import { User } from "@/types/auth";

// ── 1. DEFINE THE SHAPE OF THE CONTEXT ──────────────────
// This is what every component will have access to
interface AuthContextType {
  user: User | null;          // the logged-in user (null if not logged in)
  loading: boolean;           // true while we're fetching the user
  logout: () => void;         // call this to log out
  refreshUser: () => void;    // call this to re-fetch the user
}

// ── 2. CREATE THE CONTEXT ────────────────────────────────
// Think of this as an empty container — we fill it in the Provider below
const AuthContext = createContext<AuthContextType | null>(null);

// ── 3. CREATE THE PROVIDER ───────────────────────────────
// This wraps your entire app and makes the context available everywhere
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // fetch the user once when the app loads
  async function fetchUser() {
    setLoading(true);
    const currentUser = await getCurrentUser();
    setUser(currentUser);   // null if not logged in
    setLoading(false);
  }

  useEffect(() => {
    fetchUser();
  }, []);

  function logout() {
    logoutUser();           // clears the cookie
    setUser(null);          // clears the user from state
    router.push("/login");  // sends to login page
  }

  return (
    // everything inside here can access user, loading, logout, refreshUser
    <AuthContext.Provider value={{ user, loading, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── 4. EXPORT THE CONTEXT ITSELF ─────────────────────────
// useAuth hook needs this — see next step
export { AuthContext };