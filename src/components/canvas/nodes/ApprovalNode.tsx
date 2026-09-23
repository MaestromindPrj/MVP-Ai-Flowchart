"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ShieldCheck, Clock, UserCheck } from "lucide-react";
import { ProcessNode } from "@/lib/ai/types";

export const ApprovalNode = memo(({ data, selected }: any) => {
  const nodeData = data as ProcessNode;

  return (
    <div
      className={`relative w-[250px] bg-white rounded-lg border-2 shadow-subtle p-3 transition-all duration-150 ${
        selected
          ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md"
          : "border-amber-300 hover:border-amber-400 bg-amber-50/20"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-amber-500"
      />

      <div className="flex items-start gap-2.5">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-amber-100 text-amber-700 shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="inline-flex items-center justify-center h-5 leading-5 text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 rounded">
              Approval Gate
            </span>
            {nodeData.sla && (
              <span className="inline-flex items-center justify-center gap-1 h-5 leading-5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 rounded font-mono">
                <Clock className="w-2.5 h-2.5" />
                {nodeData.sla}
              </span>
            )}
          </div>
          <div className="text-xs font-semibold text-slate-900 leading-snug break-words">
            {nodeData.label}
          </div>
          {nodeData.role && (
            <div className="flex items-center gap-1 mt-1.5 text-[11px] text-amber-800 font-medium truncate">
              <UserCheck className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="truncate">{nodeData.role}</span>
            </div>
          )}
          {nodeData.description && (
            <p className="mt-1.5 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
              {nodeData.description}
            </p>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-amber-500"
      />
    </div>
  );
});

ApprovalNode.displayName = "ApprovalNode";
