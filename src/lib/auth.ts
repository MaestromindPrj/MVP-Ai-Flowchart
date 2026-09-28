import { randomBytes, createHash, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const derive = promisify(scrypt);
const cookieName = "jv_session";
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await derive(password, salt, 64) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string | null) {
  const [salt, hash] = (stored || `${"0".repeat(32)}:${"0".repeat(128)}`).split(":");
  const actual = await derive(password, salt, 64) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected) && !!stored;
}
export async function getUser() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { tokenHash: digest(token) }, include: { user: { include: { organization: true } } } });
  if (!session || session.expiresAt <= new Date()) return null;
  const { passwordHash: _, ...user } = session.user;
  return user;
}
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
export async function createSession(userId: string) {
  await deleteSession();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 86400_000);
  await prisma.session.create({ data: { tokenHash: digest(token), userId, expiresAt } });
  (await cookies()).set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
}
export async function deleteSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: digest(token) } });
  jar.delete(cookieName);
}
export function accessibleProcesses(userId: string) {
  return { OR: [{ creatorId: userId }, { shares: { some: { userId, permission: { in: ["view", "edit"] } } } }] };
}
export async function processPermission(id: string, userId: string): Promise<"owner" | "edit" | "view" | null> {
  const process = await prisma.process.findUnique({ where: { id }, select: { creatorId: true, shares: { where: { userId }, select: { permission: true } } } });
  if (!process) return null;
  if (process.creatorId === userId) return "owner";
  const permission = process.shares[0]?.permission;
  return permission === "edit" || permission === "view" ? permission : null;
}
export async function authorizeProcess(request: NextRequest, id: string, required?: "view" | "edit" | "owner") {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const permission = await processPermission(id, user.id);
  if (!permission) return NextResponse.json({ error: "Process not found" }, { status: 404 });
  const need = required || (request.method === "GET" ? "view" : "edit");
  if ((need === "owner" && permission !== "owner") || (need === "edit" && permission === "view")) return NextResponse.json({ error: "You do not have permission for this action" }, { status: 403 });
  return null;
}
