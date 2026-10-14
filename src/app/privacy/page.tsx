import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Privacy notice" };

export default function PrivacyPage() {
  return (
    <main className="siteShell sectionPad">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <Link href="/" className="textLink"><ArrowLeft size={16} aria-hidden="true" /> Back to home</Link>
        <span className="kicker" style={{ marginTop: 34 }}>PRIVACY NOTICE</span>
        <h1 style={{ font: "500 clamp(42px, 7vw, 64px)/1 Georgia, serif", letterSpacing: "-.05em", color: "#132e27" }}>Your details deserve care.</h1>
        <p style={{ color: "#5e6d65" }}>This digital reception form collects only the details needed for the clinic to respond to an appointment request: your name, phone number, preferred date and time, appointment category, and an optional short note.</p>
        <h2 style={{ font: "500 25px Georgia, serif", color: "#21483d", marginTop: 32 }}>How the details are used</h2>
        <p>Reception uses the information to review your request and contact you about the next step. Do not enter symptoms, diagnoses, medication details, test results, or other sensitive medical information. Sending a request does not confirm an appointment.</p>
        <h2 style={{ font: "500 25px Georgia, serif", color: "#21483d", marginTop: 32 }}>Storage and access</h2>
        <p>Requests are intended for authorized clinic reception staff. The system is designed to keep appointment records out of public browser access, but the clinic must configure its dedicated Firebase project, administrator access, retention period, and operational procedures before launch.</p>
        <h2 style={{ font: "500 25px Georgia, serif", color: "#21483d", marginTop: 32 }}>Your choices</h2>
        <p>Consent is required to submit the form. To ask about access, correction, deletion, or withdrawal of consent, contact clinic reception directly. The clinic should approve its official privacy contact and retention policy before this service is launched.</p>
        <p style={{ fontSize: 12, color: "#758078", marginTop: 36 }}>This notice is a product draft, not legal advice or a certification of compliance. The clinic must review it against Botswana’s applicable data-protection requirements and its own procedures.</p>
      </div>
    </main>
  );
}