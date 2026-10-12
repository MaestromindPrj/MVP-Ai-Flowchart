"use client";
import { useEffect, useId, useState } from "react";
import { Gauge, X } from "lucide-react";

type Usage = { enabled: boolean; models: { model: string; percentUsed: number | null }[] };
export function AIUsage() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Usage | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    let busy = false;
    async function load() {
      if (busy) return;
      busy = true;
      try {
        const response = await fetch("/api/ai/usage", { cache: "no-store", signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load usage.");
        setData(result); setError("");
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to load usage.");
      } finally { busy = false; }
    }
    void load();
    const timer = setInterval(() => void load(), 5000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [open]);
  return <>
    <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700"><Gauge className="h-3.5 w-3.5" />Usage</button>
    {open && <section id={id} aria-label="Daily token usage" onKeyDown={event => { if (event.key === "Escape") setOpen(false); }} className="absolute inset-x-2 top-[72px] z-30 max-h-[70%] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl select-text">
      <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-900">Daily token usage</h3><button type="button" aria-label="Close usage" onClick={() => setOpen(false)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>
      {error && <p role="alert" className="mb-2 text-xs text-red-600">{error}</p>}
      {!data && !error && <p role="status" className="text-xs text-slate-500">Loading usage...</p>}
      {data && !data.enabled && <p className="text-xs text-slate-500">Demo AI has no token quota.</p>}
      {data?.models.map(model => <div key={model.model} className="mb-3 rounded-lg bg-slate-50 p-3">
        <p className="break-all text-xs font-medium text-slate-600">{model.model}</p>
        <p className="mt-1 text-xl font-semibold text-blue-700">{model.percentUsed === null ? "Unavailable" : `${model.percentUsed.toLocaleString(undefined, { maximumFractionDigits: 2 })}% used`}</p>
      </div>)}
      {data?.enabled && <p className="text-[11px] leading-relaxed text-slate-500">Each model's tracked tokens today / its daily allowance. Shared across users; UTC day. This server only; resets on restart and excludes earlier untracked usage. Assumes free-plan limits unless configured.</p>}
    </section>}
  </>;
}
