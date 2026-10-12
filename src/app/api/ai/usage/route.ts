import { getUser } from "@/lib/auth";
import { getDailyTokenUsage } from "@/lib/ai/usage";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    if (!await getUser()) return Response.json({ error: "Sign in required" }, { status: 401, headers });
    const enabled = (process.env.AI_PROVIDER || "groq") === "groq";
    return Response.json({ enabled, models: enabled ? getDailyTokenUsage() : [] }, { headers });
  } catch {
    return Response.json({ error: "Unable to load AI usage. Please try again." }, { status: 503, headers });
  }
}
