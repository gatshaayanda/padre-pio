"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2, Clock3, MapPin, Phone, ShieldCheck, Sparkles } from "lucide-react";

type FormState = {
  name: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  category: string;
  note: string;
  privacyConsent: boolean;
  website: string;
};

const initialForm: FormState = {
  name: "",
  phone: "",
  preferredDate: "",
  preferredTime: "",
  category: "appointment",
  note: "",
  privacyConsent: false,
  website: ""
};

function botswanaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Gaborone",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? "";
  return part("year") + "-" + part("month") + "-" + part("day");
}

function install() {
  window.dispatchEvent(new Event("padre-pio-open-install"));
}

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{ reference: string; duplicate?: boolean } | null>(null);
  const [error, setError] = useState("");
  const [today, setToday] = useState("");
  const [installed, setInstalled] = useState(false);
  const [requestId, setRequestId] = useState("");

  useEffect(() => {
    setToday(botswanaToday());
    const video = videoRef.current;
    if (!video) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType || "") || reducedMotion) return;
    video.src = "/videos/padre.mp4";
    video.load();
    const playback = video.play();
    if (playback) void playback.catch(() => undefined);
    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, []);

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true);
    const onInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  function change<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setReceipt(null);
    if (!form.privacyConsent) {
      setError("Please confirm that reception may use these details to respond to your request.");
      return;
    }
    setSubmitting(true);
    try {
      const id = requestId || window.crypto.randomUUID();
      setRequestId(id);
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: id,
          name: form.name,
          phone: form.phone,
          preferredDate: form.preferredDate,
          preferredTime: form.preferredTime,
          category: form.category,
          note: form.note,
          privacyConsent: form.privacyConsent,
          website: form.website
        })
      });
      const payload = await response.json() as { reference?: string; error?: string; duplicate?: boolean };
      if (!response.ok || !payload.reference) {
        throw new Error(payload.error || "Your request could not be sent. Please check your connection and try again.");
      }
      setReceipt({ reference: payload.reference, duplicate: payload.duplicate });
      setRequestId("");
      setForm(initialForm);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your request could not be sent. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="siteShell">
      <div className="topline"><div className="wrap toplineInner"><span>PADRE PIO MEDICAL CENTRE</span><span className="toplineLocation"><MapPin size={13} aria-hidden="true" /> GABORONE WEST · BOTSWANA</span></div></div>
      <header className="siteHeader">
        <div className="wrap navInner">
          <a className="brand" href="#top" aria-label="Padre Pio Medical Centre home"><span className="brandMark" aria-hidden="true"><span /></span><span className="brandWords"><strong>Padre Pio</strong><small>MEDICAL CENTRE</small></span></a>
          <nav className="mainNav" aria-label="Main navigation"><a href="#your-visit">Your visit</a><a href="#before-you-visit">Before you visit</a><a href="#location">Find us</a></nav>
          <div className="navActions">{!installed && <button className="installLink" type="button" onClick={install}>Install app <ArrowDown size={15} aria-hidden="true" /></button>}<a className="button buttonSmall" href="#request-appointment">Request appointment <ArrowUpRight size={15} aria-hidden="true" /></a></div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="heroMedia" aria-hidden="true"><img className="heroPoster" src="/videos/padre-poster.webp" alt="" /><video ref={videoRef} className="heroVideo" muted loop playsInline preload="none" poster="/videos/padre-poster.webp" aria-hidden="true" /><div className="heroShade" /></div>
        <div className="wrap heroContent">
          <div className="heroEyebrow"><span className="eyebrowDot" /> A clearer way to reach reception</div>
          <h1>Care starts<br /><em>with a welcome.</em></h1>
          <p>Find your way to Padre Pio, request an appointment, and let reception take it from there.</p>
          <div className="heroActions"><a className="button buttonLight" href="#request-appointment">Request an appointment <ArrowRight size={17} aria-hidden="true" /></a><a className="heroCall" href="tel:+2673164811"><Phone size={17} aria-hidden="true" /><span><small>Call reception</small><strong>+267 316 4811</strong></span></a></div>
          <div className="heroFoot"><span><ShieldCheck size={15} aria-hidden="true" /> Your request stays a request until reception confirms</span><a href="#your-visit">How it works <ArrowDown size={14} aria-hidden="true" /></a></div>
        </div>
        <div className="heroIndex" aria-hidden="true"><span>01</span><i /><span>WELCOME</span></div>
      </section>

      <section className="visitSection sectionPad" id="your-visit">
        <div className="wrap">
          <div className="sectionIntro"><div><span className="kicker">YOUR VISIT, MADE SIMPLE</span><h2>One small step.<br /><em>Then we’ll help.</em></h2></div><p>No long forms or medical history here. Share how reception can reach you and the time you would prefer. The clinic will confirm the next step with you.</p></div>
          <div className="visitSteps">
            <article className="visitStep"><span className="stepNumber">01</span><div className="stepIcon"><CalendarDays size={22} aria-hidden="true" /></div><h3>Tell us what suits you</h3><p>Choose a preferred date and time, then leave your contact details.</p></article>
            <article className="visitStep"><span className="stepNumber">02</span><div className="stepIcon"><Phone size={22} aria-hidden="true" /></div><h3>Reception reviews it</h3><p>Your request is sent for review. We do not show unverified live availability.</p></article>
            <article className="visitStep"><span className="stepNumber">03</span><div className="stepIcon"><CheckCircle2 size={22} aria-hidden="true" /></div><h3>Wait for confirmation</h3><p>Your appointment is confirmed only after the clinic contacts you.</p></article>
          </div>
        </div>
      </section>

      <section className="requestSection sectionPad" id="request-appointment">
        <div className="wrap requestGrid">
          <div className="requestAside"><span className="kicker">APPOINTMENT REQUEST</span><h2>Let’s find<br /><em>a time that works.</em></h2><p>Complete the short form and reception can follow up with you directly.</p><div className="privacyNote"><ShieldCheck size={19} aria-hidden="true" /><div><strong>Just the essentials</strong><span>Please do not include symptoms, diagnoses, medication details or other sensitive medical information in this form.</span></div></div><div className="asideContact"><Clock3 size={17} aria-hidden="true" /><span>Preferred times are requests, not live availability.</span></div><div className="emergencyNotice"><strong>Need urgent medical help?</strong><span>Do not use this form for emergencies. Seek urgent in-person medical care or contact local emergency services.</span></div></div>
          <div className="formCard">
            {receipt ? <div className="receiptState" role="status" aria-live="polite"><div className="receiptIcon"><CheckCircle2 size={28} aria-hidden="true" /></div><span className="kicker">REQUEST RECEIVED</span><h3>Thank you. Reception has your request.</h3><p>Your reference is <strong>{receipt.reference}</strong>. This is not an appointment confirmation. Please wait for reception to contact you.</p><button className="button buttonDark" type="button" onClick={() => { setReceipt(null); setError(""); }}>Make another request <ArrowRight size={16} aria-hidden="true" /></button></div> : (
              <form onSubmit={submit} className="appointmentForm">
                <div className="formHead"><span>01 / YOUR DETAILS</span><span>About 1 minute</span></div>
                <div className="fieldGrid"><label className="field"><span>Full name <b>*</b></span><input autoComplete="name" name="name" value={form.name} onChange={event => change("name", event.target.value)} minLength={2} maxLength={80} required placeholder="Name and surname" /></label><label className="field"><span>Phone number <b>*</b></span><input autoComplete="tel" inputMode="tel" name="phone" value={form.phone} onChange={event => change("phone", event.target.value)} minLength={7} maxLength={24} required placeholder="+267 ..." /></label></div>
                <div className="formHead formHeadSpaced"><span>02 / YOUR PREFERENCE</span><span>Not a booking yet</span></div>
                <div className="fieldGrid"><label className="field"><span>Preferred date <b>*</b></span><input type="date" name="preferredDate" value={form.preferredDate} onChange={event => change("preferredDate", event.target.value)} min={today || undefined} required /></label><label className="field"><span>Preferred time <b>*</b></span><input type="time" name="preferredTime" value={form.preferredTime} onChange={event => change("preferredTime", event.target.value)} required /></label></div>
                <label className="field"><span>What do you need help with? <b>*</b></span><select name="category" value={form.category} onChange={event => change("category", event.target.value)} required><option value="appointment">Appointment / consultation</option><option value="follow-up">Follow-up visit</option><option value="not-sure">Not sure — please guide me</option></select></label>
                <label className="field"><span>Short note <small>Optional</small></span><textarea name="note" value={form.note} onChange={event => change("note", event.target.value)} maxLength={300} rows={3} placeholder="A simple message for reception only — no medical history, please." /></label>
                <label className="consentField"><input type="checkbox" checked={form.privacyConsent} onChange={event => change("privacyConsent", event.target.checked)} required /><span>I agree that the clinic may use these details to respond to my appointment request. <a href="/privacy" target="_blank" rel="noreferrer">Privacy notice</a>.</span></label>
                <div className="honeypot" aria-hidden="true"><label>Leave this field empty<input tabIndex={-1} autoComplete="off" value={form.website} onChange={event => change("website", event.target.value)} /></label></div>
                {error && <p className="formError" role="alert">{error}</p>}
                <button className="button buttonDark submitButton" type="submit" disabled={submitting}>{submitting ? "Sending request…" : "Send appointment request"} <ArrowRight size={17} aria-hidden="true" /></button><p className="formFineprint">No payment is taken. No appointment is confirmed by this form.</p>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="faqSection sectionPad" id="before-you-visit">
        <div className="wrap faqGrid">
          <div><span className="kicker">BEFORE YOU VISIT</span><h2 className="faqTitle">A few quick<br /><em>answers.</em></h2><p className="faqIntro">We keep the guidance simple and avoid promising hours, services, or availability that the clinic has not yet confirmed for this website.</p></div>
          <div className="faqList">
            <details className="faqItem"><summary>Is my appointment confirmed when I submit?</summary><p>No. This form sends a request for reception to review. Your appointment is confirmed only after the clinic contacts you.</p></details>
            <details className="faqItem"><summary>What if I need urgent medical help?</summary><p>Do not use this form for emergencies; it is not an emergency channel. Seek urgent in-person medical care or contact local emergency services.</p></details>
            <details className="faqItem"><summary>Can I walk in?</summary><p>Please contact reception before travelling to confirm current opening hours and walk-in arrangements.</p></details>
            <details className="faqItem"><summary>Which services are available?</summary><p>The clinic’s approved public service list has not yet been verified for this website. If you are unsure, choose “Not sure — please guide me” and reception can advise on the next step.</p></details>
            <details className="faqItem"><summary>What should I write in the note?</summary><p>Keep it to a short logistical message. Please do not include symptoms, diagnoses, medication details, or medical history.</p></details>
          </div>
        </div>
      </section>

      <section className="locationSection sectionPad" id="location">
        <div className="wrap locationGrid">
          <div className="locationCopy"><span className="kicker">COME FIND US</span><h2>We’ll see you<br /><em>at the door.</em></h2><p>Look for Padre Pio Medical Centre in Gaborone West Phase 1. The entrance film above helps you recognise the place when you arrive.</p><div className="addressLine"><MapPin size={19} aria-hidden="true" /><span><strong>Plot 16739</strong><small>Gaborone West Phase 1, Gaborone, Botswana</small></span></div><div className="locationActions"><a className="button buttonDark" href="https://www.google.com/maps/search/?api=1&query=Padre%20Pio%20Medical%20Centre%20Plot%2016739%20Gaborone%20West%20Phase%201" target="_blank" rel="noreferrer">Directions <ArrowUpRight size={16} aria-hidden="true" /></a><a className="textLink" href="tel:+2673164811"><Phone size={16} aria-hidden="true" /> +267 316 4811</a></div><p className="contactCaveat">Please confirm contact details and opening hours with the clinic before travelling.</p></div>
          <div className="locationArtwork"><img src="/clinic-illustration.svg" alt="Illustration of a welcoming clinic entrance with a medical cross" loading="lazy" /><div className="artworkCaption"><Sparkles size={16} aria-hidden="true" /><span>A familiar place. A simpler first step.</span></div></div>
        </div>
      </section>

      <footer className="siteFooter"><div className="wrap footerTop"><a className="brand footerBrand" href="#top"><span className="brandMark" aria-hidden="true"><span /></span><span className="brandWords"><strong>Padre Pio</strong><small>MEDICAL CENTRE</small></span></a><p>Digital reception for Plot 16739, Gaborone West Phase 1.</p><div className="footerLinks"><a href="#request-appointment">Request appointment</a><a href="#location">Directions</a><a href="/privacy">Privacy</a><a href="/admin">Staff access</a>{!installed && <button type="button" onClick={install}>Install app</button>}</div></div><div className="wrap footerBottom"><span>PADRE PIO MEDICAL CENTRE · BOTSWANA</span><span>Requests are reviewed by reception; confirmation follows separately.</span></div></footer>
    </main>
  );
}