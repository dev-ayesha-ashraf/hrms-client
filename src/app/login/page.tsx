"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { refreshUser } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await loginUser(email, password);
      await refreshUser();
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-visual">
        <div className="auth-visual-brand">
          <Image src="/logo.png?v=20260330" alt="Team Loom logo" width={200} height={150} priority unoptimized />
        </div>
        <div className="auth-visual-copy">
          <div className="auth-visual-center">
            <h2 className="auth-visual-title">HR Management Platform</h2>
            <div className="divider-bar"></div>
            <p className="auth-visual-text">
              Manage all employees, payroll and other human resource operations.
            </p>
            <div className="auth-visual-actions">
              <Link className="auth-visual-button auth-visual-button-primary" href="/">
                Learn more
              </Link>
              <Link className="auth-visual-button" href="/dashboard">
                Our Features
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <section className="auth-form-side">
        <div className="auth-card">
          <p className="auth-eyebrow">Welcome back</p>
          <h1 className="auth-title">Login to Team Loom</h1>
          <p className="auth-subtitle">
            Sign in to manage employees, approvals, attendance, and payroll.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="auth-message auth-message-error">{error}</p>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account? <Link href="/signup">Create one</Link>
          </p>
        </div>
      </section>
    </div>
  );
}