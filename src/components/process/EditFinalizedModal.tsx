"use client";

import React, { useState } from "react";
import {
  Lock,
  Unlock,
  GitBranch,
  RotateCcw,
  Sparkles,
  AlertCircle,
  X,
  Loader2,
  CheckCircle2,
  FileEdit,
} from "lucide-react";

interface EditFinalizedModalProps {
  isOpen: boolean;
  onClose: () => void;
  processName: string;
  currentVersionNumber: number;
  onUnlock: (mode: "new_version" | "unlock_current", summary?: string) => Promise<void>;
}

export function EditFinalizedModal({
  isOpen,
  onClose,
  processName,
  currentVersionNumber,
  onUnlock,
}: EditFinalizedModalProps) {
  const [mode, setMode] = useState<"new_version" | "unlock_current">("new_version");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onUnlock(mode, summary.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to unlock flowchart for editing.");
    } finally {
      setIsLoading(false);
    }
  };

  const nextVersionNumber = currentVersionNumber + 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-8 animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Edit Finalized Flowchart</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Choose how you want to unlock &ldquo;{processName}&rdquo; for editing
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed font-medium">{error}</div>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            This flowchart is currently locked in <strong className="text-emerald-700">Finalized</strong> status.
            Select your preferred editing workflow below:
          </p>

          <div className="space-y-3">
            {/* Option 1: Create New Version Revision (Recommended) */}
            <label
              className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                mode === "new_version"
                  ? "border-blue-500 bg-blue-50/40 shadow-xs"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="edit-mode"
                  checked={mode === "new_version"}
                  onChange={() => setMode("new_version")}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                      Create New Revision (v{nextVersionNumber})
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Preserves Version {currentVersionNumber} as an approved snapshot in version history, and initializes Version {nextVersionNumber} in Draft mode ready for edits.
                  </p>

                  {mode === "new_version" && (
                    <div className="mt-3 pt-3 border-t border-blue-100 animate-in fade-in">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Revision Reason / Summary (Optional)
                      </label>
                      <input
                        type="text"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder={`e.g. Updating steps from Version ${currentVersionNumber}`}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </label>

            {/* Option 2: Re-open Current Version as Draft */}
            <label
              className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                mode === "unlock_current"
                  ? "border-blue-500 bg-blue-50/40 shadow-xs"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="edit-mode"
                  checked={mode === "unlock_current"}
                  onChange={() => setMode("unlock_current")}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                      Re-open Version {currentVersionNumber} Directly
                    </span>
                    <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      Direct Unlock
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Switches the current Version {currentVersionNumber} back to Draft mode without incrementing the version number. You can edit the steps immediately.
                  </p>
                </div>
              </div>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="h-9 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 h-9 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Unlock className="w-3.5 h-3.5" />
              )}
              <span>
                {mode === "new_version"
                  ? `Create Version ${nextVersionNumber} & Edit`
                  : `Unlock Version ${currentVersionNumber} & Edit`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
