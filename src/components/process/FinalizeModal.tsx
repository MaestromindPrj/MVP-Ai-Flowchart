"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, X, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

interface FinalizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinalize: () => Promise<void>;
  processName: string;
  versionNumber: number;
}

export function FinalizeModal({
  isOpen,
  onClose,
  onFinalize,
  processName,
  versionNumber,
}: FinalizeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onFinalize();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-1.5">
            Finalize Business Process?
          </h3>

          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto mb-4">
            You are about to finalize <strong className="text-slate-800">{processName} (v{versionNumber})</strong>. Once finalized, this version becomes the officially approved operational baseline and will be marked as Approved.
          </p>

          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-lg text-left flex items-start gap-2.5 mb-5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 leading-normal">
              Any further revisions will create a new draft iteration to preserve governance audit trails.
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="h-10 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 h-10 px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Finalize & Approve</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
