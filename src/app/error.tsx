"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="siteShell sectionPad"><div className="wrap" style={{ maxWidth: 650 }}><span className="kicker">A SMALL INTERRUPTION</span><h1 style={{ font: "500 clamp(40px, 7vw, 60px)/1 Georgia, serif", color: "#132e27" }}>That didn’t load<br />as expected.</h1><p style={{ color: "#5e6d65" }}>Your details have not been confirmed as submitted. Please try again, or call reception if you need help.</p><button className="button buttonDark" type="button" onClick={reset}>Try again</button></div></main>;
}