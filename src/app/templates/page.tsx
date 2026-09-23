"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  ArrowRight,
  GitFork,
  CheckCircle2,
  Users,
  ShieldCheck,
  CreditCard,
  UserPlus,
  Truck,
  FileCheck,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useToast } from "@/components/ui/Toast";

interface TemplateItem {
  id: string;
  name: string;
  department: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  stepsCount: number;
  roles: string[];
}

export default function TemplatesPage() {
  const router = useRouter();
  const toast = useToast();
  const [cloningId, setCloningId] = useState<string | null>(null);

  const templates: TemplateItem[] = [
    {
      id: "order-to-cash",
      name: "Order Management & Fulfillment",
      department: "Sales & Operations",
      description: "Comprehensive customer sales order processing, pricing discount threshold checks, inventory allocation, and dispatch.",
      icon: Truck,
      stepsCount: 8,
      roles: ["Sales Executive", "Sales Manager", "Finance Director", "Warehouse Lead"],
    },
    {
      id: "employee-onboarding",
      name: "Employee Onboarding Workflow",
      department: "Human Resources",
      description: "Standardized new hire welcome, identity verification, IT equipment provisioning, benefits enrollment, and orientation.",
      icon: UserPlus,
      stepsCount: 7,
      roles: ["HR Coordinator", "IT Ops", "Hiring Manager", "Payroll Lead"],
    },
    {
      id: "procure-to-pay",
      name: "Procurement & Purchase Approval",
      department: "Finance & Operations",
      description: "Requisition sign-off, vendor compliance checks, purchase order issuance, goods receipt, and 3-way match invoice clearance.",
      icon: CreditCard,
      stepsCount: 6,
      roles: ["Department Head", "Procurement Lead", "Accounts Payable"],
    },
    {
      id: "contract-review",
      name: "Enterprise Contract Lifecycle",
      department: "Legal & Compliance",
      description: "NDA and MSA draft review, redlining, executive compliance approval, e-signature dispatch, and document repository archiving.",
      icon: FileCheck,
      stepsCount: 5,
      roles: ["Account Executive", "Legal Counsel", "VP of Commercial", "Customer Legal"],
    },
  ];

  const handleUseTemplate = async (template: TemplateItem) => {
    setCloningId(template.id);
    try {
      const res = await fetch("/api/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          department: template.department.split("&")[0].trim(),
          ownerName: "Alex Morgan",
          templateId: template.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Template Loaded", `Created ${template.name} workspace`);
        router.push(`/processes/${data.process.id}`);
      }
    } catch (err) {
      toast.error("Error", "Failed to initialize template");
    } finally {
      setCloningId(null);
    }
  };

  return (
    <AppShell breadcrumbs={[{ name: "Templates" }]}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Process Templates Library
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pre-configured standard operating procedures and governance frameworks
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {templates.map((template) => {
            const Icon = template.icon;
            const isCloning = cloningId === template.id;

            return (
              <div
                key={template.id}
                className="bg-white rounded-xl border border-slate-200 shadow-subtle p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-card transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {template.department}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {template.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {template.roles.map((role, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-full"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    {template.stepsCount} pre-mapped steps
                  </span>

                  <button
                    type="button"
                    onClick={() => handleUseTemplate(template)}
                    disabled={isCloning}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isCloning ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                    <span>Use Template</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
