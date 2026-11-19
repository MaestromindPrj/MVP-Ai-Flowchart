// API-compatible JSON schema. Graph relationships and size limits are still
// validated locally; JSON schema cannot ensure that an edge endpoint exists.
const text = { type: "string" };
const metadata = { type: ["string", "null"] };

export const flowchartResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["responseMessage", "processUpdate", "suggestedChanges", "suggestedPrompts"],
  properties: {
    responseMessage: { type: "string", description: "Nonempty explanation, at most 6000 characters." },
    processUpdate: {
      anyOf: [
        { type: "null" },
        {
          type: "object", additionalProperties: false, required: ["nodes", "edges"],
          properties: {
            nodes: {
              type: "array", description: "Complete diagram with 1 to 60 nodes and unique IDs.",
              items: {
                type: "object", additionalProperties: false,
                required: ["id", "type", "label"],
                properties: {
                  id: { type: "string", description: "Nonempty unique ID, at most 160 characters." },
                  type: { type: "string", enum: ["start", "task", "approval", "decision", "end"] },
                  label: { type: "string", description: "Nonempty label, at most 300 characters." },
                  role: metadata, description: metadata, sla: metadata, condition: metadata,
                  required: { type: ["boolean", "null"] },
                },
              },
            },
            edges: {
              type: "array", description: "At most 120 connections. All endpoints must reference node IDs.",
              items: {
                type: "object", additionalProperties: false, required: ["id", "source", "target"],
                properties: { id: text, source: text, target: text, label: metadata, condition: metadata },
              },
            },
          },
        },
      ],
    },
    suggestedChanges: { type: "array", items: text, description: "At most 6 suggestions, each 1 to 500 characters." },
    suggestedPrompts: { type: "array", items: text, description: "At most 4 prompts, each 1 to 500 characters." },
  },
};
