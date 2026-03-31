"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PayrollRecord } from "@/types/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getPayslip, downloadPayslipPDF } from "@/lib/api";

const MONTHS = [
  "","January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function PayslipContent() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [payslip, setPayslip] = useState<PayrollRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  async function handleDownload() {
  if (!payslip) return;
  setDownloading(true);
  try {
    const filename = `payslip_${payslip.employee.first_name.toLowerCase()}_${payslip.employee.last_name.toLowerCase()}_${payslip.year}_${String(payslip.month).padStart(2, "0")}.pdf`;
    await downloadPayslipPDF(payslip.id, filename);
  } catch (err: any) {
    alert("Failed to download PDF: " + err.message);
  } finally {
    setDownloading(false);
  }
}
  useEffect(() => {
    getPayslip(id)
      .then(setPayslip)
      .catch(() => setError("Payslip not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading payslip...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!payslip) return null;

  function fmt(value: number | string) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <button onClick={() => router.back()} style={{ marginBottom: "16px" }}>
        ← Back
      </button>
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
  <button onClick={() => router.back()}>
    ← Back
  </button>
  <button
    onClick={handleDownload}
    disabled={downloading}
    style={{
      background: "#1a237e",
      color: "white",
      border: "none",
      padding: "8px 16px",
      cursor: downloading ? "not-allowed" : "pointer",
      opacity: downloading ? 0.7 : 1,
    }}
  >
    {downloading ? "Generating PDF..." : "⬇ Download PDF"}
  </button>
</div>

      {/* payslip card */}
      <div style={{
        border: "1px solid #ddd",
        padding: "32px",
        background: "white",
      }}>
        {/* header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "28px",
          paddingBottom: "20px",
          borderBottom: "2px solid #333",
        }}>
          <div>
            <h1 style={{ fontSize: "22px", margin: 0 }}>HRMS</h1>
            <p style={{ color: "#888", margin: "4px 0 0", fontSize: "13px" }}>
              Payslip
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "18px", fontWeight: "bold" }}>
              {MONTHS[payslip.month]} {payslip.year}
            </div>
            <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
              #{String(payslip.id).padStart(6, "0")}
            </div>
          </div>
        </div>

        {/* employee info */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
            Employee
          </div>
          <div style={{ fontSize: "18px", fontWeight: "600" }}>
            {payslip.employee.first_name} {payslip.employee.last_name}
          </div>
          <div style={{ color: "#666", fontSize: "13px", marginTop: "2px" }}>
            {payslip.employee.job_title}
          </div>
        </div>

        {/* attendance stats */}
        <div style={{
          display: "flex",
          gap: "24px",
          padding: "12px 16px",
          background: "#f9f9f9",
          marginBottom: "24px",
          fontSize: "13px",
        }}>
          <span>
            <strong style={{ color: "#2e7d32" }}>{payslip.days_present}</strong> days present
          </span>
          <span>
            <strong style={{ color: "#c62828" }}>{payslip.days_absent}</strong> days absent
          </span>
          {Number(payslip.overtime_hours) > 0 && (
            <span>
              <strong>{Number(payslip.overtime_hours).toFixed(1)}h</strong> overtime
            </span>
          )}
        </div>

        {/* earnings breakdown */}
        <div style={{ marginBottom: "20px" }}>
          <div style={sectionHeader}>Earnings</div>

          <PayslipRow label="Base Salary" value={fmt(payslip.base_salary)} />

          {Number(payslip.overtime_bonus) > 0 && (
            <PayslipRow
              label="Overtime Bonus"
              value={fmt(payslip.overtime_bonus)}
            />
          )}

          {Number(payslip.performance_bonus) > 0 && (
            <PayslipRow
              label="Performance Bonus"
              value={fmt(payslip.performance_bonus)}
            />
          )}

          <PayslipRow
            label="Gross Salary"
            value={fmt(payslip.gross_salary)}
            bold
          />
        </div>

        {/* deductions breakdown */}
        <div style={{ marginBottom: "20px" }}>
          <div style={sectionHeader}>Deductions</div>

          <PayslipRow
            label="Income Tax"
            value={`-${fmt(payslip.income_tax)}`}
            negative
          />
          <PayslipRow
            label="Social Security (5%)"
            value={`-${fmt(payslip.social_security)}`}
            negative
          />
          <PayslipRow
            label="Total Deductions"
            value={`-${fmt(payslip.total_deductions)}`}
            bold
            negative
          />
        </div>

        {/* net pay — the big number */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px",
          background: "#1a237e",
          color: "white",
          marginTop: "8px",
        }}>
          <span style={{ fontSize: "16px", fontWeight: "600" }}>
            Net Pay
          </span>
          <span style={{ fontSize: "24px", fontWeight: "bold" }}>
            ${fmt(payslip.net_pay)}
          </span>
        </div>

        {/* payment status */}
        <div style={{
          marginTop: "16px",
          padding: "10px 16px",
          background: payslip.is_paid ? "#e8f5e9" : "#fff8e1",
          fontSize: "13px",
          display: "flex",
          justifyContent: "space-between",
        }}>
          <span style={{ fontWeight: "bold", color: payslip.is_paid ? "#2e7d32" : "#f57f17" }}>
            {payslip.is_paid ? "✓ Payment Confirmed" : "⏳ Payment Pending"}
          </span>
          {payslip.paid_at && (
            <span style={{ color: "#888" }}>
              {new Date(payslip.paid_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {payslip.notes && (
          <div style={{ marginTop: "12px", fontSize: "12px", color: "#888" }}>
            Note: {payslip.notes}
          </div>
        )}
      </div>
    </div>
  );
}

function PayslipRow({
  label,
  value,
  bold,
  negative,
}: {
  label: string;
  value: string;
  bold?: boolean;
  negative?: boolean;
}) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "6px 0",
      borderBottom: "1px solid #f0f0f0",
      fontWeight: bold ? "bold" : "normal",
      fontSize: "14px",
    }}>
      <span style={{ color: "#555" }}>{label}</span>
      <span style={{ color: negative ? "#c62828" : "#333" }}>{value}</span>
    </div>
  );
}

const sectionHeader = {
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "#888",
  marginBottom: "8px",
  paddingBottom: "4px",
  borderBottom: "1px solid #eee",
};

export default function PayslipPage() {
  return (
    <ProtectedRoute>
      <PayslipContent />
    </ProtectedRoute>
  );
}