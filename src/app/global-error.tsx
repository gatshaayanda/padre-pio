"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#f8f5ec", color: "#17251f" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <section style={{ width: "min(100%, 620px)", background: "#fffdf7", border: "1px solid rgba(23,76,60,.18)", padding: 30 }}>
            <strong style={{ color: "#174c3c", letterSpacing: ".12em" }}>PADRE PIO · MEDICAL CENTRE</strong>
            <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 500, fontSize: 38 }}>Something went wrong.</h1>
            <p style={{ color: "#52655b", lineHeight: 1.7 }}>Please try again. If you were sending an appointment request and did not see a receipt, do not assume it was submitted.</p>
            <button onClick={reset} style={{ padding: "13px 17px", border: 0, borderRadius: 3, background: "#174c3c", color: "#fffdf7", fontWeight: 800, cursor: "pointer" }}>Try again</button>
          </section>
        </main>
      </body>
    </html>
  );
}
