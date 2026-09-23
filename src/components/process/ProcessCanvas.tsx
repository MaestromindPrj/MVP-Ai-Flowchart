"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
  MarkerType,
} from "@xyflow/react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Map,
  RotateCcw,
  RotateCw,
  LayoutGrid,
  ArrowDown,
  ArrowRight,
  Edit2,
  X,
  Check,
  Trash2,
} from "lucide-react";
import { StartNode } from "../canvas/nodes/StartNode";
import { TaskNode } from "../canvas/nodes/TaskNode";
import { ApprovalNode } from "../canvas/nodes/ApprovalNode";
import { DecisionNode } from "../canvas/nodes/DecisionNode";
import { EndNode } from "../canvas/nodes/EndNode";
import { AddNodeMenu } from "./AddNodeMenu";
import { ProcessNode, ProcessEdge, ProcessNodeType } from "@/lib/ai/types";
import { getLayoutedElements } from "@/lib/process/layout";

interface ProcessCanvasProps {
  initialNodes: ProcessNode[];
  initialEdges: ProcessEdge[];
  onNodesChangeParent?: (nodes: ProcessNode[]) => void;
  onEdgesChangeParent?: (edges: ProcessEdge[]) => void;
  onNodeSelect?: (node: ProcessNode | null) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isReadOnly?: boolean;
}

