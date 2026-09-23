"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Download,
  FileDown,
  Printer,
  Edit3,
  GitFork,
  Users,
  Loader2,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { AppShell } from "@/components/layout/AppShell";
import { formatDate } from "@/lib/utils";
import { ProcessNode, ProcessEdge } from "@/lib/ai/types";
import { useToast } from "@/components/ui/Toast";

function SvgBadge({
  text,
  variant = "default",
  pill = false,
  width,
  height = 20,
  fontSize = 10,
  isMono = false,
}: {
  text: string;
  variant?:
    | "start"
    | "task"
    | "approval"
    | "decision"
    | "end"
    | "sla"
    | "rule"
    | "sop"
    | "status-draft"
    | "status-final"
    | "version"
    | "default";
  pill?: boolean;
  width?: number;
  height?: number;
  fontSize?: number;
  isMono?: boolean;
}) {
  let bg = "#f1f5f9";
  let border = "#e2e8f0";
  let color = "#334155";

  if (variant === "start") {
    bg = "#dcfce7";
    border = "#bbf7d0";
    color = "#15803d";
  } else if (variant === "task") {
    bg = "#dbeafe";
    border = "#bfdbfe";
    color = "#1d4ed8";
  } else if (variant === "approval") {
    bg = "#fef3c7";
    border = "#fde68a";
    color = "#92400e";
  } else if (variant === "decision") {
    bg = "#f3e8ff";
    border = "#e9d5ff";
    color = "#6b21a8";
  } else if (variant === "end") {
    bg = "#f1f5f9";
    border = "#cbd5e1";
    color = "#334155";
  } else if (variant === "sla") {
    bg = "#f1f5f9";
    border = "#e2e8f0";
    color = "#475569";
  } else if (variant === "rule") {
    bg = "#faf5ff";
    border = "#e9d5ff";
    color = "#7e22ce";
  } else if (variant === "sop") {
    bg = "#eff6ff";
    border = "#bfdbfe";
    color = "#1d4ed8";
  } else if (variant === "status-final") {
    bg = "#dcfce7";
    border = "#bbf7d0";
    color = "#15803d";
  } else if (variant === "status-draft") {
    bg = "#fef3c7";
    border = "#fde68a";
    color = "#92400e";
  } else if (variant === "version") {
    bg = "#eff6ff";
    border = "#bfdbfe";
    color = "#1d4ed8";
  }

  const calculatedWidth =
    width ||
    Math.max(
      32,
      Math.ceil(text.length * (fontSize * (isMono ? 0.62 : 0.65)) + (pill ? 18 : 14))
    );
  const rx = pill ? height / 2 : 4;

  return (
    <svg
      width={calculatedWidth}
      height={height}
      viewBox={`0 0 ${calculatedWidth} ${height}`}
      className="inline-block shrink-0 align-middle select-none"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <rect
        x="0.5"
        y="0.5"
        width={calculatedWidth - 1}
        height={height - 1}
        rx={rx}
        ry={rx}
        fill={bg}
        stroke={border}
        strokeWidth="1"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill={color}
        fontSize={fontSize}
        fontWeight="700"
        fontFamily={
          isMono
            ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
            : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }
        letterSpacing={isMono ? "0" : "0.04em"}
      >
        {text}
      </text>
    </svg>
  );
}

