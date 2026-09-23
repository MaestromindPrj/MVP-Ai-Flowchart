"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, CheckSquare, ShieldCheck, GitBranch, Play, CheckCircle2, ChevronUp } from "lucide-react";
import { ProcessNodeType } from "@/lib/ai/types";

interface AddNodeMenuProps {
  onAddNode: (type: ProcessNodeType) => void;
}

export function AddNodeMenu({ onAddNode }: AddNodeMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const items: {
    type: ProcessNodeType;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
  }[] = [
    {
      type: "task",
      label: "Task Step",
      description: "Standard operational or manual action",
      icon: CheckSquare,
      badgeClass: "bg-blue-50 text-blue-600 border-blue-200",
    },
    {
      type: "approval",
      label: "Approval Gate",
      description: "Review or sign-off by manager/finance",
      icon: ShieldCheck,
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      type: "decision",
      label: "Decision Rule",
      description: "Conditional branching logic and checks",
      icon: GitBranch,
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      type: "start",
      label: "Start Node",
      description: "Initial trigger or intake point",
      icon: Play,
      badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    {
      type: "end",
      label: "End State",
      description: "Terminal success or archival state",
      icon: CheckCircle2,
      badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
    },
  ];

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Step</span>
        <ChevronUp
          className={`w-3.5 h-3.5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-72 bg-white rounded-lg shadow-dropdown border border-slate-200 p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Choose Step Type
          </div>
          <div className="space-y-1 mt-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  onClick={() => {
                    onAddNode(item.type);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-start gap-2.5 p-2 rounded-md hover:bg-slate-50 transition-colors text-left group"
                >
                  <div
                    className={`p-1.5 rounded-md border shrink-0 ${item.badgeClass}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
