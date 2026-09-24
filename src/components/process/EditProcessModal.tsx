"use client";

import React, { useState, useEffect } from "react";
import {
  Pencil,
  Building,
  User,
  Mail,
  FileText,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Archive,
  Layers,
} from "lucide-react";

export interface ProcessFormData {
  name: string;
  description: string | null;
  department: string;
  ownerName: string;
  ownerEmail: string | null;
  status: string;
}

export interface EditableProcess {
  id: string;
  name: string;
  description?: string | null;
  department: string;
  ownerName: string;
  ownerEmail?: string | null;
  status: string;
}

interface EditProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  process: EditableProcess | null;
  onSave: (data: ProcessFormData) => Promise<void>;
}

const PRESET_DEPARTMENTS = [
  "Operations",
  "Sales",
  "Finance",
  "Logistics",
  "Customer Success",
  "Procurement",
  "Human Resources",
  "Engineering",
  "Legal & Compliance",
  "Marketing",
  "Product",
  "Quality Assurance",
  "Information Technology",
  "Executive",
];

const STATUS_OPTIONS = [
  {
    value: "Draft",
    label: "Draft",
    color: "amber",
    description: "Active work in progress; fully editable",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    dotClass: "bg-amber-500",
  },
  {
    value: "Under Review",
    label: "Under Review",
    color: "blue",
    description: "Awaiting stakeholder approval and governance sign-off",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    dotClass: "bg-blue-500",
  },
  {
    value: "Finalized",
    label: "Finalized",
    color: "emerald",
    description: "Approved baseline, locked for operational export",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  {
    value: "Archived",
    label: "Archived",
    color: "slate",
    description: "Deprecated or superseded process record",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    dotClass: "bg-slate-400",
  },
];

export function EditProcessModal({
  isOpen,
  onClose,
  process,
  onSave,
}: EditProcessModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("Operations");
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDept, setCustomDept] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [status, setStatus] = useState("Draft");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (process && isOpen) {
      setName(process.name || "");
      setDescription(process.description || "");
      setOwnerName(process.ownerName || "");
      setOwnerEmail(process.ownerEmail || "");
      setStatus(process.status || "Draft");

      const dept = process.department || "Operations";
      if (PRESET_DEPARTMENTS.includes(dept)) {
        setDepartment(dept);
        setIsCustomDept(false);
        setCustomDept("");
      } else {
        setDepartment("Other");
        setIsCustomDept(true);
        setCustomDept(dept);
      }
      setError(null);
    }
  }, [process, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSaving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !process) return null;

  const handleDeptSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "Other") {
      setIsCustomDept(true);
    } else {
      setIsCustomDept(false);
      setDepartment(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Process name is required.");
      return;
    }
    if (!ownerName.trim()) {
      setError("Process owner / lead name is required.");
      return;
    }

    const finalDept = isCustomDept
      ? customDept.trim() || "Operations"
      : department;

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        department: finalDept,
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim() || null,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update process. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-8 animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 shadow-xs">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Edit Process</span>
                <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  ID: {process.id.slice(0, 8)}...
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Update process metadata, governance ownership, and lifecycle status
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSaving}
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed font-medium">
                {error}
              </div>
            </div>
          )}

          {/* Process Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Process Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Client Onboarding Workflow"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Description & Scope */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Scope
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe workflow objectives, scope boundaries, and regulatory compliance..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Department & Lifecycle Status (Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Department</span>
              </label>
              <select
                value={isCustomDept ? "Other" : department}
                onChange={handleDeptSelectChange}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                {PRESET_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
                <option value="Other">Other (Custom)...</option>
              </select>

              {isCustomDept && (
                <input
                  type="text"
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  placeholder="Enter custom department"
                  className="w-full mt-2 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Process Status</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status info pill */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Current Status Mode:</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  STATUS_OPTIONS.find((s) => s.value === status)?.dotClass ||
                  "bg-slate-400"
                }`}
              />
              <span className="font-semibold text-slate-800">{status}</span>
              <span className="text-slate-400">—</span>
              <span className="text-slate-500">
                {STATUS_OPTIONS.find((s) => s.value === status)?.description ||
                  "Standard workflow status"}
              </span>
            </div>
          </div>

          {/* Owner Details (Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Process Owner / Lead <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Owner Contact Email</span>
              </label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="e.g. jane@acme.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="h-9 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim() || !ownerName.trim()}
              className="inline-flex items-center gap-2 h-9 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Pencil className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
