import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const participants = await prisma.processParticipant.findMany({
      where: { processId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ participants });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch participants" },
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
    const { name, role, email } = body;

    if (!name?.trim() || !role?.trim()) {
      return NextResponse.json(
        { error: "Name and role are required" },
        { status: 400 }
      );
    }

    const participant = await prisma.processParticipant.create({
      data: {
        processId: id,
        name: name.trim(),
        role: role.trim(),
        email: email?.trim() || null,
      },
    });

    return NextResponse.json({ participant }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to add participant" },
      { status: 500 }
    );
  }
}
