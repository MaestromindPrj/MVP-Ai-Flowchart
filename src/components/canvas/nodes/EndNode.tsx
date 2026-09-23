"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { CheckCircle2 } from "lucide-react";
import { ProcessNode } from "@/lib/ai/types";

export const EndNode = memo(({ data, selected }: any) => {
  const nodeData = data as ProcessNode;

  return (
    <div
      className={`relative min-w-[200px] max-w-[240px] px-4 py-2.5 bg-white border-2 rounded-full shadow-subtle transition-all duration-150 ${
        selected
          ? "border-slate-800 ring-2 ring-slate-800/20 shadow-md"
          : "border-slate-400 hover:border-slate-600"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-700"
      />

      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-800 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-slate-700" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            End State
          </div>
          <div className="text-xs font-semibold text-slate-900 truncate">
            {nodeData.label || "Completed"}
          </div>
          {nodeData.role && (
            <div className="text-[10px] text-slate-500 truncate">
              {nodeData.role}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

EndNode.displayName = "EndNode";
