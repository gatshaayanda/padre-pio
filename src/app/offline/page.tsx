import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="padreSite padreOfflinePage">
      <span className="padreBrandMark" aria-hidden="true">✚</span>
      <span className="padreEyebrow">CONNECTION INTERRUPTED</span>
      <h1>You’re offline <em>for now.</em></h1>
      <p>Some public information may be available on this device. Appointment requests and private information need a working connection and must be confirmed by the clinic.</p>
      <Link className="padreButton padreButtonPrimary" href="/">Return to the clinic website</Link>
    </main>
  );
}