export function ProcessCanvas({
  initialNodes,
  initialEdges,
  onNodesChangeParent,
  onEdgesChangeParent,
  onNodeSelect,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  isReadOnly = false,
}: ProcessCanvasProps) {
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [layoutDir, setLayoutDir] = useState<"TB" | "LR">("TB");
  const [selectedEdge, setSelectedEdge] = useState<ProcessEdge | null>(null);
  const [edgeLabelInput, setEdgeLabelInput] = useState("");

  const nodeTypes = useMemo(
    () => ({
      start: StartNode as any,
      task: TaskNode as any,
      approval: ApprovalNode as any,
      decision: DecisionNode as any,
      end: EndNode as any,
    }),
    []
  );

  const formattedNodes: Node[] = useMemo(() => {
    return initialNodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position || { x: 250, y: 100 },
      data: { ...n },
    }));
  }, [initialNodes]);

  const formattedEdges: Edge[] = useMemo(() => {
    return initialEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label || e.condition || "",
      type: "smoothstep",
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: "#64748b",
      },
    }));
  }, [initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(formattedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(formattedEdges);

  React.useEffect(() => {
    setNodes(formattedNodes);
  }, [formattedNodes, setNodes]);

  React.useEffect(() => {
    setEdges(formattedEdges);
  }, [formattedEdges, setEdges]);

  const handleNodeClick = useCallback(
    (_event: any, node: Node) => {
      setSelectedEdge(null);
      if (onNodeSelect) {
        const found = initialNodes.find((n) => n.id === node.id);
        if (found) {
          onNodeSelect(found);
        } else {
          onNodeSelect({
            id: node.id,
            type: (node.type as ProcessNodeType) || "task",
            label: (node.data as any)?.label || "Step",
            position: node.position,
            ...(node.data as any),
          });
        }
      }
    },
    [initialNodes, onNodeSelect]
  );

  const handleEdgeClick = useCallback(
    (_event: any, edge: Edge) => {
      onNodeSelect?.(null);
      const found = initialEdges.find((e) => e.id === edge.id);
      if (found) {
        setSelectedEdge(found);
        setEdgeLabelInput(found.label || found.condition || "");
      } else {
        setSelectedEdge({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: (edge.label as string) || "",
        });
        setEdgeLabelInput((edge.label as string) || "");
      }
    },
    [initialEdges, onNodeSelect]
  );

  const handlePaneClick = useCallback(() => {
    onNodeSelect?.(null);
    setSelectedEdge(null);
  }, [onNodeSelect]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (isReadOnly) return;
      if (!connection.source || !connection.target) return;

      const newEdge: ProcessEdge = {
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        label: "",
      };

      const updatedEdges = [...initialEdges, newEdge];
      onEdgesChangeParent?.(updatedEdges);
    },
    [initialEdges, isReadOnly, onEdgesChangeParent]
  );

  const handleNodeDragStop = useCallback(
    (_event: any, node: Node) => {
      if (isReadOnly) return;
      const updatedNodes = initialNodes.map((n) =>
        n.id === node.id ? { ...n, position: node.position } : n
      );
      onNodesChangeParent?.(updatedNodes);
    },
    [initialNodes, isReadOnly, onNodesChangeParent]
  );

  const handleNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      if (isReadOnly) return;
      const deletedIds = new Set(deletedNodes.map((n) => n.id));
      const updatedNodes = initialNodes.filter((n) => !deletedIds.has(n.id));
      const updatedEdges = initialEdges.filter(
        (e) => !deletedIds.has(e.source) && !deletedIds.has(e.target)
      );
      onNodesChangeParent?.(updatedNodes);
      onEdgesChangeParent?.(updatedEdges);
      onNodeSelect?.(null);
    },
    [initialNodes, initialEdges, isReadOnly, onNodesChangeParent, onEdgesChangeParent, onNodeSelect]
  );

  const handleEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      if (isReadOnly) return;
      const deletedIds = new Set(deletedEdges.map((e) => e.id));
      const updatedEdges = initialEdges.filter((e) => !deletedIds.has(e.id));
      onEdgesChangeParent?.(updatedEdges);
      setSelectedEdge(null);
    },
    [initialEdges, isReadOnly, onEdgesChangeParent]
  );

  const handleSaveEdgeLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEdge) return;

    const updatedEdges = initialEdges.map((ed) =>
      ed.id === selectedEdge.id
        ? { ...ed, label: edgeLabelInput.trim() }
        : ed
    );
    onEdgesChangeParent?.(updatedEdges);
    setSelectedEdge(null);
  };

  const handleDeleteSelectedEdge = () => {
    if (!selectedEdge) return;
    const updatedEdges = initialEdges.filter((ed) => ed.id !== selectedEdge.id);
    onEdgesChangeParent?.(updatedEdges);
    setSelectedEdge(null);
  };

  const handleAddNode = useCallback(
    (type: ProcessNodeType) => {
      if (isReadOnly) return;
      const newNodeId = `node-${Date.now()}`;
      const highestY = initialNodes.reduce(
        (max, n) => Math.max(max, n.position?.y || 0),
        0
      );

      const labels: Record<ProcessNodeType, string> = {
        task: "New Task",
        approval: "Manager Review",
        decision: "Criteria Check?",
        start: "Process Trigger",
        end: "Finished State",
      };

      const newNode: ProcessNode = {
        id: newNodeId,
        type,
        label: labels[type],
        role: "Process Lead",
        description: "",
        sla: type === "approval" ? "4 hours" : "1 day",
        required: true,
        position: { x: 250, y: highestY + 140 },
      };

      const updatedNodes = [...initialNodes, newNode];
      onNodesChangeParent?.(updatedNodes);
      onNodeSelect?.(newNode);
    },
    [initialNodes, isReadOnly, onNodesChangeParent, onNodeSelect]
  );

  const handleAutoLayout = useCallback(
    (direction: "TB" | "LR") => {
      setLayoutDir(direction);
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(initialNodes, initialEdges, direction);
      onNodesChangeParent?.(layoutedNodes);
      onEdgesChangeParent?.(layoutedEdges);
    },
    [initialNodes, initialEdges, onNodesChangeParent, onEdgesChangeParent]
  );

  return (
    <div className="w-full h-full relative bg-slate-50 overflow-hidden select-none">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        onNodeDragStop={handleNodeDragStop}
        onNodesDelete={handleNodesDelete}
        onEdgesDelete={handleEdgesDelete}
        nodeTypes={nodeTypes as any}
        fitView
        minZoom={0.2}
        maxZoom={2}
        snapToGrid={true}
        snapGrid={[15, 15]}
        nodesDraggable={!isReadOnly}
        nodesConnectable={!isReadOnly}
        elementsSelectable={!isReadOnly}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#cbd5e1"
        />

        <Panel position="top-left" className="m-4 flex items-center gap-2.5">
          {!isReadOnly && <AddNodeMenu onAddNode={handleAddNode} />}

          <div className="flex items-center h-10 bg-white rounded-lg border border-slate-200 shadow-sm p-1">
            <button
              onClick={() => handleAutoLayout("TB")}
              title="Auto Layout (Top-Down)"
              className={`h-8 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                layoutDir === "TB"
                  ? "bg-slate-100 text-slate-900 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <ArrowDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleAutoLayout("LR")}
              title="Auto Layout (Left-Right)"
              className={`h-8 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                layoutDir === "LR"
                  ? "bg-slate-100 text-slate-900 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center h-10 bg-white rounded-lg border border-slate-200 shadow-sm p-1">
            <button
              onClick={onUndo}
              disabled={!canUndo || isReadOnly}
              title="Undo (Ctrl+Z)"
              className="h-8 w-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo || isReadOnly}
              title="Redo (Ctrl+Y)"
              className="h-8 w-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </Panel>

        {selectedEdge && !isReadOnly && (
          <Panel position="top-right" className="m-4">
            <form
              onSubmit={handleSaveEdgeLabel}
              className="bg-white rounded-lg border border-slate-300 shadow-dropdown p-3 w-72 space-y-2 animate-in fade-in zoom-in-95"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                  Transition Label
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedEdge(null)}
                  className="p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                value={edgeLabelInput}
                onChange={(e) => setEdgeLabelInput(e.target.value)}
                placeholder="e.g. Yes, No, Approved, Total > $10k"
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500"
                autoFocus
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleDeleteSelectedEdge}
                  className="text-[11px] text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Line</span>
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold"
                >
                  <Check className="w-3 h-3" />
                  <span>Save Label</span>
                </button>
              </div>
            </form>
          </Panel>
        )}

        <Panel position="bottom-right" className="m-4 flex items-center gap-2">
          <button
            onClick={() => setShowMiniMap(!showMiniMap)}
            title="Toggle Mini Map"
            className={`p-2 rounded-md border text-xs shadow-sm transition-colors ${
              showMiniMap
                ? "bg-blue-50 border-blue-200 text-blue-600"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Map className="w-4 h-4" />
          </button>
        </Panel>

        {showMiniMap && (
          <MiniMap
            position="bottom-right"
            className="!mb-14 !mr-4 !border !border-slate-200 !rounded-lg !shadow-lg !bg-white/90"
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
        )}

        <Controls
          position="bottom-left"
          className="!m-4 !border-slate-200 !rounded-lg !shadow-sm !bg-white"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}
