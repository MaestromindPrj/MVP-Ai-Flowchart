import { NextRequest, NextResponse } from "next/server";
import { authorizeProcess } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
export const runtime = "nodejs";
export const maxDuration = 30;
const MAX_BYTES = 4 * 1024 * 1024;
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  try {
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > MAX_BYTES) { await reader.cancel(); return NextResponse.json({ error: "Maximum file size is 4 MB" }, { status: 413 }); }
      chunks.push(value);
    }
    const buffer = Buffer.concat(chunks); let text = "";
    if (extension === "pdf") {
      if (buffer.subarray(0,5).toString() !== "%PDF-") throw new Error("Invalid PDF");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const info = await parser.getInfo();
        if (info.total > 30) return NextResponse.json({ error: "Use a PDF with at most 30 pages" }, { status: 413 });
        const result = await parser.getText();
        text = result.pages.map(page => page.text).join("\n\n");
      } finally { await parser.destroy(); }
    } else if (extension === "docx") {
      text = (await mammoth.extractRawText({ buffer })).value;
    } else {
      text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      if (text.includes("\0")) throw new Error("Binary input");
    }
    text = text.trim();
    if (!text) return NextResponse.json({ error: "No readable text found. For scanned PDFs, run OCR or paste the text instead." }, { status: 422 });
    if (text.length > 20000) return NextResponse.json({ error: "Document exceeds 20,000 characters. Upload a shorter section." }, { status: 413 });
    return NextResponse.json({ text, name: name.slice(0,200) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Unable to read this file. Use an unencrypted PDF, DOCX, or UTF-8 text document." }, { status: 422 }); }
}
