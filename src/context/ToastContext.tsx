"use client";

import { createContext, useCallback, useContext, useReducer, useRef } from "react";

// ── Types ─────────────────────────────────────────────────
export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  dismiss: (id: number) => void;
}

// ── Context ───────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

// ── Reducer ───────────────────────────────────────────────
type Action =
  | { type: "ADD"; toast: Toast }
  | { type: "REMOVE"; id: number };

function reducer(state: Toast[], action: Action): Toast[] {
  switch (action.type) {
    case "ADD":
      return [...state, action.toast];
    case "REMOVE":
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

// ── Provider ──────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    dispatch({ type: "REMOVE", id });
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = ++counter.current;
      dispatch({ type: "ADD", toast: { id, message, type } });
      setTimeout(() => dispatch({ type: "REMOVE", id }), 4000);
    },
    []
  );

  const success = useCallback((msg: string) => toast(msg, "success"), [toast]);
  const error = useCallback((msg: string) => toast(msg, "error"), [toast]);
  const info = useCallback((msg: string) => toast(msg, "info"), [toast]);
  const warning = useCallback((msg: string) => toast(msg, "warning"), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, info, warning, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ── Toast container UI ────────────────────────────────────
const TYPE_STYLES: Record<ToastType, { bar: string; icon: string }> = {
  success: { bar: "#1c8b64", icon: "✓" },
  error:   { bar: "#c73b57", icon: "✕" },
  warning: { bar: "#d98324", icon: "!" },
  info:    { bar: "#14d8c4", icon: "i" },
};

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => {
        const style = TYPE_STYLES[t.type];
        return (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "#ffffff",
              border: "1px solid rgba(13,35,64,0.09)",
              borderLeft: `4px solid ${style.bar}`,
              borderRadius: "10px",
              padding: "12px 16px",
              boxShadow: "0 8px 32px rgba(13,35,64,0.12)",
              minWidth: "260px",
              maxWidth: "380px",
              pointerEvents: "all",
              fontSize: "14px",
              color: "#0d2340",
              animation: "toast-in 0.22s ease",
            }}
          >
            <span
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: style.bar,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "12px",
                flexShrink: 0,
              }}
            >
              {style.icon}
            </span>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => onDismiss(t.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#5f6f82",
                fontSize: "16px",
                padding: "0 0 0 4px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
