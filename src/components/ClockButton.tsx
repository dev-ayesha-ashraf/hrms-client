"use client";

import { useState, useEffect } from "react";
import { getAttendanceStatus, clockIn, clockOut } from "@/lib/api";
import { AttendanceStatus } from "@/types/auth";

export default function ClockButton() {
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // update the clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);  // cleanup on unmount
  }, []);

  // fetch current status on mount
  useEffect(() => {
    getAttendanceStatus()
      .then(setStatus)
      .catch(() => setError("Could not load attendance status"))
      .finally(() => setLoading(false));
  }, []);

  async function handleClockIn() {
    setActing(true);
    setError("");
    try {
      await clockIn();
      const updated = await getAttendanceStatus();
      setStatus(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActing(false);
    }
  }

  async function handleClockOut() {
    setActing(true);
    setError("");
    try {
      await clockOut();
      const updated = await getAttendanceStatus();
      setStatus(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActing(false);
    }
  }

  // format time from ISO string to readable local time
  function formatTime(isoString: string) {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // calculate how long they've been clocked in
  function getElapsedTime() {
    if (!status?.record?.clock_in) return "";
    const clockInTime = new Date(status.record.clock_in);
    const diff = currentTime.getTime() - clockInTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  if (loading) return <div className="surface-card">Loading attendance...</div>;

  const isClockedIn = status?.is_clocked_in;
  const record = status?.record;

  return (
    <div className="surface-card surface-card-soft" style={{ maxWidth: "360px", textAlign: "center" }}>
      <div style={{
        fontFamily: "monospace",
        fontSize: "32px",
        fontWeight: "bold",
        letterSpacing: "0.08em",
        marginBottom: "10px",
        color: "#0e2b69",
      }}>
        {currentTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </div>

      <div className="muted-text" style={{ fontSize: "13px", marginBottom: "16px" }}>
        {currentTime.toLocaleDateString([], {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>

      {/* status indicator */}
      <div style={{ marginBottom: "18px", fontSize: "14px" }}>
        {record?.clock_out ? (
          <div className="badge-success" style={{ display: "inline-flex", marginBottom: "10px" }}>
            Day complete
          </div>
        ) : isClockedIn ? (
          <div className="badge-accent" style={{ display: "inline-flex", marginBottom: "10px" }}>
            Clocked in
          </div>
        ) : (
          <div className="badge-neutral" style={{ display: "inline-flex", marginBottom: "10px" }}>
            Not clocked in
          </div>
        )}

        {record?.clock_out ? (
          <div className="muted-text" style={{ color: "#4d5d72" }}>
            Worked <strong style={{ color: "#0d2340" }}>{Number(record.hours_worked).toFixed(1)} hours</strong>
            <div style={{ fontSize: "12px", marginTop: "6px" }}>
              {formatTime(record.clock_in)} to {formatTime(record.clock_out)}
            </div>
          </div>
        ) : isClockedIn ? (
          <div style={{ color: "#1c8b64" }}>
            Since {formatTime(record!.clock_in)}
            <div className="muted-text" style={{ fontSize: "12px", marginTop: "6px" }}>
              Time elapsed: <strong style={{ color: "#0d2340" }}>{getElapsedTime()}</strong>
            </div>
          </div>
        ) : (
          <div className="muted-text">Ready to start today&apos;s session.</div>
        )}
      </div>

      {error && (
        <p className="form-error" style={{ marginBottom: "12px" }}>
          {error}
        </p>
      )}

      {!record?.clock_out && (
        <button
          onClick={isClockedIn ? handleClockOut : handleClockIn}
          disabled={acting}
          className={isClockedIn ? "app-button-danger" : "app-button"}
          style={{ width: "100%" }}
        >
          {acting ? "Please wait..." : isClockedIn ? "Clock Out" : "Clock In"}
        </button>
      )}
    </div>
  );
}