"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowRight,
  GitFork,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Search,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { formatDate } from "@/lib/utils";

interface ProcessItem {
  id: string;
  name: string;
  description: string | null;
  department: string;
  ownerName: string;
  status: string;
  currentVersionNumber: number;
  updatedAt: string;
  participants: { id: string; name: string; role: string }[];
}

export default function DashboardPage() {
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/processes");
        if (res.ok) {
          const data = await res.json();
          setProcesses(data.processes || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredProcesses = processes.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.ownerName.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q)
    );
  });

  const totalCount = processes.length;
  const draftCount = processes.filter((p) => p.status === "Draft").length;
  const finalizedCount = processes.filter(
    (p) => p.status === "Finalized" || p.status === "Approved"
  ).length;
  const recentCount = processes.length > 0 ? Math.min(processes.length, 3) : 0;

  return (
    <AppShell
      breadcrumbs={[{ name: "Dashboard" }]}
      searchPlaceholder="Search recent workflows..."
      onSearch={setSearchQuery}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Good morning
          </h1>
          <p className="text-xs text-slate-500">
            Your business process intelligence workspace
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-subtle">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Processes
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : totalCount}
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-subtle">
            <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">
              Draft Processes
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : draftCount}
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-subtle">
            <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
              Finalized / Approved
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : finalizedCount}
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-subtle">
            <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
              Recently Updated
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : recentCount}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-semibold tracking-wide uppercase">
              <Sparkles className="w-3 h-3" />
              AI Process Assistant Ready
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white">
              Map your next operating procedure with AI
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Describe steps, assign roles, configure approval gates, and let the assistant generate the visual diagram automatically.
            </p>
          </div>
          <Link
            href="/processes/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-lg shadow transition-colors shrink-0"
          >
            <span>Start Mapping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Recent Processes
              </h2>
              <p className="text-xs text-slate-500">
                Active workflow definitions across your organization
              </p>
            </div>

            <Link
              href="/processes"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View all processes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Loading workspace processes...
              </div>
            ) : filteredProcesses.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <GitFork className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-800 mb-1">
                  No processes found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Start mapping your first enterprise business process or adjust search filters.
                </p>
                <Link
                  href="/processes/new"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Process</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                <div className="grid grid-cols-12 px-5 py-3 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <div className="col-span-5">Process Name</div>
                  <div className="col-span-2">Owner / Dept</div>
                  <div className="col-span-2">Version</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1 text-right">Updated</div>
                </div>

                {filteredProcesses.map((proc) => {
                  const isApproved =
                    proc.status === "Finalized" || proc.status === "Approved";

                  return (
                    <Link
                      key={proc.id}
                      href={`/processes/${proc.id}`}
                      className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-slate-50/80 transition-colors group"
                    >
                      <div className="col-span-5 flex items-center gap-3 pr-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <GitFork className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {proc.name}
                          </div>
                          {proc.description && (
                            <div className="text-[11px] text-slate-400 truncate">
                              {proc.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-span-2 text-xs text-slate-600 truncate">
                        <span className="font-medium text-slate-800">
                          {proc.ownerName}
                        </span>
                        <span className="text-slate-400 block text-[11px]">
                          {proc.department}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                          v{proc.currentVersionNumber}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isApproved
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isApproved ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          ></span>
                          {proc.status}
                        </span>
                      </div>

                      <div className="col-span-1 text-right text-xs text-slate-400 font-mono">
                        {formatDate(proc.updatedAt)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
