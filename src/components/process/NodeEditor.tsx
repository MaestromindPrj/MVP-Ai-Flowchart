"use client";

import React, { useState, useEffect } from "react";
import { X, Trash2, Check, ShieldCheck, CheckSquare, GitBranch, Play, CheckCircle2 } from "lucide-react";
import { ProcessNode, ProcessNodeType } from "@/lib/ai/types";

interface NodeEditorProps {
  node: ProcessNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedNode: ProcessNode) => void;
  onDelete: (nodeId: string) => void;
}

export function NodeEditor({
  node,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: NodeEditorProps) {
  const [formData, setFormData] = useState<Partial<ProcessNode>>({});

  useEffect(() => {
    if (node) {
      setFormData({
        ...node,
      });
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label?.trim()) return;

    onSave({
      ...node,
      label: formData.label.trim(),
      type: (formData.type as ProcessNodeType) || node.type,
      role: formData.role?.trim() || "",
      description: formData.description?.trim() || "",
      sla: formData.sla?.trim() || "",
      required: formData.required ?? true,
      condition: formData.condition?.trim() || "",
    });
  };

  const nodeTypes: { type: ProcessNodeType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { type: "task", label: "Task", icon: CheckSquare },
    { type: "approval", label: "Approval", icon: ShieldCheck },
    { type: "decision", label: "Decision", icon: GitBranch },
    { type: "start", label: "Start", icon: Play },
    { type: "end", label: "End", icon: CheckCircle2 },
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col animate-in slide-in-from-right duration-200">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Edit Step</h3>
          <p className="text-xs text-slate-500">Configure flowchart node parameters</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Step Type
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {nodeTypes.map((item) => {
              const Icon = item.icon;
              const isSelected = formData.type === item.type;
              return (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setFormData({ ...formData, type: item.type })}
                  className={`flex flex-col items-center justify-center p-2 rounded-md border text-xs font-medium transition-all ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/80 text-blue-700 font-semibold"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Step Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.label || ""}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder="e.g. Manager Approval"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Assigned Role / Owner
          </label>
          <input
            type="text"
            value={formData.role || ""}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            placeholder="e.g. Sales Manager, Warehouse Lead"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>

        {formData.type === "decision" && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Decision Condition Rule
            </label>
            <input
              type="text"
              value={formData.condition || ""}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              placeholder="e.g. Order Total > $10,000"
              className="w-full px-3 py-2 text-xs border border-purple-300 bg-purple-50/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 font-mono"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target SLA
            </label>
            <input
              type="text"
              value={formData.sla || ""}
              onChange={(e) => setFormData({ ...formData, sla: e.target.value })}
              placeholder="e.g. 4 hours, 2 days"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Required Step
            </label>
            <select
              value={formData.required ? "yes" : "no"}
              onChange={(e) =>
                setFormData({ ...formData, required: e.target.value === "yes" })
              }
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
            >
              <option value="yes">Yes (Mandatory)</option>
              <option value="no">No (Optional)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description & Instructions
          </label>
          <textarea
            rows={4}
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Detail standard operating instructions, verification checklist, or escalation paths..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>
      </form>

      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={() => {
            onDelete(node.id);
            onClose();
          }}
          className="inline-flex items-center gap-1.5 h-10 px-3.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg border border-red-200 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Step</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 h-10 px-5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
