import { authorizeProcess } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id, participantId } = await params;
    const access = await authorizeProcess(request, id);
    if (access) return access;
    await prisma.processParticipant.delete({
      where: { id: participantId, processId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to remove participant" },
      { status: 500 }
    );
  }
}
