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
  { value: "GENERAL_APPOINTMENT", label: "General consultation", detail: "Arrange a visit with the medical centre.", symbol: "✚" },
  { value: "FOLLOW_UP", label: "Follow-up visit", detail: "A return visit or follow-up arrangement.", symbol: "↻" },
  { value: "HEALTH_CHECK", label: "Health check or screening", detail: "Enquire about a check or screening.", symbol: "♡" },
  { value: "CHILD_HEALTH", label: "Child health or immunisation", detail: "Arrange an enquiry for a child.", symbol: "⌂" },
  { value: "WOMENS_HEALTH", label: "Women's health", detail: "Request a visit or ask reception for guidance.", symbol: "✿" },
  { value: "TESTS_WOUND_CARE", label: "Tests or wound-care enquiry", detail: "Ask reception about arranging a visit.", symbol: "＋" },
  { value: "NOT_SURE", label: "Not sure — please advise", detail: "Reception can help direct your request.", symbol: "?" }
];

const steps = [
  { number: "01", title: "Your visit", short: "Choose a reason", heading: "What brings you in?", intro: "Choose the option that feels closest. If you’re not sure, that’s completely fine." },
  { number: "02", title: "Preferred timing", short: "Pick your preference", heading: "When suits you best?", intro: "Share a date and time preference. Reception will confirm what can be arranged." },
  { number: "03", title: "Your details", short: "Let us reach you", heading: "Let’s keep in touch.", intro: "Just a couple of details so our reception team can respond to you." }
];

