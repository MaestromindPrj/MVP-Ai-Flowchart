import {
  AIProcessService,
  AIProcessResponse,
  ProcessData,
  ProcessNode,
  ProcessEdge,
  ProcessNodeType,
} from "./types";

export class MockAIProcessService implements AIProcessService {
  async sendMessage(
    processId: string,
    message: string,
    currentProcess: ProcessData
  ): Promise<AIProcessResponse> {
    await new Promise((resolve) => setTimeout(resolve, 850));

    const lower = message.toLowerCase();
    const existingNodes = [...(currentProcess?.nodes || [])];
    const existingEdges = [...(currentProcess?.edges || [])];

    if (existingNodes.length === 0) {
      const startNode: ProcessNode = {
        id: `node-${Date.now()}-1`,
        type: "start",
        label: "Initiate Process",
        role: "Process Owner",
        description: message.trim() || "Initial trigger for the business process.",
        position: { x: 250, y: 50 },
      };
      const firstTask: ProcessNode = {
        id: `node-${Date.now()}-2`,
        type: "task",
        label: "Execute Initial Step",
        role: "Operator",
        description: "Review inputs and validate initial data submission.",
        sla: "2 hours",
        required: true,
        position: { x: 250, y: 180 },
      };
      const edge: ProcessEdge = {
        id: `e-${startNode.id}-${firstTask.id}`,
        source: startNode.id,
        target: firstTask.id,
      };

      return {
        responseMessage:
          "I have initialized your process workflow with the starting trigger and initial task. Who should review or approve this step?",
        processUpdate: {
          nodes: [startNode, firstTask],
          edges: [edge],
        },
        suggestedChanges: [
          "Created Start Node: Initiate Process",
          "Created Task Node: Execute Initial Step",
        ],
        suggestedPrompts: [
          "The sales manager approves the request",
          "Check if order total exceeds $10,000",
          "Add inventory verification task",
        ],
      };
    }

    if (lower.includes("manager") && (lower.includes("approv") || lower.includes("review"))) {
      const lastNode = existingNodes[existingNodes.length - 1];
      const newNodeId = `node-approval-${Date.now()}`;
      const approvalNode: ProcessNode = {
        id: newNodeId,
        type: "approval",
        label: "Manager Approval",
        role: "Sales Manager",
        description: "Review order terms, pricing discount limits, and customer credit.",
        sla: "4 hours",
        required: true,
        position: {
          x: 250,
          y: (lastNode?.position?.y || 100) + 140,
        },
      };

      const newEdges = [...existingEdges];
      const endNodeIndex = existingNodes.findIndex((n) => n.type === "end");
      if (endNodeIndex !== -1) {
        const endNode = existingNodes[endNodeIndex];
        const edgeToTarget = newEdges.find((e) => e.target === endNode.id);
        if (edgeToTarget) {
          edgeToTarget.target = newNodeId;
          newEdges.push({
            id: `e-${newNodeId}-${endNode.id}`,
            source: newNodeId,
            target: endNode.id,
          });
        }
        existingNodes.splice(endNodeIndex, 0, approvalNode);
      } else {
        if (lastNode) {
          newEdges.push({
            id: `e-${lastNode.id}-${newNodeId}`,
            source: lastNode.id,
            target: newNodeId,
          });
        }
        existingNodes.push(approvalNode);
      }

      return {
        responseMessage:
          "I have added 'Manager Approval' assigned to the Sales Manager with a 4-hour SLA. Is there any conditional branching (e.g. for high-value orders or out-of-stock items)?",
        processUpdate: {
          nodes: existingNodes,
          edges: newEdges,
        },
        suggestedChanges: [
          "Added Approval Node: Manager Approval (Sales Manager, 4h SLA)",
        ],
        suggestedPrompts: [
          "If order is above $10,000, require Finance Approval",
          "Add warehouse inventory allocation",
          "Add customer dispatch notification",
        ],
      };
    }

    if (
      lower.includes("decision") ||
      lower.includes("if ") ||
      lower.includes("condition") ||
      lower.includes("10,000") ||
      lower.includes("10000") ||
      lower.includes("high value") ||
      lower.includes("threshold")
    ) {
      const decisionId = `node-decision-${Date.now()}`;
      const financeId = `node-finance-${Date.now()}`;
      const yPos = (existingNodes[existingNodes.length - 1]?.position?.y || 300) + 140;

      const decisionNode: ProcessNode = {
        id: decisionId,
        type: "decision",
        label: "High Value Order?",
        role: "Automated Policy",
        description: "Evaluate if order value exceeds $10,000 credit threshold.",
        condition: "Order Total > $10,000",
        position: { x: 250, y: yPos },
      };

      const financeNode: ProcessNode = {
        id: financeId,
        type: "approval",
        label: "Finance Director Approval",
        role: "Finance Director",
        description: "Executive review of non-standard payment terms and exposure.",
        sla: "24 hours",
        required: true,
        position: { x: 500, y: yPos },
      };

      const lastNode = existingNodes[existingNodes.length - 1];
      const newEdges = [...existingEdges];

      if (lastNode) {
        newEdges.push({
          id: `e-${lastNode.id}-${decisionId}`,
          source: lastNode.id,
          target: decisionId,
        });
      }

      newEdges.push({
        id: `e-${decisionId}-${financeId}`,
        source: decisionId,
        target: financeId,
        label: "Yes (> $10k)",
      });

      existingNodes.push(decisionNode, financeNode);

      return {
        responseMessage:
          "I created a conditional branch: 'High Value Order?' decision diamond pointing to 'Finance Director Approval' when the condition is met. What happens for standard orders or once finance signs off?",
        processUpdate: {
          nodes: existingNodes,
          edges: newEdges,
        },
        suggestedChanges: [
          "Added Decision Node: High Value Order?",
          "Added Approval Node: Finance Director Approval",
          "Connected Conditional Branch: Yes (> $10k)",
        ],
        suggestedPrompts: [
          "Inventory team allocates stock from warehouse",
          "Send order confirmation invoice to customer",
          "Logistics team packages and dispatches",
        ],
      };
    }

    if (
      lower.includes("inventory") ||
      lower.includes("stock") ||
      lower.includes("warehouse") ||
      lower.includes("fulfill")
    ) {
      const invId = `node-inv-${Date.now()}`;
      const yPos = (existingNodes[existingNodes.length - 1]?.position?.y || 450) + 140;

      const invNode: ProcessNode = {
        id: invId,
        type: "task",
        label: "Inventory Allocation",
        role: "Warehouse Operations",
        description: "Check stock availability and reserve physical inventory in WMS.",
        sla: "4 hours",
        required: true,
        position: { x: 250, y: yPos },
      };

      const newEdges = [...existingEdges];
      const decisionNode = existingNodes.find((n) => n.type === "decision");
      const financeNode = existingNodes.find(
        (n) => n.label?.toLowerCase().includes("finance")
      );

      if (decisionNode) {
        newEdges.push({
          id: `e-${decisionNode.id}-${invId}`,
          source: decisionNode.id,
          target: invId,
          label: "No (<= $10k)",
        });
      }
      if (financeNode) {
        newEdges.push({
          id: `e-${financeNode.id}-${invId}`,
          source: financeNode.id,
          target: invId,
          label: "Approved",
        });
      }
      if (!decisionNode && !financeNode) {
        const last = existingNodes[existingNodes.length - 1];
        if (last) {
          newEdges.push({
            id: `e-${last.id}-${invId}`,
            source: last.id,
            target: invId,
          });
        }
      }

      existingNodes.push(invNode);

      return {
        responseMessage:
          "Added 'Inventory Allocation' assigned to Warehouse Operations. Both standard path and approved finance paths now merge into this step. What is the next execution step?",
        processUpdate: {
          nodes: existingNodes,
          edges: newEdges,
        },
        suggestedChanges: [
          "Added Task Node: Inventory Allocation",
          "Linked standard and finance paths to Inventory Allocation",
        ],
        suggestedPrompts: [
          "Verify payment receipt before shipping",
          "Pick, pack, and dispatch via courier",
          "Finalize process and mark complete",
        ],
      };
    }

    if (
      lower.includes("dispatch") ||
      lower.includes("ship") ||
      lower.includes("complete") ||
      lower.includes("deliver") ||
      lower.includes("end") ||
      lower.includes("finish")
    ) {
      const dispatchId = `node-dispatch-${Date.now()}`;
      const endId = `node-end-${Date.now()}`;
      const yPos = (existingNodes[existingNodes.length - 1]?.position?.y || 600) + 140;

      const dispatchNode: ProcessNode = {
        id: dispatchId,
        type: "task",
        label: "Pick, Pack & Dispatch",
        role: "Logistics Lead",
        description: "Generate shipping labels, manifest courier handover, and log tracking number.",
        sla: "6 hours",
        required: true,
        position: { x: 250, y: yPos },
      };

      const endNode: ProcessNode = {
        id: endId,
        type: "end",
        label: "Order Delivered & Closed",
        role: "Customer Success",
        description: "Order marked delivered in ERP and post-delivery survey dispatched.",
        position: { x: 250, y: yPos + 140 },
      };

      const lastNode = existingNodes[existingNodes.length - 1];
      const newEdges = [...existingEdges];

      if (lastNode) {
        newEdges.push({
          id: `e-${lastNode.id}-${dispatchId}`,
          source: lastNode.id,
          target: dispatchId,
        });
      }

      newEdges.push({
        id: `e-${dispatchId}-${endId}`,
        source: dispatchId,
        target: endId,
      });

      existingNodes.push(dispatchNode, endNode);

      return {
        responseMessage:
          "I have appended 'Pick, Pack & Dispatch' and the terminal 'Order Delivered & Closed' end node. Your process workflow is now complete and ready for review or finalization!",
        processUpdate: {
          nodes: existingNodes,
          edges: newEdges,
        },
        suggestedChanges: [
          "Added Task Node: Pick, Pack & Dispatch",
          "Added End Node: Order Delivered & Closed",
        ],
        suggestedPrompts: [
          "Add an SLA of 2 hours to Pick & Pack",
          "Add Quality Control check step before dispatch",
          "Finalize this process version",
        ],
      };
    }

    let detectedType: ProcessNodeType = "task";
    if (lower.includes("approval") || lower.includes("sign off") || lower.includes("authorize")) {
      detectedType = "approval";
    } else if (lower.includes("check") || lower.includes("decision") || lower.includes("whether")) {
      detectedType = "decision";
    } else if (lower.includes("start") || lower.includes("begin")) {
      detectedType = "start";
    } else if (lower.includes("end") || lower.includes("done")) {
      detectedType = "end";
    }

    const cleanLabel = message
      .replace(/^(please |add |create |include |we need to )/i, "")
      .slice(0, 48)
      .trim();
    const formattedLabel = cleanLabel.charAt(0).toUpperCase() + cleanLabel.slice(1);

    const genericNodeId = `node-custom-${Date.now()}`;
    const yPos = (existingNodes[existingNodes.length - 1]?.position?.y || 200) + 140;

    const genericNode: ProcessNode = {
      id: genericNodeId,
      type: detectedType,
      label: formattedLabel || "Process Step",
      role: "Operations Team",
      description: message,
      sla: detectedType === "approval" ? "12 hours" : "4 hours",
      required: true,
      position: { x: 250, y: yPos },
    };

    const newEdges = [...existingEdges];
    const lastNode = existingNodes[existingNodes.length - 1];
    if (lastNode) {
      newEdges.push({
        id: `e-${lastNode.id}-${genericNodeId}`,
        source: lastNode.id,
        target: genericNodeId,
      });
    }

    existingNodes.push(genericNode);

    return {
      responseMessage: `I have incorporated '${formattedLabel}' as a ${detectedType} node in the workflow. You can click on it in the canvas to adjust roles, SLAs, or conditions.`,
      processUpdate: {
        nodes: existingNodes,
        edges: newEdges,
      },
      suggestedChanges: [`Added ${detectedType} node: ${formattedLabel}`],
      suggestedPrompts: [
        "Add a managerial approval after this step",
        "Add an escalation SLA timer",
        "Connect to the fulfillment team",
      ],
    };
  }
}
