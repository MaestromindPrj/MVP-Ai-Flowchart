export type ProcessNodeType =
  | "start"
  | "task"
  | "approval"
  | "decision"
  | "end";

export interface ProcessNode {
  id: string;
  type: ProcessNodeType;
  label: string;
  role?: string;
  description?: string;
  sla?: string;
  required?: boolean;
  condition?: string;
  position: {
    x: number;
    y: number;
  };
}

export interface ProcessEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface ProcessData {
  nodes: ProcessNode[];
  edges: ProcessEdge[];
}

export interface AIProcessMessageRequest {
  processId: string;
  message: string;
  currentProcess: ProcessData;
}

export interface AIProcessResponse {
  responseMessage: string;
  processUpdate?: ProcessData;
  suggestedChanges?: string[];
  suggestedPrompts?: string[];
}

export interface AIConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIProcessService {
  sendMessage(
    processId: string,
    message: string,
    currentProcess: ProcessData,
    history?: AIConversationMessage[]
  ): Promise<AIProcessResponse>;
}
