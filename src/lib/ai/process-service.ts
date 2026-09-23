import { AIProcessService } from "./types";
import { MockAIProcessService } from "./mock-process-service";

let activeServiceInstance: AIProcessService | null = null;

export function getAIProcessService(): AIProcessService {
  if (!activeServiceInstance) {
    activeServiceInstance = new MockAIProcessService();
  }
  return activeServiceInstance;
}

export function setAIProcessService(service: AIProcessService): void {
  activeServiceInstance = service;
}
