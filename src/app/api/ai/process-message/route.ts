import { NextRequest, NextResponse } from "next/server";
import { getAIProcessService } from "@/lib/ai/process-service";
import { AIServiceError, parseProcessData } from "@/lib/ai/validation";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Best-effort per-instance guard; use a shared limiter for multiple replicas.
let windowStart = 0;
let requests = 0;
const pending = new Set<string>();

export async function POST(request: NextRequest) {
  let pendingId: string | undefined;
  try {
    const raw = await request.text();
    if (raw.length > 80_000) throw new AIServiceError("This flowchart is too large for AI editing.", 413);
    let body;
    try { body = JSON.parse(raw); } catch { throw new AIServiceError("Invalid JSON request.", 400); }
    if (!body || typeof body !== "object" || typeof body.processId !== "string" || !body.processId.trim() || body.processId.length > 160 || typeof body.message !== "string" || !body.message.trim() || body.message.length > 4000) {
      throw new AIServiceError("Provide a processId and a message of 1 to 4,000 characters.", 400);
    }
    const { processId } = body;
    const message = body.message.trim();
    let currentProcess;
    try { currentProcess = parseProcessData(body.currentProcess); }
    catch { throw new AIServiceError("Invalid flowchart. Use at most 60 nodes with valid connections.", 400); }
    const process = await prisma.process.findUnique({
      where: { id: processId },
      include: { versions: { orderBy: { versionNumber: "desc" } } },
    });
    if (!process) throw new AIServiceError("Process not found.", 404);
    if (["Finalized", "Approved"].includes(process.status)) throw new AIServiceError("This process is finalized and cannot be edited.", 409);
    const version = process.versions.find((item) => item.id === process.currentVersionId) || process.versions[0];
    if (!version) throw new AIServiceError("Create a process version before using AI.", 409);
    if (pending.has(processId)) throw new AIServiceError("An AI request for this process is already running. Please wait.", 429);
    if (Date.now() - windowStart >= 60_000) { windowStart = Date.now(); requests = 0; }
    if (requests >= 20) throw new AIServiceError("AI is busy. Please wait a minute before trying again.", 429);
    requests++;
    pending.add(processId);
    pendingId = processId;
    const history = await prisma.processMessage.findMany({ where: { processId }, orderBy: { createdAt: "desc" }, take: 8 });
    const result = await getAIProcessService().sendMessage(processId, message, currentProcess,
      history.reverse().map((entry) => ({ role: entry.senderType === "USER" ? "user" : "assistant", content: entry.message }))
    );

    // Commit messages and the diagram together only after a valid response.
    await prisma.$transaction(async (tx) => {
      const latest = await tx.process.findUnique({ where: { id: processId } });
      if (!latest || ["Finalized", "Approved"].includes(latest.status) || latest.currentVersionId !== process.currentVersionId) {
        throw new AIServiceError("This process changed while AI was working. Reload it and try again.", 409);
      }
      if (result.processUpdate) {
        const saved = await tx.processVersion.updateMany({
          where: { id: version.id, processId, processData: version.processData },
          data: { processData: JSON.stringify(result.processUpdate) },
        });
        if (saved.count !== 1) throw new AIServiceError("The diagram changed while AI was working. Reload it and try again.", 409);
      }
      await tx.processMessage.create({ data: { processId, senderType: "USER", message } });
      await tx.processMessage.create({ data: {
        processId, senderType: "AI", message: result.responseMessage,
        suggestedChanges: result.suggestedChanges ? JSON.stringify(result.suggestedChanges) : null,
      } });
    });
    return NextResponse.json(result);
  } catch (error) {
    const known = error instanceof AIServiceError;
    return NextResponse.json(
      { error: known ? error.message : "Unable to save the AI response. Please try again." },
      { status: known ? error.status : 500 }
    );
  } finally {
    if (pendingId) pending.delete(pendingId);
  }
}
