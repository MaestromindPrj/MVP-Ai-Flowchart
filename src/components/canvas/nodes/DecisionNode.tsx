"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import { ProcessNode } from "@/lib/ai/types";

export const DecisionNode = memo(({ data, selected }: any) => {
  const nodeData = data as ProcessNode;

  return (
    <div
      className={`relative w-[240px] bg-white rounded-lg border-2 shadow-subtle p-3.5 transition-all duration-150 ${
        selected
          ? "border-purple-500 ring-2 ring-purple-500/20 shadow-md"
          : "border-purple-300 hover:border-purple-400 bg-purple-50/20"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-purple-500"
      />

      <div className="flex items-start gap-2.5">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-purple-100 text-purple-700 shrink-0 mt-0.5">
          <GitBranch className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="inline-flex items-center justify-center h-5 leading-5 text-[10px] font-bold text-purple-800 bg-purple-100 px-2 rounded">
              Decision Rule
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-900 leading-snug break-words">
            {nodeData.label}
          </div>
          {nodeData.condition && (
            <div className="mt-1.5 px-2 py-1 bg-purple-50 rounded border border-purple-200/80 text-[10px] font-mono text-purple-700">
              {nodeData.condition}
            </div>
          )}
          {nodeData.description && !nodeData.condition && (
            <p className="mt-1.5 text-[11px] text-slate-600 line-clamp-2">
              {nodeData.description}
            </p>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!bg-purple-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-purple-500"
      />
    </div>
  );
});

DecisionNode.displayName = "DecisionNode";
