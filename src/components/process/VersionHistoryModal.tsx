"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  History,
  RotateCcw,
  Plus,
  CheckCircle2,
  GitCommit,
  ArrowRight,
  PlusCircle,
  Edit,
  MinusCircle,
  Loader2,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { ProcessData, ProcessNode } from "@/lib/ai/types";

export interface ProcessVersionItem {
  id: string;
  versionNumber: number;
  changeSummary: string | null;
  createdBy: string;
  createdAt: string;
  processData: ProcessData;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  processId: string;
  currentVersionNumber: number;
  currentProcessData: ProcessData;
  onRestoreVersion: (version: ProcessVersionItem) => void;
  onCreateSnapshot: (summary: string) => Promise<void>;
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  processId,
  currentVersionNumber,
  currentProcessData,
  onRestoreVersion,
  onCreateSnapshot,
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<ProcessVersionItem[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [snapshotSummary, setSnapshotSummary] = useState("");
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, processId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/processes/${processId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
        if (data.versions?.length > 0) {
          const current = data.versions.find(
            (v: ProcessVersionItem) => v.versionNumber === currentVersionNumber
          );
          setSelectedVersionId(current ? current.id : data.versions[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedVersion = versions.find((v) => v.id === selectedVersionId);

  const calculateDiff = (current: ProcessData, target: ProcessData) => {
    const currentNodes = current?.nodes || [];
    const targetNodes = target?.nodes || [];

    const targetNodeIds = new Set(targetNodes.map((n) => n.id));
    const currentNodeIds = new Set(currentNodes.map((n) => n.id));

    const added = currentNodes.filter((n) => !targetNodeIds.has(n.id));
    const removed = targetNodes.filter((n) => !currentNodeIds.has(n.id));
    const modified = currentNodes.filter((n) => {
      const match = targetNodes.find((tn) => tn.id === n.id);
      return (
        match &&
        (match.label !== n.label ||
          match.type !== n.type ||
          match.role !== n.role ||
          match.sla !== n.sla)
      );
    });

    return { added, removed, modified };
  };

  const diff = selectedVersion
    ? calculateDiff(currentProcessData, selectedVersion.processData)
    : { added: [], removed: [], modified: [] };

  const handleCreateSnapshotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotSummary.trim()) return;
    setIsCreatingSnapshot(true);
    try {
      await onCreateSnapshot(snapshotSummary.trim());
      setSnapshotSummary("");
      await loadVersions();
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Version History & Comparison
              </h2>
              <p className="text-xs text-slate-500">
                Audit milestone changes, inspect diffs, and restore historical snapshots
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-5 border-r border-slate-200 flex flex-col bg-slate-50/40 overflow-y-auto p-4 space-y-4">
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-subtle">
              <div className="text-xs font-bold text-slate-800 mb-2">
                Save New Milestone Snapshot
              </div>
              <form onSubmit={handleCreateSnapshotSubmit} className="space-y-2">
                <input
                  type="text"
                  placeholder="e.g. Added Finance sign-off"
                  value={snapshotSummary}
                  onChange={(e) => setSnapshotSummary(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={!snapshotSummary.trim() || isCreatingSnapshot}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold disabled:opacity-50 shadow-sm transition-all"
                >
                  {isCreatingSnapshot ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Create Snapshot</span>
                </button>
              </form>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Saved Milestones ({versions.length})
              </div>
              {loading ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Loading versions...
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((ver) => {
                    const isCurrent = ver.versionNumber === currentVersionNumber;
                    const isSelected = ver.id === selectedVersionId;

                    return (
                      <button
                        key={ver.id}
                        type="button"
                        onClick={() => setSelectedVersionId(ver.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          isSelected
                            ? "bg-blue-50/80 border-blue-300 ring-1 ring-blue-300"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              v{ver.versionNumber}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                Current
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {formatDateTime(ver.createdAt)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 font-medium line-clamp-1">
                          {ver.changeSummary || `Version ${ver.versionNumber}`}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Author: {ver.createdBy}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col overflow-y-auto p-5 space-y-5 bg-white">
            {selectedVersion ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <div className="text-xs text-slate-400">Selected Snapshot</div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Version {selectedVersion.versionNumber}</span>
                      <span className="text-xs font-normal text-slate-500">
                        ({formatDateTime(selectedVersion.createdAt)})
                      </span>
                    </div>
                  </div>

                  {selectedVersion.versionNumber !== currentVersionNumber && (
                    <button
                      type="button"
                      onClick={() => {
                        onRestoreVersion(selectedVersion);
                        onClose();
                      }}
                      className="inline-flex items-center gap-2 h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Restore This Version</span>
                    </button>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Process Comparison
                  </h4>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <span>Live Canvas (v{currentVersionNumber})</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span>v{selectedVersion.versionNumber}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 text-center">
                      <div className="p-2 bg-emerald-50 rounded border border-emerald-100">
                        <div className="text-xs font-bold text-emerald-700">
                          +{diff.added.length}
                        </div>
                        <div className="text-[10px] text-emerald-600 uppercase font-semibold">
                          Added
                        </div>
                      </div>
                      <div className="p-2 bg-amber-50 rounded border border-amber-100">
                        <div className="text-xs font-bold text-amber-700">
                          {diff.modified.length}
                        </div>
                        <div className="text-[10px] text-amber-600 uppercase font-semibold">
                          Modified
                        </div>
                      </div>
                      <div className="p-2 bg-red-50 rounded border border-red-100">
                        <div className="text-xs font-bold text-red-700">
                          -{diff.removed.length}
                        </div>
                        <div className="text-[10px] text-red-600 uppercase font-semibold">
                          Removed
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      {diff.added.map((node) => (
                        <div
                          key={node.id}
                          className="flex items-center gap-2 text-xs text-emerald-700"
                        >
                          <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Added {node.type}: <strong>{node.label}</strong>
                          </span>
                        </div>
                      ))}
                      {diff.modified.map((node) => (
                        <div
                          key={node.id}
                          className="flex items-center gap-2 text-xs text-amber-700"
                        >
                          <Edit className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Modified {node.type}: <strong>{node.label}</strong>
                          </span>
                        </div>
                      ))}
                      {diff.removed.map((node) => (
                        <div
                          key={node.id}
                          className="flex items-center gap-2 text-xs text-red-700"
                        >
                          <MinusCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Removed: <strong>{node.label}</strong>
                          </span>
                        </div>
                      ))}
                      {diff.added.length === 0 &&
                        diff.modified.length === 0 &&
                        diff.removed.length === 0 && (
                          <div className="text-xs text-slate-500 italic text-center py-1">
                            No structural differences between these two states.
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Snapshot Nodes ({selectedVersion.processData?.nodes?.length || 0})
                  </h4>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {selectedVersion.processData?.nodes?.map((node: ProcessNode, i: number) => (
                      <div
                        key={node.id}
                        className="p-2 bg-slate-50 border border-slate-200 rounded text-xs"
                      >
                        <div className="font-semibold text-slate-800 truncate">
                          {i + 1}. {node.label}
                        </div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          {node.type} {node.role ? `• ${node.role}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Select a version from the left panel to inspect details.
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
