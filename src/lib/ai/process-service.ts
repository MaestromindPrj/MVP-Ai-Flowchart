import { AIProcessService } from "./types";
import { MockAIProcessService } from "./mock-process-service";
import { GroqAIProcessService } from "./groq-process-service";
import { AIServiceError } from "./validation";
import { AnthropicAIProcessService } from "./anthropic-process-service";

let activeServiceInstance: AIProcessService | null = null;

export function getAIProcessService(): AIProcessService {
  if (!activeServiceInstance) {
    const provider = process.env.AI_PROVIDER || "groq";
    if (provider !== "groq" && provider !== "mock" && provider !== "anthropic") {
      throw new AIServiceError("Unsupported AI_PROVIDER. Use anthropic, groq or mock.", 503);
    }
    activeServiceInstance = provider === "mock" ? new MockAIProcessService() : provider === "anthropic" ? new AnthropicAIProcessService() : new GroqAIProcessService();
  }
  return activeServiceInstance;
}

export function setAIProcessService(service: AIProcessService): void {
  activeServiceInstance = service;
}
