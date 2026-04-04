"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getPayrollList,
  getMyPayslips,
  getEmployees,
  generatePayrollForEmployee,
  generateBulkPayroll,
  markPayrollPaid,
  exportPayrollCSV,
} from "@/lib/api";
import { PayrollRecord, Employee } from "@/types/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useRole } from "@/hooks/useAuth";
import { PageLoader, SectionLoader, EmptyState } from "@/components/ui";
import { useToast } from "@/context/ToastContext";

// month names helper
const MONTHS = [
  "","January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ── HR/ADMIN VIEW ─────────────────────────────────────────
function HRPayrollView() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const { isAdmin } = useRole();
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, [month, year]);

  async function fetchData() {
    setLoading(true);
    try {
      const [payroll, empsResponse] = await Promise.all([
        getPayrollList(month, year),
        getEmployees({ limit: 1000 }),
      ]);
      setPayrollRecords(payroll);
      const emps: Employee[] = empsResponse.data ?? empsResponse;
      setEmployees(emps.filter((e: Employee) => e.status === "active"));
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // check if payroll exists for an employee this month
  function getPayrollForEmployee(employeeId: number) {
    return payrollRecords.find((p) => p.employee.id === employeeId) || null;
  }

  // generate for a single employee
  async function handleGenerateSingle(employeeId: number) {
    setGeneratingId(employeeId);
    try {
      await generatePayrollForEmployee(employeeId, { month, year });
      await fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGeneratingId(null);
    }
  }

  // generate for all employees at once
  async function handleGenerateBulk() {
    const confirmed = window.confirm(
      `Generate payroll for ALL active employees for ${MONTHS[month]} ${year}?`
    );
    if (!confirmed) return;

    setGenerating(true);
    try {
      await generateBulkPayroll(month, year);
      await fetchData();
      toast.success("Bulk payroll generated.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleMarkPaid(payrollId: number) {
    setMarkingPaidId(payrollId);
    try {
      const updated = await markPayrollPaid(payrollId);
      setPayrollRecords((prev) =>
        prev.map((p) => (p.id === payrollId ? updated : p))
      );
      toast.success("Marked as paid.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setMarkingPaidId(null);
    }
  }

  // summary stats
  const totalGenerated = payrollRecords.length;
  const totalPaid = payrollRecords.filter((p) => p.is_paid).length;
  const totalNetPay = payrollRecords.reduce(
    (sum, p) => sum + Number(p.net_pay), 0
  );

  return (
    <div className="app-page app-stack">
      <div className="app-header">
        <div className="app-title-block">
          <p className="app-kicker">Payroll</p>
          <h1 className="app-title">Generate, verify, and release payroll with confidence.</h1>
          <p className="app-subtitle">
            Keep salary operations readable for HR while surfacing payment state clearly for the wider team.
          </p>
        </div>
        <div className="app-toolbar">
          <select className="app-select" value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ width: "auto", minWidth: "150px" }}>
            {MONTHS.slice(1).map((name, i) => (
              <option key={i} value={i + 1}>{name}</option>
            ))}
          </select>
          <select className="app-select" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: "auto", minWidth: "120px" }}>
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            className="app-button"
            onClick={handleGenerateBulk}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate All"}
          </button>
          <button
            className="app-button-ghost"
            onClick={async () => {
              setExporting(true);
              try { await exportPayrollCSV(month, year); }
              finally { setExporting(false); }
            }}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      <div className="metric-grid">
        <SummaryCard label="Active Employees" value={employees.length} />
        <SummaryCard label="Payroll Generated" value={`${totalGenerated} / ${employees.length}`} />
        <SummaryCard label="Paid Out" value={`${totalPaid} / ${totalGenerated}`} />
        <SummaryCard
          label="Total Net Pay"
          value={`$${totalNetPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          highlight
        />
      </div>

      {loading ? (
        <SectionLoader />
      ) : employees.length === 0 ? (
        <EmptyState icon="💰" title="No active employees" description="Add employees before generating payroll." />
      ) : (
        <div className="table-shell">
          <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Base Salary</th>
                <th>Gross</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Attendance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
              const payroll = getPayrollForEmployee(emp.id);
              return (
                <tr key={emp.id}>
                  <td>
                    <div className="person-meta">
                      <span className="person-name">{emp.first_name} {emp.last_name}</span>
                      <span className="person-subtext">{emp.job_title}</span>
                    </div>
                  </td>

                  {payroll ? (
                    <>
                      <td>${fmt(payroll.base_salary)}</td>
                      <td>${fmt(payroll.gross_salary)}</td>
                      <td style={{ color: "#c62828" }}>
                        -${fmt(payroll.total_deductions)}
                      </td>
                      <td style={{ fontWeight: "bold", color: "#2e7d32" }}>
                        ${fmt(payroll.net_pay)}
                      </td>
                      <td>
                        <span style={{ color: "#2e7d32" }}>{payroll.days_present}d</span>
                        {" / "}
                        <span style={{ color: "#c62828" }}>{payroll.days_absent}d</span>
                      </td>
                      <td>
                        {payroll.is_paid ? (
                          <span className="badge-success">Paid</span>
                        ) : (
                          <span className="badge-warning">Pending</span>
                        )}
                      </td>
                      <td>
                        <div className="app-actions">
                        <button
                          className="app-button-ghost"
                          onClick={() => router.push(`/payroll/${payroll.id}`)}
                        >
                          View
                        </button>
                        {isAdmin && !payroll.is_paid && (
                          <button
                            className="app-button-secondary"
                            onClick={() => handleMarkPaid(payroll.id)}
                            disabled={markingPaidId === payroll.id}
                          >
                            {markingPaidId === payroll.id ? "..." : "Mark Paid"}
                          </button>
                        )}
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ color: "#bbb" }} colSpan={5}>
                        Not generated
                      </td>
                      <td>
                        <span className="badge-neutral">—</span>
                      </td>
                      <td>
                        <button
                          className="app-button"
                          onClick={() => handleGenerateSingle(emp.id)}
                          disabled={generatingId === emp.id}
                        >
                          {generatingId === emp.id ? "..." : "Generate"}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── EMPLOYEE VIEW ─────────────────────────────────────────
function EmployeePayslipList() {
  const router = useRouter();
  const [payslips, setPayslips] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    getMyPayslips()
      .then(setPayslips)
      .catch((err: any) => setError(err.message ?? "Failed to load payslips"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader label="Loading payslips…" />;
  if (error) return <div className="app-page" style={{ padding: "40px" }}><p style={{ color: "#c73b57" }}>{error}</p></div>;

  return (
    <div className="app-page app-stack">
      <div className="app-title-block">
        <p className="app-kicker">Payroll</p>
        <h1 className="app-title">My Payslips</h1>
        <p className="app-subtitle">Review your payroll history, payment state, and monthly totals in a cleaner layout.</p>
      </div>
      {payslips.length === 0 ? (
        <EmptyState icon="💳" title="No payslips yet" description="Contact HR if you think this is an error." />
      ) : (
        <div className="table-shell">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Gross</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((p) => (
                  <tr key={p.id}>
                <td>
                  {MONTHS[p.month]} {p.year}
                </td>
                <td>${fmt(p.gross_salary)}</td>
                <td style={{ color: "#c62828" }}>
                  -${fmt(p.total_deductions)}
                </td>
                <td style={{ fontWeight: "bold", color: "#2e7d32" }}>
                  ${fmt(p.net_pay)}
                </td>
                <td>
                  {p.is_paid ? (
                    <span className="badge-success">Paid</span>
                  ) : (
                    <span className="badge-warning">Pending</span>
                  )}
                </td>
                <td>
                  <button className="app-button-ghost" onClick={() => router.push(`/payroll/${p.id}`)}>
                    View Payslip
                  </button>
                </td>
              </tr>
            ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SUMMARY CARD COMPONENT ────────────────────────────────
function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className={highlight ? "metric-card metric-card-accent" : "metric-card"}>
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
    </div>
  );
}

// ── HELPERS ───────────────────────────────────────────────
function fmt(value: number | string) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── MAIN PAGE ─────────────────────────────────────────────
function PayrollContent() {
  const { isAdminOrHR } = useRole();
  return isAdminOrHR ? <HRPayrollView /> : <EmployeePayslipList />;
}

export default function PayrollPage() {
  return (
    <ProtectedRoute>
      <PayrollContent />
    </ProtectedRoute>
  );
}