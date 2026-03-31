"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/lib/api";

export default function SignupPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setSuccess("");

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		setLoading(true);
		try {
			await registerUser({ name, email, password });
			setSuccess("Account created successfully. Redirecting to login...");
			setTimeout(() => {
				router.push("/login");
			}, 800);
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError("Registration failed");
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="auth-shell">
			<aside className="auth-visual">
				<div className="auth-visual-brand">
					<Image src="/logo.png?v=20260330" alt="HR Team Loom logo" width={200} height={150} priority unoptimized />
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
					<p className="auth-eyebrow">Create account</p>
					<h1 className="auth-title">Sign up for Team Loom</h1>
					<p className="auth-subtitle">
						Start with your name, email, and password. You can sign in immediately after registration.
					</p>

					<form className="auth-form" onSubmit={handleSubmit}>
						<div className="auth-field">
							<label className="auth-label">Full Name</label>
							<input
								className="auth-input"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</div>

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
								minLength={6}
							/>
						</div>

						<div className="auth-field">
							<label className="auth-label">Confirm Password</label>
							<input
								className="auth-input"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								minLength={6}
							/>
						</div>

						{error && <p className="auth-message auth-message-error">{error}</p>}
						{success && <p className="auth-message auth-message-success">{success}</p>}

						<button className="auth-submit" type="submit" disabled={loading}>
							{loading ? "Creating account..." : "Sign up"}
						</button>
					</form>

					<p className="auth-footer">
						Already have an account? <Link href="/login">Login</Link>
					</p>
				</div>
			</section>
		</div>
	);
}
