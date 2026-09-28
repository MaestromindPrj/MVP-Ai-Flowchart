import { NextRequest, NextResponse } from "next/server";
import { authorizeProcess, getUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const denied = await authorizeProcess(request, id, "owner");
  if (denied) return denied;
  const shares = await prisma.processShare.findMany({ where: { processId: id }, select: { userId: true, permission: true, user: { select: { name: true, email: true } } }, orderBy: { userId: "asc" } });
  return NextResponse.json({ shares });
}
export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const denied = await authorizeProcess(request, id, "owner");
  if (denied) return denied;
  let body; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const { email, permission } = body || {};
  if (typeof email !== "string" || email.length > 254 || !["view", "edit"].includes(permission)) return NextResponse.json({ error: "Provide an email and view or edit permission" }, { status: 400 });
  const recipient = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } });
  if (!recipient) return NextResponse.json({ error: "This user must create an account before you can share with them" }, { status: 404 });
  const owner = await getUser();
  if (recipient.id === owner!.id) return NextResponse.json({ error: "You already own this flowchart" }, { status: 400 });
  await prisma.processShare.upsert({ where: { processId_userId: { processId: id, userId: recipient.id } }, create: { processId: id, userId: recipient.id, permission }, update: { permission } });
  return NextResponse.json({ success: true });
}
export async function DELETE(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const denied = await authorizeProcess(request, id, "owner");
  if (denied) return denied;
  let body; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (typeof body?.userId !== "string") return NextResponse.json({ error: "Provide a user ID" }, { status: 400 });
  await prisma.processShare.deleteMany({ where: { processId: id, userId: body.userId } });
  return NextResponse.json({ success: true });
}
