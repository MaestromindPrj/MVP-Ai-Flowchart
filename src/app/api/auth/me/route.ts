import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await prisma.user.findFirst({
      include: { organization: true },
    });

    if (!user) {
      return NextResponse.json({
        user: {
          id: "demo-user",
          name: "Alex Morgan",
          email: "alex@jvprocess.com",
          role: "Senior Process Consultant",
          organization: { name: "Acme Global Enterprises" },
        },
      });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({
      user: {
        id: "demo-user",
        name: "Alex Morgan",
        email: "alex@jvprocess.com",
        role: "Senior Process Consultant",
        organization: { name: "Acme Global Enterprises" },
      },
    });
  }
}
