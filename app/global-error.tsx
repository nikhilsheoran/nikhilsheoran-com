"use client";

import { useEffect } from "react";

// global-error.tsx must include its own <html> and <body> tags
// because it replaces the root layout when that layout itself errors.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1e1e1e",
            fontFamily: "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
          }}
        >
          {/* Scanline overlay */}
          <div
            style={{
              pointerEvents: "none",
              position: "fixed",
              inset: 0,
              zIndex: 10,
              background:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 3px)",
              mixBlendMode: "multiply",
            }}
          />
          {/* CRT vignette */}
          <div
            style={{
              pointerEvents: "none",
              position: "fixed",
              inset: 0,
              zIndex: 10,
              background:
                "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)",
            }}
          />

          <div style={{ position: "relative", zIndex: 20, maxWidth: 480, padding: "0 24px", textAlign: "center" }}>
            <div style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}>
              <svg width="48" height="58" viewBox="0 0 48 58" fill="none" style={{ opacity: 0.9 }}>
                <path
                  d="M39.7 30.3c-.1-5.5 4.5-8.2 4.7-8.3-2.6-3.7-6.5-4.2-7.9-4.3-3.4-.3-6.6 2-8.3 2s-4.3-1.9-7.1-1.9c-3.7.1-7 2.1-8.9 5.4-3.8 6.6-1 16.3 2.7 21.7 1.8 2.6 4 5.5 6.8 5.4 2.7-.1 3.7-1.8 7-1.8s4.2 1.8 7 1.7c2.9-.1 4.8-2.7 6.6-5.2 2.1-3 2.9-5.9 3-6.1-.1-.1-5.7-2.2-5.6-8.6zM34.4 13c1.5-1.8 2.5-4.3 2.2-6.8-2.1.1-4.7 1.4-6.2 3.2-1.4 1.6-2.6 4.1-2.3 6.6 2.4.2 4.8-1.2 6.3-3z"
                  fill="rgba(255,255,255,0.85)"
                />
              </svg>
            </div>

            <h1
              style={{
                marginBottom: 16,
                fontSize: 18,
                fontWeight: 500,
                color: "rgba(255,255,255,0.9)",
                letterSpacing: "0.02em",
              }}
            >
              Your computer restarted because of a problem.
            </h1>

            <p
              style={{
                marginBottom: 32,
                fontSize: 12,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.7,
                maxWidth: 400,
                margin: "0 auto 32px",
              }}
            >
              A critical error occurred. Press &ldquo;Restart&rdquo; to reload the page.
            </p>

            {error.digest && (
              <p
                style={{
                  marginBottom: 32,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                Error ID: {error.digest}
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button
                onClick={reset}
                type="button"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 13,
                  padding: "7px 22px",
                  borderRadius: 6,
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                }}
              >
                Try Again
              </button>

              <a
                href="/"
                style={{
                  background: "linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)",
                  boxShadow: "0 1px 3px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                  color: "#fff",
                  fontSize: 13,
                  padding: "7px 22px",
                  borderRadius: 6,
                  textDecoration: "none",
                  letterSpacing: "0.01em",
                  display: "inline-block",
                }}
              >
                Restart
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
