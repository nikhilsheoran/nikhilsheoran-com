"use client";

import { useEffect } from "react";

export default function Error({
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
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{
        background: "#1e1e1e",
        fontFamily:
          "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
      }}
    >
      {/* Scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.08) 0px, rgba(0, 0, 0, 0.08) 1px, transparent 1px, transparent 3px)",
          mixBlendMode: "multiply",
        }}
      />

      {/* CRT vignette */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.5) 100%)",
        }}
      />

      <div className="relative z-20 max-w-xl px-6 text-center">
        {/* Apple logo / panic icon */}
        <div className="mb-8 flex justify-center">
          <svg
            width="48"
            height="58"
            viewBox="0 0 48 58"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ opacity: 0.9 }}
          >
            <path
              d="M39.7 30.3c-.1-5.5 4.5-8.2 4.7-8.3-2.6-3.7-6.5-4.2-7.9-4.3-3.4-.3-6.6 2-8.3 2s-4.3-1.9-7.1-1.9c-3.7.1-7 2.1-8.9 5.4-3.8 6.6-1 16.3 2.7 21.7 1.8 2.6 4 5.5 6.8 5.4 2.7-.1 3.7-1.8 7-1.8s4.2 1.8 7 1.7c2.9-.1 4.8-2.7 6.6-5.2 2.1-3 2.9-5.9 3-6.1-.1-.1-5.7-2.2-5.6-8.6zM34.4 13c1.5-1.8 2.5-4.3 2.2-6.8-2.1.1-4.7 1.4-6.2 3.2-1.4 1.6-2.6 4.1-2.3 6.6 2.4.2 4.8-1.2 6.3-3z"
              fill="rgba(255, 255, 255, 0.85)"
            />
          </svg>
        </div>

        <h1
          className="mb-4 font-medium"
          style={{
            fontSize: "18px",
            color: "rgba(255, 255, 255, 0.9)",
            letterSpacing: "0.02em",
          }}
        >
          Your computer restarted because of a problem.
        </h1>

        <p
          className="mx-auto mb-8"
          style={{
            fontSize: "12px",
            color: "rgba(255, 255, 255, 0.5)",
            lineHeight: 1.7,
            maxWidth: "400px",
          }}
        >
          Press any button to restart. If this problem persists, you
          may need to refresh the page or come back later.
        </p>

        {error.digest && (
          <p
            className="mb-8 mx-auto"
            style={{
              fontSize: "11px",
              color: "rgba(255, 255, 255, 0.3)",
              fontFamily: "'SF Mono', 'Menlo', monospace",
            }}
          >
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            type="button"
            className="rounded-md font-medium transition-all hover:brightness-110 active:brightness-90"
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "rgba(255, 255, 255, 0.85)",
              fontSize: "13px",
              padding: "7px 22px",
              letterSpacing: "0.01em",
              backdropFilter: "blur(10px)",
            }}
          >
            Try Again
          </button>

          {/* Plain <a> intentional — forces full reload to recover from error state */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="rounded-md font-medium text-white transition-all hover:brightness-110 active:brightness-90"
            style={{
              background: "linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)",
              boxShadow:
                "0 1px 3px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
              fontSize: "13px",
              padding: "7px 22px",
              letterSpacing: "0.01em",
            }}
          >
            Restart
          </a>
        </div>
      </div>
    </div>
  );
}
