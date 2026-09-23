"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Users,
  Building,
  Calendar,
  Clock,
  History,
  FileText,
  CheckCircle,
  Plus,
  Trash2,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface Participant {
  id: string;
  name: string;
  role: string;
  email?: string | null;
}

interface ProcessInfoProps {
  process: {
    id: string;
    name: string;
    description?: string | null;
    department: string;
    ownerName: string;
    ownerEmail?: string | null;
    status: string;
    currentVersionNumber: number;
    createdAt: string;
    updatedAt: string;
  };
  participants: Participant[];
  onAddParticipant: (participant: { name: string; role: string; email?: string }) => void;
  onRemoveParticipant: (participantId: string) => void;
  onOpenVersions: () => void;
  onOpenFinalize: () => void;
  isReadOnly?: boolean;
}

export function ProcessInfo({
  process,
  participants,
  onAddParticipant,
  onRemoveParticipant,
  onOpenVersions,
  onOpenFinalize,
  isReadOnly = false,
}: ProcessInfoProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newRole.trim()) return;

    onAddParticipant({
      name: newName.trim(),
      role: newRole.trim(),
      email: newEmail.trim() || undefined,
    });

    setNewName("");
    setNewRole("");
    setNewEmail("");
    setShowAddForm(false);
  };

  const isFinalized = process.status === "Finalized" || process.status === "Approved";

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 select-none overflow-y-auto">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Process Details
          </h3>
          <p className="text-[11px] text-slate-500">Metadata & Governance</p>
        </div>
        <span
          className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide leading-none ${
            isFinalized
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {process.status}
        </span>
      </div>

      <div className="p-4 space-y-5 flex-1">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-xs text-slate-500">Process Name</span>
            <span className="text-xs font-semibold text-slate-800 text-right max-w-[60%] truncate">
              {process.name}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Version</span>
            <span className="inline-flex items-center justify-center text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded leading-none">
              v{process.currentVersionNumber}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Department</span>
            <span className="text-xs font-medium text-slate-700">
              {process.department}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Process Owner</span>
            <span className="text-xs font-medium text-slate-700">
              {process.ownerName}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Created</span>
            <span className="text-xs text-slate-600">
              {formatDate(process.createdAt)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Last Modified</span>
            <span className="text-xs text-slate-600">
              {formatDate(process.updatedAt)}
            </span>
          </div>
        </div>

        {process.description && (
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 mb-1">
              Description / Scope
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-md border border-slate-100">
              {process.description}
            </p>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Participants ({participants.length})</span>
            </div>
            {!isReadOnly && !showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            )}
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAddSubmit}
              className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-3 space-y-2 animate-in fade-in"
            >
              <input
                type="text"
                placeholder="Participant Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-900"
              />
              <input
                type="text"
                placeholder="Role (e.g. Approver, Operator)"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-900"
              />
              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {participants.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">
                No participants assigned yet.
              </p>
            ) : (
              participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-100 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {p.role}
                    </div>
                  </div>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => onRemoveParticipant(p.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity"
                      title="Remove participant"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2.5">
        <button
          type="button"
          onClick={onOpenVersions}
          className="w-full flex items-center justify-center gap-2 h-10 px-4 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors"
        >
          <History className="w-4 h-4 text-slate-500" />
          <span>Version History & Diff</span>
        </button>

        <Link
          href={`/processes/${process.id}/documentation`}
          className="w-full flex items-center justify-center gap-2 h-10 px-4 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors"
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span>Documentation & Export</span>
        </Link>

        {!isFinalized ? (
          <button
            type="button"
            onClick={onOpenFinalize}
            className="w-full flex items-center justify-center gap-2 h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Finalize Process</span>
          </button>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
            <div className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Process Finalized
            </div>
            <p className="text-[10px] text-emerald-600 mt-0.5">
              This version is approved and locked.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
