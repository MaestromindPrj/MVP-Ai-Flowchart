import dagre from "dagre";
import { ProcessNode, ProcessEdge } from "../ai/types";

export function getLayoutedElements(
  nodes: ProcessNode[],
  edges: ProcessEdge[],
  direction: "TB" | "LR" = "TB"
): { nodes: ProcessNode[]; edges: ProcessEdge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 70,
    ranksep: 90,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    let width = 260;
    let height = 110;
    if (node.type === "decision") {
      width = 240;
      height = 140;
    } else if (node.type === "start" || node.type === "end") {
      width = 220;
      height = 70;
    }

    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    let width = 260;
    let height = 110;
    if (node.type === "decision") {
      width = 240;
      height = 140;
    } else if (node.type === "start" || node.type === "end") {
      width = 220;
      height = 70;
    }

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