export default function AppointmentRequestPage() {
  const today = localDateInputValue();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState(categories[0].value);
  const [note, setNote] = useState("");
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [direction, setDirection] = useState("forward");

  useEffect(() => {
    const requestedType = new URLSearchParams(window.location.search).get("type");
    if (requestedType && categories.some((item) => item.value === requestedType)) setCategory(requestedType);
  }, []);

  function moveTo(next: number) {
    setDirection(next > step ? "forward" : "back");
    setStep(next);
    setError("");
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function continueToTiming() {
    setError("");
    moveTo(2);
  }

  function continueToContact() {
    setError("");
    if (!date) { setError("Choose a preferred date to continue."); return; }
    if (date < today) { setError("Choose today or a future date."); return; }
    if (!time) { setError("Choose a time preference to continue."); return; }
    moveTo(3);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!name.trim()) { setError("Enter your name so reception knows who to contact."); return; }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) {
      setError("Enter a valid phone number, including your country code if needed.");
      return;
    }
    if (!hasFirebaseWebConfig) {
      setError("Appointment requests are not connected yet. Nothing has been sent. Please use a reception contact channel verified by the clinic.");
      return;
    }
    if (date < today) {
      setStep(2);
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
        <div className="padreFormTop"><Link className="padreBrand" href="/"><span className="padreBrandMark" aria-hidden="true">✚</span><span><strong>PADRE PIO</strong><small>MEDICAL CENTRE</small></span></Link><span className="padreFormStep">REQUEST RECEIVED</span></div>
        <section className="padreFormCard padreSuccessCard padreBookingSuccess padreBookingAnimated">
          <span className="padreSuccessMark" aria-hidden="true">✓</span>
          <span className="padreEyebrow">THANK YOU — WE HAVE YOUR REQUEST</span>
          <h1>We’ll take it from here, {name.trim().split(/\s+/)[0]}.</h1>
          <p>Your request has been recorded for reception to review. Your preferred date and time are a request, not a confirmed booking.</p>
          <div className="padreReference"><small>YOUR REQUEST REFERENCE</small><strong>{reference}</strong></div>
          <div className="padreNextSteps"><strong>What happens next?</strong><ol><li>Reception reviews your request and preferred timing.</li><li>The clinic contacts you using the phone number you provided.</li><li>Your appointment is confirmed only when the clinic confirms it with you.</li></ol></div>
          <Link className="padreButton padreButtonPrimary" href="/account">Keep track of my request <span aria-hidden="true">↗</span></Link>
          <p className="padreAccountHint">Optional: set up your patient account to find your request history on another device and check reception’s latest saved status. You do not need an account to request a visit.</p>
          <Link className="padreButton padreButtonSecondary" href="/">Back to clinic information <span aria-hidden="true">↗</span></Link>
        </section>
        <footer className="padreFormFooter"><Link href="/">← Back to clinic information</Link><span>Not an emergency service</span><Link className="padreFormAdmin" href="/admin">Admin access ↗</Link></footer>
      </main>
    );
  }

  const current = steps[step - 1];

  return (
    <main className="padreSite padreFormPage padreBookingEditorial">
      <div className="padreFormTop"><Link className="padreBrand" href="/"><span className="padreBrandMark" aria-hidden="true">✚</span><span><strong>PADRE PIO</strong><small>MEDICAL CENTRE</small></span></Link><Link className="padreBookingBack" href="/">← Clinic home</Link></div>

      <section className="padreBookingHero">
        <div className="padreBookingHeroGlow" aria-hidden="true" />
        <div className="padreBookingIntroCopy">
          <span className="padreEyebrow"><span className="padreBookingEyebrowDot" aria-hidden="true" /> A LITTLE CARE STARTS HERE</span>
          <h1>Your health.<br /><em>One step at a time.</em></h1>
          <p>Let’s arrange your visit. It only takes a moment to tell us what you need and when you’d like to come in.</p>
          <div className="padreBookingTrustLine"><span aria-hidden="true">✳</span> Simple to complete <i /> No account needed <i /> Reception follows up</div>
        </div>
        <div className="padreBookingHeroArt" aria-hidden="true">
          <div className="padreBookingOrbit padreBookingOrbitOne" />
          <div className="padreBookingOrbit padreBookingOrbitTwo" />
          <div className="padreBookingHeart">✚</div>
          <span className="padreBookingFloat padreBookingFloatOne">Care, made simpler</span>
          <span className="padreBookingFloat padreBookingFloatTwo">You’re in good hands</span>
        </div>
      </section>

      <section className="padreBookingJourney" aria-label="Appointment request progress">
        <div className="padreBookingProgressTrack"><span style={{ width: `${(step / 3) * 100}%` }} /></div>
        <div className="padreBookingProgressItems">
          {steps.map((item, index) => {
            const number = index + 1;
            const state = number === step ? "isCurrent" : number < step ? "isComplete" : "";
            return <button key={item.number} type="button" className={`padreBookingProgressStep ${state}`} onClick={() => number < step && moveTo(number)} disabled={number >= step} aria-current={number === step ? "step" : undefined}>
              <span className="padreBookingProgressNumber">{number < step ? "✓" : item.number}</span><span className="padreBookingProgressLabels"><strong>{item.title}</strong><small>{number === step ? "You are here" : number < step ? "Completed" : item.short}</small></span>
            </button>;
          })}
        </div>
      </section>

      <section className="padreBookingLayout">
        <form className="padreFormCard padreBookingForm" onSubmit={submit}>
          <div key={step} className={`padreBookingStepPanel ${direction === "back" ? "isFromBack" : "isFromForward"}`} data-step-panel={step}>
            <div className="padreBookingSectionHeading padreBookingCurrentHeading"><span>{current.number}</span><div><h2>{current.heading}</h2><p>{current.intro}</p></div></div>

            {step === 1 && <div className="padreCategoryGrid" role="radiogroup" aria-label="Reason for appointment">
              {categories.map((item, index) => <label key={item.value} className={category === item.value ? "padreCategoryOption isSelected" : "padreCategoryOption"} style={{ animationDelay: `${index * 55}ms` }}>
                <input type="radio" name="category-choice" value={item.value} checked={category === item.value} onChange={() => setCategory(item.value)} />
                <span className="padreCategoryIcon" aria-hidden="true">{item.symbol}</span>
                <span className="padreCategoryText"><strong>{item.label}</strong><small>{item.detail}</small></span>
                <span className="padreCategoryRadio" aria-hidden="true">{category === item.value ? "✓" : "↗"}</span>
              </label>)}
              <p className="padreBookingGentleNote"><span aria-hidden="true">♡</span> You don’t need to share private health details here. Just choose the kind of visit you’re looking to arrange.</p>
            </div>}

            {step === 2 && <div className="padreBookingDatePanel">
              <div className="padreBookingCalendarGlyph" aria-hidden="true"><span>✳</span><strong>DATE</strong><small>YOUR PREFERENCE</small></div>
              <label className="padreBookingField">Preferred date<input type="date" value={date} onChange={e => setDate(e.target.value)} min={today} required /></label>
              <fieldset className="padreBookingTimeChoices"><legend>What time of day works for you?</legend>
                <label className={time === "MORNING" ? "padreBookingTimeOption isSelected" : "padreBookingTimeOption"}><input type="radio" name="time" value="MORNING" checked={time === "MORNING"} onChange={() => setTime("MORNING")} required /><span aria-hidden="true">☀</span><strong>Morning</strong><small>Start your day</small></label>
                <label className={time === "AFTERNOON" ? "padreBookingTimeOption isSelected" : "padreBookingTimeOption"}><input type="radio" name="time" value="AFTERNOON" checked={time === "AFTERNOON"} onChange={() => setTime("AFTERNOON")} /><span aria-hidden="true">◒</span><strong>Afternoon</strong><small>Later in the day</small></label>
                <label className={time === "FLEXIBLE" ? "padreBookingTimeOption isSelected" : "padreBookingTimeOption"}><input type="radio" name="time" value="FLEXIBLE" checked={time === "FLEXIBLE"} onChange={() => setTime("FLEXIBLE")} /><span aria-hidden="true">↔</span><strong>I’m flexible</strong><small>Reception can advise</small></label>
              </fieldset>
              <p className="padreBookingHint"><span aria-hidden="true">◷</span> This is a preferred time, not a reserved slot. The clinic will contact you to confirm a suitable appointment.</p>
            </div>}

            {step === 3 && <div className="padreBookingContactFields">
              <label className="padreBookingField">What should we call you?<input autoComplete="name" value={name} onChange={e => setName(e.target.value)} required maxLength={100} placeholder="Your full name" /></label>
              <label className="padreBookingField">Your phone number<input autoComplete="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} required maxLength={30} placeholder="+267 …" /></label>
              <label className="padreBookingField">A note for reception <span className="padreOptional">(optional)</span><textarea value={note} onChange={e => setNote(e.target.value)} maxLength={300} rows={3} placeholder="A practical note about arranging your visit — no medical details, please." /></label>
              <div className="padrePrivacyNote padreBookingPrivacy"><span aria-hidden="true">⌑</span><p><strong>Your privacy matters.</strong><br />Please don’t include symptoms, medical history, ID numbers or other sensitive health information in this form.</p></div>
              <div className="padreBookingReview"><span aria-hidden="true">✓</span><div><strong>That’s everything we need for now.</strong><p>Reception will review your request and contact you. Your visit is not booked until the clinic confirms it.</p></div></div>
            </div>}
          </div>

          {error && <p className="padreFormError" role="alert">{error}</p>}
          <div className="padreBookingActions">
            {step > 1 && <button className="padreBookingBackButton" type="button" onClick={() => moveTo(step - 1)}><span aria-hidden="true">←</span> Back</button>}
            {step < 3 ? <button className="padreButton padreButtonPrimary padreBookingContinue" type="button" onClick={step === 1 ? continueToTiming : continueToContact}>{step === 1 ? "Continue to preferred date" : "Continue to your details"} <span aria-hidden="true">→</span></button> : <button className="padreButton padreButtonPrimary padreBookingContinue" type="submit" disabled={busy}>{busy ? "Sending your request…" : "Send appointment request"} <span aria-hidden="true">→</span></button>}
          </div>
          <p className="padreFormFineprint">{step === 3 ? "By sending this request, you understand reception must confirm your appointment." : "Your details stay in this form as you move between steps. You can go back and change your answers."} This website is not an emergency service.</p>
        </form>

        <aside className="padreBookingAside">
          <div className="padreBookingAsideTop"><span className="padreEyebrow">WHAT HAPPENS NEXT</span><h2>A little clarity goes a long way.</h2><p>Online requests help you share your preferred timing before reception follows up.</p></div>
          <ol className="padreBookingTimeline"><li className={step >= 1 ? "isActive" : ""}><span>1</span><div><strong>You send your request</strong><p>Your visit type and preferences are recorded.</p></div></li><li className={step >= 2 ? "isActive" : ""}><span>2</span><div><strong>Reception reviews it</strong><p>The team checks your request and preferred timing.</p></div></li><li className={step >= 3 ? "isActive" : ""}><span>3</span><div><strong>The clinic contacts you</strong><p>Your appointment is confirmed only after the clinic responds.</p></div></li></ol>
          <div className="padreBookingAsideNote"><strong>Not sure what to choose?</strong><p>Pick “Not sure — please advise” and reception can help guide your next step.</p></div>
          <p className="padreBookingAsideFoot">For urgent or emergency medical needs, please don’t wait for an online request response. Seek appropriate urgent care.</p>
        </aside>
      </section>
      <footer className="padreFormFooter"><Link href="/">← Back to clinic information</Link><span>Not an emergency service</span><Link className="padreFormAdmin" href="/admin">Admin access ↗</Link></footer>
    </main>
  );
}
