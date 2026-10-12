export interface QuotaSnapshot {
  remaining: number;
  limit: number;
  percent: number;
  resetAt: string | null;
}
export interface ModelUsage {
  model: string;
  updatedAt: string | null;
  requests: QuotaSnapshot | null;
  tokens: QuotaSnapshot | null;
}
// Observations, not an accounting ledger. Cold starts have no observations.
const state = globalThis as typeof globalThis & { groqUsage?: Map<string, ModelUsage> };
const snapshots = state.groqUsage ??= new Map<string, ModelUsage>();
function resetTime(value: string | null, now: number): string | null {
  if (!value) return null;
  const matches = Array.from(value.matchAll(/(\d+(?:\.\d+)?)(ms|s|m|h|d)/g));
  if (!matches.length || matches.map(match => match[0]).join("") !== value) return null;
  const units: Record<string, number> = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const duration = matches.reduce((total, match) => total + Number(match[1]) * units[match[2]], 0);
  return Number.isFinite(duration) && duration <= 365 * 86400000 ? new Date(now + duration).toISOString() : null;
}
export function recordGroqUsage(model: string, headers: Headers, now = Date.now()) {
  const read = (kind: string): QuotaSnapshot | null => {
    const rawLimit = headers.get(`x-ratelimit-limit-${kind}`);
    const rawRemaining = headers.get(`x-ratelimit-remaining-${kind}`);
    if (!rawLimit?.trim() || !rawRemaining?.trim()) return null;
    const limit = Number(rawLimit), remaining = Number(rawRemaining);
    if (!Number.isFinite(limit) || limit <= 0 || !Number.isFinite(remaining) || remaining < 0) return null;
    const bounded = Math.min(limit, remaining);
    return { limit, remaining: bounded, percent: Math.floor(bounded / limit * 100), resetAt: resetTime(headers.get(`x-ratelimit-reset-${kind}`), now) };
  };
  snapshots.set(model, { model, updatedAt: new Date(now).toISOString(), requests: read("requests"), tokens: read("tokens") });
}
export function getGroqUsage(): ModelUsage[] {
  const models = Array.from(new Set([process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b", process.env.GROQ_VISION_MODEL?.trim() || "qwen/qwen3.8-27b"]));
  return models.map(model => snapshots.get(model) || { model, updatedAt: null, requests: null, tokens: null });
}

const dailyState = globalThis as typeof globalThis & { groqDailyTokens?: Map<string, { day: string; tokens: number }> };
const dailyTokens = dailyState.groqDailyTokens ??= new Map<string, { day: string; tokens: number }>();

export function recordGroqTokens(model: string, usage: unknown, now = Date.now()) {
  if (!usage || typeof usage !== "object") return;
  const total = (usage as { total_tokens?: unknown }).total_tokens;
  if (typeof total !== "number" || !Number.isSafeInteger(total) || total < 0) return;
  const day = new Date(now).toISOString().slice(0, 10);
  const previous = dailyTokens.get(model);
  dailyTokens.set(model, { day, tokens: (previous?.day === day ? previous.tokens : 0) + total });
}

export function getDailyTokenUsage(now = Date.now()) {
  const day = new Date(now).toISOString().slice(0, 10);
  const configurations = [
    { model: process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b", limit: process.env.GROQ_DAILY_TOKEN_LIMIT },
    { model: process.env.GROQ_VISION_MODEL?.trim() || "qwen/qwen3.8-27b", limit: process.env.GROQ_VISION_DAILY_TOKEN_LIMIT },
  ];
  return configurations.filter((entry, index) => configurations.findIndex(other => other.model === entry.model) === index).map(({ model, limit }) => {
    const defaultLimit = ["openai/gpt-oss-20b", "qwen/qwen3.8-27b"].includes(model) ? 200000 : NaN;
    const dailyLimit = limit === undefined ? defaultLimit : Number(limit);
    const tracked = dailyTokens.get(model);
    const used = tracked?.day === day ? tracked.tokens : null;
    return { model, tokensUsed: used, dailyLimit: Number.isSafeInteger(dailyLimit) && dailyLimit > 0 ? dailyLimit : null, percentUsed: used !== null && Number.isSafeInteger(dailyLimit) && dailyLimit > 0 ? Math.round(used / dailyLimit * 10000) / 100 : null };
  });
}

export function getOverallDailyTokenUsage(now = Date.now()) {
  const models = getDailyTokenUsage(now);
  const hasObservation = models.some(model => model.tokensUsed !== null);
  const tokensUsed = hasObservation ? models.reduce((sum, model) => sum + (model.tokensUsed ?? 0), 0) : null;
  const dailyLimit = models.every(model => model.dailyLimit !== null) ? models.reduce((sum, model) => sum + model.dailyLimit!, 0) : null;
  return {
    tokensUsed,
    dailyLimit,
    percentUsed: tokensUsed !== null && dailyLimit !== null && dailyLimit > 0 ? Math.round(tokensUsed / dailyLimit * 10000) / 100 : null,
  };
}
