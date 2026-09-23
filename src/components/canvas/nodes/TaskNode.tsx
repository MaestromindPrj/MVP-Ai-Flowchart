"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { CheckSquare, Clock, User } from "lucide-react";
import { ProcessNode } from "@/lib/ai/types";

export const TaskNode = memo(({ data, selected }: any) => {
  const nodeData = data as ProcessNode;

  return (
    <div
      className={`relative w-[250px] bg-white rounded-lg border shadow-subtle p-3 transition-all duration-150 ${
        selected
          ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-500"
      />

      <div className="flex items-start gap-2.5">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-50 text-blue-600 shrink-0 mt-0.5">
          <CheckSquare className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="inline-flex items-center justify-center h-5 leading-5 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 rounded">
              Task
            </span>
            {nodeData.sla && (
              <span className="inline-flex items-center justify-center gap-1 h-5 leading-5 text-[10px] text-slate-500 bg-slate-100 px-1.5 rounded font-mono">
                <Clock className="w-2.5 h-2.5" />
                {nodeData.sla}
              </span>
            )}
          </div>
          <div className="text-xs font-semibold text-slate-800 leading-snug break-words">
            {nodeData.label}
          </div>
          {nodeData.role && (
            <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-500 font-medium truncate">
              <User className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{nodeData.role}</span>
            </div>
          )}
          {nodeData.description && (
            <p className="mt-1.5 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
              {nodeData.description}
            </p>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-500"
      />
    </div>
  );
});

TaskNode.displayName = "TaskNode";
