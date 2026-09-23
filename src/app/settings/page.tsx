"use client";

import React, { useState } from "react";
import {
  Settings,
  Building,
  User,
  Sparkles,
  Database,
  Code2,
  CheckCircle2,
  Save,
  Cpu,
  Layers,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const toast = useToast();

  const [orgName, setOrgName] = useState("Acme Global Enterprises");
  const [userName, setUserName] = useState("Alex Morgan");
  const [userEmail, setUserEmail] = useState("alex@jvprocess.com");
  const [userRole, setUserRole] = useState("Senior Process Consultant");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Settings Saved", "Profile parameters updated successfully");
  };

  return (
    <AppShell breadcrumbs={[{ name: "Settings" }]}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Platform Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organization governance, account profile, and AI service provider configuration
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                AI Service Integration Architecture
              </h2>
              <p className="text-xs text-slate-500">
                Provider-agnostic interface boundary for business process synthesis
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-800">
                  Active Service Provider:
                </span>
                <span className="text-xs font-mono font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Process Synthesis Core
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Operational
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              The application connects to the abstracted <code className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[11px]">AIProcessService</code> interface in <code className="font-mono text-slate-800 bg-slate-200/60 px-1 py-0.5 rounded text-[11px]">src/lib/ai/types.ts</code>. The AI developer can drop in OpenAI, Google Gemini, Anthropic, or proprietary fine-tuned BPMN models by implementing this single interface without altering UI components.
            </p>

            <div className="p-3 bg-slate-900 text-slate-200 rounded-md font-mono text-[11px] leading-relaxed overflow-x-auto">
              <div className="text-blue-400">export interface AIProcessService &#123;</div>
              <div className="pl-4">sendMessage(processId, message, currentProcess): Promise&lt;AIProcessResponse&gt;;</div>
              <div className="text-blue-400">&#125;</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-card p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Organization & User Profile
              </h2>
              <p className="text-xs text-slate-500">
                Manage your enterprise workspace identity
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Consultant Role Title
              </label>
              <input
                type="text"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold shadow-sm transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
