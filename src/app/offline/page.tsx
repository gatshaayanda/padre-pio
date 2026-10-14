import Link from "next/link";
import { WifiOff, ArrowLeft } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="siteShell sectionPad">
      <div className="wrap" style={{ maxWidth: 680 }}>
        <div className="stepIcon"><WifiOff size={28} aria-hidden="true" /></div>
        <span className="kicker">CONNECTION PAUSED</span>
        <h1 style={{ font: "500 clamp(42px, 8vw, 64px)/1 Georgia, serif", letterSpacing: "-.05em", color: "#132e27" }}>You’re still welcome.<br /><em style={{ color: "#c66d4c" }}>Let’s reconnect.</em></h1>
        <p style={{ color: "#5e6d65", maxWidth: 480 }}>The saved public page may be available, but an appointment request cannot be sent until your connection returns. Nothing has been submitted offline.</p>
        <Link className="button buttonDark" href="/"><ArrowLeft size={16} aria-hidden="true" /> Return to Padre Pio</Link>
      </div>
    </main>
  );
}