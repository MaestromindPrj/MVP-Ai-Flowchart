import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const updated = await prisma.process.update({
      where: { id },
      data: {
        status: "Finalized",
      },
      include: {
        versions: true,
        participants: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Process successfully finalized",
      process: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to finalize process" },
      { status: 500 }
    );
  }
}
