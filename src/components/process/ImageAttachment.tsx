"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import type { AIImageInput } from "@/lib/ai/types";

export function ImageAttachment({ image, onChange, onBusy, disabled }: {
  image?: AIImageInput;
  onChange: (image: AIImageInput | undefined) => void;
  onBusy: (busy: boolean) => void;
  disabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const reader = useRef<FileReader | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => () => { reader.current?.abort(); }, []);

  function select(file?: File) {
    if (!file || disabled || busy) return;
    setError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError("Choose a PNG, JPEG, or WebP image."); return; }
    if (!file.size || file.size > 3 * 1024 * 1024) { setError("Choose a non-empty image up to 3 MB."); return; }
    const next = new FileReader(); reader.current = next;
    setBusy(true); onBusy(true);
    next.onload = () => onChange({ name: file.name, dataUrl: String(next.result) });
    next.onerror = () => setError("Unable to read this image. Try again.");
    next.onloadend = () => { reader.current = null; setBusy(false); onBusy(false); };
    next.readAsDataURL(file);
  }

  return <div className="mb-2 space-y-2">
    <button type="button" disabled={disabled || busy} onClick={() => input.current?.click()} className="flex items-center gap-1 rounded border px-2 py-1 text-xs disabled:opacity-40">
      <ImagePlus size={14} /> {busy ? "Reading image..." : image ? "Replace image" : "Attach image"}
    </button>
    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Attach image for AI" className="hidden" onChange={event => { select(event.target.files?.[0]); event.target.value = ""; }} />
    {image && <div className="rounded border border-slate-200 p-2">
      {/* A local data URL preview does not need the Next.js image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.dataUrl} alt={`Attachment: ${image.name}`} className="max-h-36 w-full rounded object-contain" />
      <div className="mt-1 flex items-center justify-between gap-2 text-xs">
        <span className="truncate">{image.name}</span>
        <button type="button" disabled={disabled || busy} onClick={() => onChange(undefined)} aria-label="Remove image" className="rounded p-1 disabled:opacity-40"><X size={14} /></button>
      </div>
    </div>}
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
  </div>;
}
