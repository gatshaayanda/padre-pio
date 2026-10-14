"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  collection, doc, getDoc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc
} from "firebase/firestore";
import { auth, db, hasFirebaseWebConfig } from "@/lib/firebase/client";

type Appointment = {
  id: string;
  patientUid: string;
  patientName: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  category: string;
  patientNote: string;
  status: string;
  adminNote?: string;
  createdAt?: { toDate?: () => Date } | string;
};

const statuses = [
  "NEW", "REVIEWING", "APPROVED", "CONFIRMED",
  "RESCHEDULE_REQUESTED", "COMPLETED", "CANCELLED"
];

function labelFor(value: string) {
  return ({
    GENERAL_APPOINTMENT: "General appointment",
    FOLLOW_UP: "Follow-up appointment",
    NOT_SURE: "Not sure — advise patient",
    MORNING: "Morning",
    AFTERNOON: "Afternoon",
    FLEXIBLE: "Flexible"
  } as Record<string, string>)[value] || value.replaceAll("_", " ");
}

function formatDate(value?: Appointment["createdAt"]) {
  if (!value) return "Just received";
  try {
    const date = typeof value === "object" && value.toDate ? value.toDate() : new Date(value as string);
    return Number.isNaN(date.getTime()) ? "Recently received" : date.toLocaleString();
  } catch {
    return "Recently received";
  }
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userUid, setUserUid] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!hasFirebaseWebConfig) return;
    return onAuthStateChanged(auth, async (user) => {
      setUserUid(user?.uid || "");
      setAuthorized(false);
      setAppointments([]);
      if (!user) return;
      try {
        const roleDoc = await getDoc(doc(db, "admins", user.uid));
        const role = roleDoc.exists() ? roleDoc.data().role : "";
        if (role === "owner" || role === "staff") {
          setAuthorized(true);
          setError("");
        } else {
          await signOut(auth);
          setError("This account is not authorised for reception access.");
        }
      } catch {
        setError("We couldn’t verify reception access. Check the project configuration and database rules.");
      }
    });
  }, []);

  useEffect(() => {
    if (!authorized || !userUid) return;
    setLoading(true);
    const q = query(collection(db, "appointments"), orderBy("createdAt", "desc"), limit(100));
    return onSnapshot(q, (snapshot) => {
      setAppointments(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Appointment)));
      setLoading(false);
    }, () => {
      setError("The appointment queue could not be loaded. Verify admin authorization and the database connection.");
      setLoading(false);
    });
  }, [authorized, userUid]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!hasFirebaseWebConfig) {
      setError("Reception access is not configured yet. No sign-in was attempted.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword("");
    } catch {
      setError("Sign-in failed. Check the credentials and whether Email/Password sign-in is enabled for the clinic’s Firebase project.");
    }
  }

  async function saveAppointment(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const status = String(form.get("status") || "");
    const adminNote = String(form.get("adminNote") || "").trim();
    if (!statuses.includes(status) || adminNote.length > 500) {
      setError("Check the status and keep the internal note under 500 characters.");
      return;
    }
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      await updateDoc(doc(db, "appointments", id), {
        status,
        adminNote,
        updatedAt: serverTimestamp()
      });
      setNotice("Appointment record updated.");
    } catch {
      setError("The update was not saved. Check your role and connection, then try again.");
    } finally {
      setBusyId("");
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      setAuthorized(false);
      setUserUid("");
      setNotice("Signed out.");
    } catch {
      setError("Could not sign out cleanly. Please retry.");
    }
  }

  if (!hasFirebaseWebConfig) {
    return <main className="padreSite padreAdminPage"><Link className="padreBrand" href="/"><span className="padreBrandMark" aria-hidden="true">✚</span><span><strong>PADRE PIO</strong><small>RECEPTION</small></span></Link><section className="padreAdminNotice"><span className="padreEyebrow">SETUP REQUIRED</span><h1>Reception is not connected yet.</h1><p>This admin area is not connected to a clinic Firebase project. No patient records are being read or written. Configure the dedicated project before use.</p><Link className="padreButton padreButtonPrimary" href="/">Return to website</Link></section></main>;
  }

  return (
    <main className="padreSite padreAdminPage">
      <header className="padreAdminHeader"><Link className="padreBrand" href="/"><span className="padreBrandMark" aria-hidden="true">✚</span><span><strong>PADRE PIO</strong><small>RECEPTION DESK</small></span></Link>{authorized && <button className="padreInstallLink" type="button" onClick={logout}>Sign out ↗</button>}</header>
      {!authorized ? (
        <section className="padreAdminLogin">
          <span className="padreEyebrow">STAFF ACCESS</span>
          <h1>Reception<br /><em>workspace.</em></h1>
          <p>Sign in with an authorised clinic staff account to review appointment requests.</p>
          <form className="padreFormCard" onSubmit={login}>
            <label>Email address<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
            <label>Password<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
            {error && <p className="padreFormError" role="alert">{error}</p>}
            <button className="padreButton padreButtonPrimary padreSubmitButton" type="submit">Sign in securely <span aria-hidden="true">↗</span></button>
          </form>
          <Link className="padreTextLink" href="/">← Return to clinic website</Link>
        </section>
      ) : (
        <section className="padreQueue">
          <div className="padreQueueHeading"><div><span className="padreEyebrow">PRIVATE · AUTHORISED STAFF</span><h1>Appointment<br /><em>requests.</em></h1></div><div className="padreQueueCount"><strong>{appointments.length}</strong><span>records loaded</span></div></div>
          <p className="padreQueueIntro">Review requests and record the clinic’s actual response. Only mark a booking CONFIRMED after reception has confirmed it with the patient.</p>
          {error && <p className="padreFormError" role="alert">{error}</p>}
          {notice && <p className="padreFormNotice" role="status">{notice}</p>}
          {loading ? <p className="padreQueueState">Loading the private queue…</p> : appointments.length === 0 ? <div className="padreQueueState"><strong>No appointment requests yet.</strong><p>New requests will appear here after they are successfully submitted.</p></div> : (
            <div className="padreAppointmentList">
              {appointments.map((item) => (
                <article className="padreAppointmentCard" key={item.id}>
                  <div className="padreAppointmentHead"><div><span className="padreAppointmentDate">RECEIVED · {formatDate(item.createdAt)}</span><h2>{item.patientName}</h2><a href={"tel:" + item.phone}>{item.phone}</a></div><span className={"padreStatus padreStatus" + item.status}>{labelFor(item.status)}</span></div>
                  <div className="padreAppointmentDetails"><div><small>PREFERRED DATE</small><strong>{item.preferredDate}</strong></div><div><small>TIME</small><strong>{labelFor(item.preferredTime)}</strong></div><div><small>REQUEST TYPE</small><strong>{labelFor(item.category)}</strong></div></div>
                  {item.patientNote && <p className="padrePatientNote"><small>PATIENT NOTE</small>{item.patientNote}</p>}
                  <form className="padreAdminUpdate" onSubmit={(event) => void saveAppointment(event, item.id)}>
                    <label>Record status<select name="status" defaultValue={item.status}>{statuses.map(status=><option key={status} value={status}>{labelFor(status)}</option>)}</select></label>
                    <label>Internal note<textarea name="adminNote" defaultValue={item.adminNote || ""} rows={2} maxLength={500} placeholder="Reception-only note. Do not record clinical history." /></label>
                    <button className="padreButton padreButtonPrimary" type="submit" disabled={busyId === item.id}>{busyId === item.id ? "Saving…" : "Save update"} <span aria-hidden="true">↗</span></button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
