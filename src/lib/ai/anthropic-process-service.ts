import { AIProcessService, ProcessData, AIConversationMessage, AIImageInput } from "./types";
import { SYSTEM_PROMPT } from "./groq-process-service";
import { AIServiceError, parseAIResponse } from "./validation";
import { getLayoutedElements } from "../process/layout";
import { anthropicImage, callAnthropicWithUsage } from "./anthropic-client";
import { flowchartResponseSchema } from "./flowchart-schema";

export class AnthropicAIProcessService implements AIProcessService {
  async sendMessage(_id: string, message: string, currentProcess: ProcessData, history: AIConversationMessage[] = [], images: AIImageInput[] = []) {
    const content = [{ type: "text", text: JSON.stringify({ request: message, currentProcess: { ...currentProcess, nodes: currentProcess.nodes.map(({ position, ...node }) => node) } }) }, ...images.map(image => anthropicImage(image.dataUrl))];
    const { text, usage } = await callAnthropicWithUsage(SYSTEM_PROMPT, [
      ...history.slice(-8).map(entry => ({ role: entry.role, content: entry.content.slice(0, 1000) })),
      { role: "user", content },
    ], Math.min(16000, Math.max(4000,
      1800 + currentProcess.nodes.length * 180 + currentProcess.edges.length * 50,
      4000 + Math.ceil(message.length * 1.1), images.length ? 12000 : 0)), undefined, flowchartResponseSchema);
    let stage = "json";
    try {
      const payload: unknown = JSON.parse(text.replace(/^```(?:json)?\s*\n?/, "").replace(/\s*```$/, ""));
      stage = "validation";
      const result = parseAIResponse(payload);
      result.usage = usage;
      stage = "layout";
      if (result.processUpdate) {
        const topology = (graph: ProcessData) => JSON.stringify({ nodes: graph.nodes.map(node => node.id).sort(), edges: graph.edges.map(edge => `${edge.id}:${edge.source}:${edge.target}`).sort() });
        if (topology(result.processUpdate) === topology(currentProcess)) {
          const positions = new Map(currentProcess.nodes.map(node => [node.id, node.position]));
          result.processUpdate.nodes = result.processUpdate.nodes.map(node => ({ ...node, position: positions.get(node.id)! }));
        } else result.processUpdate = getLayoutedElements(result.processUpdate.nodes, result.processUpdate.edges);
      }
      return result;
    } catch (error) {
      // Validation messages are fixed strings, never model text or user data.
      console.warn("Claude flowchart rejected", { stage, reason: stage === "validation" && error instanceof Error ? error.message : stage });
      if (stage === "layout") throw new AIServiceError("Unable to arrange the generated flowchart. Your saved diagram has not changed.");
      throw new AIServiceError("Claude returned an invalid flowchart. Your saved diagram has not changed. Please rephrase the request.");
    }
  }
}
