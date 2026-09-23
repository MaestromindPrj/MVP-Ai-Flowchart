import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  History,
  GitFork,
  ArrowRight,
  PlusCircle,
  Edit,
  MinusCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db/prisma";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProcessVersionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const process = await prisma.process.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
      },
    },
  });

  if (!process) {
    notFound();
  }

  const versions = process.versions.map((v) => {
    let data = { nodes: [], edges: [] };
    try {
      data = JSON.parse(v.processData);
    } catch {}
    return {
      ...v,
      processData: data,
    };
  });

  return (
    <AppShell
      breadcrumbs={[
        { name: "Processes", href: "/processes" },
        { name: process.name, href: `/processes/${process.id}` },
        { name: "Version History" },
      ]}
      showCreateButton={false}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/processes/${process.id}`}
              title="Back to Workspace"
              className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-white transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {process.name} — Version History
              </h1>
              <p className="text-xs text-slate-500">
                Audit trail of changes, milestone baselines, and governance updates
              </p>
            </div>
          </div>

          <Link
            href={`/processes/${process.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
          >
            <span>Open Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-card divide-y divide-slate-100 overflow-hidden">
          {versions.map((ver, idx) => {
            const isCurrent = ver.versionNumber === process.currentVersionNumber;

            return (
              <div key={ver.id} className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      Version {ver.versionNumber}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Current Active
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {formatDateTime(ver.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    {ver.changeSummary || `Version ${ver.versionNumber} Release`}
                  </h3>

                  <div className="text-xs text-slate-500">
                    Author: <span className="font-medium text-slate-700">{ver.createdBy}</span>
                  </div>

                  <div className="pt-2 flex items-center gap-4 text-xs text-slate-500">
                    <div>
                      Nodes: <strong className="text-slate-800">{ver.processData.nodes?.length || 0}</strong>
                    </div>
                    <div>
                      Connections: <strong className="text-slate-800">{ver.processData.edges?.length || 0}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/processes/${process.id}`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors"
                  >
                    View in Workspace
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
