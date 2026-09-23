import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { organization: true },
    });

    if (!user) {
      let org = await prisma.organization.findFirst();
      if (!org) {
        org = await prisma.organization.create({
          data: { name: "Acme Global Enterprises" },
        });
      }

      user = await prisma.user.create({
        data: {
          email: email.trim().toLowerCase(),
          name: name?.trim() || email.split("@")[0],
          role: "Senior Consultant",
          organizationId: org.id,
        },
        include: { organization: true },
      });
    }

    return NextResponse.json({ user, success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to log in" },
      { status: 500 }
    );
  }
}
