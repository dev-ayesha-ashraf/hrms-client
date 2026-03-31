"use client";

import { useState, useEffect } from "react";
import { getMyAttendanceHistory } from "@/lib/api";
import { AttendanceRecord } from "@/types/auth";

export default function AttendanceHistory() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMyAttendanceHistory(month, year)
      .then(setRecords)
      .finally(() => setLoading(false));
  }, [month, year]);

  const totalHours = records
    .filter((r) => r.hours_worked)
    .reduce((sum, r) => sum + Number(r.hours_worked), 0);

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  return (
    <div className="app-stack" style={{ gap: "16px" }}>
      <div className="app-toolbar">
        <select
          className="app-select"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          style={{ width: "auto", minWidth: "150px" }}
        >
          {monthNames.map((name, i) => (
            <option key={i} value={i + 1}>{name}</option>
          ))}
        </select>

        <select
          className="app-select"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          style={{ width: "auto", minWidth: "120px" }}
        >
          {[2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <span className="muted-text" style={{ marginLeft: "auto", fontSize: "13px" }}>
          {records.length} days worked ·{" "}
          <strong>{totalHours.toFixed(1)} total hours</strong>
        </span>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && records.length === 0 && (
        <div className="empty-state">No attendance records for this month.</div>
      )}

      {!loading && records.length > 0 && (
        <div className="table-shell">
          <div className="table-scroll">
            <table className="data-table table-compact">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      {new Date(rec.date).toLocaleDateString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td>{formatTime(rec.clock_in)}</td>
                    <td>
                      {rec.clock_out ? formatTime(rec.clock_out) : <span className="badge-warning">Still in</span>}
                    </td>
                    <td>{rec.hours_worked ? Number(rec.hours_worked).toFixed(1) + "h" : "—"}</td>
                    <td className="muted-text">{rec.note ?? "—"}</td>
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
