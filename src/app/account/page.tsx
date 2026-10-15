"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  linkWithPopup,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { auth, hasFirebaseWebConfig } from "@/lib/firebase/client";

type PatientRequest = {
  id: string;
  reference: string;
  createdAt: string;
  preferredDate: string;
  preferredTime: string;
  category: string;
  status: string;
};

const statusCopy: Record<string, string> = {
  NEW: "Received by the website",
  REVIEWING: "Under reception review",
  APPROVED: "Reviewed by reception",
  CONFIRMED: "Confirmed by the clinic",
  RESCHEDULE_REQUESTED: "Reception needs to discuss another time",
  COMPLETED: "Visit completed",
  CANCELLED: "Cancelled",
};

const categoryCopy: Record<string, string> = {
  GENERAL_APPOINTMENT: "General consultation",
  FOLLOW_UP: "Follow-up visit",
  HEALTH_CHECK: "Health check or screening enquiry",
  CHILD_HEALTH: "Child health or immunisation enquiry",
  WOMENS_HEALTH: "Women's health enquiry",
  TESTS_WOUND_CARE: "Tests or wound-care enquiry",
  NOT_SURE: "Not sure — please advise",
};

export default function PatientAccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<PatientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showExistingAccount, setShowExistingAccount] = useState(false);
  const startingAnonymousSession = useRef(false);

  const loadRequests = useCallback(async (activeUser: User) => {
    const response = await fetch("/api/customer/appointments", {
      cache: "no-store",
      headers: { Authorization: "Bearer " + await activeUser.getIdToken() },
    });
    const result = await response.json() as { items?: PatientRequest[]; error?: string };
    if (!response.ok) throw new Error(result.error || "Your request history could not be loaded.");
    setRequests((result.items ?? []).map((item) => ({ ...item, reference: item.reference || item.id })));
  }, []);

  useEffect(() => {
    if (!hasFirebaseWebConfig) {
      setError("Patient accounts are not connected on this website yet. Your appointment request form remains available without an account.");
      setLoading(false);
      return;
    }
    let alive = true;
    const unsubscribe = onAuthStateChanged(auth, async (activeUser) => {
      if (!alive) return;
      if (!activeUser) {
        if (startingAnonymousSession.current) return;
        startingAnonymousSession.current = true;
        try {
          await setPersistence(auth, browserLocalPersistence);
          const credential = await signInAnonymously(auth);
          if (alive) {
            setUser(credential.user);
            try {
              await loadRequests(credential.user);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Your request history could not be loaded.");
            } finally {
              setLoading(false);
            }
          }
        } catch {
          if (alive) {
            setError("We could not open a private patient session. You can still request an appointment without creating an account.");
            setLoading(false);
          }
        } finally {
          startingAnonymousSession.current = false;
        }
        return;
      }
      setUser(activeUser);
      try {
        await loadRequests(activeUser);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Your request history could not be loaded.");
      } finally {
        if (alive) setLoading(false);
      }
    });
    return () => { alive = false; unsubscribe(); };
  }, [loadRequests]);

  async function refreshRequests() {
    if (!user) return;
    setRefreshing(true);
    setError("");
    setMessage("");
    try {
      await loadRequests(user);
      setMessage("Your request statuses have been refreshed from the clinic’s latest saved updates.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your request history could not be refreshed.");
    } finally {
      setRefreshing(false);
    }
  }

  async function secureAccount() {
    if (!user) return;
    setBusy(true);
    setError("");
    setMessage("");
    setShowExistingAccount(false);
    try {
      await setPersistence(auth, browserLocalPersistence);
      if (user.isAnonymous) await linkWithPopup(user, new GoogleAuthProvider());
      const current = auth.currentUser;
      if (current) {
        setUser(current);
        await loadRequests(current);
      }
      setMessage("Your Google account is connected to this patient identity. Requests made in this guest session remain linked to the same account.");
    } catch (err) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code?: unknown }).code) : "";
      if (["auth/credential-already-in-use", "auth/email-already-in-use", "auth/account-exists-with-different-credential"].includes(code)) {
        setShowExistingAccount(true);
        setMessage("That Google account already has a separate identity. You can sign in to it, but this guest request will not be merged automatically.");
      } else if (code === "auth/popup-closed-by-user") {
        setMessage("Account setup was cancelled. Your guest request remains saved.");
      } else if (["auth/operation-not-allowed", "auth/unauthorized-domain", "auth/configuration-not-found"].includes(code)) {
        setError("Google account linking is not enabled for this site yet. Your guest request remains saved; the clinic administrator needs to finish Firebase sign-in setup.");
      } else {
        setError("We could not secure your account right now. Your request remains saved; please try again later.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function signIntoExistingAccount() {
    setBusy(true);
    setError("");
    try {
      await setPersistence(auth, browserLocalPersistence);
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      setUser(credential.user);
      setShowExistingAccount(false);
      await loadRequests(credential.user);
      setMessage("You are signed into your existing account. The earlier guest-session request was not merged; keep its reference for reception if you need help finding it.");
    } catch {
      setError("We could not open that Google account. Your guest request has not been cancelled.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="padreSite padreFormPage padreAccountPage">
      <div className="padreFormTop">
        <Link className="padreBrand" href="/"><span className="padreBrandMark" aria-hidden="true">✚</span><span><strong>PADRE PIO</strong><small>MEDICAL CENTRE</small></span></Link>
        <span className="padreFormStep">YOUR VISITS · PRIVATE</span>
      </div>
      <section className="padreAccountIntro">
        <span className="padreEyebrow">YOUR PATIENT SPACE</span>
        <h1>Keep your next<br /><em>step close.</em></h1>
        <p>Use this space to check whether reception has reviewed your request and keep your references together. Connect Google after your first request so you can return to the same history if you change phones or browsers.</p>
      </section>
      <section className="padreFormCard padreAccountCard">
        <div className="padreAccountSectionHead"><span className="padreEyebrow">ACCOUNT ACCESS</span><h2>{user && !user.isAnonymous ? "Your account is connected." : "Start without another form."}</h2></div>
        {user && !user.isAnonymous
          ? <><p>Your Google account is connected. When you sign in with it on another device, this same patient identity can retrieve its request history.</p><button className="padreButton padreButtonSecondary" type="button" onClick={() => void refreshRequests()} disabled={refreshing || loading}>{refreshing ? "Refreshing…" : "Refresh request status"} <span aria-hidden="true">↻</span></button></>
          : <><p>You can leave this page and still request care without an account. We recommend securing this patient session with Google if you want to return to this same request history on another device. Account setup does not confirm or change an appointment.</p><button className="padreButton padreButtonPrimary" type="button" onClick={() => void secureAccount()} disabled={busy || !user}>{busy ? "Connecting…" : "Secure my patient account with Google"} <span aria-hidden="true">↗</span></button></>}
        {showExistingAccount && <button className="padreButton padreButtonSecondary" type="button" onClick={() => void signIntoExistingAccount()} disabled={busy}>Sign in to existing Google account</button>}
        {error && <p className="padreFormError" role="alert">{error}</p>}
        {message && <p className="padreFormNotice" role="status">{message}</p>}
      </section>
      <section className="padreAccountRequests">
        <div className="padreAccountSectionHead"><span className="padreEyebrow">YOUR REQUESTS</span><h2>Appointment history.</h2><p>Check the latest status saved by reception. Status changes are not push notifications; return here or refresh this list to check again.</p></div>
        {loading ? <p className="padreQueueState">Loading your private request history…</p>
          : requests.length === 0 ? <div className="padreAccountEmpty"><strong>No requests found in this patient session.</strong><p>If you submitted a request in another browser or used a separate account, the histories are not merged automatically. Your reference can help reception locate a request.</p><Link className="padreButton padreButtonPrimary" href="/appointments/request">Request an appointment <span aria-hidden="true">↗</span></Link></div>
          : <div className="padreAccountRequestList">{requests.map((item) => <article className="padreAccountRequest" key={item.id}><div><span className="padreEyebrow">REFERENCE · {item.reference}</span><h3>{categoryCopy[item.category] || "Appointment request"}</h3><p>{item.preferredDate || "Date not provided"} · {({ MORNING: "Morning", AFTERNOON: "Afternoon", FLEXIBLE: "Flexible" } as Record<string, string>)[item.preferredTime] || item.preferredTime}</p></div><span className={"padreStatus padreStatus" + item.status}>{statusCopy[item.status] || item.status.replaceAll("_", " ")}</span></article>)}</div>}
      </section>
      <div className="padreAccountPrivacy">Only request references, preferred timing and reception status are shown here. This is not a medical record. Please do not submit sensitive health details through this website.</div>
      <footer className="padreFormFooter"><Link href="/">← Back to clinic information</Link><Link href="/appointments/request">Request an appointment ↗</Link><Link className="padreFormAdmin" href="/admin">Admin access ↗</Link></footer>
    </main>
  );
}
