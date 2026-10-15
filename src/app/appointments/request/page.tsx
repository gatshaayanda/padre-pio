"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { signInAnonymously } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db, hasFirebaseWebConfig } from "@/lib/firebase/client";

function localDateInputValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const categories = [
  { value: "GENERAL_APPOINTMENT", label: "General consultation" },
  { value: "FOLLOW_UP", label: "Follow-up visit" },
  { value: "HEALTH_CHECK", label: "Health check or screening enquiry" },
  { value: "CHILD_HEALTH", label: "Child health or immunisation enquiry" },
  { value: "WOMENS_HEALTH", label: "Women's health enquiry" },
  { value: "TESTS_WOUND_CARE", label: "Tests or wound-care enquiry" },
  { value: "NOT_SURE", label: "Not sure — please advise" }
];

export default function AppointmentRequestPage() {
  const today = localDateInputValue();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState(categories[0].value);

  useEffect(() => {
    const requestedType = new URLSearchParams(window.location.search).get("type");
    if (requestedType && categories.some((item) => item.value === requestedType)) {
      setCategory(requestedType);
    }
  }, []);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!hasFirebaseWebConfig) {
      setError("Appointment requests are not connected yet. Nothing has been sent. Please use a reception contact channel verified by the clinic.");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) {
      setError("Enter a valid phone number, including your country code if needed.");
      return;
    }
    if (date < today) {
      setError("Choose today or a future date.");
      return;
    }
    setBusy(true);
    try {
      const credential = auth.currentUser
        ? { user: auth.currentUser }
        : await signInAnonymously(auth);
      const doc = await addDoc(collection(db, "appointments"), {
        patientUid: credential.user.uid,
        patientName: name.trim(),
        phone: phone.trim(),
        preferredDate: date,
        preferredTime: time,
        category,
        patientNote: note.trim(),
        status: "NEW",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setReference(doc.id);
    } catch {
      setError("We couldn’t submit your request. Nothing is confirmed. Check your connection and try again, or contact reception.");
    } finally {
      setBusy(false);
    }
  }

  if (reference) {
    return (
      <main className="padreSite padreFormPage">
        <Link className="padreBrand" href="/"><span className="padreBrandMark" aria-hidden="true">✚</span><span><strong>PADRE PIO</strong><small>MEDICAL CENTRE</small></span></Link>
        <section className="padreFormCard padreSuccessCard">
          <span className="padreSuccessMark" aria-hidden="true">✓</span>
          <span className="padreEyebrow">REQUEST RECEIVED</span>
          <h1>Thank you, {name.trim().split(/\s+/)[0]}.</h1>
          <p>Your appointment request has been sent to the clinic for review. This is not a confirmed booking; please wait for reception to respond.</p>
          <div className="padreNextSteps"><strong>What happens next?</strong><ol><li>Reception reviews your preferred date and time.</li><li>The clinic contacts you using the phone number provided.</li><li>Your visit is booked only after the clinic confirms it.</li></ol></div>
          <div className="padreReference"><small>YOUR REFERENCE</small><strong>{reference}</strong></div>
          <Link className="padreButton padreButtonPrimary" href="/account">Set up my patient account <span aria-hidden="true">↗</span></Link>
          <p className="padreAccountHint">Recommended, but optional: connect Google to return to this request history on another device and check reception’s latest saved status. You do not need an account to request a visit.</p>
          <Link className="padreButton padreButtonSecondary" href="/">Back to clinic information <span aria-hidden="true">↗</span></Link>
        </section>
        <footer className="padreFormFooter"><Link href="/">← Back to clinic information</Link><span>Not an emergency service</span><Link className="padreFormAdmin" href="/admin">Admin access ↗</Link></footer>
      </main>
    );
  }

  return (
    <main className="padreSite padreFormPage">
      <div className="padreFormTop"><Link className="padreBrand" href="/"><span className="padreBrandMark" aria-hidden="true">✚</span><span><strong>PADRE PIO</strong><small>MEDICAL CENTRE</small></span></Link><span className="padreFormStep">APPOINTMENT REQUEST · 01</span></div>
      <section className="padreFormLayout">
        <div className="padreFormIntro">
          <span className="padreEyebrow">LET RECEPTION KNOW</span>
          <h1>Request a<br /><em>time to visit.</em></h1>
          <p>Tell reception how to reach you and when you would prefer to visit. You can send a request without creating an account.</p>
          <div className="padreRequestSteps"><span><b>01</b> You send your preferred time</span><span><b>02</b> Reception reviews it</span><span><b>03</b> The clinic contacts you</span></div>
          <div className="padrePrivacyNote"><span aria-hidden="true">⌑</span><p><strong>Keep it simple and private.</strong><br />Please don’t include detailed symptoms, medical history, ID numbers or other sensitive medical information in this form.</p></div>
        </div>
        <form className="padreFormCard" onSubmit={submit}>
          <div className="padreFormFields">
            <label>Full name<input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required maxLength={100} placeholder="Your name" /></label>
            <label>Phone number<input autoComplete="tel" inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} required maxLength={30} placeholder="+267 ..." /></label>
            <div className="padreFormRow">
              <label>Preferred date<input type="date" value={date} onChange={e=>setDate(e.target.value)} min={today} required /></label>
              <label>Preferred time<select value={time} onChange={e=>setTime(e.target.value)} required><option value="">Choose a time</option><option value="MORNING">Morning</option><option value="AFTERNOON">Afternoon</option><option value="FLEXIBLE">Flexible</option></select></label>
            </div>
            <label>What is this appointment for?<select value={category} onChange={e=>setCategory(e.target.value)} required>{categories.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label>Optional note <span className="padreOptional">(not for medical history)</span><textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={300} rows={3} placeholder="Anything reception needs to know about arranging the visit?" /></label>
          </div>
          {error && <p className="padreFormError" role="alert">{error}</p>}
          <button className="padreButton padreButtonPrimary padreSubmitButton" type="submit" disabled={busy}>{busy ? "Sending request…" : "Send appointment request"} <span aria-hidden="true">↗</span></button>
          <p className="padreFormFineprint">Your request is only sent after you select “Send”. A booking is confirmed only when the clinic confirms it.</p>
        </form>
      </section>
      <footer className="padreFormFooter"><Link href="/">← Back to clinic information</Link><span>Not an emergency service</span><Link className="padreFormAdmin" href="/admin">Admin access ↗</Link></footer>
    </main>
  );
}
