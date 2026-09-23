"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Play } from "lucide-react";
import { ProcessNode } from "@/lib/ai/types";

export const StartNode = memo(({ data, selected }: any) => {
  const nodeData = data as ProcessNode;

  return (
    <div
      className={`relative min-w-[200px] max-w-[240px] px-4 py-2.5 bg-white border-2 rounded-full shadow-subtle transition-all duration-150 ${
        selected
          ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
          : "border-emerald-400 hover:border-emerald-500"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 shrink-0">
          <Play className="w-3.5 h-3.5 fill-emerald-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold tracking-wider text-emerald-600 uppercase">
            Start
          </div>
          <div className="text-xs font-semibold text-slate-800 truncate">
            {nodeData.label || "Initiate"}
          </div>
          {nodeData.role && (
            <div className="text-[10px] text-slate-500 truncate">
              {nodeData.role}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-emerald-500"
      />
    </div>
  );
});

StartNode.displayName = "StartNode";
