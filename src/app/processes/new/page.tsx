"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GitFork,
  ArrowRight,
  Loader2,
  ChevronLeft,
  Sparkles,
  Building2,
  User,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useToast } from "@/components/ui/Toast";

export default function NewProcessPage() {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("Sales");
  const [ownerName, setOwnerName] = useState("Sales Operations");
  const [ownerEmail, setOwnerEmail] = useState("sales-ops@acme.com");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          department,
          ownerName,
          ownerEmail: ownerEmail.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Process created", `Workspace ready for ${name}`);
        router.push(`/processes/${data.process.id}`);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to create process");
      }
    } catch (err) {
      setError("An unexpected error occurred while creating the process.");
    } finally {
      setIsLoading(false);
    }
  };

  const departments = [
    "Sales",
    "Operations",
    "Finance",
    "Logistics",
    "Customer Success",
    "Procurement",
    "Human Resources",
    "Engineering",
    "Legal & Compliance",
  ];

  return (
    <AppShell
      breadcrumbs={[
        { name: "Processes", href: "/processes" },
        { name: "Create New Process" },
      ]}
      showCreateButton={false}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/processes"
            title="Back to Processes"
            className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-white transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Create New Process
            </h1>
            <p className="text-xs text-slate-500">
              Establish the baseline scope and assign governance ownership
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 md:p-8">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Process Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Order Management"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                A concise and recognizable name for this standard operating workflow.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description & Scope
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this process covers, key goals, and regulatory boundaries..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Department
                </label>
                <div className="relative">
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Process Owner / Lead
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Sales Operations"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Owner Contact Email
              </label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="sales-ops@acme.com"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="p-4 bg-blue-50/60 rounded-lg border border-blue-100 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 leading-relaxed">
                Once created, the interactive <strong>AI Process Workspace</strong> will launch with an initialized starter flow where you can refine steps with natural language.
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                href="/processes"
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>Create Process</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
