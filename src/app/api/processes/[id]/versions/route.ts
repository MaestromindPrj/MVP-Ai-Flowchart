import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const versions = await prisma.processVersion.findMany({
      where: { processId: id },
      orderBy: { versionNumber: "desc" },
    });

    const parsedVersions = versions.map((v) => {
      let data = { nodes: [], edges: [] };
      try {
        data = JSON.parse(v.processData);
      } catch (e) {
        data = { nodes: [], edges: [] };
      }
      return {
        ...v,
        processData: data,
      };
    });

    return NextResponse.json({ versions: parsedVersions });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch versions" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { processData, changeSummary, createdBy } = body;

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

    const nextVersionNumber = (process.versions[0]?.versionNumber || 0) + 1;

    const newVersion = await prisma.processVersion.create({
      data: {
        processId: id,
        versionNumber: nextVersionNumber,
        processData: JSON.stringify(processData || { nodes: [], edges: [] }),
        createdBy: createdBy || process.ownerName || "Process Owner",
        changeSummary: changeSummary || `Version ${nextVersionNumber} Update`,
      },
    });

    await prisma.process.update({
      where: { id },
      data: {
        currentVersionNumber: nextVersionNumber,
        currentVersionId: newVersion.id,
      },
    });

    return NextResponse.json(
      {
        version: {
          ...newVersion,
          processData: processData || { nodes: [], edges: [] },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create version" },
      { status: 500 }
    );
  }
}
