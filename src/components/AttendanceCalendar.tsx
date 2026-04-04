"use client";

import { useState, useEffect } from "react";
import { getAllAttendance, getEmployees, exportAttendanceCSV } from "@/lib/api";
import { AttendanceRecord, Employee } from "@/types/auth";

export default function AttendanceCalendar() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAllAttendance(month, year),
      getEmployees({ limit: 1000 }),
    ])
      .then(([attendanceData, employeeResponse]) => {
        setRecords(attendanceData);
        const employeeData: Employee[] = employeeResponse.data ?? employeeResponse;
        setEmployees(employeeData.filter((e: Employee) => e.status === "active"));
      })
      .finally(() => setLoading(false));
  }, [month, year]);

  // get number of days in the selected month
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // build a lookup: employeeId_date → record
  // e.g. "3_2026-03-15" → AttendanceRecord
  const lookup: Record<string, AttendanceRecord> = {};
  records.forEach((rec) => {
    const key = `${rec.employee.id}_${rec.date}`;
    lookup[key] = rec;
  });

  function getCell(employeeId: number, day: number) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const key = `${employeeId}_${dateStr}`;
    const rec = lookup[key];

    // future date
    const cellDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (cellDate > today) return { bg: "#fafafa", label: "" };

    // weekend
    const dayOfWeek = cellDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6)
      return { bg: "#f0f0f0", label: "—" };

    if (!rec) return { bg: "#ffebee", label: "A" };         // absent
    if (!rec.clock_out) return { bg: "#fff8e1", label: "●" }; // still in
    return { bg: "#e8f5e9", label: "P" };                   // present
  }

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  return (
    <div className="app-stack" style={{ gap: "16px" }}>
      <div className="app-toolbar">
        <select className="app-select" value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ width: "auto", minWidth: "150px" }}>
          {monthNames.map((name, i) => (
            <option key={i} value={i + 1}>{name}</option>
          ))}
        </select>
        <select className="app-select" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: "auto", minWidth: "120px" }}>
          {[2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button
          className="app-button-ghost"
          onClick={async () => {
            setExporting(true);
            try { await exportAttendanceCSV(month, year); }
            finally { setExporting(false); }
          }}
          disabled={exporting}
        >
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      <div className="app-toolbar muted-text" style={{ fontSize: "12px" }}>
        <span className="badge-success">P Present</span>
        <span className="badge-danger">A Absent</span>
        <span className="badge-warning">● In progress</span>
        <span className="badge-neutral">— Weekend</span>
      </div>

      {loading ? (
        <p>Loading calendar...</p>
      ) : (
        <div className="table-shell">
          <div className="table-scroll">
          <table className="data-table table-compact" style={{ minWidth: "980px" }}>
            <thead>
              <tr>
                <th style={{ minWidth: "180px" }}>
                  Employee
                </th>

                {days.map((d) => {
                  const dateObj = new Date(year, month - 1, d);
                  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                  const isToday =
                    d === now.getDate() &&
                    month === now.getMonth() + 1 &&
                    year === now.getFullYear();
                  return (
                    <th key={d} style={{
                      background: isToday ? "#0e2b69" : isWeekend ? "rgba(95,111,130,0.1)" : "rgba(238,247,245,0.86)",
                      color: isToday ? "#fff" : "#0d2340",
                      minWidth: "32px",
                      textAlign: "center",
                    }}>
                      {d}
                    </th>
                  );
                })}

                <th style={{ minWidth: "64px", textAlign: "center" }}>Days</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                // count present days for this employee this month
                const presentDays = days.filter((d) => {
                  const cell = getCell(emp.id, d);
                  return cell.label === "P";
                }).length;

                return (
                  <tr key={emp.id}>
                    <td>
                      <div className="person-meta">
                        <span className="person-name">{emp.first_name} {emp.last_name}</span>
                        <span className="person-subtext">{emp.job_title}</span>
                      </div>
                    </td>

                    {days.map((d) => {
                      const cell = getCell(emp.id, d);
                      return (
                        <td key={d} style={{
                          background: cell.bg,
                          textAlign: "center",
                          borderLeft: "1px solid #f0f0f0",
                          color: "#333",
                          fontWeight: cell.label === "A" ? "bold" : "normal",
                        }}>
                          {cell.label}
                        </td>
                      );
                    })}

                    <td style={{
                      textAlign: "center",
                      fontWeight: "bold",
                      color: presentDays > 0 ? "#2e7d32" : "#888",
                    }}>
                      {presentDays}
                    </td>
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
