import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
export async function GET() {
  const user = await getUser();
  return NextResponse.json(user ? { user } : { error: "Sign in required" }, { status: user ? 200 : 401 });
}
