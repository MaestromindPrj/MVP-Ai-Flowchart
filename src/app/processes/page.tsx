"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  GitFork,
  Search,
  Filter,
  ArrowUpDown,
  LayoutList,
  LayoutGrid,
  ChevronRight,
  Sparkles,
  Users,
  Calendar,
  MoreVertical,
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
  createdAt: string;
  participants: { id: string; name: string; role: string }[];
}

export default function ProcessesListPage() {
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"updated" | "name" | "version">("updated");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  useEffect(() => {
    async function loadProcesses() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set("search", search);
        if (statusFilter !== "All") queryParams.set("status", statusFilter);
        if (deptFilter !== "All") queryParams.set("department", deptFilter);

        const res = await fetch(`/api/processes?${queryParams.toString()}`);
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
    loadProcesses();
  }, [search, statusFilter, deptFilter]);

  const sortedProcesses = [...processes].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "version") {
      return b.currentVersionNumber - a.currentVersionNumber;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const departments = Array.from(
    new Set(processes.map((p) => p.department).filter(Boolean))
  );

  return (
    <AppShell
      breadcrumbs={[{ name: "Processes" }]}
      searchPlaceholder="Filter processes..."
      onSearch={setSearch}
      showCreateButton={true}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Business Processes
          </h1>
          <p className="text-xs text-slate-500">
            Central repository for standard operating workflows & governance models
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search processes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Finalized">Finalized</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Department:</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:bg-white"
              >
                <option value="All">All Depts</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700"
              >
                <option value="updated">Recently Updated</option>
                <option value="name">Process Name (A-Z)</option>
                <option value="version">Version Number</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1 rounded ${
                  viewMode === "table"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Table View"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={`p-1 rounded ${
                  viewMode === "card"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
            Loading workflows...
          </div>
        ) : sortedProcesses.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <GitFork className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              No processes found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Try modifying your search query or create a brand new workflow.
            </p>
            <Link
              href="/processes/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Process</span>
            </Link>
          </div>
        ) : viewMode === "table" ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
            <div className="divide-y divide-slate-100">
              <div className="grid grid-cols-12 px-6 py-3 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <div className="col-span-5">Process Name</div>
                <div className="col-span-2">Department / Owner</div>
                <div className="col-span-2">Version</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1 text-right">Updated</div>
              </div>

              {sortedProcesses.map((proc) => {
                const isApproved =
                  proc.status === "Finalized" || proc.status === "Approved";

                return (
                  <Link
                    key={proc.id}
                    href={`/processes/${proc.id}`}
                    className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/80 transition-colors group"
                  >
                    <div className="col-span-5 flex items-center gap-3 pr-4">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <GitFork className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {proc.name}
                        </div>
                        {proc.description && (
                          <div className="text-[11px] text-slate-400 truncate">
                            {proc.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 text-xs truncate">
                      <div className="font-semibold text-slate-800 truncate">
                        {proc.department}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {proc.ownerName}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200/60">
                        v{proc.currentVersionNumber}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedProcesses.map((proc) => {
              const isApproved =
                proc.status === "Finalized" || proc.status === "Approved";

              return (
                <Link
                  key={proc.id}
                  href={`/processes/${proc.id}`}
                  className="p-5 bg-white rounded-xl border border-slate-200 shadow-subtle hover:border-blue-300 hover:shadow-card transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <GitFork className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          v{proc.currentVersionNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isApproved
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {proc.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {proc.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {proc.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <div>
                      <span className="font-medium text-slate-700">
                        {proc.ownerName}
                      </span>
                      <span className="block text-[11px]">{proc.department}</span>
                    </div>
                    <span className="font-mono">{formatDate(proc.updatedAt)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
