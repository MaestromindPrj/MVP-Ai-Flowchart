import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSession, hashPassword } from "@/lib/auth";
export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();
    if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof name !== "string" || !name.trim() || name.length > 100 || typeof password !== "string" || password.length < 12 || password.length > 128) return NextResponse.json({ error: "Enter a name, valid email, and password of 12-128 characters" }, { status: 400 });
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email: email.trim().toLowerCase(), name: name.trim(), passwordHash, organization: { create: { name: name.trim() + "'s workspace" } } } });
    await createSession(user.id);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.code === "P2002" ? "This email is already registered. Sign in instead." : "Unable to create account" }, { status: error.code === "P2002" ? 409 : 500 });
  }
}