export default function DocumentationPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const processId = params.id as string;

  const [process, setProcess] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const documentRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProcess() {
      try {
        const res = await fetch(`/api/processes/${processId}`);
        if (res.ok) {
          const data = await res.json();
          setProcess(data.process);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProcess();
  }, [processId]);

  const handleExportPng = async () => {
    if (!diagramRef.current) return;
    setIsExportingPng(true);
    try {
      const canvas = await html2canvas(diagramRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `${process.name.toLowerCase().replace(/\s+/g, "-")}-flowchart-v${process.currentVersionNumber}.png`;
      link.click();
      toast.success("PNG Exported", "Flowchart diagram saved to downloads");
    } catch (err) {
      toast.error("Export Failed", "Could not generate PNG image");
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleExportPdf = async () => {
    if (!documentRef.current) return;
    setIsExportingPdf(true);
    try {
      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;
      const maxContentHeight = pdfHeight - margin * 2;

      const totalHeightMm = (canvas.height * contentWidth) / canvas.width;

      if (totalHeightMm <= maxContentHeight) {
        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(
          imgData,
          "PNG",
          margin,
          margin,
          contentWidth,
          totalHeightMm,
          undefined,
          "FAST"
        );
      } else {
        const pageCanvasHeight = (canvas.width * maxContentHeight) / contentWidth;
        let sourceY = 0;
        let pageNum = 0;

        while (sourceY < canvas.height) {
          if (pageNum > 0) {
            pdf.addPage();
          }

          const sliceHeight = Math.min(pageCanvasHeight, canvas.height - sourceY);
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceHeight;
          const sliceCtx = sliceCanvas.getContext("2d");

          if (sliceCtx) {
            sliceCtx.drawImage(
              canvas,
              0,
              sourceY,
              canvas.width,
              sliceHeight,
              0,
              0,
              canvas.width,
              sliceHeight
            );
            const sliceData = sliceCanvas.toDataURL("image/png");
            const sliceHeightMm = (sliceHeight * contentWidth) / canvas.width;
            pdf.addImage(
              sliceData,
              "PNG",
              margin,
              margin,
              contentWidth,
              sliceHeightMm,
              undefined,
              "FAST"
            );
          }

          sourceY += pageCanvasHeight;
          pageNum++;
        }
      }

      pdf.save(
        `${process.name.toLowerCase().replace(/\s+/g, "-")}-documentation-v${process.currentVersionNumber}.pdf`
      );
      toast.success("PDF Exported", "Executive process documentation generated successfully");
    } catch (err) {
      toast.error("Export Failed", "Could not generate PDF document");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading documentation...</span>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!process) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <h2 className="text-sm font-bold text-slate-800">Process not found</h2>
          <Link
            href="/processes"
            className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 font-semibold"
          >
            ← Back to processes
          </Link>
        </div>
      </AppShell>
    );
  }

  const nodes: ProcessNode[] = process.processData?.nodes || [];
  const edges: ProcessEdge[] = process.processData?.edges || [];
  const participants = process.participants || [];
  const isFinalized = process.status === "Finalized" || process.status === "Approved";

  return (
    <AppShell
      breadcrumbs={[
        { name: "Processes", href: "/processes" },
        { name: process.name, href: `/processes/${process.id}` },
        { name: "Documentation & Export" },
      ]}
      showCreateButton={false}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
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
                Process Documentation
              </h1>
              <p className="text-xs text-slate-500">
                Standard operating procedure governance document & visual artifact
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href={`/processes/${process.id}`}
              className="inline-flex items-center gap-2 h-10 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Process</span>
            </Link>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 h-10 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>

            <button
              onClick={handleExportPng}
              disabled={isExportingPng}
              className="inline-flex items-center gap-2 h-10 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors disabled:opacity-50"
            >
              {isExportingPng ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Export PNG</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-2 h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        <div
          ref={documentRef}
          className="bg-white rounded-xl border border-slate-200 shadow-card p-8 sm:p-10 space-y-8 text-slate-900"
        >
          <div className="border-b border-slate-200 pb-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2.5 max-w-xl">
              <div>
                <SvgBadge
                  text="STANDARD OPERATING PROCEDURE (SOP)"
                  variant="sop"
                  pill
                  height={22}
                  fontSize={10}
                />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
                {process.name}
              </h2>
              {process.description && (
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {process.description}
                </p>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 min-w-[240px] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Status</span>
                <SvgBadge
                  text={process.status}
                  variant={isFinalized ? "status-final" : "status-draft"}
                  pill
                  height={20}
                  fontSize={10}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Version</span>
                <SvgBadge
                  text={`v${process.currentVersionNumber}`}
                  variant="version"
                  height={20}
                  fontSize={11}
                  isMono
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Department</span>
                <span className="font-semibold text-slate-800">
                  {process.department}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Process Owner</span>
                <span className="font-semibold text-slate-800">
                  {process.ownerName}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                <span className="text-slate-400">Last Reviewed</span>
                <span className="text-slate-600 font-mono">
                  {formatDate(process.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Participants & Governance Roles</span>
            </h3>

            {participants.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No participant roles assigned.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {participants.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-col justify-center min-h-[52px]"
                  >
                    <div className="text-xs font-bold text-slate-900 leading-snug break-words">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-blue-600 font-medium leading-snug mt-0.5 break-words">
                      {p.role}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5 text-slate-500" />
                <span>Process Flow Diagram</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                {nodes.length} Steps • {edges.length} Transitions
              </span>
            </div>

            <div
              ref={diagramRef}
              className="bg-slate-50/60 p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center min-h-[220px] overflow-x-auto"
            >
              <div className="flex flex-col items-center space-y-3 max-w-full">
                {nodes.map((node, index) => {
                  return (
                    <div key={node.id} className="flex flex-col items-center">
                      <div
                        className={`px-4 py-3 rounded-xl border shadow-subtle min-w-[280px] max-w-md bg-white ${
                          node.type === "start"
                            ? "border-emerald-400 bg-emerald-50/30"
                            : node.type === "approval"
                            ? "border-amber-400 bg-amber-50/30"
                            : node.type === "decision"
                            ? "border-purple-400 bg-purple-50/30"
                            : node.type === "end"
                            ? "border-slate-800 bg-slate-50"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <SvgBadge
                            text={node.type.toUpperCase()}
                            variant={node.type as any}
                            height={18}
                            fontSize={9}
                          />
                          {node.sla && (
                            <SvgBadge
                              text={`SLA: ${node.sla}`}
                              variant="sla"
                              height={18}
                              fontSize={9}
                              isMono
                            />
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-900 leading-snug break-words">
                          {node.label}
                        </div>
                        {node.role && (
                          <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                            Role: {node.role}
                          </div>
                        )}
                        {node.condition && (
                          <div className="mt-2">
                            <SvgBadge
                              text={`Rule: ${node.condition}`}
                              variant="rule"
                              height={18}
                              fontSize={9}
                              isMono
                            />
                          </div>
                        )}
                      </div>

                      {index < nodes.length - 1 && (
                        <div className="w-0.5 h-5 bg-slate-300 my-0.5 relative">
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full absolute -left-0.5 bottom-0"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Detailed Step-by-Step Procedure
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Operational Runbook
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-subtle">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center">#</th>
                    <th className="py-2.5 px-4">Step Name</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Owner / Role</th>
                    <th className="py-2.5 px-4">SLA</th>
                    <th className="py-2.5 px-4">Operational Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {nodes.map((node, i) => (
                    <tr key={node.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-400">
                        {i + 1}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {node.label}
                      </td>
                      <td className="py-2.5 px-4">
                        <SvgBadge
                          text={node.type.toUpperCase()}
                          variant={node.type as any}
                          height={18}
                          fontSize={9}
                        />
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 font-medium">
                        {node.role || "—"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">
                        {node.sla || "—"}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 leading-relaxed">
                        {node.description || (node.condition ? `Condition: ${node.condition}` : "Standard execution.")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <div>JV Process Platform • Business Process Intelligence</div>
            <div>Confidential & Proprietary • Document Version v{process.currentVersionNumber}</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
