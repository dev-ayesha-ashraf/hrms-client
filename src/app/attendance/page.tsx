"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import ClockButton from "@/components/ClockButton";
import AttendanceHistory from "@/components/AttendanceHistory";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import { useRole } from "@/hooks/useAuth";

function AttendanceContent() {
  const { isAdminOrHR } = useRole();

  return (
    <div className="app-page app-stack">
      <header className="app-header">
        <div className="app-title-block">
          <p className="app-kicker">Attendance</p>
          <h1 className="app-title">Time, presence, and daily rhythm.</h1>
          <p className="app-subtitle">
            Keep clock-ins, work history, and monthly attendance patterns in one calm, readable workspace.
          </p>
        </div>
      </header>

      <div className="split-grid">
        <section className="surface-card surface-card-soft">
          <p className="app-kicker">Today</p>
          <h2 className="section-title">Live attendance status</h2>
          <p className="section-copy">Track the current day in real time and record the start or end of work with one action.</p>
          <div style={{ marginTop: "20px" }}>
            <ClockButton />
          </div>
        </section>

        <section className="surface-card">
          <p className="app-kicker">Overview</p>
          <h2 className="section-title">{isAdminOrHR ? "Monthly overview" : "My attendance history"}</h2>
          <p className="section-copy">
            {isAdminOrHR
              ? "Review employee presence across the month and scan for patterns quickly."
              : "Review your logged workdays, clock times, and recorded notes for the selected month."}
          </p>
          <div style={{ marginTop: "20px" }}>
            {isAdminOrHR ? <AttendanceCalendar /> : <AttendanceHistory />}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <ProtectedRoute>
      <AttendanceContent />
    </ProtectedRoute>
  );
}