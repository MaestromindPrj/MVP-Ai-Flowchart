import { AIProcessResponse, ProcessData, ProcessNode, ProcessEdge } from "./types";

export class AIServiceError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
    this.name = "AIServiceError";
  }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected an object");
  return value as Record<string, unknown>;
}

function string(value: unknown, max = 2000): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error("Invalid text field");
  return value;
}

function optionalStrings(value: Record<string, unknown>, keys: string[]) {
  const result: Record<string, string> = {};
  for (const key of keys) {
    if (value[key] !== undefined && value[key] !== null) {
      if (typeof value[key] !== "string" || (value[key] as string).length > 2000) throw new Error("Invalid text field");
      result[key] = value[key] as string;
    }
  }
  return result;
}

export function parseProcessData(value: unknown, generated = false): ProcessData {
  const data = object(value);
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges) || data.nodes.length > 60 || data.edges.length > 120) {
    throw new Error("A flowchart must contain at most 60 nodes and 120 connections");
  }
  const ids = new Set<string>();
  const nodes: ProcessNode[] = data.nodes.map((raw) => {
    const node = object(raw);
    const id = string(node.id, 160);
    if (ids.has(id)) throw new Error("Duplicate node ID");
    ids.add(id);
    if (!["start", "task", "approval", "decision", "end"].includes(node.type as string)) throw new Error("Unsupported node type");
    const position = node.position == null && generated ? { x: 0, y: 0 } : object(node.position);
    if (typeof position.x !== "number" || typeof position.y !== "number" || !Number.isFinite(position.x) || !Number.isFinite(position.y)) throw new Error("Invalid node position");
    if (node.required != null && typeof node.required !== "boolean") throw new Error("Invalid required flag");
    return {
      id, type: node.type as ProcessNode["type"], label: string(node.label, 300),
      ...optionalStrings(node, ["role", "description", "sla", "condition"]),
      ...(typeof node.required === "boolean" ? { required: node.required } : {}),
      position: { x: position.x, y: position.y },
    };
  });
  const edgeIds = new Set<string>();
  const edges: ProcessEdge[] = data.edges.map((raw) => {
    const edge = object(raw);
    const id = string(edge.id, 160);
    const source = string(edge.source, 160);
    const target = string(edge.target, 160);
    if (edgeIds.has(id) || !ids.has(source) || !ids.has(target)) throw new Error("Invalid connection or duplicate connection ID");
    edgeIds.add(id);
    return { id, source, target, ...optionalStrings(edge, ["label", "condition"]) };
  });
  if (generated && nodes.length === 0) throw new Error("AI returned an empty flowchart");
  return { nodes, edges };
}

export function parseAIResponse(value: unknown): AIProcessResponse {
  const data = object(value);
  const result: AIProcessResponse = { responseMessage: string(data.responseMessage, 6000) };
  if (data.processUpdate != null) result.processUpdate = parseProcessData(data.processUpdate, true);
  for (const key of ["suggestedChanges", "suggestedPrompts"] as const) {
    if (data[key] != null) {
      if (!Array.isArray(data[key]) || data[key].length > 12) throw new Error("Invalid suggestions");
      result[key] = data[key].map((item) => string(item, 500));
    }
  }
  return result;
}
