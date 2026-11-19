"use client";
import { useState } from "react";
import Link from "next/link";

export function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (password !== confirmation) { setError("The new passwords do not match"); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, password }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Unable to change your password"); return; }
      setCurrentPassword(""); setPassword(""); setConfirmation(""); setDone(true);
    } catch { setError("Unable to connect. Please try again."); }
    finally { setBusy(false); }
  }
  const input = "mt-1.5 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  return <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
    <h2 className="text-sm font-bold text-slate-900">Change password</h2>
    <p className="mt-1 text-sm text-slate-500">Use 12–128 characters. Changing your password signs you out on all devices.</p>
    {done ? <div role="status" className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">Your password has been changed. <Link href="/login" className="font-semibold underline">Sign in with your new password</Link>.</div> :
      <form onSubmit={submit} className="mt-5 max-w-md space-y-4">
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <label className="block text-sm font-medium">Current password<input type="password" autoComplete="current-password" required maxLength={128} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={input} /></label>
        <label className="block text-sm font-medium">New password<input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} className={input} /></label>
        <label className="block text-sm font-medium">Confirm new password<input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmation} onChange={e => setConfirmation(e.target.value)} className={input} /></label>
        <button disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? "Changing password..." : "Change password"}</button>
      </form>}
  </section>;
}
