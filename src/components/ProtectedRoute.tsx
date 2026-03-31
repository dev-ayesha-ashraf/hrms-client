"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "hr" | "employee")[]; // optional role restriction
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // wait until we know if the user is logged in
    if (loading) return;

    // not logged in → go to login
    if (!user) {
      router.push("/login");
      return;
    }

    // logged in but wrong role → go to dashboard
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.push("/dashboard");
    }
  }, [user, loading]);

  // while checking auth, show nothing (avoid flash of wrong content)
  if (loading) return <p>Loading...</p>;

  // not logged in — return nothing while redirect happens
  if (!user) return null;

  // role restricted and use
  // r doesn't have it
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  // all good — render protected page inside shared app shell
  return <AppShell>{children}</AppShell>;
}