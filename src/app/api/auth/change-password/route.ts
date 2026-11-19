import { NextRequest, NextResponse } from "next/server";
import { getUser, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const body = await request.json().catch(() => null);
    const { currentPassword, password } = body || {};
    if (typeof currentPassword !== "string" || currentPassword.length > 128 || typeof password !== "string" || password.length < 12 || password.length > 128) {
      return NextResponse.json({ error: "Enter your current password and a new password of 12–128 characters" }, { status: 400 });
    }
    const account = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
    if (!await verifyPassword(currentPassword, account?.passwordHash || null)) return NextResponse.json({ error: "Your current password is incorrect" }, { status: 400 });
    if (currentPassword === password) return NextResponse.json({ error: "Choose a different new password" }, { status: 400 });
    const passwordHash = await hashPassword(password);
    const changed = await prisma.$transaction(async tx => {
      // Do not overwrite a concurrent administrator reset or password change.
      const result = await tx.user.updateMany({ where: { id: user.id, passwordHash: account!.passwordHash }, data: { passwordHash } });
      if (!result.count) return false;
      await tx.session.deleteMany({ where: { userId: user.id } });
      return true;
    });
    if (!changed) return NextResponse.json({ error: "Your password changed during this request. Sign in again." }, { status: 409 });
    const response = NextResponse.json({ success: true });
    response.cookies.set("jv_session", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
    return response;
  } catch {
    return NextResponse.json({ error: "Unable to change your password. Please try again." }, { status: 500 });
  }
}
