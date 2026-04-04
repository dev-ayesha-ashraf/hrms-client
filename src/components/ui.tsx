// ── Spinner ───────────────────────────────────────────────
export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        border: `${Math.max(2, size / 10)}px solid rgba(14,43,105,0.12)`,
        borderTopColor: "#14d8c4",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}

// ── Full-page loading overlay ─────────────────────────────
export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        color: "#5f6f82",
        fontSize: "14px",
      }}
    >
      <Spinner size={36} />
      <span>{label}</span>
    </div>
  );
}

// ── Inline section loader ─────────────────────────────────
export function SectionLoader() {
  return (
    <div
      style={{
        padding: "40px 0",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Spinner size={28} />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────
export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        textAlign: "center",
        color: "#5f6f82",
      }}
    >
      <span style={{ fontSize: "36px", lineHeight: 1 }}>{icon}</span>
      <p style={{ fontWeight: 600, color: "#0d2340", fontSize: "15px", margin: 0 }}>{title}</p>
      {description && (
        <p style={{ fontSize: "13px", margin: 0, maxWidth: "320px", lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: "8px" }}>{action}</div>}
    </div>
  );
}

// ── Inline error banner ───────────────────────────────────
export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      style={{
        padding: "14px 18px",
        background: "#fff1f4",
        border: "1px solid #f5c2cc",
        borderRadius: "10px",
        color: "#c73b57",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <span style={{ flexShrink: 0 }}>⚠</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: "#c73b57",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "5px 12px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
