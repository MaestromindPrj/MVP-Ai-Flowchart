import { NextRequest, NextResponse } from "next/server";
import { authorizeProcess } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import mammoth from "mammoth";
import { AIServiceError } from "@/lib/ai/validation";
export const runtime = "nodejs";
export const maxDuration = 300;
const MAX_BYTES = 4 * 1024 * 1024;
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let stage = "authorization";
  try {
  const { id } = await params;
  const denied = await authorizeProcess(request, id, "edit");
  if (denied) return denied;
  const process = await prisma.process.findUnique({ where: { id }, select: { status: true } });
  if (!process || ["Finalized", "Approved"].includes(process.status)) return NextResponse.json({ error: "This flowchart is read-only" }, { status: 409 });
  const name = request.nextUrl.searchParams.get("name") || "";
  const extension = name.split(".").pop()?.toLowerCase();
  if (!extension || !["pdf", "docx", "txt", "md", "csv"].includes(extension)) return NextResponse.json({ error: "Upload a PDF, DOCX, TXT, Markdown, or CSV file" }, { status: 400 });
  if (Number(request.headers.get("content-length")) > MAX_BYTES) return NextResponse.json({ error: "Maximum file size is 4 MB" }, { status: 413 });
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: "Select a document" }, { status: 400 });
    stage = "upload";
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > MAX_BYTES) { await reader.cancel(); return NextResponse.json({ error: "Maximum file size is 4 MB" }, { status: 413 }); }
      chunks.push(value);
    }
    const buffer = Buffer.concat(chunks); let text = "";
    let pages: number | undefined;
    if (extension === "pdf") {
      stage = "pdf-runtime";
      const { readPDFDocument } = await import("@/lib/ai/pdf-document");
      stage = "pdf-reading";
      ({ text, pages } = await readPDFDocument(buffer, request.signal));
    } else if (extension === "docx") {
      stage = "docx-reading";
      text = (await mammoth.extractRawText({ buffer })).value;
    } else {
      text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      if (text.includes("\0")) throw new Error("Binary input");
    }
    text = text.trim();
    if (!text) return NextResponse.json({ error: "No readable content found. Upload a clearer document." }, { status: 422 });
    if (text.length > 20000) return NextResponse.json({ error: "Document exceeds 20,000 characters. Upload a shorter section." }, { status: 413 });
    return NextResponse.json({ text, pages, visual: extension === "pdf", name: name.slice(0,200) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AIServiceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const detail = error as { name?: string; code?: string; message?: string };
    const message = typeof detail?.message === "string" ? detail.message : "";
    const runtimeFailure = stage === "pdf-runtime" || /worker|canvas|DOMMatrix|native binding|Cannot find module|Cannot find package/i.test(message);
    // Do not log credentials, document contents or provider response bodies.
    console.error("Document import failed", { stage, name: detail?.name, code: detail?.code, runtimeFailure });
    if (stage === "authorization") return NextResponse.json({ error: "Unable to check document access. Check the deployment database connection and server logs." }, { status: 503 });
    if (runtimeFailure) return NextResponse.json({ error: "The deployed PDF renderer could not start. Check server logs, the Node.js version, and PDF worker/native canvas dependencies." }, { status: 503 });
    if (detail?.name === "PasswordException") return NextResponse.json({ error: "This PDF needs a password. Upload an unlocked copy." }, { status: 422 });
    return NextResponse.json({ error: "Unable to read this document. Try re-exporting it; if it works locally, check the deployment server logs." }, { status: 422 });
  }
}
