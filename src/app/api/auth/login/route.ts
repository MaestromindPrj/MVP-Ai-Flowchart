import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (typeof email !== "string" || typeof password !== "string" || password.length > 128) return NextResponse.json({ error: "Enter your email and password" }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!await verifyPassword(password, user?.passwordHash || null) || !user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    await createSession(user.id);
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Unable to sign in" }, { status: 500 }); }
}
