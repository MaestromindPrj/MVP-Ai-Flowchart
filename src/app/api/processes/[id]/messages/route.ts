import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messages = await prisma.processMessage.findMany({
      where: { processId: id },
      orderBy: { createdAt: "asc" },
    });

    const parsedMessages = messages.map((m) => {
      let suggestions: string[] = [];
      if (m.suggestedChanges) {
        try {
          suggestions = JSON.parse(m.suggestedChanges);
        } catch (e) {
          suggestions = [];
        }
      }
      return {
        ...m,
        suggestedChanges: suggestions,
      };
    });

    return NextResponse.json({ messages: parsedMessages });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch messages" },
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
    const { senderType, message, suggestedChanges } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    const created = await prisma.processMessage.create({
      data: {
        processId: id,
        senderType: senderType || "USER",
        message: message.trim(),
        suggestedChanges: suggestedChanges
          ? JSON.stringify(suggestedChanges)
          : null,
      },
    });

    return NextResponse.json({ message: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create message" },
      { status: 500 }
    );
  }
}
