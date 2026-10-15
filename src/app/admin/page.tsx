"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { onAuthStateChanged, signInWithCustomToken, signOut } from "firebase/auth";
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

const nextStatuses: Record<string, string[]> = {
  NEW: ["NEW", "REVIEWING", "CANCELLED"],
  REVIEWING: ["REVIEWING", "APPROVED", "RESCHEDULE_REQUESTED", "CANCELLED"],
  APPROVED: ["APPROVED", "CONFIRMED", "RESCHEDULE_REQUESTED", "CANCELLED"],
  CONFIRMED: ["CONFIRMED", "COMPLETED", "RESCHEDULE_REQUESTED", "CANCELLED"],
  RESCHEDULE_REQUESTED: ["RESCHEDULE_REQUESTED", "REVIEWING", "APPROVED", "CONFIRMED", "CANCELLED"],
  COMPLETED: ["COMPLETED"],
  CANCELLED: ["CANCELLED"],
};

function labelFor(value: string) {
  return ({
    GENERAL_APPOINTMENT: "General appointment",
    FOLLOW_UP: "Follow-up appointment",
    NOT_SURE: "Not sure — advise patient",
    HEALTH_CHECK: "Health check or screening enquiry",
    CHILD_HEALTH: "Child health or immunisation enquiry",
    WOMENS_HEALTH: "Women's health enquiry",
    TESTS_WOUND_CARE: "Tests or wound-care enquiry",
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
  const [accessWord, setAccessWord] = useState("");
  const [userUid, setUserUid] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  const filteredAppointments = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return appointments.filter((item) => {
      const matchesSearch = !term || [item.patientName, item.phone, item.id]
        .some((value) => String(value ?? "").toLocaleLowerCase().includes(term));
      const matchesStatus = statusFilter === "ALL"
        || (statusFilter === "NEEDS_REVIEW" && ["NEW", "REVIEWING", "APPROVED", "RESCHEDULE_REQUESTED"].includes(item.status))
        || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!hasFirebaseWebConfig) {
      setError("Reception access is not configured yet. No sign-in was attempted.");
      return;
    }
    try {
      const response = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ word: accessWord }),
      });
      const result = await response.json() as { token?: string; error?: string };
      if (!response.ok || !result.token) throw new Error(result.error || "Access denied. Check the access word and try again.");
      await signInWithCustomToken(auth, result.token);
      setAccessWord("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reception sign-in is temporarily unavailable.");
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
          <p>Enter the clinic’s authorised reception access word to review appointment requests.</p>
          <form className="padreFormCard" onSubmit={login}>
            <label>Reception access word<input type="password" autoComplete="current-password" value={accessWord} onChange={e=>setAccessWord(e.target.value)} required /></label>
            {error && <p className="padreFormError" role="alert">{error}</p>}
            <button className="padreButton padreButtonPrimary padreSubmitButton" type="submit">Enter reception <span aria-hidden="true">↗</span></button>
          </form>
          <Link className="padreTextLink" href="/">← Return to clinic website</Link>
        </section>
      ) : (
        <section className="padreQueue">
          <div className="padreQueueHeading"><div><span className="padreEyebrow">PRIVATE · AUTHORISED STAFF</span><h1>Appointment<br /><em>requests.</em></h1></div><div className="padreQueueCount"><strong>{filteredAppointments.length}</strong><span>shown · {appointments.length} loaded</span></div></div>
          <p className="padreQueueIntro">Review requests and record the clinic’s actual response. A saved status is an internal record update, not a message to the patient. Only mark a booking CONFIRMED after reception has confirmed it with the patient.</p>
          {error && <p className="padreFormError" role="alert">{error}</p>}
          {notice && <p className="padreFormNotice" role="status">{notice}</p>}
          <div className="padreQueueTools">
            <label>Find a request<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Patient, phone or reference" /></label>
            <label>Show<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">All statuses</option><option value="NEEDS_REVIEW">Needs review</option>
              {statuses.filter((status) => status !== "NEW" && status !== "REVIEWING" && status !== "APPROVED" && status !== "RESCHEDULE_REQUESTED").map((status) => <option key={status} value={status}>{labelFor(status)}</option>)}
            </select></label>
          </div>
          {loading ? <p className="padreQueueState">Loading the private queue…</p> : appointments.length === 0 ? <div className="padreQueueState"><strong>No appointment requests yet.</strong><p>New requests will appear here after they are successfully submitted.</p></div> : filteredAppointments.length === 0 ? <div className="padreQueueState"><strong>No matching requests.</strong><p>Try another name, phone number, reference or status filter.</p></div> : (
            <div className="padreAppointmentList">
              {filteredAppointments.map((item) => (
                <article className="padreAppointmentCard" key={item.id}>
                  <div className="padreAppointmentHead"><div><span className="padreAppointmentDate">RECEIVED · {formatDate(item.createdAt)}</span><h2>{item.patientName}</h2><a href={"tel:" + item.phone}>{item.phone}</a><small className="padreAppointmentReference">REFERENCE · {item.id}</small></div><span className={"padreStatus padreStatus" + item.status}>{labelFor(item.status)}</span></div>
                  <div className="padreAppointmentDetails"><div><small>PREFERRED DATE</small><strong>{item.preferredDate}</strong></div><div><small>TIME</small><strong>{labelFor(item.preferredTime)}</strong></div><div><small>REQUEST TYPE</small><strong>{labelFor(item.category)}</strong></div></div>
                  {item.patientNote && <p className="padrePatientNote"><small>PATIENT NOTE</small>{item.patientNote}</p>}
                  <form className="padreAdminUpdate" onSubmit={(event) => void saveAppointment(event, item.id)}>
                    <label>Record status<select name="status" defaultValue={item.status}>{(nextStatuses[item.status] || [item.status]).map(status=><option key={status} value={status}>{labelFor(status)}</option>)}</select></label>
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
