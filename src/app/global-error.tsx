"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body style={{ margin: 0, background: "#f7f4ec", color: "#1d302b", fontFamily: "Arial, sans-serif", padding: "48px 20px" }}><main style={{ maxWidth: 620, margin: "8vh auto" }}><p style={{ letterSpacing: ".16em", fontSize: 11, fontWeight: 700 }}>PADRE PIO MEDICAL CENTRE</p><h1 style={{ font: "500 44px/1.05 Georgia, serif" }}>We’re having a moment.</h1><p>The page could not load. Your appointment is not confirmed. Try again or contact reception.</p><button style={{ padding: "13px 18px", background: "#21483d", color: "white", border: 0 }} onClick={reset}>Try again</button></main></body></html>;
}