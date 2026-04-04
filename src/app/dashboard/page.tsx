"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getAllAttendance, getDashboardStats, getDepartments, getEmployees } from "@/lib/api";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ErrorBanner } from "@/components/ui";

interface DashboardStats {
  total_employees: number;
  present_today: number;
  on_leave: number;
  pending_requests: number;
  total_payroll_this_month: number;
}

interface AttendanceBarData {
  month: string;
  attendance: number;
}

interface DepartmentPieData {
  name: string;
  value: number;
  color: string;
}

const CHART_COLORS = ["#0e2b69", "#14d8c4", "#1c8b64", "#2a7f9e", "#d98324", "#c73b57", "#5f6f82"];

function getRecentMonths(monthCount: number) {
  const now = new Date();
  return Array.from({ length: monthCount }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - index), 1);
    return {
      month: monthDate.getMonth() + 1,
      year: monthDate.getFullYear(),
      label: monthDate.toLocaleString("default", { month: "short" }),
    };
  });
}

function countWorkingDays(month: number, year: number) {
  const today = new Date();
  const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear();
  const lastDay = isCurrentMonth ? today.getDate() : new Date(year, month, 0).getDate();

  let workingDays = 0;
  for (let day = 1; day <= lastDay; day += 1) {
    const currentDate = new Date(year, month - 1, day);
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays += 1;
    }
  }

  return workingDays;
}

function DashboardContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceBarData[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentPieData[]>([]);

  const navItems = [
    {
      href: "/employees",
      title: "Employees",
      copy: "Directory, hiring data, profile updates, and team records.",
    },
    {
      href: "/departments",
      title: "Departments",
      copy: "Organize teams, ownership, and headcount across the company.",
    },
    {
      href: "/leave-requests",
      title: "Leave Requests",
      copy: "Review, approve, and track time-off decisions with context.",
    },
    {
      href: "/attendance",
      title: "Attendance",
      copy: "Monitor daily activity, clock-ins, history, and monthly patterns.",
    },
    {
      href: "/payroll",
      title: "Payroll",
      copy: "Generate payouts, verify status, and keep salary operations moving.",
    },
  ];

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [statsResponse, departments, empsResponse] = await Promise.all([
          getDashboardStats(),
          getDepartments(),
          getEmployees({ limit: 1000 }),
        ]);

        setStats(statsResponse);

        const allEmps = Array.isArray(empsResponse) ? empsResponse : (empsResponse.data ?? []);
        const activeEmployees = allEmps.filter((employee: { status: string }) => employee.status === "active");
        const monthlySlices = getRecentMonths(6);

        const monthlyAttendance = await Promise.all(
          monthlySlices.map(async (slice) => {
            const records = await getAllAttendance(slice.month, slice.year);
            const presentSet = new Set<string>();

            records.forEach((record: { employee: { id: number }; date: string }) => {
              const currentDate = new Date(record.date);
              const day = currentDate.getDay();
              if (day !== 0 && day !== 6) {
                presentSet.add(`${record.employee.id}_${record.date}`);
              }
            });

            const workingDays = countWorkingDays(slice.month, slice.year);
            const totalPossibleDays = workingDays * activeEmployees.length;
            const rate = totalPossibleDays > 0 ? (presentSet.size / totalPossibleDays) * 100 : 0;

            return {
              month: slice.label,
              attendance: Number(rate.toFixed(1)),
            };
          })
        );

        const deptData = departments
          .map((department: { id: number; name: string; employee_count: number }, index: number) => ({
            id: department.id,
            name: department.name,
            value: department.employee_count,
            color: CHART_COLORS[index % CHART_COLORS.length],
          }))
          .filter((department: { value: number }) => department.value > 0);

        const assignedCount = deptData.reduce((total: number, department: { value: number }) => total + department.value, 0);
        const unassignedCount = Math.max(activeEmployees.length - assignedCount, 0);

        if (unassignedCount > 0) {
          deptData.push({
            id: -1,
            name: "Unassigned",
            value: unassignedCount,
            color: CHART_COLORS[CHART_COLORS.length - 1],
          });
        }

        setAttendanceData(monthlyAttendance);
        setDepartmentData(deptData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const attendanceToday = useMemo(() => {
    if (!stats || stats.total_employees === 0) return 0;
    return (stats.present_today / stats.total_employees) * 100;
  }, [stats]);

  const payrollAmount = useMemo(() => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(stats?.total_payroll_this_month ?? 0);
  }, [stats]);

  if (error) {
    return (
      <div className="app-page">
        <ErrorBanner message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="app-page app-stack">
      <section className="surface-card surface-card-accent">
        <div className="app-header">
          <div className="app-title-block">
            <p className="app-kicker">Control Center</p>
            <h1 className="app-title">Good to see you, {user?.name}.</h1>
            <p className="app-subtitle section-copy-strong">
              One workspace for employee records, leave approvals, attendance checks, and payroll progress.
            </p>
            <div className="meta-row" style={{ marginTop: "16px" }}>
              <span className="badge-accent">{user?.role}</span>
              <span className="badge-neutral" style={{ color: "rgba(255,255,255,0.82)", borderColor: "rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.12)" }}>
                {user?.email}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="metric-grid">
        <div className="metric-card">
          <p className="metric-label">Headcount</p>
          <p className="metric-value">{loading ? "..." : stats?.total_employees ?? 0}</p>
          <p className="metric-note">Total active employees currently tracked by the organization.</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Attendance Today</p>
          <p className="metric-value">{loading ? "..." : `${attendanceToday.toFixed(1)}%`}</p>
          <p className="metric-note">Based on present employees against total headcount for today.</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Payroll This Month</p>
          <p className="metric-value">{loading ? "..." : payrollAmount}</p>
          <p className="metric-note">Net payroll total generated this month across all processed employees.</p>
        </div>
        <div className="metric-card metric-card-accent">
          <p className="metric-label">Open Requests</p>
          <p className="metric-value">{loading ? "..." : stats?.pending_requests ?? 0}</p>
          <p className="metric-note">Pending leave approvals that still need review.</p>
        </div>
      </section>

      <section className="content-grid">
        <div className="surface-card surface-card-soft">
          <p className="app-kicker">Attendance Trends</p>
          <h2 className="section-title">Monthly attendance health</h2>
          <p className="section-copy">
            Month-by-month attendance percentage helps you spot consistency and identify drop-offs early.
          </p>

          <div className="dashboard-chart-wrap">
            {loading ? (
              <div className="empty-state">Loading attendance chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={attendanceData} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(13, 35, 64, 0.1)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value: number | string) => `${value}%`}
                  />
                  <Tooltip formatter={(value) => `${value ?? 0}%`} />
                  <Bar dataKey="attendance" radius={[10, 10, 0, 0]} fill="var(--app-accent-dark)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <section className="surface-card">
          <p className="app-kicker">Department Mix</p>
          <h2 className="section-title">Workforce distribution</h2>
          <p className="section-copy">
            Department share highlights team concentration so hiring and resource planning stay balanced.
          </p>

          <div className="dashboard-pie-wrap">
            {loading ? (
              <div className="empty-state">Loading department chart...</div>
            ) : departmentData.length === 0 ? (
              <div className="empty-state">No department data available yet.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {departmentData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value ?? 0} employees`} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pie-legend">
                  {departmentData.map((entry) => (
                    <div key={entry.name} className="pie-legend-item">
                      <span className="pie-legend-dot" style={{ backgroundColor: entry.color }} />
                      <span className="pie-legend-name">{entry.name}</span>
                      <span className="pie-legend-value">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </section>

      <section className="dashboard-widget-flow">
        <section className="surface-card surface-card-soft dashboard-navigation-row">
          <p className="app-kicker">Navigation</p>
          <h2 className="section-title">Move through the platform faster.</h2>
          <p className="section-copy">
            Jump to core HR areas and complete daily workflows without leaving your dashboard.
          </p>

          <div className="dashboard-nav-flow" style={{ marginTop: "16px" }}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="nav-card">
                <h3 className="nav-card-title">{item.title}</h3>
                <p className="nav-card-copy">{item.copy}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="dashboard-panel-row">
          {user?.role === "admin" && (
            <section className="surface-card dashboard-panel-card">
              <p className="app-kicker">Admin Panel</p>
              <h2 className="section-title">Full system oversight.</h2>
              <p className="section-copy">
                You can manage all users, coordinate payroll release, and govern the overall HR operating model.
              </p>
            </section>
          )}

          {(user?.role === "admin" || user?.role === "hr") && (
            <section className="surface-card dashboard-panel-card">
              <p className="app-kicker">HR Panel</p>
              <h2 className="section-title">Approvals and workforce operations.</h2>
              <p className="section-copy">
                Employee administration, leave review, attendance visibility, and payroll generation all live here.
              </p>
            </section>
          )}
        </div>
      </section>

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}