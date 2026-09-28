"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Paperclip, Loader2 } from "lucide-react";
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { resultIndex: number; results: { length: number; [index: number]: { isFinal: boolean; [index: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
};
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
export function ChatInputTools({ processId, disabled, onAppend, onBusy }: { processId: string; disabled: boolean; onAppend: (text: string) => void; onBusy: (busy: boolean) => void }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [interim, setInterim] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const recognition = useRef<Recognition | null>(null);
  const upload = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const append = useRef(onAppend); append.current = onAppend;
  const reportBusy = useRef(onBusy); reportBusy.current = onBusy;
  useEffect(() => {
    const win = window as SpeechWindow;
    setSupported(!!(win.SpeechRecognition || win.webkitSpeechRecognition));
    return () => { if (recognition.current) { recognition.current.onresult = null; recognition.current.onerror = null; recognition.current.onend = null; recognition.current.abort(); } upload.current?.abort(); reportBusy.current(false); };
  }, []);
  useEffect(() => { if (disabled) { recognition.current?.abort(); upload.current?.abort(); } }, [disabled]);
  function toggleVoice() {
    if (recognition.current) { recognition.current.stop(); return; }
    const win = window as SpeechWindow;
    const Constructor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Constructor) return;
    setError(""); setNotice("");
    const speech = new Constructor(); recognition.current = speech;
    speech.lang = navigator.language || "en-US"; speech.continuous = true; speech.interimResults = true;
    speech.onresult = event => {
      let final = "", pending = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript + " ";
        else pending += event.results[i][0].transcript;
      }
      if (final.trim()) append.current(final.trim());
      setInterim(pending);
    };
    speech.onerror = event => { if (event.error !== "aborted") setError(event.error === "not-allowed" ? "Microphone access was denied. Allow it in your browser settings and try again." : "Voice input stopped (" + event.error + "). You can retry or type instead."); };
    speech.onend = () => { recognition.current = null; setListening(false); setInterim(""); reportBusy.current(false); };
    try { speech.start(); setListening(true); reportBusy.current(true); } catch { recognition.current = null; setError("Unable to start the microphone. Try again."); }
  }
  async function importFile(file?: File) {
    if (!file || disabled) return;
    setError(""); setNotice("");
    if (file.size > 4 * 1024 * 1024) { setError("Maximum file size is 4 MB."); return; }
    setUploading(true); reportBusy.current(true);
    const controller = new AbortController(); upload.current = controller;
    try {
      const res = await fetch("/api/processes/" + processId + "/document?name=" + encodeURIComponent(file.name), { method: "POST", body: file, signal: controller.signal });
      if (!res.headers.get("content-type")?.includes("application/json")) {
        throw new Error(res.status === 413 ? "The hosting server rejected the file size. Try a smaller document." : res.status === 504 ? "The hosting server timed out while reading the document. Try fewer pages." : `Document upload failed (HTTP ${res.status}). Check deployment server logs.`);
      }
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Unable to read document");
      append.current("Create or update the editable flowchart from this process document. Reconstruct any existing diagram, preserving its steps, arrow directions, labeled branches, loops, and owners. Ask about unreadable or ambiguous details instead of guessing:\n\n" + data.text);
      setNotice("Imported " + data.name);
    } catch (e: any) { if (e.name !== "AbortError") setError(e.message || "Document upload failed"); }
    finally { upload.current = null; setUploading(false); reportBusy.current(false); }
  }
  return <div className="mb-2 space-y-2">
    <div className="flex gap-2">
      <button type="button" onClick={toggleVoice} disabled={disabled || uploading || !supported} aria-pressed={listening} title={supported ? "Dictate using your microphone" : "Voice input is unavailable in this browser"} className="flex items-center gap-1 rounded border px-2 py-1 text-xs disabled:opacity-40">{listening ? <Square size={14}/> : <Mic size={14}/>} {listening ? "Stop recording" : "Voice"}</button>
      <button type="button" onClick={() => fileInput.current?.click()} disabled={disabled || uploading || listening} className="flex items-center gap-1 rounded border px-2 py-1 text-xs disabled:opacity-40">{uploading ? <Loader2 size={14} className="animate-spin"/> : <Paperclip size={14}/>} {uploading ? "Reading..." : "Import document"}</button>
      <input ref={fileInput} type="file" accept=".pdf,.docx,.txt,.md,.csv" className="hidden" aria-label="Import process document" onChange={e => { importFile(e.target.files?.[0]); e.target.value = ""; }}/>
    </div>
    {listening && <p role="status" className="text-xs text-red-600">Listening... {interim}</p>}
    {notice && <p role="status" className="text-xs text-blue-600">{notice}</p>}
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
  </div>;
}
