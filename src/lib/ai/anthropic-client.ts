import { AIServiceError } from "./validation";
import { recordGroqTokens } from "./usage";
import type { AITokenUsage } from "./types";

export const anthropicModel = () => process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5-5";
export function anthropicImage(dataUrl: string) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) throw new AIServiceError("Unsupported image format.", 400);
  return { type: "image", source: { type: "base64", media_type: match[1], data: match[2] } };
}

export async function callAnthropic(system: string, messages: { role: string; content: unknown }[], maxTokens: number, signal?: AbortSignal, outputSchema?: Record<string, unknown>) {
  return (await callAnthropicWithUsage(system, messages, maxTokens, signal, outputSchema)).text;
}

export async function callAnthropicWithUsage(system: string, messages: { role: string; content: unknown }[], maxTokens: number, signal?: AbortSignal, outputSchema?: Record<string, unknown>) {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) throw new AIServiceError("Claude is not configured. Add ANTHROPIC_API_KEY on the server.", 503);
  // A flowchart retry regenerates the complete JSON; never save truncated output.
  const deadline = AbortSignal.any([AbortSignal.timeout(outputSchema ? 270_000 : 45_000), ...(signal ? [signal] : [])]);
  let totalUsage: AITokenUsage | undefined;
  let completeUsage = true;
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", cache: "no-store",
        headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01",
          ...(process.env.ANTHROPIC_WORKSPACE_ID?.trim() ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID.trim() } : {}) },
        signal: AbortSignal.any([deadline, AbortSignal.timeout(outputSchema ? 150_000 : 45_000)]),
        body: JSON.stringify({ model: anthropicModel(), max_tokens: maxTokens, system, messages,
          ...(outputSchema ? { output_config: { format: { type: "json_schema", schema: outputSchema } } } : {}),
        }),
      });
      if (response.status === 429) {
        const retry = Number(response.headers.get("retry-after"));
        throw new AIServiceError("Claude rate limit reached. Please wait and try again.", 429, Number.isFinite(retry) && retry > 0 ? Math.ceil(retry) : undefined);
      }
      if ([401, 403].includes(response.status)) throw new AIServiceError("Claude access unavailable. Check the API key and model permissions.", 503);
      if (response.status === 400) throw new AIServiceError("Claude could not accept this request. Check API credits and model configuration, or try a smaller request.", 502);
      if (response.status === 404) throw new AIServiceError("Claude model or workspace unavailable. Check ANTHROPIC_MODEL and workspace access.", 503);
      if (!response.ok) throw new AIServiceError("Claude is temporarily unavailable. Please try again later.", 502);
      const result = await response.json();
      const usage = result.usage;
      let tokenUsage: AITokenUsage | undefined;
      const count = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
      if (usage && count(usage.input_tokens) && count(usage.output_tokens) && count(usage.cache_creation_input_tokens ?? 0) && count(usage.cache_read_input_tokens ?? 0)) {
        const cacheReadInputTokens = usage.cache_read_input_tokens ?? 0;
        const cacheCreationInputTokens = usage.cache_creation_input_tokens ?? 0;
        const inputTokens = usage.input_tokens + cacheReadInputTokens + cacheCreationInputTokens;
        tokenUsage = { model: typeof result.model === "string" ? result.model : anthropicModel(), requestId: response.headers.get("request-id"),
          inputTokens, outputTokens: usage.output_tokens, cacheReadInputTokens, cacheCreationInputTokens, totalTokens: inputTokens + usage.output_tokens };
        recordGroqTokens(anthropicModel(), { total_tokens: tokenUsage.totalTokens });
        // No prompts, diagram content, or credentials in this per-call record.
        console.info("Claude token usage", JSON.stringify({ ...tokenUsage, timestamp: new Date().toISOString(), stopReason: result.stop_reason }));
      }
      if (!tokenUsage) completeUsage = false;
      else {
        totalUsage = {
          ...tokenUsage, ...(attempt ? { attempts: attempt + 1 } : {}),
          inputTokens: (totalUsage?.inputTokens ?? 0) + tokenUsage.inputTokens,
          outputTokens: (totalUsage?.outputTokens ?? 0) + tokenUsage.outputTokens,
          cacheReadInputTokens: (totalUsage?.cacheReadInputTokens ?? 0) + tokenUsage.cacheReadInputTokens,
          cacheCreationInputTokens: (totalUsage?.cacheCreationInputTokens ?? 0) + tokenUsage.cacheCreationInputTokens,
          totalTokens: (totalUsage?.totalTokens ?? 0) + tokenUsage.totalTokens,
        };
      }
      if (result.stop_reason === "max_tokens") {
        if (outputSchema && attempt === 0 && maxTokens < 24000) {
          maxTokens = Math.min(24000, Math.max(12000, maxTokens * 2));
          continue;
        }
        throw new AIServiceError("Claude reached the response-length limit before completing the result. Split the document or request into smaller sections. Your saved diagram has not changed.", 422);
      }
      if (result.stop_reason !== "end_turn") throw new AIServiceError("Claude could not finish the response. Please request a smaller change.", 422);
      const text = Array.isArray(result.content) ? result.content.filter((block: { type: string; text?: unknown }) => block.type === "text" && typeof block.text === "string").map((block: { text: string }) => block.text).join("\n") : "";
      if (!text.trim()) throw new AIServiceError("Claude returned an empty response. Please try again.", 502);
      return { text: text.trim(), usage: completeUsage ? totalUsage : undefined };
    }
    throw new AIServiceError("Claude reached the response-length limit. Split the request into smaller sections.", 422);
  } catch (error) {
    if (error instanceof AIServiceError) throw error;
    if (deadline.aborted || (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name))) throw new AIServiceError("Claude request timed out or was cancelled. Try a shorter request.", 504);
    throw new AIServiceError("Cannot reach Claude. Please try again later.", 502);
  }
}
