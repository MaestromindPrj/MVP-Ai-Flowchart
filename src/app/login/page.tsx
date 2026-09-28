"use client";
import { useState } from "react";
import { GitFork } from "lucide-react";
export default function LoginPage() {
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const res = await fetch(register ? "/api/auth/register" : "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, name, password }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      window.location.assign("/dashboard");
    } catch { setError("Unable to connect. Please try again."); }
    finally { setBusy(false); }
  }
  const input = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  return <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
    <div className="w-full max-w-md">
      <div className="text-center mb-8"><GitFork className="mx-auto mb-3 h-10 w-10 text-blue-600" /><h1 className="text-2xl font-bold text-slate-900">JV Process</h1><p className="mt-2 text-sm text-slate-500">Your processes. Your private workspace.</p></div>
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-5">{register ? "Create your account" : "Welcome back"}</h2>
        {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          {register && <label className="block text-sm font-medium">Name<input className={input} autoComplete="name" required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label>}
          <label className="block text-sm font-medium">Email<input className={input} type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label className="block text-sm font-medium">Password<input className={input} type="password" autoComplete={register ? "new-password" : "current-password"} required minLength={register ? 12 : 1} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} /></label>
          {register && <p className="text-xs text-slate-500">Use at least 12 characters. You control who can access the flowcharts you create.</p>}
          <button disabled={busy} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-semibold disabled:opacity-50">{busy ? "Please wait..." : register ? "Create account" : "Sign in"}</button>
        </form>
        <button disabled={busy} onClick={() => { setRegister(!register); setError(""); setPassword(""); }} className="mt-5 w-full text-sm text-blue-600">{register ? "Already have an account? Sign in" : "New here? Create an account"}</button>
      </div>
    </div>
  </main>;
}
