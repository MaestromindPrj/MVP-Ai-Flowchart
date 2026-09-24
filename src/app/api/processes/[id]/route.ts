import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const process = await prisma.process.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
        },
        participants: {
          orderBy: { createdAt: "asc" },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!process) {
      return NextResponse.json(
        { error: "Process not found" },
        { status: 404 }
      );
    }

    let activeVersion = process.versions.find(
      (v) => v.id === process.currentVersionId
    );
    if (!activeVersion && process.versions.length > 0) {
      activeVersion = process.versions[0];
    }

    let parsedProcessData = { nodes: [], edges: [] };
    if (activeVersion?.processData) {
      try {
        parsedProcessData = JSON.parse(activeVersion.processData);
      } catch (e) {
        parsedProcessData = { nodes: [], edges: [] };
      }
    }

    return NextResponse.json({
      process: {
        ...process,
        activeVersion,
        processData: parsedProcessData,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch process" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      department,
      ownerName,
      ownerEmail,
      status,
      processData,
      changeSummary,
    } = body;

    const existingProcess = await prisma.process.findUnique({
      where: { id },
      include: { versions: { orderBy: { versionNumber: "desc" } } },
    });

    if (!existingProcess) {
      return NextResponse.json(
        { error: "Process not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (department !== undefined) updateData.department = department;
    if (ownerName !== undefined) updateData.ownerName = ownerName;
    if (ownerEmail !== undefined) updateData.ownerEmail = ownerEmail;
    if (status !== undefined) updateData.status = status;

    if (processData !== undefined) {
      const activeVersion =
        existingProcess.versions.find(
          (v) => v.id === existingProcess.currentVersionId
        ) || existingProcess.versions[0];

      if (activeVersion) {
        await prisma.processVersion.update({
          where: { id: activeVersion.id },
          data: {
            processData: JSON.stringify(processData),
            changeSummary: changeSummary || activeVersion.changeSummary,
          },
        });
      }
    }

    const updated = await prisma.process.update({
      where: { id },
      data: updateData,
      include: {
        versions: { orderBy: { versionNumber: "desc" } },
        participants: true,
      },
    });

    return NextResponse.json({ process: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update process" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingProcess = await prisma.process.findUnique({
      where: { id },
    });

    if (!existingProcess) {
      return NextResponse.json(
        { error: "Process not found" },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.processMessage.deleteMany({ where: { processId: id } }),
      prisma.processParticipant.deleteMany({ where: { processId: id } }),
      prisma.processVersion.deleteMany({ where: { processId: id } }),
      prisma.process.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true, message: "Process deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete process" },
      { status: 500 }
    );
  }
}
