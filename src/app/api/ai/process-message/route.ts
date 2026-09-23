import { NextRequest, NextResponse } from "next/server";
import { getAIProcessService } from "@/lib/ai/process-service";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { processId, message, currentProcess } = body;

    if (!processId || !message?.trim()) {
      return NextResponse.json(
        { error: "processId and message are required" },
        { status: 400 }
      );
    }

    await prisma.processMessage.create({
      data: {
        processId,
        senderType: "USER",
        message: message.trim(),
      },
    });

    const aiService = getAIProcessService();
    const result = await aiService.sendMessage(
      processId,
      message.trim(),
      currentProcess || { nodes: [], edges: [] }
    );

    await prisma.processMessage.create({
      data: {
        processId,
        senderType: "AI",
        message: result.responseMessage,
        suggestedChanges: result.suggestedChanges
          ? JSON.stringify(result.suggestedChanges)
          : null,
      },
    });

    if (result.processUpdate) {
      const process = await prisma.process.findUnique({
        where: { id: processId },
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      });

      if (process && process.versions.length > 0) {
        const activeVersionId =
          process.currentVersionId || process.versions[0].id;
        await prisma.processVersion.update({
          where: { id: activeVersionId },
          data: {
            processData: JSON.stringify(result.processUpdate),
          },
        });
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process AI message" },
      { status: 500 }
    );
  }
}
