"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { ArrowLeft, ClipboardList, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { auth, hasFirebaseWebConfig } from "@/lib/firebase/client";

type Appointment = { id: string; reference: string; name: string; phone: string; preferredDate: string; preferredTime: string; category: string; note: string; status: string; adminNote: string; createdAt: string | null };
const STATUSES = ["NEW", "REVIEWING", "APPROVED", "CONFIRMED", "RESCHEDULE_REQUESTED", "COMPLETED", "CANCELLED"];
const NEXT: Record<string, string[]> = {
  NEW: ["REVIEWING", "CANCELLED"], REVIEWING: ["APPROVED", "RESCHEDULE_REQUESTED", "CANCELLED"],
  APPROVED: ["CONFIRMED", "RESCHEDULE_REQUESTED", "CANCELLED"], CONFIRMED: ["COMPLETED", "RESCHEDULE_REQUESTED", "CANCELLED"],
  RESCHEDULE_REQUESTED: ["REVIEWING", "APPROVED", "CONFIRMED", "CANCELLED"], COMPLETED: ["REVIEWING"], CANCELLED: ["REVIEWING"]
};
const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, char => char.toUpperCase());

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!auth) { setAuthReady(true); return; }
    return onAuthStateChanged(auth, next => { setUser(next); setAuthReady(true); });
  }, []);

  const loadAppointments = useCallback(async (currentUser: User) => {
    setLoading(true); setError("");
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/appointments", { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
      const payload = await response.json() as { appointments?: Appointment[]; error?: string };
      if (!response.ok) {
        if (response.status === 401 && auth) await signOut(auth);
        throw new Error(payload.error || "The queue could not be loaded.");
      }
      setAppointments(payload.appointments || []);
      setDraftNotes(Object.fromEntries((payload.appointments || []).map(item => [item.id, item.adminNote || ""])));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The queue could not be loaded."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user) void loadAppointments(user); else setAppointments([]); }, [user, loadAppointments]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    if (!auth) { setError("Staff sign-in is not configured. The clinic administrator must connect the dedicated Firebase project."); return; }
    setLoading(true);
    try { await signInWithEmailAndPassword(auth, email.trim(), password); setPassword(""); }
    catch { setError("Sign-in failed. Check your staff email and password, then try again."); }
    finally { setLoading(false); }
  }

  async function updateAppointment(item: Appointment, status: string) {
    if (!user) return;
    setBusyId(item.id); setError(""); setNotice("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/appointments", { method: "PATCH", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, status, adminNote: draftNotes[item.id] || "" }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "The update could not be saved.");
      setNotice("Saved " + item.reference + ". The status is now " + label(status) + ".");
      await loadAppointments(user);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The update could not be saved."); }
    finally { setBusyId(""); }
  }

  const filtered = useMemo(() => appointments.filter(item => {
    const matchesStatus = filter === "ALL" || item.status === filter;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [item.reference, item.name, item.phone].some(value => String(value || "").toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  }), [appointments, filter, search]);
  const counts = useMemo(() => ({
    fresh: appointments.filter(item => item.status === "NEW").length,
    review: appointments.filter(item => item.status === "REVIEWING").length,
    awaiting: appointments.filter(item => ["APPROVED", "RESCHEDULE_REQUESTED"].includes(item.status)).length,
    confirmed: appointments.filter(item => item.status === "CONFIRMED").length
  }), [appointments]);

  if (!authReady) return <main className="adminShell"><div className="adminLogin"><p>PADRE PIO · STAFF</p><h1>Checking access…</h1></div></main>;
  if (!user) return <main className="adminShell"><div className="adminLogin">
    <Link href="/" className="textLink"><ArrowLeft size={15} aria-hidden="true" /> Patient website</Link>
    <div className="stepIcon"><ShieldCheck size={28} aria-hidden="true" /></div><span className="kicker">AUTHORIZED STAFF ONLY</span><h1>Reception desk.</h1>
    <p>Sign in with your clinic staff account. Access is verified again on the server before any appointment data is returned.</p>
    {!hasFirebaseWebConfig && <div className="adminNotice">Staff sign-in is not configured yet. A dedicated Firebase project and clinic-approved staff accounts are required.</div>}
    <form onSubmit={login}><label>Staff email<input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>{error && <p className="formError" role="alert">{error}</p>}<button className="button buttonDark" type="submit" disabled={loading || !hasFirebaseWebConfig}>{loading ? "Signing in…" : "Sign in securely"}</button></form>
  </div></main>;

  return <main className="adminShell"><div className="adminPanel">
    <header className="adminHeader"><div><Link href="/" className="textLink"><ArrowLeft size={15} aria-hidden="true" /> Patient website</Link><span className="kicker" style={{ marginTop: 16 }}>PADRE PIO · OPERATIONS</span><h1>Appointment queue</h1><p>Review requests, update status, and leave an internal note.</p></div><div className="adminToolbar"><button className="adminButton" type="button" onClick={() => void loadAppointments(user)} disabled={loading}><RefreshCw size={14} aria-hidden="true" /> Refresh</button><button className="adminButton" type="button" onClick={() => auth && void signOut(auth)}><LogOut size={14} aria-hidden="true" /> Sign out</button></div></header>
    {error && <p className="formError" role="alert">{error}</p>}{notice && <p className="adminNotice" role="status">{notice}</p>}
    <div className="adminStats"><div className="adminStat"><small>New requests</small><strong>{counts.fresh}</strong></div><div className="adminStat"><small>Under review</small><strong>{counts.review}</strong></div><div className="adminStat"><small>Awaiting next step</small><strong>{counts.awaiting}</strong></div><div className="adminStat"><small>Confirmed</small><strong>{counts.confirmed}</strong></div></div>
    <section className="adminQueue"><div className="adminQueueHead"><h2><ClipboardList size={19} aria-hidden="true" style={{ verticalAlign: "middle", marginRight: 8 }} /> Recent requests <span style={{ color: "#7b867e", fontSize: 13 }}>({filtered.length})</span></h2><div className="adminToolbar"><input aria-label="Search requests" placeholder="Search name, phone, reference" value={search} onChange={event => setSearch(event.target.value)} /><select aria-label="Filter by status" value={filter} onChange={event => setFilter(event.target.value)}><option value="ALL">All statuses</option>{STATUSES.map(status => <option key={status} value={status}>{label(status)}</option>)}</select></div></div>
      {loading && appointments.length === 0 ? <div className="adminEmpty">Loading the queue…</div> : filtered.length === 0 ? <div className="adminEmpty">{appointments.length ? "No requests match this filter." : "No appointment requests yet. New submissions will appear here."}</div> : <div className="appointmentList">{filtered.map(item => <article className="appointmentRow" key={item.id}><div><div className="appointmentMeta"><span>{item.reference}</span><span>{item.createdAt ? new Date(item.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Received recently"}</span><span className={"statusPill " + (item.status === "CONFIRMED" ? "statusConfirmed" : item.status === "CANCELLED" ? "statusCancelled" : "")}>{label(item.status)}</span></div><h3>{item.name}</h3><div className="appointmentMeta"><a href={"tel:" + item.phone}>{item.phone}</a><span>Preferred: {item.preferredDate} at {item.preferredTime}</span><span>{label(item.category)}</span></div>{item.note && <p className="appointmentNote">Patient note: {item.note}</p>}<label className="field" style={{ marginTop: 12, maxWidth: 560 }}><span>Internal note</span><textarea rows={2} maxLength={1000} value={draftNotes[item.id] ?? ""} onChange={event => setDraftNotes(current => ({ ...current, [item.id]: event.target.value }))} placeholder="Reception-only note. Keep clinical records elsewhere." /></label></div><div className="appointmentActions"><select aria-label={"Update status for " + item.reference} value={item.status} disabled={busyId === item.id} onChange={event => void updateAppointment(item, event.target.value)}><option value={item.status}>{label(item.status)}</option>{(NEXT[item.status] || []).map(status => <option key={status} value={status}>{label(status)}</option>)}</select><button className="adminButton adminButtonPrimary" type="button" disabled={busyId === item.id || (draftNotes[item.id] || "") === (item.adminNote || "")} onClick={() => void updateAppointment(item, item.status)}>{busyId === item.id ? "Saving…" : "Save note"}</button></div></article>)}</div>}
    </section><p style={{ color: "#738078", fontSize: 11, marginTop: 18 }}>Status changes are recorded in the audit log. CONFIRMED means reception has actually confirmed the appointment with the patient.</p>
  </div></main>;
}
