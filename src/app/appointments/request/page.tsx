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
  { value: "GENERAL_APPOINTMENT", label: "General consultation", detail: "Arrange a visit with the medical centre." },
  { value: "FOLLOW_UP", label: "Follow-up visit", detail: "Return visit or follow-up arrangement." },
  { value: "HEALTH_CHECK", label: "Health check or screening", detail: "Enquire about a check or screening." },
  { value: "CHILD_HEALTH", label: "Child health or immunisation", detail: "Arrange an enquiry for a child." },
  { value: "WOMENS_HEALTH", label: "Women's health", detail: "Request a visit or ask reception for guidance." },
  { value: "TESTS_WOUND_CARE", label: "Tests or wound-care enquiry", detail: "Ask reception about arranging a visit." },
  { value: "NOT_SURE", label: "Not sure — please advise", detail: "Reception can help direct your request." }
];

export default function AppointmentRequestPage() {
  const today = localDateInputValue();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState(categories[0].value);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const requestedType = new URLSearchParams(window.location.search).get("type");
    if (requestedType && categories.some((item) => item.value === requestedType)) setCategory(requestedType);
  }, []);

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
      const credential = auth.currentUser ? { user: auth.currentUser } : await signInAnonymously(auth);
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
      <main className="padreSite padreFormPage padreBookingEditorial">
        <div className="padreFormTop"><Link className="padreBrand" href="/"><span className="padreBrandMark" aria-hidden="true">✚</span><span><strong>PADRE PIO</strong><small>MEDICAL CENTRE</small></span></Link><span className="padreFormStep">APPOINTMENT REQUEST · RECEIVED</span></div>
        <section className="padreFormCard padreSuccessCard padreBookingSuccess">
          <span className="padreSuccessMark" aria-hidden="true">✓</span>
          <span className="padreEyebrow">REQUEST RECEIVED</span>
          <h1>Thank you, {name.trim().split(/\s+/)[0]}.</h1>
          <p>Your request has been recorded for reception to review. Your preferred date and time are a request, not a confirmed booking.</p>
          <div className="padreReference"><small>YOUR REQUEST REFERENCE</small><strong>{reference}</strong></div>
          <div className="padreNextSteps"><strong>What happens next?</strong><ol><li>Reception reviews the details and preferred timing.</li><li>The clinic contacts you using the phone number you provided.</li><li>Your appointment is confirmed only when the clinic confirms it with you.</li></ol></div>
          <Link className="padreButton padreButtonPrimary" href="/account">Keep track of my request <span aria-hidden="true">↗</span></Link>
          <p className="padreAccountHint">Optional: set up your patient account to find your request history on another device and check reception’s latest saved status. You do not need an account to request a visit.</p>
          <Link className="padreButton padreButtonSecondary" href="/">Back to clinic information <span aria-hidden="true">↗</span></Link>
        </section>
        <footer className="padreFormFooter"><Link href="/">← Back to clinic information</Link><span>Not an emergency service</span><Link className="padreFormAdmin" href="/admin">Admin access ↗</Link></footer>
      </main>
    );
  }

  return (
    <main className="padreSite padreFormPage padreBookingEditorial">
      <div className="padreFormTop"><Link className="padreBrand" href="/"><span className="padreBrandMark" aria-hidden="true">✚</span><span><strong>PADRE PIO</strong><small>MEDICAL CENTRE</small></span></Link><span className="padreFormStep">A SIMPLE THREE-STEP REQUEST</span></div>

      <section className="padreBookingIntro">
        <div className="padreBookingIntroCopy">
          <span className="padreEyebrow"><span aria-hidden="true">✳</span> YOUR VISIT, YOUR NEXT STEP</span>
          <h1>A few details.<br /><em>We’ll help from here.</em></h1>
          <p>Tell us what kind of visit you’re arranging, when you would prefer to come, and how reception can reach you. You can request an appointment without creating an account.</p>
        </div>
        <div className="padreBookingProgress" aria-label="Three steps to request an appointment">
          <span><b>01</b><span><strong>Your visit</strong><small>What you need</small></span></span>
          <span><b>02</b><span><strong>Preferred timing</strong><small>Choose a date and time</small></span></span>
          <span><b>03</b><span><strong>Your details</strong><small>How we can reach you</small></span></span>
        </div>
      </section>

      <section className="padreBookingLayout">
        <form className="padreFormCard padreBookingForm" onSubmit={submit}>
          <section className="padreBookingSection" aria-labelledby="visit-heading">
            <div className="padreBookingSectionHeading"><span>01</span><div><h2 id="visit-heading">What brings you in?</h2><p>Choose the closest option. If you are unsure, reception can help guide you.</p></div></div>
            <div className="padreCategoryGrid" role="radiogroup" aria-label="Reason for appointment">
              {categories.map((item) => <label key={item.value} className={category === item.value ? "padreCategoryOption isSelected" : "padreCategoryOption"}>
                <input type="radio" name="category-choice" value={item.value} checked={category === item.value} onChange={() => setCategory(item.value)} />
                <span className="padreCategoryRadio" aria-hidden="true">{category === item.value ? "✓" : ""}</span>
                <span className="padreCategoryText"><strong>{item.label}</strong><small>{item.detail}</small></span>
              </label>)}
            </div>
          </section>

          <section className="padreBookingSection" aria-labelledby="timing-heading">
            <div className="padreBookingSectionHeading"><span>02</span><div><h2 id="timing-heading">When would you prefer to visit?</h2><p>These are preferences for reception to review, not live availability or a reserved slot.</p></div></div>
            <div className="padreFormRow padreBookingTiming">
              <label>Preferred date<input type="date" value={date} onChange={e => setDate(e.target.value)} min={today} required /></label>
              <label>Preferred time<select value={time} onChange={e => setTime(e.target.value)} required><option value="">Choose a preference</option><option value="MORNING">Morning</option><option value="AFTERNOON">Afternoon</option><option value="FLEXIBLE">Flexible — reception can advise</option></select></label>
            </div>
            <p className="padreBookingHint"><span aria-hidden="true">◷</span> The clinic will contact you to confirm a suitable time. Please wait for confirmation before treating the visit as booked.</p>
          </section>

          <section className="padreBookingSection" aria-labelledby="contact-heading">
            <div className="padreBookingSectionHeading"><span>03</span><div><h2 id="contact-heading">How can we reach you?</h2><p>Just the essentials needed to respond to your request.</p></div></div>
            <div className="padreBookingContactFields">
              <label>Full name<input autoComplete="name" value={name} onChange={e => setName(e.target.value)} required maxLength={100} placeholder="Your full name" /></label>
              <label>Phone number<input autoComplete="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} required maxLength={30} placeholder="+267 …" /></label>
              <label>Anything reception should know? <span className="padreOptional">(optional)</span><textarea value={note} onChange={e => setNote(e.target.value)} maxLength={300} rows={3} placeholder="A practical note about arranging your visit — no medical details, please." /></label>
            </div>
            <div className="padrePrivacyNote padreBookingPrivacy"><span aria-hidden="true">⌑</span><p><strong>Your privacy matters.</strong><br />Please don’t include symptoms, medical history, ID numbers or other sensitive health information in this form.</p></div>
          </section>

          {error && <p className="padreFormError" role="alert">{error}</p>}
          <button className="padreButton padreButtonPrimary padreSubmitButton" type="submit" disabled={busy}>{busy ? "Sending your request…" : "Send appointment request"} <span aria-hidden="true">→</span></button>
          <p className="padreFormFineprint">Your request is sent only when you select “Send appointment request”. Reception must confirm your appointment. This website is not an emergency service.</p>
        </form>

        <aside className="padreBookingAside">
          <div className="padreBookingAsideTop"><span className="padreEyebrow">A CLEAR NEXT STEP</span><h2>We’ll take it one step at a time.</h2><p>Requesting a visit online helps you share your preferred timing before reception follows up.</p></div>
          <ol className="padreBookingTimeline"><li><span>1</span><div><strong>You send your request</strong><p>Your preferred date, time and visit category are recorded.</p></div></li><li><span>2</span><div><strong>Reception reviews it</strong><p>The team checks your request and the timing you prefer.</p></div></li><li><span>3</span><div><strong>The clinic contacts you</strong><p>Your appointment is confirmed only after the clinic responds.</p></div></li></ol>
          <div className="padreBookingAsideNote"><strong>Need help choosing?</strong><p>Select “Not sure — please advise” and reception can guide your next step.</p></div>
          <p className="padreBookingAsideFoot">For urgent or emergency medical needs, do not wait for an online request response. Seek appropriate urgent care.</p>
        </aside>
      </section>
      <footer className="padreFormFooter"><Link href="/">← Back to clinic information</Link><span>Not an emergency service</span><Link className="padreFormAdmin" href="/admin">Admin access ↗</Link></footer>
    </main>
  );
}
