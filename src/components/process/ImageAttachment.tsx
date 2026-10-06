"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import type { AIImageInput } from "@/lib/ai/types";

export function ImageAttachment({ images, onChange, onBusy, disabled }: {
  images: AIImageInput[];
  onChange: (images: AIImageInput[]) => void;
  onBusy: (busy: boolean) => void;
  disabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const reader = useRef<FileReader | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => () => { reader.current?.abort(); }, []);

  async function select(files: File[]) {
    if (!files.length || disabled || reader.current) return;
    setError("");
    if (images.length + files.length > 2) { setError("Attach at most two images. Remove one before adding another."); return; }
    if (files.some(file => !["image/png", "image/jpeg", "image/webp"].includes(file.type))) { setError("Choose PNG, JPEG, or WebP images."); return; }
    if (files.some(file => !file.size || file.size > 3 * 1024 * 1024)) { setError("Each image must be non-empty and up to 3 MB."); return; }
    setBusy(true); onBusy(true);
    try {
      const added: AIImageInput[] = [];
      for (const file of files) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const next = new FileReader(); reader.current = next;
          next.onload = () => resolve(String(next.result));
          next.onerror = () => reject(new Error("Unable to read this image. Try again."));
          next.onabort = () => reject(new DOMException("Cancelled", "AbortError"));
          next.readAsDataURL(file);
        });
        added.push({ name: file.name, dataUrl });
      }
      onChange([...images, ...added]);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") setError(error.message);
    } finally {
      reader.current = null; setBusy(false); onBusy(false);
    }
  }

  return <div className="mb-2 space-y-2">
    <button type="button" disabled={disabled || busy || images.length >= 2} onClick={() => input.current?.click()} className="flex items-center gap-1 rounded border px-2 py-1 text-xs disabled:opacity-40">
      <ImagePlus size={14} /> {busy ? "Reading images..." : `Attach images (${images.length}/2)`}
    </button>
    <input ref={input} type="file" multiple accept="image/png,image/jpeg,image/webp" aria-label="Attach up to two images for AI" className="hidden" onChange={event => { void select(Array.from(event.target.files || [])); event.target.value = ""; }} />
    {images.map((image, index) => <div key={`${index}-${image.name}`} className="rounded border border-slate-200 p-2">
      {/* A local data URL preview does not need the Next.js image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.dataUrl} alt={`Attachment: ${image.name}`} className="max-h-36 w-full rounded object-contain" />
      <div className="mt-1 flex items-center justify-between gap-2 text-xs">
        <span className="truncate">{image.name}</span>
        <button type="button" disabled={disabled || busy} onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove image ${index + 1}: ${image.name}`} className="rounded p-1 disabled:opacity-40"><X size={14} /></button>
      </div>
    </div>)}
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
  </div>;
}
