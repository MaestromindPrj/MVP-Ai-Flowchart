"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  CheckCircle,
  FileText,
  History,
  Check,
  Loader2,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Eye,
} from "lucide-react";
import { ProcessCanvas } from "./ProcessCanvas";
import { ProcessChat, ChatMessage } from "./ProcessChat";
import { ProcessInfo, Participant } from "./ProcessInfo";
import { NodeEditor } from "./NodeEditor";
import { VersionHistoryModal, ProcessVersionItem } from "./VersionHistoryModal";
import { FinalizeModal } from "./FinalizeModal";
import { ProcessData, ProcessNode, ProcessEdge } from "@/lib/ai/types";
import { useToast } from "@/components/ui/Toast";

interface ProcessWorkspaceProps {
  initialProcess: any;
}

export function ProcessWorkspace({ initialProcess }: ProcessWorkspaceProps) {
  const toast = useToast();

  const [process, setProcess] = useState(initialProcess);
  const [nodes, setNodes] = useState<ProcessNode[]>(
    initialProcess?.processData?.nodes || []
  );
  const [edges, setEdges] = useState<ProcessEdge[]>(
    initialProcess?.processData?.edges || []
  );
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialProcess?.messages || []
  );
  const [participants, setParticipants] = useState<Participant[]>(
    initialProcess?.participants || []
  );

  const [selectedNode, setSelectedNode] = useState<ProcessNode | null>(null);
  const [isNodeEditorOpen, setIsNodeEditorOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);

  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("saved");

  const historyStack = useRef<ProcessData[]>([
    {
      nodes: initialProcess?.processData?.nodes || [],
      edges: initialProcess?.processData?.edges || [],
    },
  ]);
  const historyIndex = useRef<number>(0);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isFinalized = process?.status === "Finalized" || process?.status === "Approved";

  const triggerAutosave = useCallback(
    (newNodes: ProcessNode[], newEdges: ProcessEdge[]) => {
      if (isFinalized) return;

      setSaveStatus("saving");
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/processes/${process.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              processData: { nodes: newNodes, edges: newEdges },
            }),
          });

          if (res.ok) {
            setSaveStatus("saved");
          } else {
            setSaveStatus("idle");
          }
        } catch (err) {
          setSaveStatus("idle");
        }
      }, 900);
    },
    [process.id, isFinalized]
  );

  const pushHistory = useCallback(
    (newProcessData: ProcessData) => {
      const nextIndex = historyIndex.current + 1;
      const newStack = historyStack.current.slice(0, nextIndex);
      newStack.push(newProcessData);
      historyStack.current = newStack;
      historyIndex.current = nextIndex;
    },
    []
  );

  const handleNodesChange = useCallback(
    (newNodes: ProcessNode[]) => {
      setNodes(newNodes);
      pushHistory({ nodes: newNodes, edges });
      triggerAutosave(newNodes, edges);
    },
    [edges, pushHistory, triggerAutosave]
  );

  const handleEdgesChange = useCallback(
    (newEdges: ProcessEdge[]) => {
      setEdges(newEdges);
      pushHistory({ nodes, edges: newEdges });
      triggerAutosave(nodes, newEdges);
    },
    [nodes, pushHistory, triggerAutosave]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex.current > 0) {
      historyIndex.current -= 1;
      const target = historyStack.current[historyIndex.current];
      setNodes(target.nodes);
      setEdges(target.edges);
      triggerAutosave(target.nodes, target.edges);
    }
  }, [triggerAutosave]);

  const handleRedo = useCallback(() => {
    if (historyIndex.current < historyStack.current.length - 1) {
      historyIndex.current += 1;
      const target = historyStack.current[historyIndex.current];
      setNodes(target.nodes);
      setEdges(target.edges);
      triggerAutosave(target.nodes, target.edges);
    }
  }, [triggerAutosave]);

  const handleNodeSelect = useCallback((node: ProcessNode | null) => {
    setSelectedNode(node);
    setIsNodeEditorOpen(!!node);
  }, []);

  const handleSaveNode = useCallback(
    (updatedNode: ProcessNode) => {
      const updatedNodes = nodes.map((n) =>
        n.id === updatedNode.id ? updatedNode : n
      );
      setNodes(updatedNodes);
      pushHistory({ nodes: updatedNodes, edges });
      triggerAutosave(updatedNodes, edges);
      setSelectedNode(null);
      setIsNodeEditorOpen(false);
      toast.success("Step updated", `Saved parameters for ${updatedNode.label}`);
    },
    [nodes, edges, pushHistory, triggerAutosave, toast]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const updatedNodes = nodes.filter((n) => n.id !== nodeId);
      const updatedEdges = edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      );
      setNodes(updatedNodes);
      setEdges(updatedEdges);
      pushHistory({ nodes: updatedNodes, edges: updatedEdges });
      triggerAutosave(updatedNodes, updatedEdges);
      setSelectedNode(null);
      setIsNodeEditorOpen(false);
      toast.info("Step removed", "Node and connected edges removed from flowchart");
    },
    [nodes, edges, pushHistory, triggerAutosave, toast]
  );

  const handleAIProcessUpdate = useCallback(
    (updatedProcess: ProcessData) => {
      if (updatedProcess.nodes) setNodes(updatedProcess.nodes);
      if (updatedProcess.edges) setEdges(updatedProcess.edges);
      pushHistory(updatedProcess);
      setSaveStatus("saved");
      toast.success("Flowchart updated by AI", "Structured steps incorporated");
    },
    [pushHistory, toast]
  );

  const handleNewChatMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleAddParticipant = useCallback(
    async (part: { name: string; role: string; email?: string }) => {
      try {
        const res = await fetch(`/api/processes/${process.id}/participants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(part),
        });
        if (res.ok) {
          const data = await res.json();
          setParticipants((prev) => [...prev, data.participant]);
          toast.success("Participant added", `${part.name} added as ${part.role}`);
        }
      } catch (err) {
        toast.error("Error", "Failed to add participant");
      }
    },
    [process.id, toast]
  );

  const handleRemoveParticipant = useCallback(
    async (participantId: string) => {
      try {
        const res = await fetch(
          `/api/processes/${process.id}/participants/${participantId}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          setParticipants((prev) => prev.filter((p) => p.id !== participantId));
          toast.info("Participant removed");
        }
      } catch (err) {
        toast.error("Error", "Failed to remove participant");
      }
    },
    [process.id, toast]
  );

  const handleRestoreVersion = useCallback(
    async (version: ProcessVersionItem) => {
      try {
        const res = await fetch(
          `/api/processes/${process.id}/versions/${version.id}/restore`,
          { method: "POST" }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.restoredVersion?.processData) {
            setNodes(data.restoredVersion.processData.nodes || []);
            setEdges(data.restoredVersion.processData.edges || []);
            setProcess((prev: any) => ({
              ...prev,
              currentVersionNumber: data.restoredVersion.versionNumber,
              status: "Draft",
            }));
            toast.success(
              "Version restored",
              `Reverted state to Version ${version.versionNumber}`
            );
          }
        }
      } catch (err) {
        toast.error("Error", "Failed to restore version");
      }
    },
    [process.id, toast]
  );

  const handleCreateSnapshot = useCallback(
    async (summary: string) => {
      try {
        const res = await fetch(`/api/processes/${process.id}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            processData: { nodes, edges },
            changeSummary: summary,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setProcess((prev: any) => ({
            ...prev,
            currentVersionNumber: data.version.versionNumber,
          }));
          toast.success("Snapshot created", `Version ${data.version.versionNumber} saved`);
        }
      } catch (err) {
        toast.error("Error", "Failed to create version snapshot");
      }
    },
    [process.id, nodes, edges, toast]
  );

  const handleFinalize = useCallback(async () => {
    try {
      const res = await fetch(`/api/processes/${process.id}/finalize`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setProcess((prev: any) => ({
          ...prev,
          status: "Finalized",
        }));
        toast.success(
          "Process Finalized",
          "This baseline is now approved and ready for export"
        );
      }
    } catch (err) {
      toast.error("Error", "Failed to finalize process");
    }
  }, [process.id, toast]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 select-none">
      <header className="h-16 bg-white border-b border-slate-200 px-5 flex items-center justify-between shrink-0 z-30 shadow-subtle">
        <div className="flex items-center gap-3.5 min-w-0">
          <Link
            href="/processes"
            title="Back to Processes"
            className="inline-flex items-center justify-center h-10 w-10 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>

          <div className="h-5 w-px bg-slate-200 shrink-0"></div>

          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-sm font-bold text-slate-900 truncate">
              {process.name}
            </h1>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide shrink-0 ${
                isFinalized
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {process.status}
            </span>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 border border-blue-200/60 px-2.5 py-1 rounded-md shrink-0">
              v{process.currentVersionNumber}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-medium">
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Saving changes...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Saved just now</span>
              </>
            )}
          </div>

          <div className="h-5 w-px bg-slate-200 hidden md:block"></div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              title={leftPanelOpen ? "Collapse AI Chat" : "Expand AI Chat"}
              className={`h-10 w-10 flex items-center justify-center rounded-lg border text-xs transition-colors ${
                leftPanelOpen
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsVersionsOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors"
            >
              <History className="w-4 h-4 text-slate-500" />
              <span>Versions</span>
            </button>

            <Link
              href={`/processes/${process.id}/documentation`}
              className="inline-flex items-center gap-2 h-10 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Docs & Export</span>
            </Link>

            {!isFinalized && (
              <button
                onClick={() => setIsFinalizeOpen(true)}
                className="inline-flex items-center gap-2 h-10 px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Finalize</span>
              </button>
            )}

            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              title={rightPanelOpen ? "Collapse Info" : "Expand Info"}
              className={`h-10 w-10 flex items-center justify-center rounded-lg border text-xs transition-colors ${
                rightPanelOpen
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {leftPanelOpen && (
          <ProcessChat
            processId={process.id}
            messages={messages}
            currentProcess={{ nodes, edges }}
            onProcessUpdate={handleAIProcessUpdate}
            onNewMessage={handleNewChatMessage}
            isReadOnly={isFinalized}
          />
        )}

        <div className="flex-1 relative h-full">
          <ProcessCanvas
            initialNodes={nodes}
            initialEdges={edges}
            onNodesChangeParent={handleNodesChange}
            onEdgesChangeParent={handleEdgesChange}
            onNodeSelect={handleNodeSelect}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex.current > 0}
            canRedo={historyIndex.current < historyStack.current.length - 1}
            isReadOnly={isFinalized}
          />
        </div>

        {rightPanelOpen && (
          <ProcessInfo
            process={process}
            participants={participants}
            onAddParticipant={handleAddParticipant}
            onRemoveParticipant={handleRemoveParticipant}
            onOpenVersions={() => setIsVersionsOpen(true)}
            onOpenFinalize={() => setIsFinalizeOpen(true)}
            isReadOnly={isFinalized}
          />
        )}
      </div>

      <NodeEditor
        node={selectedNode}
        isOpen={isNodeEditorOpen && !isFinalized}
        onClose={() => {
          setSelectedNode(null);
          setIsNodeEditorOpen(false);
        }}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
      />

      <VersionHistoryModal
        isOpen={isVersionsOpen}
        onClose={() => setIsVersionsOpen(false)}
        processId={process.id}
        currentVersionNumber={process.currentVersionNumber}
        currentProcessData={{ nodes, edges }}
        onRestoreVersion={handleRestoreVersion}
        onCreateSnapshot={handleCreateSnapshot}
      />

      <FinalizeModal
        isOpen={isFinalizeOpen}
        onClose={() => setIsFinalizeOpen(false)}
        onFinalize={handleFinalize}
        processName={process.name}
        versionNumber={process.currentVersionNumber}
      />
    </div>
  );
}
