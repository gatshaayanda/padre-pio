"use client";

export default function AppErrorFallback({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f8f5ec", fontFamily: "Arial, sans-serif", color: "#17251f" }}>
      <section style={{ width: "min(640px,100%)", background: "#fffdf7", border: "1px solid rgba(23,76,60,.18)", padding: 30 }}>
        <strong style={{ color: "#174c3c", fontSize: 12, letterSpacing: ".12em" }}>PADRE PIO · MEDICAL CENTRE</strong>
        <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 500 }}>This page could not load.</h1>
        <p style={{ color: "#52655b", lineHeight: 1.7 }}>Please try again. If you were sending an appointment request and did not receive a reference, do not assume it was submitted.</p>
        <button onClick={reset} style={{ border: 0, padding: "12px 18px", background: "#174c3c", color: "#fffdf7", fontWeight: 800, cursor: "pointer" }}>Try again</button>
      </section>
    </main>
  );
}
