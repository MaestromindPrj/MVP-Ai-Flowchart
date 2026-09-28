"use client";
import { useEffect, useRef, useState } from "react";
type Share = { userId: string; permission: string; user: { name: string; email: string } };
export function ShareProcessModal({ processId, onClose }: { processId: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [shares, setShares] = useState<Share[]>([]);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("view");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const url = "/api/processes/" + processId + "/shares";
  async function load() {
    const res = await fetch(url); const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to load access list");
    setShares(data.shares);
  }
  useEffect(() => { dialog.current?.showModal(); load().catch(e => setError(e.message)).finally(() => setLoading(false)); }, [processId]);
  async function save(method: string, body: object) {
    setBusy(true); setError("");
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Unable to update access");
      await load(); if (method === "POST") setEmail("");
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="share-title" className="w-full max-w-lg rounded-xl p-6 shadow-xl backdrop:bg-slate-900/40">
    <div className="flex justify-between items-center"><h2 id="share-title" className="text-lg font-bold">Share flowchart</h2><button onClick={onClose} aria-label="Close sharing dialog" className="p-2">Close</button></div>
    <p className="text-sm text-slate-500 my-3">Share with a registered user's email. View allows reading and export. Edit also allows changes, AI edits, and version management. Only you can share or delete this flowchart.</p>
    {error && <p role="alert" className="text-sm text-red-600 my-3">{error}</p>}
    <form onSubmit={e => { e.preventDefault(); save("POST", { email, permission }); }} className="flex flex-wrap gap-2 my-4">
      <input aria-label="Recipient email" type="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" className="flex-1 min-w-40 border rounded-lg p-2 text-sm" />
      <select aria-label="Access permission" value={permission} onChange={e => setPermission(e.target.value)} className="border rounded-lg p-2 text-sm"><option value="view">Can view</option><option value="edit">Can edit</option></select>
      <button disabled={busy || loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">Share</button>
    </form>
    <h3 className="font-semibold text-sm mb-3">People with access</h3>
    {loading ? <p>Loading...</p> : shares.length === 0 ? <p className="text-sm text-slate-500">Only you have access.</p> : <ul className="space-y-3">{shares.map(share => <li key={share.userId} className="flex flex-wrap items-center gap-2 border-t pt-3"><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{share.user.name}</p><p className="text-xs text-slate-500 truncate">{share.user.email}</p></div><select aria-label={"Permission for " + share.user.email} disabled={busy} value={share.permission} onChange={e => save("POST", { email: share.user.email, permission: e.target.value })} className="border rounded p-1 text-sm"><option value="view">Can view</option><option value="edit">Can edit</option></select><button disabled={busy} onClick={() => save("DELETE", { userId: share.userId })} className="text-red-600 text-sm">Remove</button></li>)}</ul>}
  </dialog>;
}
