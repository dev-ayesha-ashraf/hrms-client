"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getNotifications,
  getNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api";
import { AppNotification } from "@/types/auth";

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // fetch unread count on mount and every 30 seconds
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchCount() {
    try {
      const data = await getNotificationCount();
      setCount(data.unread_count);
    } catch {}  // fail silently — don't break the UI
  }

  async function handleOpen() {
    setOpen((prev) => !prev);
    if (!open) {
      setLoading(true);
      try {
        const data = await getNotifications();
        setNotifications(data);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleNotificationClick(notification: AppNotification) {
    // mark as read
    if (!notification.is_read) {
      await markNotificationRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      setCount((prev) => Math.max(0, prev - 1));
    }

    // navigate if there's a link
    if (notification.link) {
      setOpen(false);
      router.push(notification.link);
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setCount(0);
  }

  // icon color per notification type
  const typeIcon: Record<string, string> = {
    success: "✓",
    warning: "⚠",
    error: "✕",
    info: "ℹ",
  };

  const typeColor: Record<string, string> = {
    success: "#2e7d32",
    warning: "#f57f17",
    error: "#c62828",
    info: "#1565c0",
  };

  function timeAgo(dateStr: string) {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(dateStr).getTime()) / 1000
    );
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* bell button */}
      <button
        onClick={handleOpen}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "20px",
          position: "relative",
          padding: "4px 8px",
        }}
        title="Notifications"
      >
        🔔
        {/* unread badge */}
        {count > 0 && (
          <span style={{
            position: "absolute",
            top: "0px",
            right: "0px",
            background: "#c62828",
            color: "white",
            borderRadius: "50%",
            width: "18px",
            height: "18px",
            fontSize: "11px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* dropdown panel */}
      {open && (
        <div style={{
          position: "absolute",
          right: 0,
          top: "100%",
          width: "340px",
          background: "white",
          border: "1px solid #ddd",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          zIndex: 200,
          maxHeight: "420px",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* dropdown header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid #eee",
          }}>
            <span style={{ fontWeight: "bold", fontSize: "14px" }}>
              Notifications {count > 0 && (
                <span style={{
                  background: "#c62828",
                  color: "white",
                  borderRadius: "10px",
                  padding: "1px 7px",
                  fontSize: "11px",
                  marginLeft: "6px",
                }}>
                  {count}
                </span>
              )}
            </span>
            {count > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#1565c0",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* notification list */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? (
              <p style={{ textAlign: "center", color: "#888", padding: "20px" }}>
                Loading...
              </p>
            ) : notifications.length === 0 ? (
              <p style={{ textAlign: "center", color: "#888", padding: "24px" }}>
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f5f5f5",
                    cursor: n.link ? "pointer" : "default",
                    background: n.is_read ? "white" : "#f8f9ff",
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                  }}
                >
                  {/* type icon */}
                  <span style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: typeColor[n.type] + "22",
                    color: typeColor[n.type],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "bold",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}>
                    {typeIcon[n.type]}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "13px",
                      fontWeight: n.is_read ? "normal" : "bold",
                      color: "#222",
                      marginBottom: "2px",
                    }}>
                      {n.title}
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: "#666",
                      lineHeight: "1.4",
                      wordBreak: "break-word",
                    }}>
                      {n.message}
                    </div>
                    <div style={{
                      fontSize: "11px",
                      color: "#aaa",
                      marginTop: "4px",
                    }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>

                  {/* unread dot */}
                  {!n.is_read && (
                    <div style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#1565c0",
                      flexShrink: 0,
                      marginTop: "6px",
                    }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}