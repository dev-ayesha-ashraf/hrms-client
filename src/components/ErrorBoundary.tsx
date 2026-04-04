"use client";

import React from "react";

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f4f8f7",
            padding: "24px",
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(13,35,64,0.08)",
              borderRadius: "16px",
              padding: "40px 48px",
              maxWidth: "480px",
              textAlign: "center",
              boxShadow: "0 22px 60px rgba(13,35,64,0.08)",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "#c73b5715",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "24px",
              }}
            >
              ⚠
            </div>
            <h2 style={{ color: "#0d2340", fontSize: "20px", fontWeight: 600, marginBottom: "10px" }}>
              Something went wrong
            </h2>
            <p style={{ color: "#5f6f82", fontSize: "14px", marginBottom: "24px", lineHeight: 1.6 }}>
              {this.state.message}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                className="app-button-secondary"
                onClick={this.handleReset}
              >
                Try again
              </button>
              <button
                className="app-button"
                onClick={() => (window.location.href = "/")}
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
