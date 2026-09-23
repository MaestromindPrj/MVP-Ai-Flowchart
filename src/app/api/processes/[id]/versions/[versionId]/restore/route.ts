import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params;
    const versionToRestore = await prisma.processVersion.findUnique({
      where: { id: versionId },
    });

    if (!versionToRestore || versionToRestore.processId !== id) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    const process = await prisma.process.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
      },
    });

    if (!process) {
      return NextResponse.json(
        { error: "Process not found" },
        { status: 404 }
      );
    }

    const newVersionNumber = (process.versions[0]?.versionNumber || 0) + 1;

    const restoredVersion = await prisma.processVersion.create({
      data: {
        processId: id,
        versionNumber: newVersionNumber,
        processData: versionToRestore.processData,
        createdBy: "System Restore",
        changeSummary: `Restored state from Version ${versionToRestore.versionNumber}`,
      },
    });

    await prisma.process.update({
      where: { id },
      data: {
        currentVersionNumber: newVersionNumber,
        currentVersionId: restoredVersion.id,
        status: "Draft",
      },
    });

    let parsed = { nodes: [], edges: [] };
    try {
      parsed = JSON.parse(restoredVersion.processData);
    } catch (e) {
      parsed = { nodes: [], edges: [] };
    }

    return NextResponse.json({
      success: true,
      restoredVersion: {
        ...restoredVersion,
        processData: parsed,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to restore version" },
      { status: 500 }
    );
  }
}
